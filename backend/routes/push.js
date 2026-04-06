const router = require('express').Router();
const pool = require('../db');
const webpush = require('web-push');
const { auth, adminOnly } = require('../middleware/auth');

// ─── VAPID KEYS ────────────────────────────────────────────────────────────
// Configura estas en las variables de entorno de tu hosting (Render, etc.)
// Para generar un par nuevo ejecuta:
//   node -e "const wp=require('web-push'); console.log(wp.generateVAPIDKeys())"
const VAPID_PUBLIC  = process.env.VAPID_PUBLIC_KEY  || 'BAMOiqZrXtEj9JWpUjY6a2f7dTlzI1ky-651_gTyO8_i6lBPkZ9n1lrT2ynRjSAG9ngljpcNv78-Ea8fdGfGrdE';
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY || 'gKD7b8GL_KxsoCTboF9xhMWA9k9VdaRvk2XcNUvlg2g';
const VAPID_EMAIL   = process.env.VAPID_EMAIL       || 'mailto:starcrumbs@starcrumbs.com';

webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC, VAPID_PRIVATE);

// ─── TABLA push_subscriptions ──────────────────────────────────────────────
// user_id es NULL para suscripciones anónimas (sin login)
const ensureTable = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS push_subscriptions (
        id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
        endpoint   TEXT UNIQUE NOT NULL,
        keys       JSONB NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    // Permitir user_id NULL para suscripciones anónimas
    await pool.query(
      `ALTER TABLE push_subscriptions ALTER COLUMN user_id DROP NOT NULL;`
    ).catch(() => {});
  } catch (e) {
    console.log('push_subscriptions setup:', e.message);
  }
};
ensureTable();

// ─── GET /vapid-key ────────────────────────────────────────────────────────
// Pública: el frontend la necesita para llamar a pushManager.subscribe()
router.get('/vapid-key', (_req, res) => {
  res.json({ publicKey: VAPID_PUBLIC });
});

// ─── POST /subscribe ───────────────────────────────────────────────────────
// Guarda la suscripción. Funciona con o sin usuario logueado.
// Compatible con todos los navegadores: Chrome, Firefox, Edge, Samsung,
// Safari macOS 16+, Safari iOS 16.4+ (requiere PWA instalada por Apple).
// El sw.js también llama a este endpoint desde pushsubscriptionchange.
router.post('/subscribe', async (req, res) => {
  const { endpoint, keys } = req.body;
  if (!endpoint || !keys) {
    return res.status(400).json({ message: 'endpoint y keys son requeridos' });
  }

  // Intentar obtener user_id del JWT si viene en el header (opcional)
  let userId = null;
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(authHeader.slice(7), process.env.JWT_SECRET);
      userId = decoded.id || decoded.userId || null;
    } catch (_) {}
  }

  try {
    await pool.query(
      `INSERT INTO push_subscriptions (user_id, endpoint, keys)
       VALUES ($1, $2, $3)
       ON CONFLICT (endpoint)
       DO UPDATE SET user_id = COALESCE($1, push_subscriptions.user_id), keys = $3`,
      [userId, endpoint, JSON.stringify(keys)]
    );
    res.json({ message: 'Suscripción guardada' });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// ─── DELETE /subscribe ─────────────────────────────────────────────────────
router.delete('/subscribe', async (req, res) => {
  const { endpoint } = req.body;
  if (!endpoint) return res.status(400).json({ message: 'endpoint requerido' });
  try {
    await pool.query('DELETE FROM push_subscriptions WHERE endpoint = $1', [endpoint]);
    res.json({ message: 'Suscripción eliminada' });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// ─── HELPER: enviar a una suscripción individual ───────────────────────────
// Maneja errores de todos los servicios push:
//   FCM (Chrome/Android), Mozilla Push (Firefox), APNs (Safari iOS/macOS),
//   WNS (Edge), etc.
const sendOne = async (endpoint, keys, payload) => {
  try {
    await webpush.sendNotification(
      { endpoint, keys },
      JSON.stringify(payload),
      {
        TTL: 86400,          // La notificación espera hasta 24h si el dispositivo está offline
        urgency: 'normal',   // Compatibilidad con todos los servicios push
        contentEncoding: 'aes128gcm' // Estándar moderno, soportado por todos los browsers actuales
      }
    );
    return true;
  } catch (err) {
    // 410 Gone / 404: suscripción expirada o inválida → eliminar de la BD
    if (err.statusCode === 410 || err.statusCode === 404) {
      await pool.query(
        'DELETE FROM push_subscriptions WHERE endpoint = $1', [endpoint]
      ).catch(() => {});
      return false;
    }
    // 401 Unauthorized: VAPID key no coincide con el endpoint (puede pasar si
    // se cambiaron las keys sin regenerar suscripciones) → eliminar también
    if (err.statusCode === 401) {
      await pool.query(
        'DELETE FROM push_subscriptions WHERE endpoint = $1', [endpoint]
      ).catch(() => {});
      console.warn('Push 401 (VAPID inválido), suscripción eliminada:', endpoint.slice(0, 60));
      return false;
    }
    // Otros errores (red, timeout): loguear pero no eliminar
    console.error(`Push error ${err.statusCode || err.code}:`, err.message?.slice(0, 100));
    return false;
  }
};

// ─── HELPER: enviar a un usuario específico ───────────────────────────────
const sendToUser = async (userId, payload) => {
  if (!userId) return 0;
  try {
    const { rows } = await pool.query(
      'SELECT endpoint, keys FROM push_subscriptions WHERE user_id = $1',
      [userId]
    );
    const results = await Promise.allSettled(
      rows.map(s => sendOne(s.endpoint, s.keys, payload))
    );
    return results.filter(r => r.value === true).length;
  } catch (e) {
    console.error('sendToUser error:', e.message);
    return 0;
  }
};

// ─── HELPER: enviar a todos los administradores ───────────────────────────
const sendToAdmins = async (payload) => {
  try {
    const { rows } = await pool.query(
      `SELECT ps.endpoint, ps.keys
       FROM push_subscriptions ps
       JOIN users u ON u.id = ps.user_id
       WHERE u.role = 'admin'`
    );
    await Promise.allSettled(
      rows.map(s => sendOne(s.endpoint, s.keys, payload))
    );
  } catch (e) {
    console.error('sendToAdmins error:', e.message);
  }
};

// ─── HELPER: broadcast a todos los usuarios (incluye anónimos) ────────────
const broadcastToUsers = async (payload) => {
  try {
    const { rows } = await pool.query(
      `SELECT ps.endpoint, ps.keys
       FROM push_subscriptions ps
       LEFT JOIN users u ON u.id = ps.user_id
       WHERE u.role = 'user' OR ps.user_id IS NULL`
    );
    await Promise.allSettled(
      rows.map(s => sendOne(s.endpoint, s.keys, payload))
    );
  } catch (e) {
    console.error('broadcastToUsers error:', e.message);
  }
};

// ─── POST /send ────────────────────────────────────────────────────────────
// Solo administradores pueden disparar notificaciones manuales
router.post('/send', auth, adminOnly, async (req, res) => {
  const { title, body, icon, url, target } = req.body;
  const payload = {
    title: title || 'Star Crumbs 🍪',
    body,
    icon: icon || '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    url: url || '/',
    timestamp: Date.now()
  };
  try {
    if (target === 'admins') {
      await sendToAdmins(payload);
    } else {
      await broadcastToUsers(payload);
    }
    res.json({ message: 'Notificaciones enviadas' });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;
module.exports.sendToUser = sendToUser;
module.exports.sendToAdmins = sendToAdmins;
module.exports.broadcastToUsers = broadcastToUsers;

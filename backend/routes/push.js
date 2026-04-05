const router = require('express').Router();
const pool = require('../db');
const webpush = require('web-push');
const { auth, adminOnly } = require('../middleware/auth');

// ─── VAPID KEYS ────────────────────────────────────────────────────────────
// Configura estas variables de entorno en Render (o tu plataforma de hosting).
// Para generar un par nuevo: node -e "const wp=require('web-push');console.log(wp.generateVAPIDKeys())"
const VAPID_PUBLIC  = process.env.VAPID_PUBLIC_KEY  || 'BAMOiqZrXtEj9JWpUjY6a2f7dTlzI1ky-651_gTyO8_i6lBPkZ9n1lrT2ynRjSAG9ngljpcNv78-Ea8fdGfGrdE';
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY || 'gKD7b8GL_KxsoCTboF9xhMWA9k9VdaRvk2XcNUvlg2g';
const VAPID_EMAIL   = process.env.VAPID_EMAIL       || 'mailto:starcrumbs@starcrumbs.com';

webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC, VAPID_PRIVATE);

// ─── TABLA push_subscriptions ──────────────────────────────────────────────
// user_id es NULL para suscripciones anónimas (navegadores sin login)
const ensureTable = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS push_subscriptions (
        id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
        endpoint    TEXT UNIQUE NOT NULL,
        keys        JSONB NOT NULL,
        created_at  TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    // Permitir user_id NULL (para suscripciones anónimas)
    await pool.query(`
      ALTER TABLE push_subscriptions ALTER COLUMN user_id DROP NOT NULL;
    `).catch(() => {}); // Ignora si ya es nullable
  } catch (e) {
    console.log('push_subscriptions setup:', e.message);
  }
};
ensureTable();

// ─── GET /vapid-key ────────────────────────────────────────────────────────
// Pública: el frontend necesita esta key para llamar a pushManager.subscribe()
router.get('/vapid-key', (_req, res) => {
  res.json({ publicKey: VAPID_PUBLIC });
});

// ─── POST /subscribe ───────────────────────────────────────────────────────
// Guarda la suscripción. Funciona tanto con usuario logueado como anónimo.
// El sw.js también llama a este endpoint directamente desde pushsubscriptionchange.
router.post('/subscribe', async (req, res) => {
  const { endpoint, keys } = req.body;
  if (!endpoint || !keys) {
    return res.status(400).json({ message: 'endpoint y keys son requeridos' });
  }

  // Intentar obtener el user_id del JWT si viene (opcional)
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
       ON CONFLICT (endpoint) DO UPDATE SET user_id = COALESCE($1, push_subscriptions.user_id), keys = $3`,
      [userId, endpoint, JSON.stringify(keys)]
    );
    res.json({ message: 'Suscripción guardada' });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// ─── DELETE /subscribe ─────────────────────────────────────────────────────
// Elimina la suscripción. Funciona sin auth también (basta con el endpoint).
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

// ─── HELPERS INTERNOS ──────────────────────────────────────────────────────

// Envía notificación push a todos los dispositivos de un usuario
const sendToUser = async (userId, payload) => {
  if (!userId) return 0;
  try {
    const subs = await pool.query(
      'SELECT endpoint, keys FROM push_subscriptions WHERE user_id = $1',
      [userId]
    );
    const results = await Promise.allSettled(
      subs.rows.map(s =>
        webpush
          .sendNotification({ endpoint: s.endpoint, keys: s.keys }, JSON.stringify(payload))
          .catch(async (err) => {
            if (err.statusCode === 410 || err.statusCode === 404) {
              await pool.query('DELETE FROM push_subscriptions WHERE endpoint = $1', [s.endpoint]);
            }
          })
      )
    );
    return results.length;
  } catch (e) {
    console.error('push sendToUser error:', e.message);
    return 0;
  }
};

// Envía notificación push a todos los administradores
const sendToAdmins = async (payload) => {
  try {
    const admins = await pool.query(
      `SELECT ps.endpoint, ps.keys
       FROM push_subscriptions ps
       JOIN users u ON u.id = ps.user_id
       WHERE u.role = 'admin'`
    );
    await Promise.allSettled(
      admins.rows.map(s =>
        webpush
          .sendNotification({ endpoint: s.endpoint, keys: s.keys }, JSON.stringify(payload))
          .catch(async (err) => {
            if (err.statusCode === 410 || err.statusCode === 404) {
              await pool.query('DELETE FROM push_subscriptions WHERE endpoint = $1', [s.endpoint]);
            }
          })
      )
    );
  } catch (e) {
    console.error('push sendToAdmins error:', e.message);
  }
};

// Difunde notificación push a todos los usuarios (incluyendo anónimos)
const broadcastToUsers = async (payload) => {
  try {
    const subs = await pool.query(
      `SELECT ps.endpoint, ps.keys
       FROM push_subscriptions ps
       LEFT JOIN users u ON u.id = ps.user_id
       WHERE u.role = 'user' OR ps.user_id IS NULL`
    );
    await Promise.allSettled(
      subs.rows.map(s =>
        webpush
          .sendNotification({ endpoint: s.endpoint, keys: s.keys }, JSON.stringify(payload))
          .catch(async (err) => {
            if (err.statusCode === 410 || err.statusCode === 404) {
              await pool.query('DELETE FROM push_subscriptions WHERE endpoint = $1', [s.endpoint]);
            }
          })
      )
    );
  } catch (e) {
    console.error('push broadcastToUsers error:', e.message);
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

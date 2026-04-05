const router = require('express').Router();
const pool = require('../db');
const webpush = require('web-push');
const { auth, adminOnly } = require('../middleware/auth');

// VAPID keys — set these in your Render environment variables
const VAPID_PUBLIC  = process.env.VAPID_PUBLIC_KEY  || 'BAMOiqZrXtEj9JWpUjY6a2f7dTlzI1ky-651_gTyO8_i6lBPkZ9n1lrT2ynRjSAG9ngljpcNv78-Ea8fdGfGrdE';
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY || 'gKD7b8GL_KxsoCTboF9xhMWA9k9VdaRvk2XcNUvlg2g';
const VAPID_EMAIL   = process.env.VAPID_EMAIL       || 'mailto:starcrumbs@starcrumbs.com';

webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC, VAPID_PRIVATE);

// Ensure push_subscriptions table
const ensureTable = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS push_subscriptions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        endpoint TEXT UNIQUE NOT NULL,
        keys JSONB NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
  } catch (e) { console.log('push_subscriptions:', e.message); }
};
ensureTable();

// GET VAPID public key (needed by frontend to subscribe)
router.get('/vapid-key', (_req, res) => {
  res.json({ publicKey: VAPID_PUBLIC });
});

// POST /subscribe — save push subscription
router.post('/subscribe', auth, async (req, res) => {
  const { endpoint, keys } = req.body;
  if (!endpoint || !keys) return res.status(400).json({ message: 'endpoint and keys required' });
  try {
    await pool.query(
      `INSERT INTO push_subscriptions (user_id, endpoint, keys)
       VALUES ($1, $2, $3)
       ON CONFLICT (endpoint) DO UPDATE SET user_id=$1, keys=$3`,
      [req.user.id, endpoint, JSON.stringify(keys)]
    );
    res.json({ message: 'Subscribed' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// DELETE /subscribe — remove subscription
router.delete('/subscribe', auth, async (req, res) => {
  const { endpoint } = req.body;
  await pool.query('DELETE FROM push_subscriptions WHERE endpoint=$1 AND user_id=$2', [endpoint, req.user.id]);
  res.json({ message: 'Unsubscribed' });
});

// Internal helper — send to a specific user
const sendToUser = async (userId, payload) => {
  try {
    const subs = await pool.query(
      'SELECT endpoint, keys FROM push_subscriptions WHERE user_id=$1',
      [userId]
    );
    const results = await Promise.allSettled(
      subs.rows.map(s =>
        webpush.sendNotification({ endpoint: s.endpoint, keys: s.keys }, JSON.stringify(payload))
          .catch(async (err) => {
            // Remove expired subscriptions
            if (err.statusCode === 410 || err.statusCode === 404) {
              await pool.query('DELETE FROM push_subscriptions WHERE endpoint=$1', [s.endpoint]);
            }
          })
      )
    );
    return results.length;
  } catch (e) { console.error('push error:', e.message); return 0; }
};

// Internal helper — send to all admins
const sendToAdmins = async (payload) => {
  try {
    const admins = await pool.query(
      `SELECT ps.endpoint, ps.keys FROM push_subscriptions ps
       JOIN users u ON u.id=ps.user_id WHERE u.role='admin'`
    );
    await Promise.allSettled(
      admins.rows.map(s =>
        webpush.sendNotification({ endpoint: s.endpoint, keys: s.keys }, JSON.stringify(payload))
          .catch(async (err) => {
            if (err.statusCode === 410 || err.statusCode === 404) {
              await pool.query('DELETE FROM push_subscriptions WHERE endpoint=$1', [s.endpoint]);
            }
          })
      )
    );
  } catch (e) { console.error('push admins error:', e.message); }
};

// Internal helper — broadcast to all users (not admins)
const broadcastToUsers = async (payload) => {
  try {
    const subs = await pool.query(
      `SELECT ps.endpoint, ps.keys FROM push_subscriptions ps
       JOIN users u ON u.id=ps.user_id WHERE u.role='user'`
    );
    await Promise.allSettled(
      subs.rows.map(s =>
        webpush.sendNotification({ endpoint: s.endpoint, keys: s.keys }, JSON.stringify(payload))
          .catch(async (err) => {
            if (err.statusCode === 410 || err.statusCode === 404) {
              await pool.query('DELETE FROM push_subscriptions WHERE endpoint=$1', [s.endpoint]);
            }
          })
      )
    );
  } catch (e) { console.error('push broadcast error:', e.message); }
};

// POST /send — admin sends broadcast to all users
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
    res.json({ message: 'Notifications sent' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// Export helpers for use in other routes
module.exports = router;
module.exports.sendToUser = sendToUser;
module.exports.sendToAdmins = sendToAdmins;
module.exports.broadcastToUsers = broadcastToUsers;

const router = require('express').Router();
const pool = require('../db');
const { auth, adminOnly } = require('../middleware/auth');

const ensureColumns = async () => {
  try {
    await pool.query(`
      ALTER TABLE reviews ADD COLUMN IF NOT EXISTS admin_reply TEXT;
      ALTER TABLE reviews ADD COLUMN IF NOT EXISTS admin_reply_at TIMESTAMPTZ;
      ALTER TABLE reviews ADD COLUMN IF NOT EXISTS likes INTEGER DEFAULT 0;
      ALTER TABLE reviews ADD COLUMN IF NOT EXISTS is_visible BOOLEAN DEFAULT TRUE;
    `);
  } catch (e) { console.log('reviews columns:', e.message); }
};
ensureColumns();

// GET product reviews (public)
router.get('/:productId', async (req, res) => {
  const r = await pool.query(
    `SELECT rv.*, u.username, u.profile_picture
     FROM reviews rv JOIN users u ON u.id=rv.user_id
     WHERE rv.product_id=$1 AND COALESCE(rv.is_visible,TRUE)=TRUE
     ORDER BY rv.created_at DESC`,
    [req.params.productId]
  );
  res.json(r.rows);
});

// GET all reviews (admin)
router.get('/', auth, adminOnly, async (req, res) => {
  const { product_id } = req.query;
  let q = `SELECT rv.*, u.username, u.profile_picture, p.name as product_name, p.images as product_images
           FROM reviews rv JOIN users u ON u.id=rv.user_id JOIN products p ON p.id=rv.product_id`;
  const params = [];
  if (product_id) { q += ' WHERE rv.product_id=$1'; params.push(product_id); }
  q += ' ORDER BY rv.created_at DESC';
  const r = await pool.query(q, params);
  res.json(r.rows);
});

router.post('/', auth, async (req, res) => {
  const { product_id, rating, comment } = req.body;
  try {
    const r = await pool.query(
      `INSERT INTO reviews (product_id, user_id, rating, comment)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT (product_id, user_id) DO UPDATE SET rating=$3, comment=$4 RETURNING *`,
      [product_id, req.user.id, rating, comment]
    );
    // Notify admins (socket + push + browser)
    try {
      const userR = await pool.query('SELECT username FROM users WHERE id=$1', [req.user.id]);
      const payload = {
        type: 'review',
        title: '⭐ Nueva reseña de producto',
        body: `${userR.rows[0]?.username || 'Un usuario'} dejó una reseña`,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
        url: '/admin'
      };
      const io = req.app.get('io');
      if (io) io.emit('in_app_notification_admin', payload);
      const { sendToAdmins } = require('./push');
      await sendToAdmins(payload);
    } catch (_) {}

    res.status(201).json(r.rows[0]);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.put('/:id/reply', auth, adminOnly, async (req, res) => {
  const r = await pool.query(
    `UPDATE reviews SET admin_reply=$1, admin_reply_at=NOW() WHERE id=$2 RETURNING *`,
    [req.body.admin_reply, req.params.id]
  );
  res.json(r.rows[0]);
});

router.put('/:id/visibility', auth, adminOnly, async (req, res) => {
  const r = await pool.query(
    `UPDATE reviews SET is_visible=NOT COALESCE(is_visible,TRUE) WHERE id=$1 RETURNING *`,
    [req.params.id]
  );
  res.json(r.rows[0]);
});

router.post('/:id/like', auth, async (req, res) => {
  const r = await pool.query(
    `UPDATE reviews SET likes=COALESCE(likes,0)+1 WHERE id=$1 RETURNING likes`,
    [req.params.id]
  );
  res.json(r.rows[0]);
});

router.delete('/:id', auth, adminOnly, async (req, res) => {
  await pool.query('DELETE FROM reviews WHERE id=$1', [req.params.id]);
  res.json({ message: 'Deleted' });
});

module.exports = router;

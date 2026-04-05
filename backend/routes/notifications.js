const router = require('express').Router();
const pool = require('../db');
const { auth, adminOnly } = require('../middleware/auth');

// GET all active notifications
router.get('/', auth, async (req, res) => {
  const r = await pool.query(
    `SELECT n.*, u.username as admin_name,
      CASE WHEN nr.user_id IS NOT NULL THEN TRUE ELSE FALSE END as is_read
     FROM notifications n
     LEFT JOIN users u ON u.id=n.admin_id
     LEFT JOIN notification_reads nr ON nr.notification_id=n.id AND nr.user_id=$1
     WHERE n.is_active=TRUE ORDER BY n.created_at DESC`,
    [req.user.id]
  );
  res.json(r.rows);
});

// POST create notification (admin)
router.post('/', auth, adminOnly, async (req, res) => {
  const { title, description, image_url } = req.body;
  try {
    const r = await pool.query(
      `INSERT INTO notifications (title, description, image_url, admin_id) VALUES($1,$2,$3,$4) RETURNING *`,
      [title, description, image_url || null, req.user.id]
    );
    res.status(201).json(r.rows[0]);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// POST mark as read
router.post('/:id/read', auth, async (req, res) => {
  await pool.query(
    `INSERT INTO notification_reads (user_id, notification_id) VALUES($1,$2) ON CONFLICT DO NOTHING`,
    [req.user.id, req.params.id]
  );
  res.json({ message: 'Marked as read' });
});

// DELETE notification (admin)
router.delete('/:id', auth, adminOnly, async (req, res) => {
  await pool.query('UPDATE notifications SET is_active=FALSE WHERE id=$1', [req.params.id]);
  res.json({ message: 'Deleted' });
});

// POST /read-all
router.post('/read-all', auth, async (req, res) => {
  await pool.query('UPDATE notifications SET is_read=TRUE WHERE user_id=$1', [req.user.id]);
  res.json({ message: 'All read' });
});

module.exports = router;

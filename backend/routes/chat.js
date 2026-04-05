const router = require('express').Router();
const pool = require('../db');
const { auth, adminOnly } = require('../middleware/auth');

// GET chat history between user and admin
router.get('/history/:userId', auth, async (req, res) => {
  const otherUserId = req.params.userId;
  try {
    const r = await pool.query(
      `SELECT cm.*, u.username as sender_name, u.profile_picture as sender_pic
       FROM chat_messages cm JOIN users u ON u.id=cm.sender_id
       WHERE (cm.sender_id=$1 AND cm.receiver_id=$2) OR (cm.sender_id=$2 AND cm.receiver_id=$1)
       ORDER BY cm.created_at ASC`,
      [req.user.id, otherUserId]
    );
    res.json(r.rows);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// POST save a message to DB
router.post('/', auth, async (req, res) => {
  const { receiver_id, message } = req.body;
  try {
    const r = await pool.query(
      `INSERT INTO chat_messages (sender_id, receiver_id, message) VALUES($1,$2,$3) RETURNING *`,
      [req.user.id, receiver_id, message]
    );
    res.status(201).json(r.rows[0]);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// GET all users who have chatted with admin (for admin panel)
router.get('/conversations', auth, adminOnly, async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT DISTINCT ON (u.id) u.id, u.username, u.profile_picture, u.email,
        cm.message as last_message, cm.created_at as last_time,
        COUNT(cm2.id) FILTER (WHERE cm2.is_read=FALSE AND cm2.receiver_id=$1) as unread_count
       FROM users u
       JOIN chat_messages cm ON (cm.sender_id=u.id OR cm.receiver_id=u.id)
       LEFT JOIN chat_messages cm2 ON cm2.sender_id=u.id AND cm2.receiver_id=$1
       WHERE u.role='user' AND (cm.sender_id=$1 OR cm.receiver_id=$1)
       GROUP BY u.id, cm.message, cm.created_at
       ORDER BY u.id, cm.created_at DESC`,
      [req.user.id]
    );
    res.json(r.rows);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// GET admin user id (so frontend knows who to chat with)
router.get('/admin-id', auth, async (_req, res) => {
  const r = await pool.query(`SELECT id, username, profile_picture FROM users WHERE role='admin' LIMIT 1`);
  if (!r.rows.length) return res.status(404).json({ message: 'No admin found' });
  res.json(r.rows[0]);
});

// POST mark messages as read
router.post('/mark-read/:senderId', auth, async (req, res) => {
  await pool.query(
    `UPDATE chat_messages SET is_read=TRUE WHERE sender_id=$1 AND receiver_id=$2`,
    [req.params.senderId, req.user.id]
  );
  res.json({ message: 'Marked read' });
});

module.exports = router;

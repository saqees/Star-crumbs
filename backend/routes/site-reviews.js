const router = require('express').Router();
const pool = require('../db');
const { auth, adminOnly } = require('../middleware/auth');

// GET public reviews
router.get('/', async (_req, res) => {
  const r = await pool.query(
    `SELECT sr.*, u.profile_picture FROM site_reviews sr
     LEFT JOIN users u ON u.id=sr.user_id
     WHERE sr.is_public=TRUE ORDER BY sr.created_at DESC`
  );
  res.json(r.rows);
});

// GET all reviews (admin)
router.get('/all', auth, adminOnly, async (_req, res) => {
  const r = await pool.query(
    `SELECT sr.*, u.profile_picture, u.email FROM site_reviews sr
     LEFT JOIN users u ON u.id=sr.user_id ORDER BY sr.created_at DESC`
  );
  res.json(r.rows);
});

// POST create review
router.post('/', auth, async (req, res) => {
  const { rating, comment, type } = req.body;
  if (!comment) return res.status(400).json({ message: 'Comment required' });
  try {
    const user = await pool.query('SELECT username FROM users WHERE id=$1', [req.user.id]);
    const r = await pool.query(
      `INSERT INTO site_reviews (user_id, username, rating, comment, type)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [req.user.id, user.rows[0]?.username, rating || null, comment, type || 'review']
    );
    res.status(201).json(r.rows[0]);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// PUT mark as read (admin)
router.put('/:id/read', auth, adminOnly, async (req, res) => {
  await pool.query('UPDATE site_reviews SET is_read=TRUE WHERE id=$1', [req.params.id]);
  res.json({ message: 'Marked as read' });
});

// DELETE review (admin)
router.delete('/:id', auth, adminOnly, async (req, res) => {
  await pool.query('DELETE FROM site_reviews WHERE id=$1', [req.params.id]);
  res.json({ message: 'Deleted' });
});

module.exports = router;

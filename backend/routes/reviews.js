const router = require('express').Router();
const pool = require('../db');
const { auth } = require('../middleware/auth');

router.get('/:productId', async (req, res) => {
  const r = await pool.query(
    `SELECT rv.*, u.username, u.profile_picture FROM reviews rv JOIN users u ON u.id=rv.user_id
     WHERE rv.product_id=$1 ORDER BY rv.created_at DESC`,
    [req.params.productId]
  );
  res.json(r.rows);
});

router.post('/', auth, async (req, res) => {
  const { product_id, rating, comment } = req.body;
  try {
    const r = await pool.query(
      `INSERT INTO reviews (product_id, user_id, rating, comment) VALUES($1,$2,$3,$4)
       ON CONFLICT (product_id, user_id) DO UPDATE SET rating=$3, comment=$4
       RETURNING *`,
      [product_id, req.user.id, rating, comment]
    );
    res.status(201).json(r.rows[0]);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports = router;

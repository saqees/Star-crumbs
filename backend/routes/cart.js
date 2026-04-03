const router = require('express').Router();
const pool = require('../db');
const { auth } = require('../middleware/auth');

// GET /api/cart
router.get('/', auth, async (req, res) => {
  const r = await pool.query(
    `SELECT ci.id, ci.quantity, ci.product_id, p.name, p.price, p.images, p.stock
     FROM cart_items ci JOIN products p ON p.id=ci.product_id
     WHERE ci.user_id=$1`,
    [req.user.id]
  );
  res.json(r.rows);
});

// POST /api/cart
router.post('/', auth, async (req, res) => {
  const { product_id, quantity } = req.body;
  try {
    const r = await pool.query(
      `INSERT INTO cart_items (user_id, product_id, quantity)
       VALUES ($1,$2,$3)
       ON CONFLICT (user_id, product_id) DO UPDATE SET quantity=cart_items.quantity+$3
       RETURNING *`,
      [req.user.id, product_id, quantity || 1]
    );
    res.status(201).json(r.rows[0]);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// PUT /api/cart/:id
router.put('/:id', auth, async (req, res) => {
  const { quantity } = req.body;
  if (quantity < 1) {
    await pool.query('DELETE FROM cart_items WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id]);
    return res.json({ message: 'Removed' });
  }
  const r = await pool.query(
    'UPDATE cart_items SET quantity=$1 WHERE id=$2 AND user_id=$3 RETURNING *',
    [quantity, req.params.id, req.user.id]
  );
  res.json(r.rows[0]);
});

// DELETE /api/cart/:id
router.delete('/:id', auth, async (req, res) => {
  await pool.query('DELETE FROM cart_items WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id]);
  res.json({ message: 'Removed' });
});

// DELETE /api/cart (clear all)
router.delete('/', auth, async (req, res) => {
  await pool.query('DELETE FROM cart_items WHERE user_id=$1', [req.user.id]);
  res.json({ message: 'Cart cleared' });
});

module.exports = router;

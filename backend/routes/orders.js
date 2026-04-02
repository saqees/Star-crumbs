const router = require('express').Router();
const pool = require('../db');
const { auth, adminOnly } = require('../middleware/auth');

// POST /api/orders - place order from cart
router.post('/', auth, async (req, res) => {
  const { payment_method, notes } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const cartItems = await client.query(
      `SELECT ci.quantity, ci.product_id, p.price, p.stock, p.name
       FROM cart_items ci JOIN products p ON p.id=ci.product_id WHERE ci.user_id=$1`,
      [req.user.id]
    );
    if (!cartItems.rows.length) { await client.query('ROLLBACK'); return res.status(400).json({ message: 'Cart is empty' }); }

    const total = cartItems.rows.reduce((acc, i) => acc + Number(i.price) * i.quantity, 0);
    const order = await client.query(
      `INSERT INTO orders (user_id, total, payment_method, notes) VALUES ($1,$2,$3,$4) RETURNING id`,
      [req.user.id, total, payment_method, notes]
    );
    const orderId = order.rows[0].id;

    for (const item of cartItems.rows) {
      await client.query(
        'INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES ($1,$2,$3,$4)',
        [orderId, item.product_id, item.quantity, item.price]
      );
      await client.query('UPDATE products SET stock=stock-$1 WHERE id=$2', [item.quantity, item.product_id]);
    }

    await client.query('DELETE FROM cart_items WHERE user_id=$1', [req.user.id]);
    await client.query('COMMIT');
    res.status(201).json({ orderId, total });
  } catch (e) {
    await client.query('ROLLBACK');
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  } finally { client.release(); }
});

// GET /api/orders (admin gets all, user gets own)
router.get('/', auth, async (req, res) => {
  const query = req.user.role === 'admin'
    ? `SELECT o.*, u.username, u.email FROM orders o LEFT JOIN users u ON u.id=o.user_id ORDER BY o.created_at DESC`
    : `SELECT * FROM orders WHERE user_id=$1 ORDER BY created_at DESC`;
  const params = req.user.role === 'admin' ? [] : [req.user.id];
  const r = await pool.query(query, params);
  res.json(r.rows);
});

// PUT /api/orders/:id/status (admin)
router.put('/:id/status', auth, adminOnly, async (req, res) => {
  const { status } = req.body;
  const r = await pool.query(
    'UPDATE orders SET status=$1, updated_at=NOW() WHERE id=$2 RETURNING *',
    [status, req.params.id]
  );
  res.json(r.rows[0]);
});

module.exports = router;

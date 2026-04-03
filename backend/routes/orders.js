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
      `SELECT ci.quantity, ci.product_id, p.price, p.stock, p.name, p.images
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

// GET /api/orders
router.get('/', auth, async (req, res) => {
  try {
    const { archived, deleted } = req.query;
    if (req.user.role === 'admin') {
      let whereClause = 'WHERE o.deleted_by_admin=FALSE AND o.archived_by_admin=FALSE';
      if (archived === 'true') whereClause = 'WHERE o.archived_by_admin=TRUE AND o.deleted_by_admin=FALSE';
      if (deleted === 'true') whereClause = 'WHERE o.deleted_by_admin=TRUE';
      const r = await pool.query(
        `SELECT o.*, u.username, u.email, u.full_name, u.phone, u.ambiente_number, u.schedule, u.profile_picture
         FROM orders o LEFT JOIN users u ON u.id=o.user_id ${whereClause} ORDER BY o.created_at DESC`
      );
      res.json(r.rows);
    } else {
      let whereClause = 'WHERE o.user_id=$1 AND o.deleted_by_user=FALSE AND o.deleted_by_admin=FALSE AND o.archived_by_user=FALSE';
      if (archived === 'true') whereClause = 'WHERE o.user_id=$1 AND o.archived_by_user=TRUE AND o.deleted_by_user=FALSE';
      const r = await pool.query(
        `SELECT o.*, json_agg(json_build_object(
            'product_id', oi.product_id, 'quantity', oi.quantity,
            'unit_price', oi.unit_price, 'name', p.name, 'images', p.images
          )) as items
         FROM orders o
         LEFT JOIN order_items oi ON oi.order_id=o.id
         LEFT JOIN products p ON p.id=oi.product_id
         ${whereClause} GROUP BY o.id ORDER BY o.created_at DESC`,
        [req.user.id]
      );
      res.json(r.rows);
    }
  } catch (e) { console.error(e); res.status(500).json({ message: 'Server error' }); }
});

// GET single order with items
router.get('/:id', auth, async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT o.*, u.username, u.email, u.full_name, u.phone, u.ambiente_number, u.schedule, u.profile_picture,
        json_agg(json_build_object(
          'product_id', oi.product_id, 'quantity', oi.quantity,
          'unit_price', oi.unit_price, 'name', p.name, 'images', p.images
        )) as items
       FROM orders o
       LEFT JOIN users u ON u.id=o.user_id
       LEFT JOIN order_items oi ON oi.order_id=o.id
       LEFT JOIN products p ON p.id=oi.product_id
       WHERE o.id=$1
       GROUP BY o.id, u.username, u.email, u.full_name, u.phone, u.ambiente_number, u.schedule, u.profile_picture`,
      [req.params.id]
    );
    if (!r.rows.length) return res.status(404).json({ message: 'Order not found' });
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ message: 'Server error' }); }
});

// PUT status (admin)
router.put('/:id/status', auth, adminOnly, async (req, res) => {
  const r = await pool.query('UPDATE orders SET status=$1, updated_at=NOW() WHERE id=$2 RETURNING *', [req.body.status, req.params.id]);
  res.json(r.rows[0]);
});

// PUT archive (admin)
router.put('/:id/archive', auth, adminOnly, async (req, res) => {
  await pool.query('UPDATE orders SET archived_by_admin=TRUE WHERE id=$1', [req.params.id]);
  res.json({ message: 'Archived' });
});

// PUT restore (admin)
router.put('/:id/restore', auth, adminOnly, async (req, res) => {
  await pool.query('UPDATE orders SET archived_by_admin=FALSE, deleted_by_admin=FALSE WHERE id=$1', [req.params.id]);
  res.json({ message: 'Restored' });
});

// DELETE soft (admin)
router.delete('/:id/admin', auth, adminOnly, async (req, res) => {
  await pool.query('UPDATE orders SET deleted_by_admin=TRUE WHERE id=$1', [req.params.id]);
  res.json({ message: 'Deleted' });
});

// DELETE permanent (admin)
router.delete('/:id/permanent', auth, adminOnly, async (req, res) => {
  await pool.query('DELETE FROM order_items WHERE order_id=$1', [req.params.id]);
  await pool.query('DELETE FROM orders WHERE id=$1', [req.params.id]);
  res.json({ message: 'Permanently deleted' });
});

// PUT user archive
router.put('/:id/user-archive', auth, async (req, res) => {
  await pool.query('UPDATE orders SET archived_by_user=TRUE WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id]);
  res.json({ message: 'Archived' });
});

// DELETE user soft-delete
router.delete('/:id/user-delete', auth, async (req, res) => {
  await pool.query('UPDATE orders SET deleted_by_user=TRUE WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id]);
  res.json({ message: 'Deleted' });
});

module.exports = router;

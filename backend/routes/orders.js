const router = require('express').Router();
const pool = require('../db');
const { auth, adminOnly } = require('../middleware/auth');

// Ensure columns exist on startup (safe migration)
const ensureColumns = async () => {
  try {
    await pool.query(`
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS archived_by_admin BOOLEAN DEFAULT FALSE;
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS deleted_by_admin  BOOLEAN DEFAULT FALSE;
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS archived_by_user  BOOLEAN DEFAULT FALSE;
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS deleted_by_user   BOOLEAN DEFAULT FALSE;
    `);
  } catch (e) { console.log('Column check:', e.message); }
};
ensureColumns();

// POST /api/orders
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
    if (!cartItems.rows.length) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Cart is empty' });
    }
    const total = cartItems.rows.reduce((acc, i) => acc + Number(i.price) * i.quantity, 0);
    const order = await client.query(
      `INSERT INTO orders (user_id, total, payment_method, notes) VALUES ($1,$2,$3,$4) RETURNING id`,
      [req.user.id, total, payment_method, notes]
    );
    const orderId = order.rows[0].id;
    for (const item of cartItems.rows) {
      await client.query('INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES ($1,$2,$3,$4)',
        [orderId, item.product_id, item.quantity, item.price]);
      await client.query('UPDATE products SET stock=stock-$1 WHERE id=$2', [item.quantity, item.product_id]);
    }
    await client.query('DELETE FROM cart_items WHERE user_id=$1', [req.user.id]);
    await client.query('COMMIT');

    // Notify admins: socket (real-time, no install needed) + push (background)
    try {
      const userRow = await pool.query('SELECT username FROM users WHERE id=$1', [req.user.id]);
      const username = userRow.rows[0]?.username || 'Un usuario';
      const notifPayload = {
        title: '🛍️ Nuevo pedido recibido',
        body: `${username} realizó un pedido por $${total.toLocaleString('es-CO')}`,
        url: '/admin', icon: '/icons/icon-192x192.png'
      };
      // Real-time socket to online admins
      const io = req.app.get('io');
      const onlineUsers = req.app.get('onlineUsers');
      if (io && onlineUsers) {
        const admins = await pool.query("SELECT id FROM users WHERE role='admin'");
        admins.rows.forEach(a => {
          const sid = onlineUsers.get(a.id);
          if (sid) io.to(sid).emit('star_crumbs_notification', notifPayload);
        });
      }
      // Push for offline admins
      const { sendToAdmins } = require('./push');
      await sendToAdmins({ ...notifPayload, badge: '/icons/badge-72x72.png' });
    } catch (_) {}

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
      let where = 'WHERE COALESCE(o.deleted_by_admin,FALSE)=FALSE AND COALESCE(o.archived_by_admin,FALSE)=FALSE';
      if (archived === 'true') where = 'WHERE COALESCE(o.archived_by_admin,FALSE)=TRUE AND COALESCE(o.deleted_by_admin,FALSE)=FALSE';
      if (deleted === 'true') where = 'WHERE COALESCE(o.deleted_by_admin,FALSE)=TRUE';
      const r = await pool.query(`
        SELECT o.*, u.username, u.email, u.full_name, u.phone, u.ambiente_number, u.schedule, u.profile_picture,
          COALESCE(json_agg(json_build_object(
            'product_id', oi.product_id, 'quantity', oi.quantity,
            'unit_price', oi.unit_price, 'name', p.name, 'images', p.images
          )) FILTER (WHERE oi.id IS NOT NULL), '[]') as items
        FROM orders o
        LEFT JOIN users u ON u.id=o.user_id
        LEFT JOIN order_items oi ON oi.order_id=o.id
        LEFT JOIN products p ON p.id=oi.product_id
        ${where}
        GROUP BY o.id, u.username, u.email, u.full_name, u.phone, u.ambiente_number, u.schedule, u.profile_picture
        ORDER BY o.created_at DESC`);
      res.json(r.rows);
    } else {
      let where = 'WHERE o.user_id=$1 AND COALESCE(o.deleted_by_user,FALSE)=FALSE AND COALESCE(o.deleted_by_admin,FALSE)=FALSE AND COALESCE(o.archived_by_user,FALSE)=FALSE';
      if (archived === 'true') where = 'WHERE o.user_id=$1 AND COALESCE(o.archived_by_user,FALSE)=TRUE AND COALESCE(o.deleted_by_user,FALSE)=FALSE';
      const r = await pool.query(`
        SELECT o.*,
          COALESCE(json_agg(json_build_object(
            'product_id', oi.product_id, 'quantity', oi.quantity,
            'unit_price', oi.unit_price, 'name', p.name, 'images', p.images
          )) FILTER (WHERE oi.id IS NOT NULL), '[]') as items
        FROM orders o
        LEFT JOIN order_items oi ON oi.order_id=o.id
        LEFT JOIN products p ON p.id=oi.product_id
        ${where}
        GROUP BY o.id
        ORDER BY o.created_at DESC`, [req.user.id]);
      res.json(r.rows);
    }
  } catch (e) { console.error(e); res.status(500).json({ message: e.message }); }
});

// GET single
router.get('/:id', auth, async (req, res) => {
  try {
    const r = await pool.query(`
      SELECT o.*, u.username, u.email, u.full_name, u.phone, u.ambiente_number, u.schedule, u.profile_picture,
        COALESCE(json_agg(json_build_object(
          'product_id', oi.product_id, 'quantity', oi.quantity,
          'unit_price', oi.unit_price, 'name', p.name, 'images', p.images
        )) FILTER (WHERE oi.id IS NOT NULL), '[]') as items
      FROM orders o
      LEFT JOIN users u ON u.id=o.user_id
      LEFT JOIN order_items oi ON oi.order_id=o.id
      LEFT JOIN products p ON p.id=oi.product_id
      WHERE o.id=$1
      GROUP BY o.id, u.username, u.email, u.full_name, u.phone, u.ambiente_number, u.schedule, u.profile_picture`,
      [req.params.id]);
    if (!r.rows.length) return res.status(404).json({ message: 'Not found' });
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// Admin routes
router.put('/:id/status', auth, adminOnly, async (req, res) => {
  const r = await pool.query('UPDATE orders SET status=$1, updated_at=NOW() WHERE id=$2 RETURNING *', [req.body.status, req.params.id]);
  res.json(r.rows[0]);
});
router.put('/:id/archive', auth, adminOnly, async (req, res) => {
  await pool.query('UPDATE orders SET archived_by_admin=TRUE WHERE id=$1', [req.params.id]);
  res.json({ message: 'Archived' });
});
router.put('/:id/restore', auth, adminOnly, async (req, res) => {
  await pool.query('UPDATE orders SET archived_by_admin=FALSE, deleted_by_admin=FALSE WHERE id=$1', [req.params.id]);
  res.json({ message: 'Restored' });
});
router.delete('/:id/admin', auth, adminOnly, async (req, res) => {
  await pool.query('UPDATE orders SET deleted_by_admin=TRUE WHERE id=$1', [req.params.id]);
  res.json({ message: 'Deleted' });
});
router.delete('/:id/permanent', auth, adminOnly, async (req, res) => {
  await pool.query('DELETE FROM order_items WHERE order_id=$1', [req.params.id]);
  await pool.query('DELETE FROM orders WHERE id=$1', [req.params.id]);
  res.json({ message: 'Permanently deleted' });
});

// User archive/delete — with explicit error handling
router.put('/:id/user-archive', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'UPDATE orders SET archived_by_user=TRUE WHERE id=$1 AND user_id=$2 RETURNING id',
      [req.params.id, req.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ message: 'Pedido no encontrado' });
    res.json({ message: 'Archived', id: result.rows[0].id });
  } catch (e) {
    console.error('user-archive error:', e.message);
    res.status(500).json({ message: e.message });
  }
});
router.delete('/:id/user-delete', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'UPDATE orders SET deleted_by_user=TRUE WHERE id=$1 AND user_id=$2 RETURNING id',
      [req.params.id, req.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ message: 'Pedido no encontrado' });
    res.json({ message: 'Deleted', id: result.rows[0].id });
  } catch (e) {
    console.error('user-delete error:', e.message);
    res.status(500).json({ message: e.message });
  }
});

// Edit order items
router.put('/:id/edit-items', auth, async (req, res) => {
  const { items } = req.body;
  if (!items || !items.length) return res.status(400).json({ message: 'Items required' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const ord = await client.query('SELECT * FROM orders WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id]);
    if (!ord.rows.length) return res.status(404).json({ message: 'Order not found' });
    if (ord.rows[0].status !== 'pending') return res.status(400).json({ message: 'Solo pedidos pendientes' });
    const oldItems = await client.query('SELECT * FROM order_items WHERE order_id=$1', [req.params.id]);
    for (const oi of oldItems.rows) await client.query('UPDATE products SET stock=stock+$1 WHERE id=$2', [oi.quantity, oi.product_id]);
    await client.query('DELETE FROM order_items WHERE order_id=$1', [req.params.id]);
    let total = 0;
    for (const item of items) {
      const p = await client.query('SELECT price FROM products WHERE id=$1', [item.product_id]);
      if (!p.rows.length) continue;
      const price = Number(p.rows[0].price);
      await client.query('INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES ($1,$2,$3,$4)', [req.params.id, item.product_id, item.quantity, price]);
      await client.query('UPDATE products SET stock=stock-$1 WHERE id=$2', [item.quantity, item.product_id]);
      total += price * item.quantity;
    }
    await client.query('UPDATE orders SET total=$1, updated_at=NOW() WHERE id=$2', [total, req.params.id]);
    await client.query('COMMIT');
    res.json({ message: 'Order updated', total });
  } catch (e) { await client.query('ROLLBACK'); res.status(500).json({ message: e.message }); }
  finally { client.release(); }
});

module.exports = router;

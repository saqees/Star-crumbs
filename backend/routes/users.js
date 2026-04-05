const router = require('express').Router();
const pool = require('../db');
const { auth, adminOnly } = require('../middleware/auth');

// Ensure is_active column
const ensureColumns = async () => {
  try {
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE`);
  } catch (e) { console.log('users cols:', e.message); }
};
ensureColumns();

// GET /api/users (admin) — include is_active
router.get('/', auth, adminOnly, async (_req, res) => {
  const r = await pool.query(
    `SELECT id, username, email, full_name, phone, ambiente_number, schedule,
            profile_picture, role, COALESCE(is_active,TRUE) as is_active, created_at
     FROM users ORDER BY created_at DESC`
  );
  res.json(r.rows);
});

// PUT /api/users/me — update own profile
router.put('/me', auth, async (req, res) => {
  const { full_name, phone, ambiente_number, schedule, username, profile_picture } = req.body;
  try {
    const r = await pool.query(
      `UPDATE users SET
        full_name=COALESCE($1,full_name), phone=COALESCE($2,phone),
        ambiente_number=COALESCE($3,ambiente_number), schedule=COALESCE($4,schedule),
        username=COALESCE($5,username), profile_picture=COALESCE($6,profile_picture),
        updated_at=NOW()
       WHERE id=$7
       RETURNING id,username,email,full_name,phone,ambiente_number,schedule,profile_picture,role`,
      [full_name, phone, ambiente_number, schedule, username, profile_picture, req.user.id]
    );
    res.json(r.rows[0]);
  } catch (e) { console.error(e); res.status(500).json({ message: 'Server error' }); }
});

// GET /api/users/me/stats — purchase stats for current user
router.get('/me/stats', auth, async (req, res) => {
  try {
    // Total units purchased
    const totalR = await pool.query(
      `SELECT COALESCE(SUM(oi.quantity), 0) as total_units,
              COUNT(DISTINCT o.id) as total_orders
       FROM orders o
       JOIN order_items oi ON oi.order_id = o.id
       WHERE o.user_id=$1
         AND COALESCE(o.deleted_by_user,FALSE)=FALSE
         AND COALESCE(o.deleted_by_admin,FALSE)=FALSE`,
      [req.user.id]
    );

    // Favorite products (most ordered)
    const favR = await pool.query(
      `SELECT p.id, p.name, p.images, p.price,
              SUM(oi.quantity) as total_qty,
              COUNT(DISTINCT o.id) as times_ordered
       FROM orders o
       JOIN order_items oi ON oi.order_id = o.id
       JOIN products p ON p.id = oi.product_id
       WHERE o.user_id=$1
         AND COALESCE(o.deleted_by_user,FALSE)=FALSE
         AND COALESCE(o.deleted_by_admin,FALSE)=FALSE
       GROUP BY p.id, p.name, p.images, p.price
       ORDER BY total_qty DESC
       LIMIT 5`,
      [req.user.id]
    );

    res.json({
      total_units: parseInt(totalR.rows[0]?.total_units || 0),
      total_orders: parseInt(totalR.rows[0]?.total_orders || 0),
      favorites: favR.rows
    });
  } catch (e) { console.error(e); res.status(500).json({ message: e.message }); }
});

// PUT /api/users/:id/toggle-active (admin)
router.put('/:id/toggle-active', auth, adminOnly, async (req, res) => {
  try {
    const r = await pool.query(
      `UPDATE users SET is_active=NOT COALESCE(is_active,TRUE) WHERE id=$1 RETURNING id,username,is_active`,
      [req.params.id]
    );
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// DELETE /api/users/:id (admin — hard delete)
router.delete('/:id', auth, adminOnly, async (req, res) => {
  if (req.params.id === req.user.id) return res.status(400).json({ message: 'No puedes eliminarte a ti mismo' });
  try {
    // Anonymize orders first, then delete user
    await pool.query(`UPDATE orders SET notes=CONCAT(COALESCE(notes,''),' [cuenta eliminada]') WHERE user_id=$1`, [req.params.id]);
    await pool.query('DELETE FROM cart_items WHERE user_id=$1', [req.params.id]);
    await pool.query('DELETE FROM users WHERE id=$1', [req.params.id]);
    res.json({ message: 'Usuario eliminado' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports = router;

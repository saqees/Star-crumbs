const router = require('express').Router();
const pool = require('../db');
const { auth, adminOnly } = require('../middleware/auth');

// GET /api/users (admin)
router.get('/', auth, adminOnly, async (_req, res) => {
  const result = await pool.query(
    'SELECT id, username, email, full_name, phone, ambiente_number, schedule, profile_picture, role, created_at FROM users ORDER BY created_at DESC'
  );
  res.json(result.rows);
});

// PUT /api/users/me - update own profile
router.put('/me', auth, async (req, res) => {
  const { full_name, phone, ambiente_number, schedule, username, profile_picture } = req.body;
  try {
    const result = await pool.query(
      `UPDATE users SET
        full_name=COALESCE($1, full_name),
        phone=COALESCE($2, phone),
        ambiente_number=COALESCE($3, ambiente_number),
        schedule=COALESCE($4, schedule),
        username=COALESCE($5, username),
        profile_picture=COALESCE($6, profile_picture),
        updated_at=NOW()
       WHERE id=$7
       RETURNING id, username, email, full_name, phone, ambiente_number, schedule, profile_picture, role`,
      [full_name, phone, ambiente_number, schedule, username, profile_picture, req.user.id]
    );
    res.json(result.rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

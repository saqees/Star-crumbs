const router = require('express').Router();
const pool = require('../db');
const { auth, adminOnly } = require('../middleware/auth');

// GET setting by key (public)
router.get('/:key', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM site_settings WHERE setting_key=$1', [req.params.key]);
    if (!r.rows.length) return res.status(404).json({ message: 'Setting not found' });
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// PUT update setting (admin)
router.put('/:key', auth, adminOnly, async (req, res) => {
  const { setting_value } = req.body;
  try {
    const r = await pool.query(
      `INSERT INTO site_settings (setting_key, setting_value) VALUES ($1,$2)
       ON CONFLICT (setting_key) DO UPDATE SET setting_value=$2, updated_at=NOW()
       RETURNING *`,
      [req.params.key, JSON.stringify(setting_value)]
    );
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports = router;

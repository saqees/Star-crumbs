const router = require('express').Router();
const pool = require('../db');
const { auth, adminOnly } = require('../middleware/auth');

// Ensure store_theme default exists
const ensureTheme = async () => {
  try {
    await pool.query(`
      INSERT INTO site_settings (setting_key, setting_value) VALUES ('store_theme', '{
        "primary_color":"#C9956A","primary_dark":"#B5622E","secondary_color":"#5C3A1E",
        "accent_color":"#E8C99A","bg_color":"#FFF9F4","text_color":"#2D1B0E",
        "heading_font":"Playfair Display","body_font":"Lato",
        "btn_radius":"9999px","card_radius":"24px"
      }') ON CONFLICT (setting_key) DO NOTHING;
    `);
  } catch (e) { /* ignore */ }
};
ensureTheme();

router.get('/:key', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM site_settings WHERE setting_key=$1', [req.params.key]);
    if (!r.rows.length) return res.status(404).json({ message: 'Not found' });
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.put('/:key', auth, adminOnly, async (req, res) => {
  const { setting_value } = req.body;
  try {
    const r = await pool.query(
      `INSERT INTO site_settings (setting_key, setting_value)
       VALUES ($1,$2)
       ON CONFLICT (setting_key) DO UPDATE SET setting_value=$2, updated_at=NOW()
       RETURNING *`,
      [req.params.key, JSON.stringify(setting_value)]
    );
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports = router;

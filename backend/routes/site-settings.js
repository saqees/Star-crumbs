const router = require('express').Router();
const pool = require('../db');
const { auth, adminOnly } = require('../middleware/auth');

// Ensure store_theme default exists
const ensureTheme = async () => {
  try {
    await pool.query(`
      INSERT INTO site_settings (setting_key, setting_value) VALUES ('store_theme', '{"primary_color":"#C9956A","primary_dark":"#B5622E","secondary_color":"#5C3A1E","accent_color":"#E8C99A","bg_color":"#FFF9F4","text_color":"#2D1B0E","heading_font":"Playfair Display","body_font":"Lato","btn_radius":"9999px","card_radius":"24px"}') ON CONFLICT (setting_key) DO NOTHING;
    `);
  } catch (e) { /* ignore */ }
};
ensureTheme();

// GET: retorna setting_value ya como objeto JS (no string)
router.get('/:key', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM site_settings WHERE setting_key=$1', [req.params.key]);
    if (!r.rows.length) return res.status(404).json({ message: 'Not found' });
    const row = r.rows[0];
    // setting_value puede venir como string JSON o ya como objeto (depende del driver pg)
    let val = row.setting_value;
    if (typeof val === 'string') {
      try { val = JSON.parse(val); } catch (_) {}
    }
    res.json({ ...row, setting_value: val });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// PUT: siempre guarda como JSON string en la BD
router.put('/:key', auth, adminOnly, async (req, res) => {
  const { setting_value } = req.body;
  try {
    // Asegurar que se guarda como string JSON válido, sin importar qué llegue
    const valueToStore = typeof setting_value === 'string'
      ? setting_value
      : JSON.stringify(setting_value);

    const r = await pool.query(
      `INSERT INTO site_settings (setting_key, setting_value)
       VALUES ($1, $2::jsonb)
       ON CONFLICT (setting_key) DO UPDATE SET setting_value=$2::jsonb, updated_at=NOW()
       RETURNING *`,
      [req.params.key, valueToStore]
    );
    let val = r.rows[0].setting_value;
    if (typeof val === 'string') { try { val = JSON.parse(val); } catch (_) {} }
    res.json({ ...r.rows[0], setting_value: val });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports = router;

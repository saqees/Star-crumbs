const router = require('express').Router();
const pool = require('../db');
const { auth, adminOnly } = require('../middleware/auth');

router.get('/', async (_req, res) => {
  try {
    const r = await pool.query('SELECT * FROM carousel_slides WHERE is_active=TRUE ORDER BY order_index ASC');
    res.json(r.rows);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.get('/all', auth, adminOnly, async (_req, res) => {
  try {
    const r = await pool.query('SELECT * FROM carousel_slides ORDER BY order_index ASC');
    res.json(r.rows);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.post('/', auth, adminOnly, async (req, res) => {
  const { title, subtitle, description, button_text, button_url, image_url, bg_gradient, bg_color, order_index, display_mode, emoji } = req.body;
  try {
    const r = await pool.query(
      `INSERT INTO carousel_slides (title, subtitle, description, button_text, button_url, image_url, bg_gradient, bg_color, order_index, display_mode, emoji)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [title, subtitle, description, button_text||'Ver más', button_url||'/products', image_url||null,
       bg_gradient||'linear-gradient(135deg,#F5E6D3 60%,#E8C99A)', bg_color||'', order_index||0,
       display_mode||'emoji', emoji||'🍪']
    );
    res.status(201).json(r.rows[0]);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.put('/:id', auth, adminOnly, async (req, res) => {
  const { title, subtitle, description, button_text, button_url, image_url, bg_gradient, bg_color, order_index, is_active, display_mode, emoji } = req.body;
  try {
    const r = await pool.query(
      `UPDATE carousel_slides SET
        title=COALESCE($1,title), subtitle=COALESCE($2,subtitle), description=COALESCE($3,description),
        button_text=COALESCE($4,button_text), button_url=COALESCE($5,button_url),
        image_url=$6, bg_gradient=COALESCE($7,bg_gradient), bg_color=COALESCE($8,bg_color),
        order_index=COALESCE($9,order_index), is_active=COALESCE($10,is_active),
        display_mode=COALESCE($11,display_mode), emoji=COALESCE($12,emoji), updated_at=NOW()
       WHERE id=$13 RETURNING *`,
      [title, subtitle, description, button_text, button_url, image_url||null, bg_gradient, bg_color,
       order_index, is_active, display_mode, emoji, req.params.id]
    );
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.delete('/:id', auth, adminOnly, async (req, res) => {
  await pool.query('DELETE FROM carousel_slides WHERE id=$1', [req.params.id]);
  res.json({ message: 'Deleted' });
});

module.exports = router;

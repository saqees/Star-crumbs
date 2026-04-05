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
  const { title, subtitle, description, button_text, button_url, image_url,
    bg_gradient, bg_color, order_index, display_mode, emoji,
    title_color, subtitle_color, desc_color, title_font, body_font, tag_bg_color, btn_style } = req.body;
  try {
    const r = await pool.query(
      `INSERT INTO carousel_slides
        (title, subtitle, description, button_text, button_url, image_url,
         bg_gradient, bg_color, order_index, display_mode, emoji,
         title_color, subtitle_color, desc_color, title_font, body_font, tag_bg_color, btn_style)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18) RETURNING *`,
      [title, subtitle, description,
       button_text||'Ver más', button_url||'/products', image_url||null,
       bg_gradient||'linear-gradient(to right,#F5E6D3,#E8C99A)', bg_color||'',
       order_index||0, display_mode||'emoji', emoji||'🍪',
       title_color||'#3B2010', subtitle_color||'#ffffff', desc_color||'#6B4226',
       title_font||'Playfair Display', body_font||'Lato', tag_bg_color||'#C9956A', btn_style||'primary']
    );
    res.status(201).json(r.rows[0]);
  } catch (e) { console.error(e); res.status(500).json({ message: e.message }); }
});

router.put('/:id', auth, adminOnly, async (req, res) => {
  const { title, subtitle, description, button_text, button_url, image_url,
    bg_gradient, bg_color, order_index, is_active, display_mode, emoji,
    title_color, subtitle_color, desc_color, title_font, body_font, tag_bg_color, btn_style } = req.body;
  try {
    const r = await pool.query(
      `UPDATE carousel_slides SET
        title=COALESCE($1,title), subtitle=COALESCE($2,subtitle), description=COALESCE($3,description),
        button_text=COALESCE($4,button_text), button_url=COALESCE($5,button_url),
        image_url=$6, bg_gradient=COALESCE($7,bg_gradient), bg_color=COALESCE($8,bg_color),
        order_index=COALESCE($9,order_index), is_active=COALESCE($10,is_active),
        display_mode=COALESCE($11,display_mode), emoji=COALESCE($12,emoji),
        title_color=COALESCE($13,title_color), subtitle_color=COALESCE($14,subtitle_color),
        desc_color=COALESCE($15,desc_color), title_font=COALESCE($16,title_font),
        body_font=COALESCE($17,body_font), tag_bg_color=COALESCE($18,tag_bg_color),
        btn_style=COALESCE($19,btn_style), updated_at=NOW()
       WHERE id=$20 RETURNING *`,
      [title, subtitle, description, button_text, button_url, image_url||null,
       bg_gradient, bg_color, order_index, is_active, display_mode, emoji,
       title_color, subtitle_color, desc_color, title_font, body_font, tag_bg_color, btn_style,
       req.params.id]
    );
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.delete('/:id', auth, adminOnly, async (req, res) => {
  await pool.query('DELETE FROM carousel_slides WHERE id=$1', [req.params.id]);
  res.json({ message: 'Deleted' });
});

module.exports = router;

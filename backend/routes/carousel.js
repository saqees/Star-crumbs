const router = require('express').Router();
const pool = require('../db');
const { auth, adminOnly } = require('../middleware/auth');

// GET all active slides
router.get('/', async (_req, res) => {
  try {
    const r = await pool.query('SELECT * FROM carousel_slides WHERE is_active=TRUE ORDER BY order_index ASC');
    res.json(r.rows);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// GET all slides (admin)
router.get('/all', auth, adminOnly, async (_req, res) => {
  try {
    const r = await pool.query('SELECT * FROM carousel_slides ORDER BY order_index ASC');
    res.json(r.rows);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// POST create slide
router.post('/', auth, adminOnly, async (req, res) => {
  const { title, subtitle, description, button_text, button_url, image_url, bg_gradient, order_index } = req.body;
  try {
    const r = await pool.query(
      `INSERT INTO carousel_slides (title, subtitle, description, button_text, button_url, image_url, bg_gradient, order_index)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [title, subtitle, description, button_text || 'Ver más', button_url || '/products', image_url, bg_gradient, order_index || 0]
    );
    res.status(201).json(r.rows[0]);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// PUT update slide
router.put('/:id', auth, adminOnly, async (req, res) => {
  const { title, subtitle, description, button_text, button_url, image_url, bg_gradient, order_index, is_active } = req.body;
  try {
    const r = await pool.query(
      `UPDATE carousel_slides SET
        title=COALESCE($1,title), subtitle=COALESCE($2,subtitle), description=COALESCE($3,description),
        button_text=COALESCE($4,button_text), button_url=COALESCE($5,button_url),
        image_url=COALESCE($6,image_url), bg_gradient=COALESCE($7,bg_gradient),
        order_index=COALESCE($8,order_index), is_active=COALESCE($9,is_active), updated_at=NOW()
       WHERE id=$10 RETURNING *`,
      [title, subtitle, description, button_text, button_url, image_url, bg_gradient, order_index, is_active, req.params.id]
    );
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// DELETE slide
router.delete('/:id', auth, adminOnly, async (req, res) => {
  await pool.query('DELETE FROM carousel_slides WHERE id=$1', [req.params.id]);
  res.json({ message: 'Deleted' });
});

module.exports = router;

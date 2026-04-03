const router = require('express').Router();
const pool = require('../db');
const { auth, adminOnly } = require('../middleware/auth');

router.get('/', async (_req, res) => {
  const r = await pool.query('SELECT * FROM site_pages WHERE is_active=TRUE ORDER BY created_at ASC');
  res.json(r.rows);
});

router.get('/all', auth, adminOnly, async (_req, res) => {
  const r = await pool.query('SELECT * FROM site_pages ORDER BY created_at ASC');
  res.json(r.rows);
});

router.get('/slug/:slug', async (req, res) => {
  const r = await pool.query('SELECT * FROM site_pages WHERE slug=$1 AND is_active=TRUE', [req.params.slug]);
  if (!r.rows.length) return res.status(404).json({ message: 'Page not found' });
  res.json(r.rows[0]);
});

router.post('/', auth, adminOnly, async (req, res) => {
  const { title, slug, sections, is_active, show_in_nav } = req.body;
  try {
    const r = await pool.query(
      `INSERT INTO site_pages (title, slug, sections, is_active, show_in_nav) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [title, slug, JSON.stringify(sections || []), is_active !== false, show_in_nav !== false]
    );
    res.status(201).json(r.rows[0]);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.put('/:id', auth, adminOnly, async (req, res) => {
  const { title, slug, sections, is_active, show_in_nav } = req.body;
  try {
    const r = await pool.query(
      `UPDATE site_pages SET title=COALESCE($1,title), slug=COALESCE($2,slug),
       sections=COALESCE($3,sections), is_active=COALESCE($4,is_active),
       show_in_nav=COALESCE($5,show_in_nav), updated_at=NOW() WHERE id=$6 RETURNING *`,
      [title, slug, sections ? JSON.stringify(sections) : null, is_active, show_in_nav, req.params.id]
    );
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.delete('/:id', auth, adminOnly, async (req, res) => {
  await pool.query('DELETE FROM site_pages WHERE id=$1', [req.params.id]);
  res.json({ message: 'Deleted' });
});

module.exports = router;

const router = require('express').Router();
const pool = require('../db');
const { auth, adminOnly } = require('../middleware/auth');

router.get('/', async (_req, res) => {
  const r = await pool.query('SELECT * FROM categories ORDER BY name');
  res.json(r.rows);
});
router.post('/', auth, adminOnly, async (req, res) => {
  const { name, slug, description, image_url } = req.body;
  try {
    const r = await pool.query(
      'INSERT INTO categories (name,slug,description,image_url) VALUES($1,$2,$3,$4) RETURNING *',
      [name, slug, description, image_url]
    );
    res.status(201).json(r.rows[0]);
  } catch (e) { res.status(500).json({ message: e.message }); }
});
router.delete('/:id', auth, adminOnly, async (req, res) => {
  await pool.query('DELETE FROM categories WHERE id=$1', [req.params.id]);
  res.json({ message: 'Deleted' });
});
module.exports = router;

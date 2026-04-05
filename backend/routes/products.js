const router = require('express').Router();
const pool = require('../db');
const { auth, adminOnly } = require('../middleware/auth');

// GET /api/products
router.get('/', async (req, res) => {
  const { category, featured, search, sort } = req.query;
  let query = `SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id=c.id WHERE p.is_active=TRUE`;
  const params = [];
  if (category) { params.push(category); query += ` AND c.slug=$${params.length}`; }
  if (featured === 'true') query += ` AND p.is_featured=TRUE`;
  if (search) { params.push(`%${search}%`); query += ` AND (p.name ILIKE $${params.length} OR p.description ILIKE $${params.length})`; }
  if (sort === 'price_asc') query += ' ORDER BY p.price ASC';
  else if (sort === 'price_desc') query += ' ORDER BY p.price DESC';
  else if (sort === 'popular') query += ' ORDER BY p.rating_count DESC';
  else query += ' ORDER BY p.created_at DESC';
  try {
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/products/:id
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id=c.id WHERE p.id=$1`,
      [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ message: 'Product not found' });
    res.json(result.rows[0]);
  } catch (e) { res.status(500).json({ message: 'Server error' }); }
});

// POST /api/products (admin)
router.post('/', auth, adminOnly, async (req, res) => {
  const { name, description, price, stock, category_id, images, is_featured } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO products (name, description, price, stock, category_id, images, is_featured)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [name, description, price, stock || 0, category_id || null, images || [], is_featured || false]
    );
    res.status(201).json(result.rows[0]);
  } catch (e) { console.error(e); res.status(500).json({ message: 'Server error' }); }
});

// PUT /api/products/:id (admin)
router.put('/:id', auth, adminOnly, async (req, res) => {
  const { name, description, price, stock, category_id, images, is_featured, is_active } = req.body;
  try {
    const result = await pool.query(
      `UPDATE products SET name=COALESCE($1,name), description=COALESCE($2,description),
       price=COALESCE($3,price), stock=COALESCE($4,stock), category_id=COALESCE($5,category_id),
       images=COALESCE($6,images), is_featured=COALESCE($7,is_featured), is_active=COALESCE($8,is_active),
       updated_at=NOW() WHERE id=$9 RETURNING *`,
      [name, description, price, stock, category_id, images, is_featured, is_active, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ message: 'Product not found' });
    res.json(result.rows[0]);
  } catch (e) { res.status(500).json({ message: 'Server error' }); }
});

// DELETE /api/products/:id (admin)
router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    await pool.query('UPDATE products SET is_active=FALSE WHERE id=$1', [req.params.id]);
    res.json({ message: 'Product deactivated' });
  } catch (e) { res.status(500).json({ message: 'Server error' }); }
});

module.exports = router;

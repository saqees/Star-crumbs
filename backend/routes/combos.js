const router = require('express').Router();
const pool = require('../db');
const { auth, adminOnly } = require('../middleware/auth');

// Auto-ensure table exists
const ensureTable = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS combo_boxes (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(200) NOT NULL,
        description TEXT,
        image_url TEXT,
        units INTEGER NOT NULL DEFAULT 4,
        items JSONB DEFAULT '[]',
        original_price DECIMAL(10,2) DEFAULT 0,
        discount_amount DECIMAL(10,2) DEFAULT 0,
        discount_percent DECIMAL(5,2) DEFAULT 0,
        final_price DECIMAL(10,2) DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        is_featured BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
  } catch (e) { console.log('combo_boxes ensure:', e.message); }
};
ensureTable();

// GET active combos (public)
router.get('/', async (_req, res) => {
  try {
    const r = await pool.query('SELECT * FROM combo_boxes WHERE is_active=TRUE ORDER BY is_featured DESC, created_at DESC');
    res.json(r.rows);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// GET all (admin)
router.get('/all', auth, adminOnly, async (_req, res) => {
  try {
    const r = await pool.query('SELECT * FROM combo_boxes ORDER BY created_at DESC');
    res.json(r.rows);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// POST create
router.post('/', auth, adminOnly, async (req, res) => {
  const { name, description, image_url, units, items, original_price, discount_amount, discount_percent, final_price, is_active, is_featured } = req.body;
  try {
    const r = await pool.query(
      `INSERT INTO combo_boxes (name, description, image_url, units, items, original_price, discount_amount, discount_percent, final_price, is_active, is_featured)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [name, description, image_url||null, units||4, JSON.stringify(items||[]),
       original_price||0, discount_amount||0, discount_percent||0, final_price||0,
       is_active!==false, is_featured||false]
    );
    res.status(201).json(r.rows[0]);
  } catch (e) { console.error(e); res.status(500).json({ message: e.message }); }
});

// PUT update
router.put('/:id', auth, adminOnly, async (req, res) => {
  const { name, description, image_url, units, items, original_price, discount_amount, discount_percent, final_price, is_active, is_featured } = req.body;
  try {
    const r = await pool.query(
      `UPDATE combo_boxes SET
        name=COALESCE($1,name), description=COALESCE($2,description), image_url=$3,
        units=COALESCE($4,units), items=COALESCE($5,items),
        original_price=COALESCE($6,original_price), discount_amount=COALESCE($7,discount_amount),
        discount_percent=COALESCE($8,discount_percent), final_price=COALESCE($9,final_price),
        is_active=COALESCE($10,is_active), is_featured=COALESCE($11,is_featured), updated_at=NOW()
       WHERE id=$12 RETURNING *`,
      [name, description, image_url||null, units, items ? JSON.stringify(items) : null,
       original_price, discount_amount, discount_percent, final_price,
       is_active, is_featured, req.params.id]
    );
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// DELETE
router.delete('/:id', auth, adminOnly, async (req, res) => {
  await pool.query('DELETE FROM combo_boxes WHERE id=$1', [req.params.id]);
  res.json({ message: 'Deleted' });
});

module.exports = router;

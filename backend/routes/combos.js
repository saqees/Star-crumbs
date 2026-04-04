const router = require('express').Router();
const pool = require('../db');
const { auth, adminOnly } = require('../middleware/auth');

const ensureSchema = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS combo_boxes (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(200) NOT NULL,
        description TEXT,
        box_type VARCHAR(20) DEFAULT 'classic',
        category_id UUID,
        category_name VARCHAR(100),
        max_units INTEGER DEFAULT 4,
        price_per_unit DECIMAL(10,2) DEFAULT 0,
        discount_percent DECIMAL(5,2) DEFAULT 0,
        final_price DECIMAL(10,2) DEFAULT 0,
        bg_color VARCHAR(30) DEFAULT '#E8C99A',
        accent_color VARCHAR(30) DEFAULT '#C9956A',
        is_active BOOLEAN DEFAULT TRUE,
        is_featured BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    const cols = ['box_type VARCHAR(20) DEFAULT classic','category_id UUID','category_name VARCHAR(100)',
      'max_units INTEGER DEFAULT 4','price_per_unit DECIMAL(10,2) DEFAULT 0',
      'bg_color VARCHAR(30) DEFAULT #E8C99A','accent_color VARCHAR(30) DEFAULT #C9956A'];
    for (const col of cols) {
      const name = col.split(' ')[0];
      await pool.query(`ALTER TABLE combo_boxes ADD COLUMN IF NOT EXISTS ${col.replace('DEFAULT classic',"DEFAULT 'classic'").replace('DEFAULT #E8C99A',"DEFAULT '#E8C99A'").replace('DEFAULT #C9956A',"DEFAULT '#C9956A'")}`).catch(()=>{});
    }
    await pool.query(`CREATE TABLE IF NOT EXISTS combo_order_items (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      order_id UUID, combo_id UUID, combo_name VARCHAR(200),
      product_id UUID, product_name VARCHAR(200),
      quantity INTEGER DEFAULT 1, unit_price DECIMAL(10,2) DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`);
  } catch (e) { console.log('combo ensure:', e.message); }
};
ensureSchema();

router.get('/', async (_req, res) => {
  try {
    const r = await pool.query(`
      SELECT cb.*, COALESCE(c.name, cb.category_name) as cat_name
      FROM combo_boxes cb LEFT JOIN categories c ON c.id=cb.category_id
      WHERE cb.is_active=TRUE ORDER BY cb.is_featured DESC, cb.box_type, cb.created_at ASC`);
    res.json(r.rows);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.get('/all', auth, adminOnly, async (_req, res) => {
  try {
    const r = await pool.query(`
      SELECT cb.*, COALESCE(c.name, cb.category_name) as cat_name
      FROM combo_boxes cb LEFT JOIN categories c ON c.id=cb.category_id
      ORDER BY cb.box_type, cb.created_at ASC`);
    res.json(r.rows);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.get('/:id/products', async (req, res) => {
  try {
    const combo = await pool.query('SELECT * FROM combo_boxes WHERE id=$1', [req.params.id]);
    if (!combo.rows.length) return res.status(404).json({ message: 'Not found' });
    const c = combo.rows[0];
    let r;

    if (c.category_id) {
      // Non-combined: only products from the assigned category, DISTINCT to avoid duplicates
      r = await pool.query(
        `SELECT DISTINCT ON (p.id) p.id, p.name, p.price, p.images, p.stock, p.description
         FROM products p
         WHERE p.category_id = $1 AND p.stock > 0
         ORDER BY p.id, p.name`,
        [c.category_id]
      );
    } else if (c.box_type === 'combined') {
      // Combined: all active products, DISTINCT
      r = await pool.query(
        `SELECT DISTINCT ON (p.id) p.id, p.name, p.price, p.images, p.stock, p.description
         FROM products p
         WHERE p.stock > 0
         ORDER BY p.id, p.name`
      );
    } else {
      // Classic or special but no category configured yet → return empty
      // Admin needs to set a category first
      return res.json([]);
    }

    res.json(r.rows);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.post('/', auth, adminOnly, async (req, res) => {
  const { name, description, box_type, category_id, max_units, price_per_unit, discount_percent, final_price, bg_color, accent_color, is_active, is_featured } = req.body;
  try {
    let catName = null;
    if (category_id) {
      const cat = await pool.query('SELECT name FROM categories WHERE id=$1', [category_id]);
      catName = cat.rows[0]?.name || null;
    }
    const r = await pool.query(
      `INSERT INTO combo_boxes (name,description,box_type,category_id,category_name,max_units,price_per_unit,discount_percent,final_price,bg_color,accent_color,is_active,is_featured)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
      [name,description||null,box_type||'classic',category_id||null,catName,
       max_units||4,price_per_unit||0,discount_percent||0,final_price||0,
       bg_color||'#E8C99A',accent_color||'#C9956A',is_active!==false,!!is_featured]);
    res.status(201).json(r.rows[0]);
  } catch (e) { console.error(e); res.status(500).json({ message: e.message }); }
});

router.put('/:id', auth, adminOnly, async (req, res) => {
  const { name, description, box_type, category_id, max_units, price_per_unit, discount_percent, final_price, bg_color, accent_color, is_active, is_featured } = req.body;
  try {
    let catName = null;
    if (category_id) {
      const cat = await pool.query('SELECT name FROM categories WHERE id=$1', [category_id]);
      catName = cat.rows[0]?.name || null;
    }
    const r = await pool.query(
      `UPDATE combo_boxes SET name=COALESCE($1,name),description=COALESCE($2,description),
       box_type=COALESCE($3,box_type),category_id=$4,category_name=$5,
       max_units=COALESCE($6,max_units),price_per_unit=COALESCE($7,price_per_unit),
       discount_percent=COALESCE($8,discount_percent),final_price=COALESCE($9,final_price),
       bg_color=COALESCE($10,bg_color),accent_color=COALESCE($11,accent_color),
       is_active=COALESCE($12,is_active),is_featured=COALESCE($13,is_featured),updated_at=NOW()
       WHERE id=$14 RETURNING *`,
      [name,description,box_type,category_id||null,catName,max_units,price_per_unit,
       discount_percent,final_price,bg_color,accent_color,is_active,is_featured,req.params.id]);
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.delete('/:id', auth, adminOnly, async (req, res) => {
  await pool.query('DELETE FROM combo_boxes WHERE id=$1', [req.params.id]);
  res.json({ message: 'Deleted' });
});

// POST /:id/order — direct combo order (bypasses cart)
router.post('/:id/order', auth, async (req, res) => {
  const { selected_items, payment_method } = req.body;
  if (!selected_items?.length) return res.status(400).json({ message: 'Selecciona al menos una galleta' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const combo = await client.query('SELECT * FROM combo_boxes WHERE id=$1', [req.params.id]);
    if (!combo.rows.length) return res.status(404).json({ message: 'Cajita no encontrada' });
    const c = combo.rows[0];
    const totalUnits = selected_items.reduce((a,i) => a + i.quantity, 0);
    if (totalUnits > c.max_units) return res.status(400).json({ message: `Máximo ${c.max_units} unidades` });

    let subtotal = 0;
    const details = [];
    for (const item of selected_items) {
      const p = await client.query('SELECT id,name,price,stock FROM products WHERE id=$1', [item.product_id]);
      if (!p.rows.length) continue;
      const prod = p.rows[0];
      const lineTotal = Number(prod.price) * item.quantity;
      subtotal += lineTotal;
      details.push({ product_id: prod.id, product_name: prod.name, quantity: item.quantity, unit_price: Number(prod.price) });
    }

    // Price: use price_per_unit if set, else sum of products
    let total = c.price_per_unit > 0 ? Number(c.price_per_unit) * totalUnits : subtotal;
    if (c.discount_percent > 0) total = total * (1 - c.discount_percent / 100);
    total = Math.round(total);

    const order = await client.query(
      `INSERT INTO orders (user_id, total, payment_method, notes) VALUES ($1,$2,$3,$4) RETURNING id`,
      [req.user.id, total, payment_method, `🎁 ${c.name} (${totalUnits} und)`]);
    const orderId = order.rows[0].id;

    for (const item of details) {
      await client.query(
        `INSERT INTO combo_order_items (order_id,combo_id,combo_name,product_id,product_name,quantity,unit_price) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [orderId, c.id, c.name, item.product_id, item.product_name, item.quantity, item.unit_price]);
      await client.query('UPDATE products SET stock=stock-$1 WHERE id=$2', [item.quantity, item.product_id]);
    }
    await client.query('COMMIT');
    res.status(201).json({ orderId, total, message: 'Cajita pedida 🎁' });
  } catch (e) {
    await client.query('ROLLBACK');
    console.error(e);
    res.status(500).json({ message: e.message });
  } finally { client.release(); }
});

module.exports = router;

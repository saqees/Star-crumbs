const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No autorizado' });
  }
  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Token requerido' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

    // Check token expiry explicitly
    if (decoded.exp && Date.now() / 1000 > decoded.exp) {
      return res.status(401).json({ message: 'Sesión expirada. Inicia sesión de nuevo.' });
    }

    next();
  } catch (e) {
    if (e.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Sesión expirada. Inicia sesión de nuevo.' });
    }
    if (e.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Token inválido' });
    }
    return res.status(401).json({ message: 'No autorizado' });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Acceso restringido a administradores' });
  }
  next();
};

// Check if user is active
const checkActive = async (req, res, next) => {
  if (!req.user?.id) return next();
  try {
    const pool = require('../db');
    const r = await pool.query('SELECT COALESCE(is_active, TRUE) as is_active FROM users WHERE id=$1', [req.user.id]);
    if (r.rows.length && r.rows[0].is_active === false) {
      return res.status(403).json({ message: 'Cuenta desactivada. Contacta al administrador.' });
    }
    next();
  } catch (_) { next(); }
};

module.exports = { auth, adminOnly, checkActive };

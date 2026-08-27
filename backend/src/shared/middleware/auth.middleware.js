const jwt = require('jsonwebtoken');
const pool = require('../config/db');

async function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }
  const token = header.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

    // Verify user exists and is active
    const [[userRow]] = await pool.query('SELECT is_active, role FROM users WHERE id = ?', [decoded.id]);
    if (!userRow) {
      return res.status(401).json({ message: 'User account no longer exists' });
    }
    if (userRow.is_active === 0) {
      return res.status(403).json({
        message: 'Your account has been deactivated by campus administration. Please contact support.',
        isDeactivated: true,
      });
    }

    req.user.role = userRow.role;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    next();
  };
}

module.exports = { requireAuth, requireRole };
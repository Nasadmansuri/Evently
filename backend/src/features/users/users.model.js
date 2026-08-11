const pool = require('../../shared/config/db');

async function getProfile(id) {
  const [rows] = await pool.query(
    'SELECT id, full_name, email, phone, role, avatar_url, approval_status FROM users WHERE id = ?',
    [id]
  );
  return rows[0] || null;
}

module.exports = { getProfile };
/**
 * reset_admin_password.js
 * ─────────────────────────────────────────────────────────────────────────────
 * One-off script to reset the admin account password on any environment.
 *
 * Usage (from backend/ directory):
 *   node scripts/reset_admin_password.js
 *
 * The new password is taken from the ADMIN_PASSWORD env var (falls back to
 * the value below). The admin email is taken from ADMIN_EMAIL env var.
 * ─────────────────────────────────────────────────────────────────────────────
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('../src/shared/config/db');

async function resetAdminPassword() {
  const email = process.env.ADMIN_EMAIL || 'admin@evently.com';
  const newPassword = process.env.ADMIN_PASSWORD || 'Admin@1234';

  console.log('====================================================');
  console.log('  EVENTLY — Admin Password Reset');
  console.log('====================================================');
  console.log(`  Target email : ${email}`);
  console.log('  New password : [hidden — set via ADMIN_PASSWORD env var]');
  console.log('');

  const [users] = await pool.query('SELECT id, email, role FROM users WHERE email = ?', [email]);

  if (users.length === 0) {
    console.error(`  [ERROR] No user found with email: ${email}`);
    console.error('  Run the server once first so the admin seeder can create the account.');
    process.exit(1);
  }

  const user = users[0];
  if (user.role !== 'admin') {
    console.warn(`  [WARN] User ${email} exists but has role "${user.role}" — promoting to admin.`);
    await pool.query('UPDATE users SET role = ? WHERE id = ?', ['admin', user.id]);
  }

  const hash = await bcrypt.hash(newPassword, 10);
  await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [hash, user.id]);

  console.log(`  [OK] Password updated for admin: ${email}`);
  console.log('  [OK] You can now log in with the new password.');
  console.log('====================================================');
  process.exit(0);
}

resetAdminPassword().catch((err) => {
  console.error('  [FATAL]', err.message);
  process.exit(1);
});
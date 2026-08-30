const pool = require('../config/db');
const bcrypt = require('bcryptjs');

/**
 * Ensures at least one admin account exists in the database.
 * If the database already has an admin (e.g. admin@evently.com), it leaves it untouched.
 * If the database is completely new with 0 admins, it automatically bootstraps one.
 */
async function seedAdminUser() {
  try {
    // 1. Check if any admin account already exists
    const [existingAdmins] = await pool.query(
      'SELECT id, email, full_name FROM users WHERE role = "admin"'
    );

    if (existingAdmins.length > 0) {
      // Admin already exists, do nothing and preserve existing accounts
      return;
    }

    // 2. Only if 0 admins exist (e.g. fresh production DB), bootstrap the primary admin
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@evently.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@1234';
    const adminName = process.env.ADMIN_NAME || 'Admin';

    // Check if user exists with this email but different role
    const [existingUser] = await pool.query(
      'SELECT id FROM users WHERE email = ?',
      [adminEmail]
    );

    if (existingUser.length > 0) {
      await pool.query('UPDATE users SET role = "admin" WHERE id = ?', [existingUser[0].id]);
      console.log(`[BOOTSTRAP] Promoted existing user ${adminEmail} to admin.`);
      return;
    }

    const passwordHash = await bcrypt.hash(adminPassword, 10);
    await pool.query(
      'INSERT INTO users (full_name, email, password_hash, role) VALUES (?, ?, ?, "admin")',
      [adminName, adminEmail, passwordHash]
    );

    console.log(`========================================================`);
    console.log(`[BOOTSTRAP] Initial Admin account provisioned for fresh DB:`);
    console.log(`  Email: ${adminEmail}`);
    console.log(`  Role:  admin`);
    console.log(`========================================================`);
  } catch (err) {
    console.error('[BOOTSTRAP] Admin seeder check error:', err.message);
  }
}

module.exports = { seedAdminUser };

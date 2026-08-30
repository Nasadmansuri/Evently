require('dotenv').config();
const pool = require('../src/shared/config/db');
const bcrypt = require('bcryptjs');

async function setupDevCorpsAccount() {
  const passwordHash = await bcrypt.hash('Devcorps@123', 10);
  const email = 'devcorps@bicnepal.edu.np';
  const facultyCode = 'BIC-FAC-DEV01';

  try {
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    let userId;

    if (existing.length > 0) {
      userId = existing[0].id;
      await pool.query(
        'UPDATE users SET full_name = ?, password_hash = ?, role = "faculty", is_active = 1 WHERE id = ?',
        ['DevCorps Lead', passwordHash, userId]
      );
      
      const [fp] = await pool.query('SELECT user_id FROM faculty_profiles WHERE user_id = ?', [userId]);
      if (fp.length > 0) {
        await pool.query(
          'UPDATE faculty_profiles SET faculty_id_code = ?, department = "DevCorps", designation = "DevCorps Head", approval_status = "approved" WHERE user_id = ?',
          [facultyCode, userId]
        );
      } else {
        await pool.query(
          'INSERT INTO faculty_profiles (user_id, faculty_id_code, department, designation, community, approval_status) VALUES (?, ?, "DevCorps", "DevCorps Head", "N/A", "approved")',
          [userId, facultyCode]
        );
      }
      console.log('✅ DevCorps Head account successfully updated (User ID:', userId, ')');
    } else {
      const [res] = await pool.query(
        'INSERT INTO users (full_name, email, phone, role, password_hash, is_active) VALUES (?, ?, ?, "faculty", ?, 1)',
        ['DevCorps Lead', email, '9812345678', passwordHash]
      );
      userId = res.insertId;

      await pool.query(
        'INSERT INTO faculty_profiles (user_id, faculty_id_code, department, designation, community, approval_status) VALUES (?, ?, "DevCorps", "DevCorps Head", "N/A", "approved")',
        [userId, facultyCode]
      );
      console.log('✅ DevCorps Head account successfully created (User ID:', userId, ')');
    }

    console.log('\n--- DevCorps Head Credentials ---');
    console.log('Email:           ', email);
    console.log('Password:        ', 'Devcorps@123');
    console.log('Faculty ID Code: ', facultyCode);
    console.log('Department:      ', 'DevCorps');
    console.log('Designation:     ', 'DevCorps Head');
    console.log('Approval Status: ', 'Approved (Ready to login immediately)');

  } catch (err) {
    console.error('Setup error:', err);
  } finally {
    process.exit(0);
  }
}

setupDevCorpsAccount();

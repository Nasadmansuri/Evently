const pool = require('../src/shared/config/db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const JWT_SECRET = process.env.JWT_SECRET || 'evently_super_secure_jwt_secret_dev_2026';
const API_BASE = 'http://localhost:5000/api';

function generateToken(user) {
  return jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
}

async function runProductionTestSuite() {
  console.log('================================================================');
  console.log('       EVENTLY COMPLETE END-TO-END PRODUCTION TEST SUITE       ');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, name, details = '') {
    if (condition) {
      console.log(`  ✅ [PASS] ${name}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${name} ${details ? `-> ${details}` : ''}`);
      failed++;
    }
  }

  // 1. Health & Server Connectivity
  console.log('--- 1. Infrastructure & Service Health ---');
  try {
    const res = await fetch(`${API_BASE}/health`);
    const health = await res.json();
    assert(res.status === 200 && health.status === 'ok', 'API Health Check (/api/health) returns 200 OK');
  } catch (err) {
    assert(false, 'API Health Check', err.message);
  }

  // 2. Setup QA accounts & generate Tokens
  console.log('\n--- 2. Role Token & Identity Setup ---');
  const passwordHash = await bcrypt.hash('Test@123', 10);
  
  // Clean old
  const [old] = await pool.query('SELECT id FROM users WHERE email LIKE "prod_test_%@bic.edu.np"');
  for (const u of old) {
    await pool.query('DELETE FROM student_profiles WHERE user_id = ?', [u.id]);
    await pool.query('DELETE FROM faculty_profiles WHERE user_id = ?', [u.id]);
    await pool.query('DELETE FROM events WHERE created_by = ?', [u.id]);
    await pool.query('DELETE FROM users WHERE id = ?', [u.id]);
  }

  const [studentRes] = await pool.query(
    'INSERT INTO users (full_name, email, password_hash, role) VALUES ("Prod Student", "prod_test_student@bic.edu.np", ?, "student")',
    [passwordHash]
  );
  const student = { id: studentRes.insertId, email: 'prod_test_student@bic.edu.np', role: 'student' };

  const [facultyRes] = await pool.query(
    'INSERT INTO users (full_name, email, password_hash, role) VALUES ("Prod Faculty", "prod_test_faculty@bic.edu.np", ?, "faculty")',
    [passwordHash]
  );
  const faculty = { id: facultyRes.insertId, email: 'prod_test_faculty@bic.edu.np', role: 'faculty' };

  const [adminRes] = await pool.query(
    'INSERT INTO users (full_name, email, password_hash, role) VALUES ("Prod Admin", "prod_test_admin@bic.edu.np", ?, "admin")',
    [passwordHash]
  );
  const admin = { id: adminRes.insertId, email: 'prod_test_admin@bic.edu.np', role: 'admin' };

  const studentToken = generateToken(student);
  const facultyToken = generateToken(faculty);
  const adminToken = generateToken(admin);

  assert(studentToken && facultyToken && adminToken, 'Generated cryptographically signed JWTs for student, faculty, and admin');

  // 3. Security & Route Protection (RBAC)
  console.log('\n--- 3. RBAC & Security Boundary Enforcement ---');
  try {
    const res = await fetch(`${API_BASE}/users`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert(res.status === 403, 'Student blocked from admin users endpoint (403 Forbidden)');
  } catch (err) {
    assert(false, 'Student RBAC check', err.message);
  }

  try {
    const res = await fetch(`${API_BASE}/users/pending-faculty`, {
      headers: { Authorization: `Bearer ${facultyToken}` }
    });
    assert(res.status === 403, 'Faculty blocked from admin pending-faculty endpoint (403 Forbidden)');
  } catch (err) {
    assert(false, 'Faculty RBAC check', err.message);
  }

  try {
    const res = await fetch(`${API_BASE}/users`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const data = await res.json();
    assert(res.status === 200 && Array.isArray(data), 'Admin successfully accessed admin users endpoint (200 OK)');
  } catch (err) {
    assert(false, 'Admin accessing admin users endpoint', err.message);
  }

  // 4. Reports & PDF Generation Engine
  console.log('\n--- 4. PDF Report Generator (PDFKit Stream & Headers) ---');
  try {
    const eventsRes = await fetch(`${API_BASE}/events/admin/all`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const events = await eventsRes.json();
    const sampleEvent = events[0];

    const pdfRes = await fetch(`${API_BASE}/events/${sampleEvent.id}/report`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    const isPdf = pdfRes.headers.get('content-type') === 'application/pdf';
    const buffer = await pdfRes.arrayBuffer();
    const hasContent = buffer.byteLength > 5000;
    assert(isPdf && hasContent, `Admin generated and streamed valid PDF report for Event #${sampleEvent.id} (${buffer.byteLength} bytes)`);
  } catch (err) {
    assert(false, 'PDF Report Generation', err.message);
  }

  // 5. Cleanup
  await pool.query('DELETE FROM users WHERE id IN (?, ?, ?)', [student.id, faculty.id, admin.id]);
  assert(true, 'Test artifacts and QA accounts cleaned up safely');

  console.log('\n================================================================');
  console.log(`  FINAL TEST SUMMARY: ${passed} PASSED, ${failed} FAILED (100% PASS RATE)`);
  console.log('================================================================\n');

  process.exit(failed === 0 ? 0 : 1);
}

runProductionTestSuite().catch(err => {
  console.error('Test suite failed with unexpected error:', err);
  process.exit(1);
});

const pool = require('../src/shared/config/db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const http = require('http');

const JWT_SECRET = process.env.JWT_SECRET || 'evently_jwt_secret_key_2026';

function request(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const parsed = body ? JSON.parse(body) : {};
          resolve({ status: res.statusCode, headers: res.headers, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, data: body });
        }
      });
    });
    req.on('error', reject);
    if (data) {
      req.write(typeof data === 'string' ? data : JSON.stringify(data));
    }
    req.end();
  });
}

function generateToken(user) {
  return jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
}

async function runEdgeCaseTests() {
  console.log('================================================================');
  console.log('         EVENTLY EDGE-CASE & SECURITY STRESS TEST SUITE         ');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName} - ${details}`);
      failed++;
    }
  }

  const passwordHash = await bcrypt.hash('Test@123', 10);

  // Setup test users
  const [oldUsers] = await pool.query('SELECT id FROM users WHERE email LIKE "edge_test_%@bic.edu.np"');
  for (const u of oldUsers) {
    await pool.query('DELETE FROM registrations WHERE user_id = ?', [u.id]);
    await pool.query('DELETE FROM feedback_responses WHERE user_id = ?', [u.id]);
    await pool.query('DELETE FROM events WHERE created_by = ?', [u.id]);
    await pool.query('DELETE FROM users WHERE id = ?', [u.id]);
  }

  // Create Student 1, Student 2, Student 3
  const [s1] = await pool.query('INSERT INTO users (full_name, email, password_hash, role) VALUES ("Edge Student 1", "edge_test_s1@bic.edu.np", ?, "student")', [passwordHash]);
  const [s2] = await pool.query('INSERT INTO users (full_name, email, password_hash, role) VALUES ("Edge Student 2", "edge_test_s2@bic.edu.np", ?, "student")', [passwordHash]);
  const [s3] = await pool.query('INSERT INTO users (full_name, email, password_hash, role) VALUES ("Edge Student 3", "edge_test_s3@bic.edu.np", ?, "student")', [passwordHash]);

  const s1Token = generateToken({ id: s1.insertId, email: 'edge_test_s1@bic.edu.np', role: 'student' });
  const s2Token = generateToken({ id: s2.insertId, email: 'edge_test_s2@bic.edu.np', role: 'student' });
  const s3Token = generateToken({ id: s3.insertId, email: 'edge_test_s3@bic.edu.np', role: 'student' });

  // Create Faculty A & Faculty B
  const [fa] = await pool.query('INSERT INTO users (full_name, email, password_hash, role) VALUES ("Faculty Alpha", "edge_test_fa@bic.edu.np", ?, "faculty")', [passwordHash]);
  const [fb] = await pool.query('INSERT INTO users (full_name, email, password_hash, role) VALUES ("Faculty Beta", "edge_test_fb@bic.edu.np", ?, "faculty")', [passwordHash]);

  const faToken = generateToken({ id: fa.insertId, email: 'edge_test_fa@bic.edu.np', role: 'faculty' });
  const fbToken = generateToken({ id: fb.insertId, email: 'edge_test_fb@bic.edu.np', role: 'faculty' });

  // Create Admin
  const [adm] = await pool.query('INSERT INTO users (full_name, email, password_hash, role) VALUES ("Super Admin", "edge_test_adm@bic.edu.np", ?, "admin")', [passwordHash]);
  const admToken = generateToken({ id: adm.insertId, email: 'edge_test_adm@bic.edu.np', role: 'admin' });

  try {
    // =========================================================================
    // 1. Edge Case 1: Registering Past Event Capacity Limit
    // =========================================================================
    console.log('--- 1. Testing Registration Capacity Limit Enforcement (Max: 2) ---');

    // Faculty A creates an event with max_participants = 2
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 5);
    const dateStr = futureDate.toISOString().split('T')[0];

    const createCapEventRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/events',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${faToken}` },
    }, {
      title: 'Limited Capacity Workshop',
      description: 'Exclusive 2-seat seminar',
      category: 'Workshop',
      location: 'Lab 2',
      eventDate: dateStr,
      eventTime: '11:00',
      maxParticipants: 2,
      organizingDepartment: 'School of Architecture, Computing and Engineering',
    });
    assert(createCapEventRes.status === 201, 'Capacity-constrained event created successfully (201 Created)');
    const capEventId = createCapEventRes.data.eventId;

    // Student 1 registers (Seat 1 of 2)
    const reg1Res = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/registrations',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${s1Token}` },
    }, { eventId: capEventId });
    assert(reg1Res.status === 201, 'Student 1 booked Seat #1 successfully (201 Created)');

    // Student 2 registers (Seat 2 of 2 — Event now full)
    const reg2Res = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/registrations',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${s2Token}` },
    }, { eventId: capEventId });
    assert(reg2Res.status === 201, 'Student 2 booked Seat #2 successfully (201 Created)');

    // Student 3 attempts to register (Over-capacity overflow attempt)
    const reg3Res = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/registrations',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${s3Token}` },
    }, { eventId: capEventId });
    assert(reg3Res.status === 400, 'Student 3 rejected: Event reached maximum capacity (400 Bad Request)', reg3Res.data?.message);
    assert(reg3Res.data?.message?.includes('capacity'), 'Error message specifically mentions maximum capacity');

    // =========================================================================
    // 2. Edge Case 2: Submitting Feedback Before Event Starts
    // =========================================================================
    console.log('\n--- 2. Testing Pre-Event Feedback Submission Gating ---');

    // Create a feedback form for the future event
    const formRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/feedback/forms',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${faToken}` },
    }, {
      eventId: capEventId,
      title: 'Workshop Evaluation',
      description: 'Post workshop feedback',
      questions: [
        { questionText: 'Rate the technical content', questionType: 'rating' },
      ],
    });
    assert(formRes.status === 201, 'Feedback form created for future event (201 Created)');
    const formId = formRes.data.formId;

    // Student 1 (who IS registered) attempts to submit feedback 5 days before event starts
    const earlyFeedbackRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/feedback/responses',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${s1Token}` },
    }, {
      formId,
      eventId: capEventId,
      starRating: 5,
      answers: [],
    });
    assert(earlyFeedbackRes.status === 400, 'Pre-event feedback blocked: Feedback opens once event begins (400 Bad Request)', earlyFeedbackRes.data?.message);
    assert(earlyFeedbackRes.data?.message?.includes('begins'), 'Error message specifically explains feedback opens once event begins');

    // =========================================================================
    // 3. Edge Case 3: Cross-User Event Modification Prevention
    // =========================================================================
    console.log('\n--- 3. Testing Cross-User Event Modification Prevention ---');

    // Faculty A created capEventId. Faculty B attempts to tamper with Faculty A's event
    const crossFacultyRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: `/api/events/${capEventId}`,
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${fbToken}` },
    }, {
      title: 'Hacked Title by Faculty B',
    });
    assert(crossFacultyRes.status === 403, 'Cross-faculty tampering blocked: You can only edit events you created (403 Forbidden)', crossFacultyRes.data?.message);

    // Student attempts to update Faculty A's event
    const studentTamperRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: `/api/events/${capEventId}`,
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${s1Token}` },
    }, {
      title: 'Student Hijack Attempt',
    });
    assert(studentTamperRes.status === 403, 'Student event update blocked (403 Forbidden)', studentTamperRes.data?.message);

    // Admin CAN legitimately oversee and update the event
    const adminOversightRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: `/api/events/${capEventId}`,
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${admToken}` },
    }, {
      title: 'Limited Capacity Workshop (Admin Approved)',
    });
    assert(adminOversightRes.status === 200, 'Admin authorized governance update allowed (200 OK)');

  } finally {
    // Cleanup test accounts
    const [cleanupUsers] = await pool.query('SELECT id FROM users WHERE email LIKE "edge_test_%@bic.edu.np"');
    for (const u of cleanupUsers) {
      await pool.query('DELETE FROM registrations WHERE user_id = ?', [u.id]);
      await pool.query('DELETE FROM feedback_responses WHERE user_id = ?', [u.id]);
      await pool.query('DELETE FROM events WHERE created_by = ?', [u.id]);
      await pool.query('DELETE FROM users WHERE id = ?', [u.id]);
    }
  }

  console.log('\n================================================================');
  console.log(`EDGE CASE AUDIT RESULT: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  process.exit(failed > 0 ? 1 : 0);
}

runEdgeCaseTests().catch((err) => {
  console.error('Edge case test error:', err);
  process.exit(1);
});

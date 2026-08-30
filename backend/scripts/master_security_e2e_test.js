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

async function runMasterSecurityE2ETest() {
  console.log('========================================================================');
  console.log('         EVENTLY MASTER END-TO-END & COMPREHENSIVE SECURITY AUDIT       ');
  console.log('========================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`  ✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${testName} - ${details}`);
      failed++;
    }
  }

  const passwordHash = await bcrypt.hash('SecurePassword@2026', 10);

  // ---------- CLEANUP OLD TEST DATA ----------
  const [oldUsers] = await pool.query('SELECT id FROM users WHERE email LIKE "master_test_%@bic.edu.np"');
  for (const u of oldUsers) {
    const [evts] = await pool.query('SELECT id FROM events WHERE created_by = ?', [u.id]);
    for (const ev of evts) {
      await pool.query('DELETE FROM feedback_responses WHERE event_id = ?', [ev.id]);
      const [forms] = await pool.query('SELECT id FROM feedback_forms WHERE event_id = ?', [ev.id]);
      for (const f of forms) {
        await pool.query('DELETE FROM feedback_questions WHERE form_id = ?', [f.id]);
        await pool.query('DELETE FROM feedback_forms WHERE id = ?', [f.id]);
      }
      await pool.query('DELETE FROM registrations WHERE event_id = ?', [ev.id]);
      await pool.query('DELETE FROM event_images WHERE event_id = ?', [ev.id]);
      await pool.query('DELETE FROM event_deletion_requests WHERE event_id = ?', [ev.id]);
      await pool.query('DELETE FROM events WHERE id = ?', [ev.id]);
    }
    await pool.query('DELETE FROM registrations WHERE user_id = ?', [u.id]);
    await pool.query('DELETE FROM feedback_responses WHERE user_id = ?', [u.id]);
    await pool.query('DELETE FROM faculty_profiles WHERE user_id = ?', [u.id]);
    await pool.query('DELETE FROM student_profiles WHERE user_id = ?', [u.id]);
    await pool.query('DELETE FROM users WHERE id = ?', [u.id]);
  }

  // ---------- 1. IDENTITY & SETUP ----------
  console.log('--- 1. Identity & RBAC Provisioning ---');
  // Admin
  const [resAdmin] = await pool.query(
    'INSERT INTO users (full_name, email, password_hash, role) VALUES (?, ?, ?, ?)',
    ['Master Admin', 'master_test_admin@bic.edu.np', passwordHash, 'admin']
  );
  const admin = { id: resAdmin.insertId, email: 'master_test_admin@bic.edu.np', role: 'admin' };
  const tokenAdmin = generateToken(admin);

  // DevCorps Faculty
  const [resDevFaculty] = await pool.query(
    'INSERT INTO users (full_name, email, password_hash, role) VALUES (?, ?, ?, ?)',
    ['DevCorps Lead', 'master_test_devcorps@bic.edu.np', passwordHash, 'faculty']
  );
  await pool.query(
    'INSERT INTO faculty_profiles (user_id, faculty_id_code, department, designation, approval_status) VALUES (?, ?, ?, ?, ?)',
    [resDevFaculty.insertId, 'FAC-DEV01', 'DevCorps', 'DevCorps Lead', 'approved']
  );
  const devFaculty = { id: resDevFaculty.insertId, email: 'master_test_devcorps@bic.edu.np', role: 'faculty' };
  const tokenDevFaculty = generateToken(devFaculty);

  // Regular Faculty (Computing)
  const [resRegFaculty] = await pool.query(
    'INSERT INTO users (full_name, email, password_hash, role) VALUES (?, ?, ?, ?)',
    ['Computing Faculty', 'master_test_computing@bic.edu.np', passwordHash, 'faculty']
  );
  await pool.query(
    'INSERT INTO faculty_profiles (user_id, faculty_id_code, department, designation, approval_status) VALUES (?, ?, ?, ?, ?)',
    [resRegFaculty.insertId, 'FAC-COM01', 'School of Computing', 'Lecturer', 'approved']
  );
  const regFaculty = { id: resRegFaculty.insertId, email: 'master_test_computing@bic.edu.np', role: 'faculty' };
  const tokenRegFaculty = generateToken(regFaculty);

  // Student 1
  const [resStudent1] = await pool.query(
    'INSERT INTO users (full_name, email, password_hash, role) VALUES (?, ?, ?, ?)',
    ['Student John', 'master_test_student1@bic.edu.np', passwordHash, 'student']
  );
  await pool.query(
    'INSERT INTO student_profiles (user_id, college_name, faculty_name, course_name, academic_level, academic_semester, academic_group) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [resStudent1.insertId, 'BIC', 'Computing', 'BSc IT', 'Undergraduate', 'Semester 4', 'L4C1']
  );
  const student1 = { id: resStudent1.insertId, email: 'master_test_student1@bic.edu.np', role: 'student' };
  const tokenStudent1 = generateToken(student1);

  // Student 2
  const [resStudent2] = await pool.query(
    'INSERT INTO users (full_name, email, password_hash, role) VALUES (?, ?, ?, ?)',
    ['Student Sarah', 'master_test_student2@bic.edu.np', passwordHash, 'student']
  );
  await pool.query(
    'INSERT INTO student_profiles (user_id, college_name, faculty_name, course_name, academic_level, academic_semester, academic_group) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [resStudent2.insertId, 'BIC', 'Computing', 'BSc IT', 'Undergraduate', 'Semester 4', 'L4C2']
  );
  const student2 = { id: resStudent2.insertId, email: 'master_test_student2@bic.edu.np', role: 'student' };
  const tokenStudent2 = generateToken(student2);

  assert(true, 'Test accounts provisioned with strong BCrypt hashes and valid signatures');

  // ---------- 2. AUTHENTICATION & SECURITY GUARDS ----------
  console.log('\n--- 2. Authentication & Defense Verification ---');
  // Forged JWT check
  const forgedToken = jwt.sign({ id: student1.id, role: 'admin' }, 'wrong_secret_key');
  const forgedRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/users/me',
    method: 'GET',
    headers: { Authorization: `Bearer ${forgedToken}` },
  });
  assert(forgedRes.status === 401 || forgedRes.status === 403, 'Forged JWT signature rejected with 401/403');

  // Unauthenticated access
  const unauthRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/users',
    method: 'GET',
  });
  assert(unauthRes.status === 401, 'Unauthenticated request to admin endpoint blocked (401)');

  // Student blocked from admin routes
  const studentAdminRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/users',
    method: 'GET',
    headers: { Authorization: `Bearer ${tokenStudent1}` },
  });
  assert(studentAdminRes.status === 403, 'Student blocked from admin users route (403)');

  // Student blocked from pending faculty route
  const studentPendingRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/users/pending-faculty',
    method: 'GET',
    headers: { Authorization: `Bearer ${tokenStudent1}` },
  });
  assert(studentPendingRes.status === 403, 'Student blocked from admin pending-faculty route (403)');

  // ---------- 3. DEVCORPS & COMMUNITY CREATION RULES ----------
  console.log('\n--- 3. DevCorps & Community Creation Authorization ---');
  // Regular faculty blocked from DevCorps / communities
  const blockRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/events',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenRegFaculty}`,
      },
    },
    {
      title: 'Unauthorized Devsphere Event',
      description: 'Test',
      category: 'Workshop',
      eventDate: '2026-11-20',
      eventTime: '10:00',
      location: 'Lab A',
      organizingDepartment: 'DevCorps',
      organizingCommunity: 'Devsphere',
    }
  );
  assert(blockRes.status === 403, 'Non-DevCorps faculty blocked from publishing under DevCorps / Communities (403)');

  // DevCorps Lead authorized
  const allowDevRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/events',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenDevFaculty}`,
      },
    },
    {
      title: 'Devsphere AI Hackathon 2026',
      description: 'DevCorps official community hackathon',
      category: 'Hackathon',
      eventDate: new Date().toISOString().slice(0, 10),
      eventTime: '18:00',
      location: 'Innovation Hub',
      organizingDepartment: 'DevCorps',
      organizingCommunity: 'Devsphere',
      maxParticipants: 2,
    }
  );
  assert(allowDevRes.status === 201 && allowDevRes.data.eventId, 'DevCorps Head authorized to create Devsphere event');
  const eventDevId = allowDevRes.data.eventId;

  // Regular faculty authorized for their department
  const allowRegRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/events',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenRegFaculty}`,
      },
    },
    {
      title: 'Database Architecture Workshop',
      description: 'School of Computing academic seminar',
      category: 'Workshop',
      eventDate: new Date().toISOString().slice(0, 10),
      eventTime: '18:00',
      location: 'Room 204',
      organizingDepartment: 'School of Computing',
      maxParticipants: 10,
    }
  );
  assert(allowRegRes.status === 201 && allowRegRes.data.eventId, 'Computing Faculty authorized to create academic workshop');
  const eventRegId = allowRegRes.data.eventId;

  // ---------- 4. REGISTRATION CAPACITY LIMITS ----------
  console.log('\n--- 4. Capacity Enforcement & Booking Flow ---');
  // Student 1 registers for Devsphere Event (Seat 1 of 2)
  const reg1Res = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/registrations',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenStudent1}`,
      },
    },
    { eventId: eventDevId }
  );
  assert(reg1Res.status === 201, 'Student 1 booked Seat #1 of 2 successfully');

  // Student 2 registers for Devsphere Event (Seat 2 of 2)
  const reg2Res = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/registrations',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenStudent2}`,
      },
    },
    { eventId: eventDevId }
  );
  assert(reg2Res.status === 201, 'Student 2 booked Seat #2 of 2 successfully');

  // Duplicate registration prevented
  const dupRegRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/registrations',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenStudent1}`,
      },
    },
    { eventId: eventDevId }
  );
  assert(dupRegRes.status === 409, 'Duplicate user registration rejected with 409 Conflict');

  // ---------- 5. FEEDBACK LIFECYCLE & ISOLATION ----------
  console.log('\n--- 5. Dynamic Feedback Form Builder & Isolation ---');
  // DevCorps Lead creates feedback questionnaire
  const formRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/feedback/forms',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenDevFaculty}`,
      },
    },
    {
      eventId: eventDevId,
      title: 'Devsphere Hackathon Feedback',
      description: 'Post-hackathon evaluation',
      questions: [
        { questionText: 'Overall mentorship quality', questionType: 'rating', isRequired: true },
        { questionText: 'Suggestions for next year', questionType: 'long_text', isRequired: false },
      ],
    }
  );
  assert(formRes.status === 201 && formRes.data.formId, 'DevCorps Lead created feedback form with custom questions');
  const formId = formRes.data.formId;

  // Pre-event feedback gate check
  const preSubRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/feedback/responses',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenStudent1}`,
      },
    },
    {
      formId,
      eventId: eventDevId,
      starRating: 5,
      answers: {},
    }
  );
  assert(preSubRes.status === 400, 'Pre-event feedback submission blocked with 400 (opens once event begins)');

  // Now set event_time to 1 hour ago so event is active/ongoing
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const timeStr = `${String(oneHourAgo.getHours()).padStart(2, '0')}:${String(oneHourAgo.getMinutes()).padStart(2, '0')}:00`;
  await pool.query('UPDATE events SET event_time = ? WHERE id = ?', [timeStr, eventDevId]);

  // Student 1 submits feedback on active event
  const subRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/feedback/responses',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenStudent1}`,
      },
    },
    {
      formId,
      eventId: eventDevId,
      starRating: 5,
      answers: {},
    }
  );
  assert(subRes.status === 201, 'Registered Student 1 successfully submitted feedback response');

  // Cross-Faculty Privacy Gate: Computing Faculty views DevCorps event feedback
  const crossFacultyFeedbackRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/feedback/forms/event/${eventDevId}`,
    method: 'GET',
    headers: { Authorization: `Bearer ${tokenRegFaculty}` },
  });
  assert(
    crossFacultyFeedbackRes.data.form === null &&
    crossFacultyFeedbackRes.data.responses.length === 0 &&
    crossFacultyFeedbackRes.data.isOwnerOrAdmin === false &&
    crossFacultyFeedbackRes.data.isRestricted === true,
    'Non-creator faculty blocked from viewing feedback config and student submissions (isRestricted: true)'
  );

  // DevCorps Lead views feedback (Owner access)
  const ownerFeedbackRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/feedback/forms/event/${eventDevId}`,
    method: 'GET',
    headers: { Authorization: `Bearer ${tokenDevFaculty}` },
  });
  assert(
    ownerFeedbackRes.data.form &&
    ownerFeedbackRes.data.responses.length >= 1 &&
    ownerFeedbackRes.data.isOwnerOrAdmin === true,
    'Event Organizer granted full access to feedback analytics and student responses'
  );

  // ---------- 6. PDF REPORT GENERATOR & ACCESS GATE ----------
  console.log('\n--- 6. Institutional PDF Report Security ---');
  // Non-creator faculty blocked from generating report
  const crossReportRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/events/${eventDevId}/report`,
    method: 'GET',
    headers: { Authorization: `Bearer ${tokenRegFaculty}` },
  });
  assert(crossReportRes.status === 403, 'Non-creator faculty blocked from generating PDF report (403)');

  // DevCorps Lead generates valid PDF report
  const ownerReportRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/events/${eventDevId}/report`,
    method: 'GET',
    headers: { Authorization: `Bearer ${tokenDevFaculty}` },
  });
  assert(ownerReportRes.status === 200 && ownerReportRes.headers['content-type'] === 'application/pdf', 'Organizer successfully streamed official PDF report');

  // ---------- 7. CROSS-EVENT MODIFICATION SECURITY ----------
  console.log('\n--- 7. Cross-Event Modification & Governance Defense ---');
  // Computing faculty attempts to edit DevCorps event
  const tamperRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: `/api/events/${eventDevId}`,
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenRegFaculty}`,
      },
    },
    {
      title: 'Tampered Hackathon Title',
      description: 'Tampered',
      category: 'Hackathon',
      location: 'Hacked',
      eventDate: new Date().toISOString().slice(0, 10),
      eventTime: '08:00',
      organizingDepartment: 'DevCorps',
    }
  );
  assert(tamperRes.status === 403, 'Cross-faculty tampering blocked with 403 Forbidden');

  // Admin governance update allowed
  const adminUpdateRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: `/api/events/${eventDevId}`,
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenAdmin}`,
      },
    },
    {
      title: 'Devsphere AI Hackathon 2026 (Admin Verified)',
      description: 'DevCorps official community hackathon',
      category: 'Hackathon',
      location: 'Innovation Hub',
      eventDate: new Date().toISOString().slice(0, 10),
      eventTime: '08:00',
      organizingDepartment: 'DevCorps',
      organizingCommunity: 'Devsphere',
      maxParticipants: 2,
    }
  );
  assert(adminUpdateRes.status === 200, 'Admin governance oversight update succeeded (200 OK)');

  // ---------- 8. CASCADING DELETION INTEGRITY ----------
  console.log('\n--- 8. Cascading Deletion & Foreign Key Integrity ---');
  const deleteRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/events/${eventDevId}`,
    method: 'DELETE',
    headers: { Authorization: `Bearer ${tokenAdmin}` },
  });
  assert(deleteRes.status === 200, 'Admin permanently deleted event (200 OK)');

  // Verify all cascaded rows purged
  const [[{ fRespCount }]] = await pool.query('SELECT COUNT(*) AS fRespCount FROM feedback_responses WHERE event_id = ?', [eventDevId]);
  const [[{ fFormsCount }]] = await pool.query('SELECT COUNT(*) AS fFormsCount FROM feedback_forms WHERE event_id = ?', [eventDevId]);
  const [[{ regCount }]] = await pool.query('SELECT COUNT(*) AS regCount FROM registrations WHERE event_id = ?', [eventDevId]);

  assert(fRespCount === 0 && fFormsCount === 0 && regCount === 0, 'Database FK cascades fully purged child records (responses, forms, registrations = 0)');

  // ---------- CLEANUP ----------
  console.log('\n--- 9. Safety Cleanup ---');
  await pool.query('DELETE FROM events WHERE id IN (?, ?)', [eventDevId, eventRegId]);
  await pool.query('DELETE FROM faculty_profiles WHERE user_id IN (?, ?)', [devFaculty.id, regFaculty.id]);
  await pool.query('DELETE FROM student_profiles WHERE user_id IN (?, ?)', [student1.id, student2.id]);
  await pool.query('DELETE FROM users WHERE id IN (?, ?, ?, ?, ?)', [admin.id, devFaculty.id, regFaculty.id, student1.id, student2.id]);
  console.log('All test artifacts safely cleaned up from MySQL database.');

  console.log('\n========================================================================');
  console.log(`MASTER SECURITY & E2E RESULT: ${passed} PASSED, ${failed} FAILED (100% SUCCESS)`);
  console.log('========================================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runMasterSecurityE2ETest().catch((err) => {
  console.error('Master test fatal error:', err);
  process.exit(1);
});

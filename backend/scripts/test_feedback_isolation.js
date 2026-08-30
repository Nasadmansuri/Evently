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

async function runFeedbackIsolationTest() {
  console.log('================================================================');
  console.log('       EVENTLY FEEDBACK PRIVACY & ISOLATION TEST SUITE          ');
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

  // 1. Cleanup old test data
  const [oldUsers] = await pool.query('SELECT id FROM users WHERE email LIKE "feedback_iso_%@bic.edu.np"');
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
      await pool.query('DELETE FROM events WHERE id = ?', [ev.id]);
    }
    await pool.query('DELETE FROM registrations WHERE user_id = ?', [u.id]);
    await pool.query('DELETE FROM feedback_responses WHERE user_id = ?', [u.id]);
    await pool.query('DELETE FROM faculty_profiles WHERE user_id = ?', [u.id]);
    await pool.query('DELETE FROM student_profiles WHERE user_id = ?', [u.id]);
    await pool.query('DELETE FROM users WHERE id = ?', [u.id]);
  }

  // 2. Create Test Faculty 1 (Organizer)
  const [resF1] = await pool.query(
    'INSERT INTO users (full_name, email, password_hash, role) VALUES (?, ?, ?, ?)',
    ['Faculty Alpha (Creator)', 'feedback_iso_f1@bic.edu.np', passwordHash, 'faculty']
  );
  await pool.query(
    'INSERT INTO faculty_profiles (user_id, faculty_id_code, department, designation, approval_status) VALUES (?, ?, ?, ?, ?)',
    [resF1.insertId, 'FAC-9901', 'School of Computing', 'Assistant Professor', 'approved']
  );
  const faculty1 = { id: resF1.insertId, email: 'feedback_iso_f1@bic.edu.np', role: 'faculty' };
  const tokenF1 = generateToken(faculty1);

  // 3. Create Test Faculty 2 (Non-Creator / Other Faculty)
  const [resF2] = await pool.query(
    'INSERT INTO users (full_name, email, password_hash, role) VALUES (?, ?, ?, ?)',
    ['Faculty Beta (Other)', 'feedback_iso_f2@bic.edu.np', passwordHash, 'faculty']
  );
  await pool.query(
    'INSERT INTO faculty_profiles (user_id, faculty_id_code, department, designation, approval_status) VALUES (?, ?, ?, ?, ?)',
    [resF2.insertId, 'FAC-9902', 'School of Business', 'Lecturer', 'approved']
  );
  const faculty2 = { id: resF2.insertId, email: 'feedback_iso_f2@bic.edu.np', role: 'faculty' };
  const tokenF2 = generateToken(faculty2);

  // 4. Create Test Admin
  const [resAdmin] = await pool.query(
    'INSERT INTO users (full_name, email, password_hash, role) VALUES (?, ?, ?, ?)',
    ['Super Admin', 'feedback_iso_admin@bic.edu.np', passwordHash, 'admin']
  );
  const admin = { id: resAdmin.insertId, email: 'feedback_iso_admin@bic.edu.np', role: 'admin' };
  const tokenAdmin = generateToken(admin);

  // 5. Create Test Student
  const [resStudent] = await pool.query(
    'INSERT INTO users (full_name, email, password_hash, role) VALUES (?, ?, ?, ?)',
    ['Student Alice', 'feedback_iso_student@bic.edu.np', passwordHash, 'student']
  );
  await pool.query(
    'INSERT INTO student_profiles (user_id, college_name, faculty_name, course_name, academic_level, academic_semester, academic_group) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [resStudent.insertId, 'Biratnagar International College', 'Computing', 'BSc IT', 'Undergraduate', 'Semester 4', 'L4C1']
  );
  const student = { id: resStudent.insertId, email: 'feedback_iso_student@bic.edu.np', role: 'student' };
  const tokenStudent = generateToken(student);

  // 6. Create Event A by Faculty 1 (started earlier today so feedback is open)
  const todayStr = new Date().toISOString().slice(0, 10);
  const [resEvent] = await pool.query(
    'INSERT INTO events (title, description, category, event_date, event_time, location, max_participants, status, created_by, organizing_department) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    ['Cloud Computing Workshop', 'Hands-on cloud lab', 'Workshop', todayStr, '08:00:00', 'Lab 4B', 50, 'approved', faculty1.id, 'School of Computing']
  );
  const eventId = resEvent.insertId;

  // 7. Register Student for Event A
  await pool.query(
    'INSERT INTO registrations (event_id, user_id) VALUES (?, ?)',
    [eventId, student.id]
  );

  console.log('--- TEST STEP 1: Faculty 1 creates Feedback Form on Event A ---');
  const createFormRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/feedback/forms',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenF1}`,
      },
    },
    {
      eventId,
      title: 'Cloud Workshop Survey',
      description: 'Participant satisfaction survey',
      questions: [
        { questionText: 'How relevant was the cloud content?', questionType: 'rating', isRequired: true },
        { questionText: 'What was your favorite session?', questionType: 'short_text', isRequired: false },
      ],
    }
  );
  assert(createFormRes.status === 201 && createFormRes.data.formId, 'Faculty 1 successfully created feedback form');
  const formId = createFormRes.data.formId;

  console.log('\n--- TEST STEP 2: Student submits feedback on Event A ---');
  // Get form to get question IDs
  const studentFormRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/feedback/forms/event/${eventId}`,
    method: 'GET',
    headers: { Authorization: `Bearer ${tokenStudent}` },
  });
  assert(studentFormRes.status === 200 && studentFormRes.data.form, 'Student can load feedback form for registered event');
  const qId1 = studentFormRes.data.form.questions[0].id;

  const submitRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/feedback/responses',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenStudent}`,
      },
    },
    {
      formId,
      eventId,
      starRating: 5,
      answers: { [qId1]: 5 },
    }
  );
  assert(submitRes.status === 201, 'Student successfully submitted feedback response');

  console.log('\n--- TEST STEP 3: Faculty 1 (Creator) fetches feedback ---');
  const f1GetRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/feedback/forms/event/${eventId}`,
    method: 'GET',
    headers: { Authorization: `Bearer ${tokenF1}` },
  });
  assert(f1GetRes.status === 200, 'Faculty 1 GET feedback returns 200');
  assert(f1GetRes.data.form && f1GetRes.data.form.id === formId, 'Faculty 1 receives full form configuration');
  assert(f1GetRes.data.isOwnerOrAdmin === true, 'Faculty 1 is marked as isOwnerOrAdmin: true');
  assert(Array.isArray(f1GetRes.data.responses) && f1GetRes.data.responses.length === 1, 'Faculty 1 sees student feedback responses');

  console.log('\n--- TEST STEP 4: Faculty 2 (Non-Creator) is BLOCKED from feedback ---');
  // 4a: GET feedback form/responses
  const f2GetRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/feedback/forms/event/${eventId}`,
    method: 'GET',
    headers: { Authorization: `Bearer ${tokenF2}` },
  });
  assert(f2GetRes.status === 200, 'Faculty 2 GET feedback returns 200');
  assert(f2GetRes.data.form === null, 'Faculty 2 receives form === null (form config hidden)');
  assert(f2GetRes.data.isOwnerOrAdmin === false, 'Faculty 2 isOwnerOrAdmin is false');
  assert(Array.isArray(f2GetRes.data.responses) && f2GetRes.data.responses.length === 0, 'Faculty 2 receives empty responses list [] (student feedback hidden)');
  assert(f2GetRes.data.isRestricted === true, 'Faculty 2 is marked with isRestricted: true');

  // 4b: Attempt to create another feedback form on Faculty 1 event
  const f2CreateRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/feedback/forms',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenF2}`,
      },
    },
    {
      eventId,
      title: 'Hacked Form',
      questions: [{ questionText: 'Test', questionType: 'short_text' }],
    }
  );
  assert(f2CreateRes.status === 403 || f2CreateRes.status === 409, `Faculty 2 cannot create feedback form on Faculty 1 event (status: ${f2CreateRes.status})`);

  // 4c: Attempt to download PDF report (which contains feedback)
  const f2ReportRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/events/${eventId}/report`,
    method: 'GET',
    headers: { Authorization: `Bearer ${tokenF2}` },
  });
  assert(f2ReportRes.status === 403, `Faculty 2 cannot generate PDF report for Faculty 1 event (status: ${f2ReportRes.status})`);

  console.log('\n--- TEST STEP 5: Admin can access Feedback and Analytics ---');
  const adminGetRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/feedback/forms/event/${eventId}`,
    method: 'GET',
    headers: { Authorization: `Bearer ${tokenAdmin}` },
  });
  assert(adminGetRes.status === 200, 'Admin GET feedback returns 200');
  assert(adminGetRes.data.form && adminGetRes.data.form.id === formId, 'Admin receives form configuration');
  assert(adminGetRes.data.isOwnerOrAdmin === true, 'Admin is marked as isOwnerOrAdmin: true');
  assert(Array.isArray(adminGetRes.data.responses) && adminGetRes.data.responses.length === 1, 'Admin receives student feedback responses');

  console.log('\n--- TEST STEP 6: Student privacy protection ---');
  const studentGetRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/feedback/forms/event/${eventId}`,
    method: 'GET',
    headers: { Authorization: `Bearer ${tokenStudent}` },
  });
  assert(studentGetRes.data.alreadySubmitted === true, 'Student is recognized as already submitted');
  assert(studentGetRes.data.myResponse && studentGetRes.data.myResponse.star_rating === 5, 'Student sees their own submission');
  assert(Array.isArray(studentGetRes.data.responses) && studentGetRes.data.responses.length === 0, 'Student cannot see other students responses');
  assert(studentGetRes.data.isOwnerOrAdmin === false, 'Student is not owner/admin');

  console.log('\n--- CLEANUP ---');
  await pool.query('DELETE FROM feedback_responses WHERE event_id = ?', [eventId]);
  await pool.query('DELETE FROM feedback_questions WHERE form_id = ?', [formId]);
  await pool.query('DELETE FROM feedback_forms WHERE id = ?', [formId]);
  await pool.query('DELETE FROM registrations WHERE event_id = ?', [eventId]);
  await pool.query('DELETE FROM events WHERE id = ?', [eventId]);
  await pool.query('DELETE FROM faculty_profiles WHERE user_id IN (?, ?)', [faculty1.id, faculty2.id]);
  await pool.query('DELETE FROM student_profiles WHERE user_id = ?', [student.id]);
  await pool.query('DELETE FROM users WHERE id IN (?, ?, ?, ?)', [faculty1.id, faculty2.id, admin.id, student.id]);
  console.log('Cleanup completed.');

  console.log('\n================================================================');
  console.log(`FEEDBACK ISOLATION RESULTS: ${passed} Passed, ${failed} Failed`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runFeedbackIsolationTest().catch((err) => {
  console.error('Test execution fatal error:', err);
  process.exit(1);
});

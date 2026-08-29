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

async function runQATests() {
  console.log('================================================================');
  console.log('           EVENTLY PLATFORM FULL QA STRESS-TEST & AUDIT         ');
  console.log('================================================================\n');

  let passedTests = 0;
  let failedTests = 0;

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passedTests++;
    } else {
      console.error(`  ❌ FAIL: ${testName} - ${details}`);
      failedTests++;
    }
  }

  try {
    // 0. Setup Test Users
    console.log('--- 0. Setup Test Accounts in Database ---');
    const passwordHash = await bcrypt.hash('Test@123', 10);

    const [oldUsers] = await pool.query('SELECT id FROM users WHERE email LIKE "qa_test_%@bic.edu.np"');
    for (const u of oldUsers) {
      await pool.query('DELETE FROM student_profiles WHERE user_id = ?', [u.id]);
      await pool.query('DELETE FROM faculty_profiles WHERE user_id = ?', [u.id]);
      await pool.query('DELETE FROM events WHERE created_by = ?', [u.id]);
      await pool.query('DELETE FROM users WHERE id = ?', [u.id]);
    }

    const [studentRes] = await pool.query(
      `INSERT INTO users (full_name, email, password_hash, role) 
       VALUES ('QA Student', 'qa_test_student@bic.edu.np', ?, 'student')`,
      [passwordHash]
    );
    await pool.query(
      `INSERT INTO student_profiles (user_id, college_name, faculty_name, course_name, academic_level, academic_semester, academic_group)
       VALUES (?, 'Biratnagar International College', 'School of Architecture, Computing and Engineering', 'BSc (Hons) Computer Science', 'Level 5', 'Semester 3', 'G1')`,
      [studentRes.insertId]
    );
    const studentUser = { id: studentRes.insertId, email: 'qa_test_student@bic.edu.np', role: 'student' };
    const studentToken = generateToken(studentUser);

    const [facultyARes] = await pool.query(
      `INSERT INTO users (full_name, email, password_hash, role) 
       VALUES ('QA Faculty A', 'qa_test_faculty_a@bic.edu.np', ?, 'faculty')`,
      [passwordHash]
    );
    await pool.query(
      `INSERT INTO faculty_profiles (user_id, faculty_id_code, department, designation, community, approval_status)
       VALUES (?, 'BIC-FAC-0901', 'IT Academics', 'Senior Lecturer', 'AI Horizon', 'approved')`,
      [facultyARes.insertId]
    );
    const facultyA = { id: facultyARes.insertId, email: 'qa_test_faculty_a@bic.edu.np', role: 'faculty' };
    const facultyAToken = generateToken(facultyA);

    const [facultyBRes] = await pool.query(
      `INSERT INTO users (full_name, email, password_hash, role) 
       VALUES ('QA Faculty B', 'qa_test_faculty_b@bic.edu.np', ?, 'faculty')`,
      [passwordHash]
    );
    await pool.query(
      `INSERT INTO faculty_profiles (user_id, faculty_id_code, department, designation, community, approval_status)
       VALUES (?, 'BIC-FAC-0902', 'Business Academics', 'Lecturer', NULL, 'approved')`,
      [facultyBRes.insertId]
    );
    const facultyB = { id: facultyBRes.insertId, email: 'qa_test_faculty_b@bic.edu.np', role: 'faculty' };
    const facultyBToken = generateToken(facultyB);

    const [adminRes] = await pool.query(
      `INSERT INTO users (full_name, email, password_hash, role) 
       VALUES ('QA Admin', 'qa_test_admin@bic.edu.np', ?, 'admin')`,
      [passwordHash]
    );
    const adminUser = { id: adminRes.insertId, email: 'qa_test_admin@bic.edu.np', role: 'admin' };
    const adminToken = generateToken(adminUser);

    console.log(`Created test users: Student #${studentUser.id}, FacultyA #${facultyA.id}, FacultyB #${facultyB.id}, Admin #${adminUser.id}\n`);

    // =========================================================================
    // 1. Role Boundaries & Access Control
    // =========================================================================
    console.log('--- 1. Testing Role Boundaries & Access Control ---');

    // 1.1 Student accessing Admin route
    const res1_1 = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/users/pending-faculty',
      method: 'GET',
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert(res1_1.status === 403, 'Student cannot access admin-only pending faculty route (403 Forbidden)');

    // 1.2 Student attempting to create event
    const res1_2 = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/events',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentToken}` },
    }, {
      title: 'Hacked Event',
      description: 'Test',
      category: 'Technical',
      location: 'Auditorium',
      eventDate: '2026-09-01',
      eventTime: '10:00',
      organizingDepartment: 'IT Academics',
    });
    assert(res1_2.status === 403, 'Student cannot create events (403 Forbidden)');

    // 1.3 Faculty A creates an event
    const res1_3_create = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/events',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${facultyAToken}` },
    }, {
      title: 'Faculty A Event',
      description: 'Original Event by Faculty A',
      category: 'Technical',
      location: 'Wulfruna Hall',
      eventDate: '2026-09-10',
      eventTime: '14:00',
      organizingDepartment: 'School of Architecture, Computing and Engineering',
      organizingCommunity: 'AI Horizon',
    });
    assert(res1_3_create.status === 201, 'Faculty A can create an event (201 Created)');
    const facultyAEventId = res1_3_create.data.eventId;

    // 1.4 Faculty B attempts to edit Faculty A's event by ID
    const res1_4 = await request({
      hostname: 'localhost',
      port: 5000,
      path: `/api/events/${facultyAEventId}`,
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${facultyBToken}` },
    }, {
      title: 'Tampered Title by Faculty B',
    });
    assert(res1_4.status === 403, 'Faculty B cannot edit Faculty A event (403 Forbidden)');

    // 1.5 Admin CAN edit Faculty A's event (Authorized oversight)
    const res1_5 = await request({
      hostname: 'localhost',
      port: 5000,
      path: `/api/events/${facultyAEventId}`,
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    }, {
      title: 'Admin Verified Faculty A Event',
      description: 'Updated by admin',
      category: 'Technical',
      location: 'Wulfruna Hall',
      eventDate: '2026-09-10',
      eventTime: '14:00',
      organizingDepartment: 'School of Architecture, Computing and Engineering',
    });
    assert(res1_5.status === 200, 'Admin can oversee and update event (200 OK)');

    // 1.6 Cancelled event cannot be modified
    // Mark event as cancelled
    await pool.query('UPDATE events SET status = "cancelled", cancellation_reason = "QA Cancellation Test", cancelled_at = NOW() WHERE id = ?', [facultyAEventId]);

    const res1_6 = await request({
      hostname: 'localhost',
      port: 5000,
      path: `/api/events/${facultyAEventId}`,
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${facultyAToken}` },
    }, {
      title: 'Trying to resurrect cancelled event',
    });
    assert(res1_6.status === 400, 'Cancelled event cannot be modified (400 Bad Request)');

    // =========================================================================
    // 2. Event Date & Time Lifecycle
    // =========================================================================
    console.log('\n--- 2. Testing Event Date & Time Lifecycle ---');

    // 2.1 Create an ended event in DB (Date in past)
    const [pastEventRes] = await pool.query(
      `INSERT INTO events (title, description, category, location, event_date, event_time, organizing_department, status, created_by)
       VALUES ('Historical Concluded Workshop', 'Past event', 'Workshop', 'Lab 1', '2026-08-20', '10:00:00', 'IT Academics', 'published', ?)`,
      [facultyA.id]
    );
    const pastEventId = pastEventRes.insertId;

    // 2.2 Attempt to modify date/time of concluded event
    const res2_2 = await request({
      hostname: 'localhost',
      port: 5000,
      path: `/api/events/${pastEventId}`,
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${facultyAToken}` },
    }, {
      title: 'Updated Description on Concluded Event',
      description: 'New notes',
      category: 'Workshop',
      location: 'Lab 1',
      eventDate: '2026-09-25', // Attempt to alter historical date
      eventTime: '15:00',
      organizingDepartment: 'IT Academics',
    });
    assert(res2_2.status === 200, 'Concluded event update request completes');

    // Verify in DB that historical date was NOT altered (tamper-proof)
    const [rows2_2] = await pool.query('SELECT event_date, event_time FROM events WHERE id = ?', [pastEventId]);
    assert(
      rows2_2[0].event_date.slice(0, 10) === '2026-08-20',
      'Historical event_date remains locked at 2026-08-20 despite incoming payload'
    );

    // 2.3 Attempt to schedule an event in the past
    const res2_3 = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/events',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${facultyAToken}` },
    }, {
      title: 'Invalid Past Event',
      description: 'Should fail',
      category: 'Seminar',
      location: 'Auditorium',
      eventDate: '2026-08-01',
      eventTime: '10:00',
      organizingDepartment: 'IT Academics',
    });
    assert(res2_3.status === 400, 'Backend rejects scheduling event in the past (400 Bad Request)');

    // =========================================================================
    // 3. Dynamic Form Builder & Submissions
    // =========================================================================
    console.log('\n--- 3. Testing Dynamic Form Builder & Submissions ---');

    // 3.1 Create ended event so feedback is open
    const [fbEventRes] = await pool.query(
      `INSERT INTO events (title, description, category, location, event_date, event_time, organizing_department, status, created_by)
       VALUES ('QA Feedback Event', 'Testing forms', 'Seminar', 'SR-Wolves', '2026-08-26', '08:00:00', 'IT Academics', 'published', ?)`,
      [facultyA.id]
    );
    const fbEventId = fbEventRes.insertId;

    // 3.2 Create custom feedback form with 4 question types
    const res3_2 = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/feedback/forms',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${facultyAToken}` },
    }, {
      eventId: fbEventId,
      title: 'Event Quality & Speaker Feedback',
      description: 'Please rate your experience',
      questions: [
        { questionText: 'Rate overall event quality', questionType: 'rating', isRequired: true },
        { questionText: 'Key takeaway from the keynote', questionType: 'short_text', isRequired: true },
        { questionText: 'Detailed suggestions for future events', questionType: 'long_text', isRequired: false },
        { questionText: 'Would you recommend this seminar to a peer?', questionType: 'multiple_choice', options: ['Definitely', 'Maybe', 'No'], isRequired: true },
      ],
    });
    assert(res3_2.status === 201, 'Faculty successfully created dynamic feedback form with 4 question types (201 Created)');
    const formId = res3_2.data.formId;

    // Fetch form and questions
    const res3_form = await request({
      hostname: 'localhost',
      port: 5000,
      path: `/api/feedback/forms/event/${fbEventId}`,
      method: 'GET',
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert(res3_form.data.form && res3_form.data.form.questions.length === 4, 'Feedback form retrieved 4 distinct questions for student');
    const questions = res3_form.data.form.questions;

    // 3.3 Verify Unregistered student is rejected (403 Forbidden)
    const answersObj = {};
    answersObj[questions[0].id] = '5';
    answersObj[questions[1].id] = 'Excellent real-world case studies.';
    answersObj[questions[2].id] = 'More interactive Q&A time would be great.';
    answersObj[questions[3].id] = 'Definitely';

    const res3_unregistered = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/feedback/responses',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentToken}` },
    }, {
      formId,
      eventId: fbEventId,
      starRating: 5,
      answers: answersObj,
    });
    assert(res3_unregistered.status === 403, 'Unregistered student feedback submission rejected (403 Forbidden)');

    // Register student for event
    await pool.query('INSERT INTO registrations (event_id, user_id) VALUES (?, ?)', [fbEventId, studentUser.id]);

    // 3.4 Student submits feedback responses after registering
    const res3_3 = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/feedback/responses',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentToken}` },
    }, {
      formId,
      eventId: fbEventId,
      starRating: 5,
      answers: answersObj,
    });
    assert(res3_3.status === 201, 'Student submitted feedback successfully (201 Created)');

    // 3.4 Duplicate feedback submission prevention
    const res3_4 = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/feedback/responses',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentToken}` },
    }, {
      formId,
      eventId: fbEventId,
      starRating: 4,
      answers: answersObj,
    });
    assert(res3_4.status === 409, 'Duplicate feedback submission rejected (409 Conflict)');

    // =========================================================================
    // 4. Registration Flow (Individual, Team, Capacity Limits)
    // =========================================================================
    console.log('\n--- 4. Testing Registration Flow & Capacity Limits ---');

    // 4.1 Create event with capacity cap of 2 participants
    const [capEventRes] = await pool.query(
      `INSERT INTO events (title, description, category, location, event_date, event_time, organizing_department, max_participants, is_team_event, status, created_by)
       VALUES ('QA Hackathon', 'Team event with cap', 'Competition', 'Lab 2', '2026-09-15', '09:00:00', 'IT Academics', 2, 1, 'published', ?)`,
      [facultyA.id]
    );
    const capEventId = capEventRes.insertId;

    // 4.2 Student registers team
    const res4_2 = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/registrations',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentToken}` },
    }, {
      eventId: capEventId,
      teamMembers: 'Aarav Sharma (ST-101), Maya Adhikari (ST-102)',
    });
    assert(res4_2.status === 201, 'Student registered team successfully (201 Created)');

    // 4.3 Duplicate registration prevention for same student
    const res4_3 = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/registrations',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentToken}` },
    }, {
      eventId: capEventId,
      teamMembers: 'Second Registration Attempt',
    });
    assert(res4_3.status === 409, 'Duplicate user registration rejected (409 Conflict)');

    // =========================================================================
    // 5. Cascading Permanent Deletion Test
    // =========================================================================
    console.log('\n--- 5. Testing Cascading Permanent Deletion (MySQL FK Cascades) ---');

    // 5.1 Add an image and deletion request to fbEventId
    await pool.query('INSERT INTO event_images (event_id, image_url, is_banner) VALUES (?, "/uploads/test.jpg", 1)', [fbEventId]);
    await pool.query(
      `INSERT INTO event_deletion_requests (event_id, requested_by, reason_category, problem_statement, status)
       VALUES (?, ?, 'Venue Conflict', 'Testing cascade deletion', 'pending')`,
      [fbEventId, facultyA.id]
    );

    // 5.2 Admin permanently deletes the event
    const res5_2 = await request({
      hostname: 'localhost',
      port: 5000,
      path: `/api/events/${fbEventId}`,
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(res5_2.status === 200, 'Admin permanently deleted event (200 OK)');

    // 5.3 Verify all dependent tables have 0 orphaned rows
    const [imgCheck] = await pool.query('SELECT COUNT(*) as count FROM event_images WHERE event_id = ?', [fbEventId]);
    const [fbFormCheck] = await pool.query('SELECT COUNT(*) as count FROM feedback_forms WHERE event_id = ?', [fbEventId]);
    const [delReqCheck] = await pool.query('SELECT COUNT(*) as count FROM event_deletion_requests WHERE event_id = ?', [fbEventId]);

    assert(imgCheck[0].count === 0, 'Cascaded delete: event_images purged (0 rows)');
    assert(fbFormCheck[0].count === 0, 'Cascaded delete: feedback_forms purged (0 rows)');
    assert(delReqCheck[0].count === 0, 'Cascaded delete: event_deletion_requests purged (0 rows)');

    // Cleanup QA Accounts
    const [finalOldUsers] = await pool.query('SELECT id FROM users WHERE email LIKE "qa_test_%@bic.edu.np"');
    for (const u of finalOldUsers) {
      await pool.query('DELETE FROM student_profiles WHERE user_id = ?', [u.id]);
      await pool.query('DELETE FROM faculty_profiles WHERE user_id = ?', [u.id]);
      await pool.query('DELETE FROM events WHERE created_by = ?', [u.id]);
      await pool.query('DELETE FROM users WHERE id = ?', [u.id]);
    }
    console.log('\nCleaned up temporary QA test accounts.');

    console.log('\n================================================================');
    console.log(`QA AUDIT RESULT: ${passedTests} PASSED, ${failedTests} FAILED`);
    console.log('================================================================\n');

    process.exit(failedTests > 0 ? 1 : 0);
  } catch (err) {
    console.error('QA Test Suite Exception:', err);
    process.exit(1);
  }
}

runQATests();

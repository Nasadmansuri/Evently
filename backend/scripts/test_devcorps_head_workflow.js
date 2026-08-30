require('dotenv').config();
const jwt = require('jsonwebtoken');
const pool = require('../src/shared/config/db');
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

async function runDevCorpsWorkflowTest() {
  console.log('================================================================');
  console.log('   DEVCORPS HEAD vs OTHER FACULTY RBAC PERMISSIONS AUDIT        ');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(cond, desc) {
    if (cond) {
      console.log(`  ✅ [PASS] ${desc}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${desc}`);
      failed++;
    }
  }

  const timestamp = Date.now();
  const devcorpsEmail = `devcorps_head_${timestamp}@bicnepal.edu.np`;
  const itFacultyEmail = `it_faculty_${timestamp}@bicnepal.edu.np`;
  const studentEmail = `student_${timestamp}@bicnepal.edu.np`;

  const createdEventIds = [];
  let devcorpsUserId, itFacultyUserId, studentUserId;

  try {
    // 1. Create DevCorps Head account
    const [devUserRes] = await pool.query(
      `INSERT INTO users (full_name, email, phone, role, password_hash, is_active)
       VALUES (?, ?, ?, 'faculty', '$2a$10$dummyhashfortesting', 1)`,
      ['Aayush Shrestha', devcorpsEmail, '9800000001']
    );
    devcorpsUserId = devUserRes.insertId;

    await pool.query(
      `INSERT INTO faculty_profiles (user_id, faculty_id_code, department, designation, community, approval_status)
       VALUES (?, ?, 'DevCorps', 'DevCorps Head', 'N/A', 'approved')`,
      [devcorpsUserId, `BIC-DEV-${timestamp.toString().slice(-4)}`]
    );

    // 2. Create Regular IT Academics Faculty account
    const [itUserRes] = await pool.query(
      `INSERT INTO users (full_name, email, phone, role, password_hash, is_active)
       VALUES (?, ?, ?, 'faculty', '$2a$10$dummyhashfortesting', 1)`,
      ['Rohan Gupta', itFacultyEmail, '9800000002']
    );
    itFacultyUserId = itUserRes.insertId;

    await pool.query(
      `INSERT INTO faculty_profiles (user_id, faculty_id_code, department, designation, community, approval_status)
       VALUES (?, ?, 'IT Academics', 'Senior Lecturer', 'N/A', 'approved')`,
      [itFacultyUserId, `BIC-IT-${timestamp.toString().slice(-4)}`]
    );

    assert(devcorpsUserId > 0 && itFacultyUserId > 0, 'Created DevCorps Head and IT Academics faculty accounts');

    // Generate JWTs
    const devcorpsToken = jwt.sign(
      { id: devcorpsUserId, role: 'faculty', email: devcorpsEmail },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    const itFacultyToken = jwt.sign(
      { id: itFacultyUserId, role: 'faculty', email: itFacultyEmail },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    // 3. DevCorps Head creates events for DevCorps Core and all 4 communities
    const communities = ['DevCorps Core', 'Devsphere', 'AI Horizon', 'BIC Converge', 'Incognitus'];

    for (const comm of communities) {
      const payload = {
        title: `${comm} Annual Tech Summit ${timestamp}`,
        description: `Official campus event organized by DevCorps for ${comm}`,
        category: 'Hackathons & Tech',
        location: 'BIC Main Auditorium',
        eventDate: '2026-11-20',
        eventTime: '10:00',
        organizingDepartment: 'DevCorps',
        organizingCommunity: comm,
        maxParticipants: 100,
        isTeamEvent: false,
        publishType: 'now',
      };

      const res = await request(
        {
          hostname: 'localhost',
          port: 5000,
          path: '/api/events',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${devcorpsToken}`,
          },
        },
        payload
      );

      assert(res.status === 201 && res.data.eventId, `DevCorps Head authorized: Created event for "${comm}" (ID: ${res.data.eventId})`);
      createdEventIds.push(res.data.eventId);
    }

    // 4. Test Security Boundary: IT Faculty attempting to create an event under DevCorps
    const illegalDevCorpsPayload = {
      title: `Unauthorized DevCorps Event ${timestamp}`,
      description: `Attempting to create DevCorps event from non-DevCorps faculty`,
      category: 'Hackathons & Tech',
      location: 'Lab 4',
      eventDate: '2026-11-25',
      eventTime: '11:00',
      organizingDepartment: 'DevCorps',
      organizingCommunity: 'Devsphere',
      maxParticipants: 50,
      isTeamEvent: false,
      publishType: 'now',
    };

    const illegalRes = await request(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/events',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${itFacultyToken}`,
        },
      },
      illegalDevCorpsPayload
    );

    assert(
      illegalRes.status === 403,
      `RBAC Security: Non-DevCorps faculty rejected when trying to publish under DevCorps (403 Forbidden)`
    );

    // 5. Test: IT Faculty CAN create event under IT Academics
    const validItPayload = {
      title: `Python Data Structures Workshop ${timestamp}`,
      description: `Academic workshop hosted by IT Academics`,
      category: 'Workshops & Masterclasses',
      location: 'Hall B',
      eventDate: '2026-11-22',
      eventTime: '14:00',
      organizingDepartment: 'IT Academics',
      maxParticipants: 60,
      isTeamEvent: false,
      publishType: 'now',
    };

    const validItRes = await request(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/events',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${itFacultyToken}`,
        },
      },
      validItPayload
    );

    assert(validItRes.status === 201 && validItRes.data.eventId, `IT Faculty authorized: Created event for "IT Academics" (ID: ${validItRes.data.eventId})`);
    createdEventIds.push(validItRes.data.eventId);

    // 6. Test: Student registration on DevCorps event
    const [stuRes] = await pool.query(
      `INSERT INTO users (full_name, email, phone, role, password_hash, is_active)
       VALUES (?, ?, ?, 'student', '$2a$10$dummyhashfortesting', 1)`,
      ['Kiran Thapa', studentEmail, '9800000003']
    );
    studentUserId = stuRes.insertId;

    await pool.query(
      `INSERT INTO student_profiles (user_id, college_name, faculty_name, course_name, academic_level, academic_semester, academic_group)
       VALUES (?, 'Biratnagar International College', 'School of Architecture, Computing and Engineering', 'BSc (Hons) Computer Science', 'Level 5', 'Semester 3', 'G1')`,
      [studentUserId]
    );

    const studentToken = jwt.sign(
      { id: studentUserId, role: 'student', email: studentEmail },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    const targetEventId = createdEventIds[2]; // AI Horizon
    const regRes = await request(
      {
        hostname: 'localhost',
        port: 5000,
        path: `/api/registrations`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${studentToken}`,
        },
      },
      { eventId: targetEventId }
    );

    assert(regRes.status === 201 && regRes.data.registrationId, `Student registered for AI Horizon event (Registration ID: ${regRes.data.registrationId})`);

    // 7. Verify Database Records
    const [rows] = await pool.query(
      `SELECT id, title, organizing_department, organizing_community FROM events WHERE id IN (?)`,
      [createdEventIds]
    );

    assert(rows.length === 6, 'All 6 events accurately registered in MySQL database');

  } catch (err) {
    console.error('Test execution error:', err.message);
    failed++;
  } finally {
    // Cleanup temporary test data
    try {
      if (studentUserId) {
        await pool.query('DELETE FROM registrations WHERE user_id = ?', [studentUserId]);
        await pool.query('DELETE FROM student_profiles WHERE user_id = ?', [studentUserId]);
        await pool.query('DELETE FROM users WHERE id = ?', [studentUserId]);
      }
      if (createdEventIds.length > 0) {
        await pool.query('DELETE FROM events WHERE id IN (?)', [createdEventIds]);
      }
      if (devcorpsUserId) {
        await pool.query('DELETE FROM faculty_profiles WHERE user_id = ?', [devcorpsUserId]);
        await pool.query('DELETE FROM users WHERE id = ?', [devcorpsUserId]);
      }
      if (itFacultyUserId) {
        await pool.query('DELETE FROM faculty_profiles WHERE user_id = ?', [itFacultyUserId]);
        await pool.query('DELETE FROM users WHERE id = ?', [itFacultyUserId]);
      }
      assert(true, 'Cleaned up all temporary QA test accounts and events safely');
    } catch (cleanErr) {
      console.error('Cleanup error:', cleanErr.message);
    }
  }

  console.log('\n================================================================');
  console.log(`WORKFLOW & RBAC AUDIT RESULT: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) process.exit(1);
}

runDevCorpsWorkflowTest();

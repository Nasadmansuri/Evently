const pool = require('../../shared/config/db');
const normalizeUser = require('../../shared/utils/normalizeUser');

const USER_JOIN_SELECT = `
  u.*,
  sp.college_name AS sp_college_name, sp.faculty_name, sp.course_name,
  sp.academic_level, sp.academic_semester, sp.academic_group,
  gp.college_name AS gp_college_name, gp.course_major,
  fp.faculty_id_code, fp.department, fp.designation, fp.community, fp.approval_status
  FROM users u
  LEFT JOIN student_profiles sp ON sp.user_id = u.id
  LEFT JOIN guest_profiles gp ON gp.user_id = u.id
  LEFT JOIN faculty_profiles fp ON fp.user_id = u.id
`;

async function findByEmail(email) {
  const [rows] = await pool.query(`SELECT ${USER_JOIN_SELECT} WHERE u.email = ?`, [email]);
  return normalizeUser(rows[0]);
}

async function findById(id) {
  const [rows] = await pool.query(`SELECT ${USER_JOIN_SELECT} WHERE u.id = ?`, [id]);
  return normalizeUser(rows[0]);
}

async function createStudent(data) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [result] = await conn.query(
      `INSERT INTO users (full_name, email, phone, password_hash, role) VALUES (?, ?, ?, ?, 'student')`,
      [data.fullName, data.email, data.phone || null, data.passwordHash]
    );
    const userId = result.insertId;

    if (data.isBic) {
      await conn.query(
        `INSERT INTO student_profiles (user_id, college_name, faculty_name, course_name, academic_level, academic_semester, academic_group)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [userId, data.collegeName, data.facultyName, data.courseName, data.academicLevel, data.academicSemester, data.academicGroup]
      );
    } else {
      await conn.query(
        `INSERT INTO guest_profiles (user_id, college_name, course_major) VALUES (?, ?, ?)`,
        [userId, data.collegeName, data.courseMajor]
      );
    }

    await conn.query(
      `INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)`,
      [userId, 'Welcome to Evently', 'Your account is all set up. Browse events to get started.']
    );

    await conn.commit();
    return findById(userId);
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

async function createFaculty(data) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [result] = await conn.query(
      `INSERT INTO users (full_name, email, phone, password_hash, role) VALUES (?, ?, ?, ?, 'faculty')`,
      [data.fullName, data.email, data.phone || null, data.passwordHash]
    );
    const userId = result.insertId;

    await conn.query(
      `INSERT INTO faculty_profiles (user_id, faculty_id_code, department, designation, community, approval_status)
       VALUES (?, ?, ?, ?, ?, 'pending')`,
      [userId, data.facultyIdCode, data.department, data.designation, data.community]
    );

    await conn.commit();
    return findById(userId);
  } catch (err) {
    await conn.rollback();
    console.error('MYSQL TRANSACTION ERROR:', err);
    throw err;
  } finally {
    conn.release();
  }
}
module.exports = { findByEmail, findById, createStudent, createFaculty };
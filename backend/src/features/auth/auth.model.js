const pool = require('../../shared/config/db');

async function createStudent(data) {
  const [result] = await pool.query(
    `INSERT INTO users (
      full_name, email, phone, password_hash, role,
      is_bic_student, college_name, course_major,
      faculty_name, course_name, academic_level, academic_semester, academic_group
    ) VALUES (?, ?, ?, ?, 'student', ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.fullName, data.email, data.phone || null, data.passwordHash,
      data.isBic, data.collegeName, data.courseMajor || null,
      data.facultyName || null, data.courseName || null,
      data.academicLevel || null, data.academicSemester || null, data.academicGroup || null,
    ]
  );
  return findById(result.insertId);
}

async function findByEmail(email) {
  const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
  return rows[0] || null;
}

async function findById(id) {
  const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
  return rows[0] || null;
}

module.exports = { findByEmail, findById, createStudent };
const pool = require('../../shared/config/db');
const normalizeUser = require('../../shared/utils/normalizeUser');

async function getProfile(id) {
  const [rows] = await pool.query(
    `SELECT u.id, u.full_name, u.email, u.phone, u.role, u.google_id, u.avatar_url, u.created_at,
            sp.college_name AS sp_college_name, sp.faculty_name, sp.course_name,
            sp.academic_level, sp.academic_semester, sp.academic_group,
            gp.college_name AS gp_college_name, gp.course_major,
            fp.faculty_id_code, fp.department, fp.designation, fp.community, fp.approval_status
     FROM users u
     LEFT JOIN student_profiles sp ON sp.user_id = u.id
     LEFT JOIN guest_profiles gp ON gp.user_id = u.id
     LEFT JOIN faculty_profiles fp ON fp.user_id = u.id
     WHERE u.id = ?`,
    [id]
  );
  return normalizeUser(rows[0]);
}

async function getPendingFaculty() {
  const [rows] = await pool.query(
    `SELECT u.id, u.full_name, u.email, u.phone,
            fp.faculty_id_code, fp.department, fp.designation, fp.community
     FROM users u
     JOIN faculty_profiles fp ON fp.user_id = u.id
     WHERE fp.approval_status = 'pending'
     ORDER BY u.id DESC`
  );
  return rows;
}

async function setApprovalStatus(id, status) {
  const [result] = await pool.query(
    `UPDATE faculty_profiles SET approval_status = ? WHERE user_id = ?`,
    [status, id]
  );

  if (result.affectedRows > 0 && status === 'approved') {
    await pool.query(
      `INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)`,
      [id, 'Account Approved', 'Your account has been approved. You can now create and manage events.']
    );
  }

  return result.affectedRows > 0;
}

module.exports = { getProfile, getPendingFaculty, setApprovalStatus };
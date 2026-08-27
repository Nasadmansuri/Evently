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

async function updateUserStatus(id, { isActive, reason }) {
  const activeValue = isActive ? 1 : 0;
  const reasonValue = activeValue === 0 ? (reason || 'Administrative review and policy compliance').trim() : null;
  const [result] = await pool.query(
    `UPDATE users SET is_active = ?, deactivation_reason = ? WHERE id = ?`,
    [activeValue, reasonValue, id]
  );

  if (result.affectedRows > 0) {
    if (activeValue === 0) {
      await pool.query(
        `INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)`,
        [
          id,
          'Account Deactivated',
          `Your account has been temporarily deactivated by campus administration. Reason: ${reasonValue}`,
        ]
      );
    } else {
      await pool.query(
        `INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)`,
        [
          id,
          'Account Reactivated',
          'Your account has been reactivated by campus administration. You can now log in and access campus events.',
        ]
      );
    }
  }

  return result.affectedRows > 0;
}

async function getAllUsers({ role, search } = {}) {
  let query = `
    SELECT u.id, u.full_name, u.email, u.phone, u.role, u.is_active, u.deactivation_reason, u.created_at,
           sp.college_name AS sp_college_name, sp.faculty_name, sp.course_name,
           sp.academic_level, sp.academic_semester, sp.academic_group,
           gp.college_name AS gp_college_name, gp.course_major,
           fp.faculty_id_code, fp.department, fp.designation, fp.community, fp.approval_status
    FROM users u
    LEFT JOIN student_profiles sp ON sp.user_id = u.id
    LEFT JOIN guest_profiles gp ON gp.user_id = u.id
    LEFT JOIN faculty_profiles fp ON fp.user_id = u.id
    WHERE 1=1
  `;
  const params = [];
  if (role && role !== 'All') {
    if (role === 'guest') {
      query += ' AND u.role = "student" AND gp.user_id IS NOT NULL';
    } else if (role === 'student') {
      query += ' AND u.role = "student" AND sp.user_id IS NOT NULL';
    } else {
      query += ' AND u.role = ?';
      params.push(role);
    }
  }
  if (search) {
    query += ' AND (u.full_name LIKE ? OR u.email LIKE ? OR u.id = ? OR sp.college_name LIKE ? OR gp.college_name LIKE ?)';
    const like = `%${search}%`;
    params.push(like, like, Number(search) || 0, like, like);
  }
  query += ' ORDER BY u.id DESC';
  const [rows] = await pool.query(query, params);
  return rows.map((r) => {
    const isGuest = r.role === 'student' && (r.gp_college_name != null || r.sp_college_name == null);
    return {
      ...r,
      role: isGuest ? 'guest' : r.role,
      is_guest: isGuest,
    };
  });
}

async function deleteUser(id) {
  const [result] = await pool.query(`DELETE FROM users WHERE id = ?`, [id]);
  return result.affectedRows > 0;
}

async function getUserStats(userId, role) {
  const stats = { totalRegistrations: 0, totalFeedback: 0, createdEvents: 0, feedbackReceived: 0 };

  if (role === 'student') {
    const [[regRow]] = await pool.query('SELECT COUNT(*) as count FROM registrations WHERE user_id = ?', [userId]);
    const [[feedRow]] = await pool.query('SELECT COUNT(DISTINCT form_id) as count FROM feedback_responses WHERE user_id = ?', [userId]);
    stats.totalRegistrations = regRow ? regRow.count : 0;
    stats.totalFeedback = feedRow ? feedRow.count : 0;
  } else if (role === 'faculty') {
    const [[eventsRow]] = await pool.query('SELECT COUNT(*) as count FROM events WHERE created_by = ?', [userId]);
    const [[regRow]] = await pool.query('SELECT COUNT(r.id) as count FROM registrations r JOIN events e ON e.id = r.event_id WHERE e.created_by = ?', [userId]);
    const [[feedRow]] = await pool.query('SELECT COUNT(fr.id) as count FROM feedback_responses fr JOIN events e ON e.id = fr.event_id WHERE e.created_by = ?', [userId]);
    stats.createdEvents = eventsRow ? eventsRow.count : 0;
    stats.totalRegistrations = regRow ? regRow.count : 0;
    stats.feedbackReceived = feedRow ? feedRow.count : 0;
  } else if (role === 'admin') {
    const [[usersRow]] = await pool.query('SELECT COUNT(*) as count FROM users');
    const [[eventsRow]] = await pool.query('SELECT COUNT(*) as count FROM events');
    stats.totalUsers = usersRow ? usersRow.count : 0;
    stats.totalEvents = eventsRow ? eventsRow.count : 0;
  }

  return stats;
}

async function updateProfile(id, data) {
  const { fullName, phone, avatarUrl, academicSemester, academicGroup, department, designation, community } = data;

  if (fullName || phone !== undefined || avatarUrl !== undefined) {
    const updates = [];
    const params = [];
    if (fullName) { updates.push('full_name = ?'); params.push(fullName); }
    if (phone !== undefined) { updates.push('phone = ?'); params.push(phone); }
    if (avatarUrl !== undefined) { updates.push('avatar_url = ?'); params.push(avatarUrl); }
    if (updates.length) {
      params.push(id);
      await pool.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);
    }
  }

  if (academicSemester || academicGroup) {
    const spUpdates = [];
    const spParams = [];
    if (academicSemester) { spUpdates.push('academic_semester = ?'); spParams.push(academicSemester); }
    if (academicGroup) { spUpdates.push('academic_group = ?'); spParams.push(academicGroup); }
    if (spUpdates.length) {
      spParams.push(id);
      await pool.query(`UPDATE student_profiles SET ${spUpdates.join(', ')} WHERE user_id = ?`, spParams);
    }
  }

  if (department || designation || community) {
    const fpUpdates = [];
    const fpParams = [];
    if (department) { fpUpdates.push('department = ?'); fpParams.push(department); }
    if (designation) { fpUpdates.push('designation = ?'); fpParams.push(designation); }
    if (community) { fpUpdates.push('community = ?'); fpParams.push(community); }
    if (fpUpdates.length) {
      fpParams.push(id);
      await pool.query(`UPDATE faculty_profiles SET ${fpUpdates.join(', ')} WHERE user_id = ?`, fpParams);
    }
  }

  return getProfile(id);
}

module.exports = {
  getProfile,
  getPendingFaculty,
  setApprovalStatus,
  updateUserStatus,
  getAllUsers,
  deleteUser,
  getUserStats,
  updateProfile,
};
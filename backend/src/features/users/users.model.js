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

  if (result.affectedRows > 0) {
    if (status === 'approved') {
      await pool.query(
        `INSERT INTO notifications (user_id, title, message, link) VALUES (?, ?, ?, ?)`,
        [id, 'Faculty Account Approved', 'Congratulations! Your faculty account has been approved by campus administration. You can now create and manage events.', '/faculty/dashboard']
      );
    } else if (status === 'rejected') {
      await pool.query(
        `INSERT INTO notifications (user_id, title, message, link) VALUES (?, ?, ?, ?)`,
        [id, 'Faculty Registration Rejected', 'Your faculty account registration was not approved by administration. Please contact the campus admin office for assistance.', null]
      );
    }
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
           fp.faculty_id_code, fp.department, fp.designation, fp.community, fp.approval_status,
           (SELECT COUNT(*) FROM events e WHERE e.created_by = u.id) AS events_created_count,
           (SELECT COUNT(r.id) FROM registrations r JOIN events e2 ON e2.id = r.event_id WHERE e2.created_by = u.id) AS total_attendees_hosted,
           (SELECT COUNT(*) FROM events e3 WHERE e3.created_by = u.id AND e3.status = 'published') AS active_events_count,
           (SELECT COUNT(fr.id) FROM feedback_responses fr JOIN events e4 ON e4.id = fr.event_id WHERE e4.created_by = u.id) AS feedback_responses_received,
           (SELECT COUNT(*) FROM registrations reg WHERE reg.user_id = u.id) AS registered_events_count,
           (SELECT COUNT(DISTINCT fresp.form_id) FROM feedback_responses fresp WHERE fresp.user_id = u.id) AS feedback_submitted_count
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
    const collegeName = r.role === 'faculty' || r.role === 'admin'
      ? 'Biratnagar International College'
      : (isGuest ? (r.gp_college_name || 'External College') : (r.sp_college_name || 'Biratnagar International College'));
    return {
      ...r,
      role: isGuest ? 'guest' : r.role,
      is_guest: isGuest,
      college_name: collegeName,
      events_created_count: Number(r.events_created_count || 0),
      total_attendees_hosted: Number(r.total_attendees_hosted || 0),
      active_events_count: Number(r.active_events_count || 0),
      feedback_responses_received: Number(r.feedback_responses_received || 0),
      registered_events_count: Number(r.registered_events_count || 0),
      feedback_submitted_count: Number(r.feedback_submitted_count || 0),
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

async function getUserActivity(userId, role) {
  if (role === 'faculty') {
    const [events] = await pool.query(
      `SELECT e.id, e.title, e.category, e.event_date, e.event_time, e.status, e.location, e.max_participants,
              (SELECT COUNT(*) FROM registrations r WHERE r.event_id = e.id) AS registered_count,
              (SELECT COUNT(*) FROM feedback_responses fr WHERE fr.event_id = e.id) AS feedback_count
       FROM events e
       WHERE e.created_by = ?
       ORDER BY e.event_date DESC, e.id DESC
       LIMIT 10`,
      [userId]
    );
    return { hostedEvents: events };
  }

  // Student or Guest
  const [registrations] = await pool.query(
    `SELECT r.id AS registration_id, r.registered_at, r.team_members,
            e.id AS event_id, e.title, e.category, e.event_date, e.event_time, e.status, e.location
     FROM registrations r
     JOIN events e ON e.id = r.event_id
     WHERE r.user_id = ?
     ORDER BY r.registered_at DESC, r.id DESC
     LIMIT 10`,
    [userId]
  );
  return { registeredEvents: registrations };
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
  getUserActivity,
  updateProfile,
};
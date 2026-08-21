const pool = require('../../shared/config/db');

async function findRegistration(eventId, userId) {
  const [rows] = await pool.query(
    'SELECT id FROM registrations WHERE event_id = ? AND user_id = ?',
    [eventId, userId]
  );
  return rows[0] || null;
}

async function getRegistrationCount(eventId) {
  const [[{ count }]] = await pool.query(
    'SELECT COUNT(*) AS count FROM registrations WHERE event_id = ?',
    [eventId]
  );
  return count;
}

async function createRegistration({ eventId, userId, teamMembers }) {
  const [result] = await pool.query(
    'INSERT INTO registrations (event_id, user_id, team_members) VALUES (?, ?, ?)',
    [eventId, userId, teamMembers || null]
  );
  return result.insertId;
}

async function getMyRegistrations(userId) {
  const [rows] = await pool.query(
    `SELECT r.id AS registration_id, r.team_members, r.registered_at,
            e.id, e.title, e.category, e.location, e.event_date, e.event_time, e.status
     FROM registrations r
     JOIN events e ON e.id = r.event_id
     WHERE r.user_id = ?
     ORDER BY e.event_date ASC`,
    [userId]
  );
  return rows;
}

async function getEventParticipants(eventId) {
  const [rows] = await pool.query(
    `SELECT r.id AS registration_id, r.team_members, r.registered_at,
            u.full_name, u.email, u.phone,
            sp.college_name AS sp_college_name, sp.course_name,
            sp.academic_level, sp.academic_semester, sp.academic_group,
            gp.college_name AS gp_college_name, gp.course_major
     FROM registrations r
     JOIN users u ON u.id = r.user_id
     LEFT JOIN student_profiles sp ON sp.user_id = u.id
     LEFT JOIN guest_profiles gp ON gp.user_id = u.id
     WHERE r.event_id = ?
     ORDER BY r.registered_at ASC`,
    [eventId]
  );
  return rows;
}

module.exports = { findRegistration, getRegistrationCount, createRegistration, getMyRegistrations, getEventParticipants };
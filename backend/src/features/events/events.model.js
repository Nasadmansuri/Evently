const pool = require('../../shared/config/db');

async function getEventsByFaculty(userId) {
  const [rows] = await pool.query(
    `SELECT id, title, event_date, event_time, category, status
     FROM events
     WHERE created_by = ?
     ORDER BY event_date DESC`,
    [userId]
  );
  return rows;
}

async function getFacultyStats(userId) {
  const [[{ totalEvents }]] = await pool.query(
    `SELECT COUNT(*) AS totalEvents FROM events WHERE created_by = ?`,
    [userId]
  );
  const [[{ upcomingEvents }]] = await pool.query(
    `SELECT COUNT(*) AS upcomingEvents FROM events WHERE created_by = ? AND event_date >= CURDATE()`,
    [userId]
  );
  return { totalEvents, upcomingEvents };
}

async function createEvent(data) {
  const [result] = await pool.query(
    `INSERT INTO events (
      title, description, category, location, event_date, event_time,
      organizing_department, organizing_community, rules_eligibility,
      prize_info, max_participants, status, created_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'upcoming', ?)`,
    [
      data.title, data.description, data.category, data.location,
      data.eventDate, data.eventTime, data.organizingDepartment,
      data.organizingCommunity || null, data.rulesEligibility || null,
      data.prizeInfo || null, data.maxParticipants || null, data.userId,
    ]
  );
  return result.insertId;
}

async function getAllEvents({ category } = {}) {
  let query = `
    SELECT e.id, e.title, e.description, e.category, e.location, e.event_date, e.event_time,
           e.organizing_department, e.status, u.full_name AS organizer_name
    FROM events e
    JOIN users u ON u.id = e.created_by
  `;
  const params = [];
  if (category) {
    query += ' WHERE e.category = ?';
    params.push(category);
  }
  query += ' ORDER BY e.event_date ASC';
  const [rows] = await pool.query(query, params);
  return rows;
}

async function getEventById(id) {
  const [rows] = await pool.query(
    `SELECT e.*, u.full_name AS organizer_name
     FROM events e
     JOIN users u ON u.id = e.created_by
     WHERE e.id = ?`,
    [id]
  );
  return rows[0] || null;
}

module.exports = { getEventsByFaculty, getFacultyStats, createEvent, getAllEvents, getEventById };
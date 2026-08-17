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

async function getAllEvents({ category } = {}, userId) {
  let query = `
    SELECT e.id, e.title, e.description, e.category, e.location, e.event_date, e.event_time,
           e.organizing_department, e.status, u.full_name AS organizer_name,
           (r.id IS NOT NULL) AS is_registered
    FROM events e
    JOIN users u ON u.id = e.created_by
    LEFT JOIN registrations r ON r.event_id = e.id AND r.user_id = ?
  `;
  const params = [userId || null];
  if (category) {
    query += ' WHERE e.category = ?';
    params.push(category);
  }
  query += ' ORDER BY e.event_date ASC';
  const [rows] = await pool.query(query, params);
  return rows.map((row) => ({ ...row, is_registered: !!row.is_registered }));
}

async function getEventById(id, userId) {
  const [rows] = await pool.query(
    `SELECT e.*, u.full_name AS organizer_name,
            (r.id IS NOT NULL) AS is_registered
     FROM events e
     JOIN users u ON u.id = e.created_by
     LEFT JOIN registrations r ON r.event_id = e.id AND r.user_id = ?
     WHERE e.id = ?`,
    [userId || null, id]
  );
  if (!rows[0]) return null;
  return { ...rows[0], is_registered: !!rows[0].is_registered };
}

async function getRecommendedEvents(userId) {
  const [registered] = await pool.query(
    `SELECT DISTINCT e.category FROM registrations r JOIN events e ON e.id = r.event_id WHERE r.user_id = ?`,
    [userId]
  );
  const categories = registered.map((r) => r.category);

  let query, params;
  if (categories.length > 0) {
    query = `
      SELECT e.id, e.title, e.category, e.location, e.event_date, e.event_time
      FROM events e
      WHERE e.category IN (?)
        AND e.event_date >= CURDATE()
        AND e.id NOT IN (SELECT event_id FROM registrations WHERE user_id = ?)
      ORDER BY e.event_date ASC LIMIT 4
    `;
    params = [categories, userId];
  } else {
    query = `
      SELECT e.id, e.title, e.category, e.location, e.event_date, e.event_time
      FROM events e
      WHERE e.event_date >= CURDATE()
      ORDER BY e.event_date ASC LIMIT 4
    `;
    params = [];
  }
  const [rows] = await pool.query(query, params);
  return rows;
}

module.exports = { getEventsByFaculty, getFacultyStats, createEvent, getAllEvents, getEventById, getRecommendedEvents };
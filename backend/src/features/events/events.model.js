const pool = require('../../shared/config/db');

async function getEventsByFaculty(userId) {
  const [rows] = await pool.query(
    `SELECT id, title, event_date, event_time, category, status, is_team_event,
            (SELECT image_url FROM event_images WHERE event_id = events.id AND is_banner = 1 LIMIT 1) AS banner_image
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

// async function createEvent(data) {
//   const [result] = await pool.query(
//     `INSERT INTO events (
//       title, description, category, location, event_date, event_time,
//       organizing_department, organizing_community, rules_eligibility,
//       prize_info, max_participants, is_team_event, status, created_by
//     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'upcoming', ?)`,
//     [
//       data.title, data.description, data.category, data.location,
//       data.eventDate, data.eventTime, data.organizingDepartment,
//       data.organizingCommunity || null, data.rulesEligibility || null,
//       data.prizeInfo || null, data.maxParticipants || null, 
//       data.isTeamEvent ? 1 : 0, data.userId,
//     ]
//   );
//   return result.insertId;
// }

async function createEvent(data) {
  const [result] = await pool.query(
    `INSERT INTO events (
      title, description, category, location, event_date, event_time,
      organizing_department, organizing_community, rules_eligibility,
      prize_info, max_participants, is_team_event, status, created_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'upcoming', ?)`,
    [
      data.title, data.description, data.category, data.location,
      data.eventDate, data.eventTime, data.organizingDepartment,
      data.organizingCommunity || null, data.rulesEligibility || null,
      data.prizeInfo || null, data.maxParticipants || null, 
      data.isTeamEvent ? 1 : 0, // <-- Converts true/false to 1/0
      data.userId,
    ]
  );
  return result.insertId;
}

async function getAllEvents({ category } = {}, userId) {
  let query = `
    SELECT e.id, e.title, e.description, e.category, e.location, e.event_date, e.event_time,
           e.organizing_department, e.organizing_community, e.is_team_event, e.status, u.full_name AS organizer_name,
           (r.id IS NOT NULL) AS is_registered,
           (SELECT image_url FROM event_images WHERE event_id = e.id AND is_banner = 1 LIMIT 1) AS banner_image
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
async function getAllEventsAdmin() {
  const [rows] = await pool.query(
    `SELECT e.id, e.title, e.category, e.location, e.event_date, e.event_time,
            e.status, e.created_by, e.organizing_department, e.organizing_community, e.is_team_event,
            u.full_name AS organizer_name,
            (SELECT COUNT(*) FROM registrations r WHERE r.event_id = e.id) AS registration_count,
            (SELECT image_url FROM event_images WHERE event_id = e.id AND is_banner = 1 LIMIT 1) AS banner_image
     FROM events e
     JOIN users u ON u.id = e.created_by
     ORDER BY e.event_date DESC`
  );
  return rows;
}

async function updateEvent(id, data) {
  await pool.query(
    `UPDATE events SET
      title = ?, description = ?, category = ?, location = ?,
      event_date = ?, event_time = ?, organizing_department = ?,
      organizing_community = ?, rules_eligibility = ?, prize_info = ?, max_participants = ?, is_team_event = ?
     WHERE id = ?`,
    [
      data.title, data.description, data.category, data.location,
      data.eventDate, data.eventTime, data.organizingDepartment,
      data.organizingCommunity || null, data.rulesEligibility || null,
      data.prizeInfo || null, data.maxParticipants || null, 
      data.isTeamEvent ? 1 : 0, id,
    ]
  );
}

async function deleteEvent(id) {
  const [result] = await pool.query(`DELETE FROM events WHERE id = ?`, [id]);
  return result.affectedRows > 0;
}

async function getAdminStats() {
  const [[{ totalEvents }]] = await pool.query(`SELECT COUNT(*) AS totalEvents FROM events`);
  const [[{ totalStudents }]] = await pool.query(`SELECT COUNT(*) AS totalStudents FROM users WHERE role = 'student'`);
  const [[{ totalFaculty }]] = await pool.query(`SELECT COUNT(*) AS totalFaculty FROM users WHERE role = 'faculty'`);
  const [[{ pendingFaculty }]] = await pool.query(
    `SELECT COUNT(*) AS pendingFaculty FROM faculty_profiles WHERE approval_status = 'pending'`
  );
  const [[{ totalParticipants }]] = await pool.query(`SELECT COUNT(*) AS totalParticipants FROM registrations`);
  const [[{ upcomingEvents }]] = await pool.query(
    `SELECT COUNT(*) AS upcomingEvents FROM events WHERE event_date >= CURDATE()`
  );
  return { totalEvents, totalStudents, totalFaculty, pendingFaculty, totalParticipants, upcomingEvents };
}

async function getEventById(id, userId) {
  const [rows] = await pool.query(
    `SELECT e.*, u.full_name AS organizer_name,
            (r.id IS NOT NULL) AS is_registered,
            r.team_members AS my_team_members,
            (SELECT image_url FROM event_images WHERE event_id = e.id AND is_banner = 1 LIMIT 1) AS banner_image
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

async function addEventImages(eventId, imageUrls) {
  if (!imageUrls.length) return;
  const values = imageUrls.map((url) => [eventId, url]);
  await pool.query(`INSERT INTO event_images (event_id, image_url) VALUES ?`, [values]);

  const [[{ bannerCount }]] = await pool.query(
    `SELECT COUNT(*) AS bannerCount FROM event_images WHERE event_id = ? AND is_banner = 1`,
    [eventId]
  );
  if (bannerCount === 0) {
    await pool.query(
      `UPDATE event_images SET is_banner = 1
       WHERE id = (SELECT id FROM (SELECT id FROM event_images WHERE event_id = ? ORDER BY uploaded_at ASC, id ASC LIMIT 1) t)`,
      [eventId]
    );
  }
}

async function setBannerImage(eventId, imageId) {
  await pool.query(`UPDATE event_images SET is_banner = 0 WHERE event_id = ?`, [eventId]);
  await pool.query(`UPDATE event_images SET is_banner = 1 WHERE id = ? AND event_id = ?`, [imageId, eventId]);
}

async function getEventImages(eventId) {
  const [rows] = await pool.query(
    `SELECT id, event_id, image_url, uploaded_at FROM event_images WHERE event_id = ? ORDER BY uploaded_at ASC`,
    [eventId]
  );
  return rows;
}

async function getEventImageById(imageId) {
  const [rows] = await pool.query(`SELECT * FROM event_images WHERE id = ?`, [imageId]);
  return rows[0] || null;
}

async function deleteEventImage(imageId) {
  const [rows] = await pool.query(`SELECT event_id, is_banner FROM event_images WHERE id = ?`, [imageId]);
  const image = rows[0];
  if (!image) return false;

  const [result] = await pool.query(`DELETE FROM event_images WHERE id = ?`, [imageId]);

  if (image.is_banner) {
    await pool.query(
      `UPDATE event_images SET is_banner = 1
       WHERE id = (SELECT id FROM (SELECT id FROM event_images WHERE event_id = ? ORDER BY uploaded_at ASC, id ASC LIMIT 1) t)`,
      [image.event_id]
    );
  }

  return result.affectedRows > 0;
}

async function getGallerySummary() {
  const [rows] = await pool.query(
    `SELECT e.id, e.title, e.category, e.event_date,
            COALESCE(
              (SELECT image_url FROM event_images WHERE event_id = e.id AND is_banner = 1 LIMIT 1),
              (SELECT image_url FROM event_images WHERE event_id = e.id ORDER BY id ASC LIMIT 1)
            ) AS cover_image,
            (SELECT COUNT(*) FROM event_images WHERE event_id = e.id) AS photo_count
     FROM events e
     WHERE (SELECT COUNT(*) FROM event_images WHERE event_id = e.id) > 0
     ORDER BY e.event_date DESC`
  );
  return rows;
}

module.exports = {
  getEventsByFaculty, getFacultyStats, createEvent, getAllEvents, getEventById,
  getRecommendedEvents, getAllEventsAdmin, deleteEvent, getAdminStats, updateEvent,
  addEventImages, getEventImages, getEventImageById, deleteEventImage, getGallerySummary,
  setBannerImage,
};
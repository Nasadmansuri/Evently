const pool = require('../../shared/config/db');

async function getEventsByFaculty(userId) {
  await autoPublishScheduledEvents();
  const [rows] = await pool.query(
    `SELECT e.id, e.title, e.description, e.location, e.event_date, e.event_time, e.category,
            e.status, e.publish_at, e.is_team_event, e.cancellation_reason, e.cancelled_at,
            e.organizing_department, e.organizing_community,
            (SELECT COUNT(*) FROM registrations r WHERE r.event_id = e.id) AS registration_count,
            (SELECT image_url FROM event_images WHERE event_id = e.id AND is_banner = 1 LIMIT 1) AS banner_image,
            (SELECT id FROM event_deletion_requests WHERE event_id = e.id AND status = 'pending' LIMIT 1) AS deletion_request_id,
            (SELECT reason_category FROM event_deletion_requests WHERE event_id = e.id AND status = 'pending' LIMIT 1) AS deletion_reason,
            (SELECT problem_statement FROM event_deletion_requests WHERE event_id = e.id AND status = 'pending' LIMIT 1) AS deletion_problem
     FROM events e
     WHERE e.created_by = ?
     ORDER BY e.event_date DESC`,
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
  const [[{ totalRegistrations }]] = await pool.query(
    `SELECT COUNT(r.id) AS totalRegistrations
     FROM registrations r
     JOIN events e ON e.id = r.event_id
     WHERE e.created_by = ?`,
    [userId]
  );
  const [[{ completedEvents }]] = await pool.query(
    `SELECT COUNT(*) AS completedEvents FROM events WHERE created_by = ? AND event_date < CURDATE()`,
    [userId]
  );
  return {
    totalEvents: Number(totalEvents) || 0,
    upcomingEvents: Number(upcomingEvents) || 0,
    totalRegistrations: Number(totalRegistrations) || 0,
    completedEvents: Number(completedEvents) || 0,
  };
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

async function autoPublishScheduledEvents() {
  try {
    const [scheduled] = await pool.query(
      `SELECT id, title, category, organizing_department, created_by
       FROM events
       WHERE status = 'scheduled' AND publish_at IS NOT NULL AND publish_at <= NOW()`
    );
    if (scheduled.length > 0) {
      const ids = scheduled.map((e) => e.id);
      await pool.query(`UPDATE events SET status = 'upcoming' WHERE id IN (?)`, [ids]);
      return scheduled;
    }
    return [];
  } catch (err) {
    console.error('Auto-publish check error:', err.message);
    return [];
  }
}

async function createEvent(data) {
  const status = data.publishAt ? 'scheduled' : 'upcoming';
  const [result] = await pool.query(
    `INSERT INTO events (
      title, description, category, location, event_date, event_time,
      organizing_department, organizing_community, rules_eligibility,
      prize_info, max_participants, is_team_event, status, publish_at, created_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.title, data.description, data.category, data.location,
      data.eventDate, data.eventTime, data.organizingDepartment,
      data.organizingCommunity || null, data.rulesEligibility || null,
      data.prizeInfo || null, data.maxParticipants || null, 
      data.isTeamEvent ? 1 : 0,
      status,
      data.publishAt || null,
      data.userId,
    ]
  );
  return result.insertId;
}

async function getAllEvents({ category } = {}, userId) {
  await autoPublishScheduledEvents();
  let query = `
    SELECT e.id, e.title, e.description, e.category, e.location, e.event_date, e.event_time,
           e.organizing_department, e.organizing_community, e.is_team_event, e.status, e.publish_at,
           e.rules_eligibility, e.prize_info, e.max_participants,
           e.cancellation_reason, e.cancelled_at,
           u.full_name AS organizer_name,
           (r.id IS NOT NULL) AS is_registered,
           (SELECT image_url FROM event_images WHERE event_id = e.id AND is_banner = 1 LIMIT 1) AS banner_image
    FROM events e
    JOIN users u ON u.id = e.created_by
    LEFT JOIN registrations r ON r.event_id = e.id AND r.user_id = ?
    WHERE e.status != 'cancelled' AND (e.status != 'scheduled' OR (e.publish_at IS NOT NULL AND e.publish_at <= NOW()))
  `;
  const params = [userId || null];
  if (category) {
    query += ' AND e.category = ?';
    params.push(category);
  }
  query += ' ORDER BY e.event_date ASC';
  const [rows] = await pool.query(query, params);
  return rows.map((row) => ({ ...row, is_registered: !!row.is_registered }));
}

async function getAllEventsAdmin() {
  await autoPublishScheduledEvents();
  const [rows] = await pool.query(
    `SELECT e.id, e.title, e.category, e.location, e.event_date, e.event_time,
            e.status, e.publish_at, e.created_by, e.organizing_department, e.organizing_community, e.is_team_event,
            e.cancellation_reason, e.cancelled_at,
            u.full_name AS organizer_name,
            (SELECT COUNT(*) FROM registrations r WHERE r.event_id = e.id) AS registration_count,
            (SELECT image_url FROM event_images WHERE event_id = e.id AND is_banner = 1 LIMIT 1) AS banner_image,
            (SELECT id FROM event_deletion_requests WHERE event_id = e.id AND status = 'pending' LIMIT 1) AS deletion_request_id,
            (SELECT reason_category FROM event_deletion_requests WHERE event_id = e.id AND status = 'pending' LIMIT 1) AS deletion_reason,
            (SELECT problem_statement FROM event_deletion_requests WHERE event_id = e.id AND status = 'pending' LIMIT 1) AS deletion_problem
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
  const [[{ totalEvents }]] = await pool.query(`SELECT COUNT(*) AS totalEvents FROM events WHERE status != 'cancelled'`);
  const [[{ totalStudents }]] = await pool.query(`SELECT COUNT(*) AS totalStudents FROM users WHERE role = 'student'`);
  const [[{ totalFaculty }]] = await pool.query(`SELECT COUNT(*) AS totalFaculty FROM users WHERE role = 'faculty'`);
  const [[{ pendingFaculty }]] = await pool.query(
    `SELECT COUNT(*) AS pendingFaculty FROM faculty_profiles WHERE approval_status = 'pending'`
  );
  const [[{ totalParticipants }]] = await pool.query(`SELECT COUNT(*) AS totalParticipants FROM registrations`);
  const [[{ upcomingEvents }]] = await pool.query(
    `SELECT COUNT(*) AS upcomingEvents FROM events WHERE event_date >= CURDATE() AND status != 'cancelled'`
  );
  return { totalEvents, totalStudents, totalFaculty, pendingFaculty, totalParticipants, upcomingEvents };
}

async function getEventById(id, userId) {
  const [rows] = await pool.query(
    `SELECT e.*, u.full_name AS organizer_name,
            (r.id IS NOT NULL) AS is_registered,
            r.team_members AS my_team_members,
            (SELECT image_url FROM event_images WHERE event_id = e.id AND is_banner = 1 LIMIT 1) AS banner_image,
            (SELECT id FROM event_deletion_requests WHERE event_id = e.id AND status = 'pending' LIMIT 1) AS deletion_request_id,
            (SELECT reason_category FROM event_deletion_requests WHERE event_id = e.id AND status = 'pending' LIMIT 1) AS deletion_reason,
            (SELECT problem_statement FROM event_deletion_requests WHERE event_id = e.id AND status = 'pending' LIMIT 1) AS deletion_problem
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
      WHERE e.status != 'cancelled'
        AND e.category IN (?)
        AND e.event_date >= CURDATE()
        AND e.id NOT IN (SELECT event_id FROM registrations WHERE user_id = ?)
      ORDER BY e.event_date ASC LIMIT 4
    `;
    params = [categories, userId];
  } else {
    query = `
      SELECT e.id, e.title, e.category, e.location, e.event_date, e.event_time
      FROM events e
      WHERE e.status != 'cancelled'
        AND e.event_date >= CURDATE()
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
    `SELECT e.id, e.title, e.description, e.category, e.location, e.event_date, e.event_time,
            e.organizing_department, e.organizing_community, e.is_team_event, e.status, e.publish_at,
            COALESCE(
              (SELECT image_url FROM event_images WHERE event_id = e.id AND is_banner = 1 LIMIT 1),
              (SELECT image_url FROM event_images WHERE event_id = e.id ORDER BY id ASC LIMIT 1)
            ) AS banner_image,
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

// -------------------------------------------------------------
// EVENT DELETION REQUESTS GOVERNANCE
// -------------------------------------------------------------
async function createDeletionRequest({ eventId, userId, reasonCategory, problemStatement }) {
  const [result] = await pool.query(
    `INSERT INTO event_deletion_requests (event_id, requested_by, reason_category, problem_statement, status)
     VALUES (?, ?, ?, ?, 'pending')`,
    [eventId, userId, reasonCategory, problemStatement]
  );
  return result.insertId;
}

async function getDeletionRequests({ status = 'pending' } = {}) {
  let query = `
    SELECT edr.*,
           e.title AS event_title, e.category AS event_category, e.event_date, e.event_time,
           e.organizing_department, e.organizing_community,
           u.full_name AS requester_name, u.email AS requester_email,
           (SELECT COUNT(*) FROM registrations r WHERE r.event_id = edr.event_id) AS registration_count
    FROM event_deletion_requests edr
    JOIN events e ON e.id = edr.event_id
    JOIN users u ON u.id = edr.requested_by
  `;
  const params = [];
  if (status && status !== 'all') {
    query += ' WHERE edr.status = ?';
    params.push(status);
  }
  query += ' ORDER BY edr.created_at DESC';
  const [rows] = await pool.query(query, params);
  return rows;
}

async function getDeletionRequestById(requestId) {
  const [rows] = await pool.query(
    `SELECT edr.*, e.title AS event_title, e.created_by AS event_owner_id
     FROM event_deletion_requests edr
     JOIN events e ON e.id = edr.event_id
     WHERE edr.id = ?`,
    [requestId]
  );
  return rows[0] || null;
}

async function resolveDeletionRequest(requestId, { status, adminNotes, adminId }) {
  const reqData = await getDeletionRequestById(requestId);
  if (!reqData) return null;

  await pool.query(
    `UPDATE event_deletion_requests
     SET status = ?, admin_notes = ?, resolved_by = ?, resolved_at = NOW()
     WHERE id = ?`,
    [status, adminNotes || null, adminId, requestId]
  );

  return reqData;
}

module.exports = {
  getEventsByFaculty, getFacultyStats, createEvent, getAllEvents, getEventById,
  getRecommendedEvents, getAllEventsAdmin, deleteEvent, getAdminStats, updateEvent,
  addEventImages, getEventImages, getEventImageById, deleteEventImage, getGallerySummary,
  setBannerImage, autoPublishScheduledEvents,
  createDeletionRequest, getDeletionRequests, getDeletionRequestById, resolveDeletionRequest,
};
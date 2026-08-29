const pool = require('../../shared/config/db'); // adjust path if your pool export lives elsewhere

async function getByUser(userId, { unreadOnly = false, limit = 50 } = {}) {
  let query = `SELECT id, title, message, is_read, event_id, link, created_at FROM notifications WHERE user_id = ?`;
  const params = [userId];
  if (unreadOnly) {
    query += ` AND is_read = 0`;
  }
  query += ` ORDER BY created_at DESC LIMIT ?`;
  params.push(limit);
  const [rows] = await pool.query(query, params);
  return rows;
}

async function getUnreadCount(userId) {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS count FROM notifications WHERE user_id = ? AND is_read = 0`,
    [userId]
  );
  return rows[0].count;
}

async function markAsRead(notificationId, userId) {
  const [result] = await pool.query(
    `UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?`,
    [notificationId, userId]
  );
  return result.affectedRows > 0;
}

async function markAllAsRead(userId) {
  const [result] = await pool.query(
    `UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0`,
    [userId]
  );
  return result.affectedRows;
}

/**
 * Bulk-inserts one notification row per user. Title is defensively
 * truncated to 200 chars to match the `title` column's varchar(200) limit —
 * without this, an unusually long event title could throw a DB error and
 * crash the fire-and-forget notification step (and, worse, silently swallow
 * that error, hiding a real bug). Message has no length limit (TEXT column).
 */
async function createForUsers(userIds, { title, message, eventId = null, link = null }) {
  if (!userIds || userIds.length === 0) return 0;
  const safeTitle = String(title).slice(0, 200);
  const safeLink = link ? String(link).slice(0, 255) : (eventId ? `/events/${eventId}` : null);
  const values = userIds.map((userId) => [userId, safeTitle, message, eventId || null, safeLink]);
  const [result] = await pool.query(
    `INSERT INTO notifications (user_id, title, message, event_id, link) VALUES ?`,
    [values]
  );
  return result.affectedRows;
}

async function deleteNotification(notificationId, userId) {
  const [result] = await pool.query(
    `DELETE FROM notifications WHERE id = ? AND user_id = ?`,
    [notificationId, userId]
  );
  return result.affectedRows > 0;
}

async function clearAll(userId) {
  const [result] = await pool.query(
    `DELETE FROM notifications WHERE user_id = ?`,
    [userId]
  );
  return result.affectedRows;
}

async function create(userId, { title, message, eventId = null, link = null }) {
  if (!userId) return 0;
  return createForUsers([userId], { title, message, eventId, link });
}

module.exports = {
  getByUser,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  create,
  createForUsers,
  deleteNotification,
  clearAll,
};
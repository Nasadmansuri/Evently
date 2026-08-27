const pool = require('../../shared/config/db'); // adjust path if your pool export lives elsewhere

async function getByUser(userId, limit = 20) {
  const [rows] = await pool.query(
    `SELECT id, title, message, is_read, created_at
     FROM notifications
     WHERE user_id = ?
     ORDER BY created_at DESC
     LIMIT ?`,
    [userId, limit]
  );
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
async function createForUsers(userIds, { title, message }) {
  if (!userIds || userIds.length === 0) return 0;
  const safeTitle = String(title).slice(0, 200);
  const values = userIds.map((userId) => [userId, safeTitle, message]);
  const [result] = await pool.query(
    `INSERT INTO notifications (user_id, title, message) VALUES ?`,
    [values]
  );
  return result.affectedRows;
}

module.exports = { getByUser, getUnreadCount, markAsRead, markAllAsRead, createForUsers };
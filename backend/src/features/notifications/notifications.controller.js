const notificationsModel = require('./notifications.model');

async function listNotifications(req, res) {
  try {
    const notifications = await notificationsModel.getByUser(req.user.id);
    res.json({ notifications });
  } catch (err) {
    console.error('listNotifications error:', err);
    res.status(500).json({ message: 'Failed to load notifications' });
  }
}

async function unreadCount(req, res) {
  try {
    const count = await notificationsModel.getUnreadCount(req.user.id);
    res.json({ count });
  } catch (err) {
    console.error('unreadCount error:', err);
    res.status(500).json({ message: 'Failed to load unread count' });
  }
}

async function markRead(req, res) {
  try {
    const ok = await notificationsModel.markAsRead(req.params.id, req.user.id);
    if (!ok) return res.status(404).json({ message: 'Notification not found' });
    res.json({ success: true });
  } catch (err) {
    console.error('markRead error:', err);
    res.status(500).json({ message: 'Failed to mark notification as read' });
  }
}

async function markAllRead(req, res) {
  try {
    const updated = await notificationsModel.markAllAsRead(req.user.id);
    res.json({ success: true, updated });
  } catch (err) {
    console.error('markAllRead error:', err);
    res.status(500).json({ message: 'Failed to mark notifications as read' });
  }
}

module.exports = { listNotifications, unreadCount, markRead, markAllRead };
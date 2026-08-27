import api from './api'; // adjust if your axios instance has a different name/path

export const getNotifications = (unreadOnly = true) =>
  api.get('/notifications', { params: { unread_only: unreadOnly } });
export const getUnreadCount = () => api.get('/notifications/unread-count');
export const markNotificationRead = (id) => api.patch(`/notifications/${id}/read`);
export const markAllNotificationsRead = () => api.patch('/notifications/read-all');
export const deleteNotification = (id) => api.delete(`/notifications/${id}`);
export const clearAllNotifications = () => api.delete('/notifications/clear-all');
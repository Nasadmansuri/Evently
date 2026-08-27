const express = require('express');
const router = express.Router();
const controller = require('./notifications.controller');
const { requireAuth } = require('../../shared/middleware/auth.middleware');

router.use(requireAuth);

router.get('/unread-count', controller.unreadCount);
router.patch('/read-all', controller.markAllRead);
router.delete('/clear-all', controller.clearAll);
router.get('/', controller.listNotifications);
router.patch('/:id/read', controller.markRead);
router.delete('/:id', controller.deleteNotification);

module.exports = router;
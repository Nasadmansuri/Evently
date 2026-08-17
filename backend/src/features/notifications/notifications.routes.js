const express = require('express');
const router = express.Router();
const controller = require('./notifications.controller');
const { requireAuth } = require('../../shared/middleware/auth.middleware');

router.use(requireAuth);

router.get('/unread-count', controller.unreadCount);
router.patch('/read-all', controller.markAllRead);
router.get('/', controller.listNotifications);
router.patch('/:id/read', controller.markRead);

module.exports = router;
const express = require('express');
const router = express.Router();
const eventsController = require('./events.controller');
const { requireAuth, requireRole } = require('../../shared/middleware/auth.middleware');

router.get('/', requireAuth, eventsController.getAllEvents);
router.get('/my-events', requireAuth, requireRole('faculty'), eventsController.getMyEvents);
router.get('/my-stats', requireAuth, requireRole('faculty'), eventsController.getMyStats);
router.get('/recommended', requireAuth, requireRole('student'), eventsController.getRecommended);
router.get('/admin/all', requireAuth, requireRole('admin'), eventsController.getAllEventsAdmin);
router.get('/admin/stats', requireAuth, requireRole('admin'), eventsController.getAdminStats);
router.get('/:id', requireAuth, eventsController.getEventById);
router.post('/', requireAuth, requireRole('faculty', 'admin'), eventsController.createEvent);
router.delete('/:id', requireAuth, requireRole('admin', 'faculty'), eventsController.deleteEvent);
router.patch('/:id', requireAuth, requireRole('admin', 'faculty'), eventsController.updateEvent);

module.exports = router;
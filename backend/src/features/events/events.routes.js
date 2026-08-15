const express = require('express');
const router = express.Router();
const eventsController = require('./events.controller');
const { requireAuth, requireRole } = require('../../shared/middleware/auth.middleware');

router.get('/', requireAuth, eventsController.getAllEvents);
router.get('/my-events', requireAuth, requireRole('faculty'), eventsController.getMyEvents);
router.get('/my-stats', requireAuth, requireRole('faculty'), eventsController.getMyStats);
router.get('/:id', requireAuth, eventsController.getEventById);
router.post('/', requireAuth, requireRole('faculty'), eventsController.createEvent);

module.exports = router;
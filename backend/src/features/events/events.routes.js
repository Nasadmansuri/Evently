const express = require('express');
const router = express.Router();
const eventsController = require('./events.controller');
const { requireAuth, optionalAuth, requireRole } = require('../../shared/middleware/auth.middleware');
const upload = require('../../shared/middleware/upload.middleware');

router.get('/', optionalAuth, eventsController.getAllEvents);
router.get('/my-events', requireAuth, requireRole('faculty'), eventsController.getMyEvents);
router.get('/my-stats', requireAuth, requireRole('faculty'), eventsController.getMyStats);
router.get('/recommended', requireAuth, requireRole('student'), eventsController.getRecommended);
router.get('/admin/all', requireAuth, requireRole('admin'), eventsController.getAllEventsAdmin);
router.get('/admin/stats', requireAuth, requireRole('admin'), eventsController.getAdminStats);
router.get('/gallery-summary', optionalAuth, eventsController.getGallerySummary);
router.get('/deletion-requests/all', requireAuth, requireRole('admin'), eventsController.getDeletionRequests);
router.patch('/deletion-requests/:requestId', requireAuth, requireRole('admin'), eventsController.resolveDeletionRequest);
router.get('/:id', optionalAuth, eventsController.getEventById);
router.post('/:id/deletion-request', requireAuth, requireRole('faculty', 'admin'), eventsController.createDeletionRequest);
router.post('/', requireAuth, requireRole('faculty', 'admin'), eventsController.createEvent);
router.delete('/:id', requireAuth, requireRole('admin', 'faculty'), eventsController.deleteEvent);
router.patch('/:id', requireAuth, requireRole('admin', 'faculty'), eventsController.updateEvent);
router.get('/:id/images', optionalAuth, eventsController.getEventImages);
router.post('/:id/images', requireAuth, requireRole('admin', 'faculty'), upload.array('images', 10), eventsController.uploadEventImages);
router.delete('/:id/images/:imageId', requireAuth, requireRole('admin', 'faculty'), eventsController.deleteEventImage);
router.patch('/:id/images/:imageId/banner', requireAuth, requireRole('admin', 'faculty'), eventsController.setBannerImage);
router.get('/:id/report', requireAuth, requireRole('admin', 'faculty'), eventsController.generateReport);

module.exports = router;
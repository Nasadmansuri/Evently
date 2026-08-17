const express = require('express');
const router = express.Router();
const controller = require('./feedback.controller');
const { requireAuth, requireRole } = require('../../shared/middleware/auth.middleware');

router.post('/forms', requireAuth, requireRole('faculty'), controller.createForm);
router.get('/forms/event/:eventId', requireAuth, controller.getFormByEvent);
router.post('/responses', requireAuth, requireRole('student'), controller.submitResponse);

module.exports = router;
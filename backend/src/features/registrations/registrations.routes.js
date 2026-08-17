const express = require('express');
const router = express.Router();
const registrationsController = require('./registrations.controller');
const { requireAuth, requireRole } = require('../../shared/middleware/auth.middleware');

router.get('/my', requireAuth, requireRole('student'), registrationsController.getMyRegistrations);
router.post('/', requireAuth, requireRole('student'), registrationsController.register);

module.exports = router;
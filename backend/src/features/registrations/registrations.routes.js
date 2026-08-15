const express = require('express');
const router = express.Router();
const registrationsController = require('./registrations.controller');
const { requireAuth, requireRole } = require('../../shared/middleware/auth.middleware');

router.post('/', requireAuth, requireRole('student'), registrationsController.register);

module.exports = router;
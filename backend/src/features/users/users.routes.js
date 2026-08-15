const express = require('express');
const router = express.Router();
const usersController = require('./users.controller');
const { requireAuth, requireRole } = require('../../shared/middleware/auth.middleware');

router.get('/me', requireAuth, usersController.getMe);
router.get('/pending-faculty', requireAuth, requireRole('admin'), usersController.getPendingFaculty);
router.patch('/:id/approval', requireAuth, requireRole('admin'), usersController.updateApproval);

module.exports = router;
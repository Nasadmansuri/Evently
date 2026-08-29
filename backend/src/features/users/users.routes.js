const express = require('express');
const router = express.Router();
const usersController = require('./users.controller');
const { requireAuth, requireRole } = require('../../shared/middleware/auth.middleware');

router.get('/me', requireAuth, usersController.getMe);
router.put('/me', requireAuth, usersController.updateMe);
router.get('/pending-faculty', requireAuth, requireRole('admin'), usersController.getPendingFaculty);
router.patch('/:id/approval', requireAuth, requireRole('admin'), usersController.updateApproval);
router.patch('/:id/status', requireAuth, requireRole('admin'), usersController.updateUserStatus);
router.get('/', requireAuth, requireRole('admin'), usersController.getAllUsers);
router.get('/:id/activity', requireAuth, requireRole('admin'), usersController.getUserActivity);
router.delete('/:id', requireAuth, requireRole('admin'), usersController.deleteUser);

module.exports = router;
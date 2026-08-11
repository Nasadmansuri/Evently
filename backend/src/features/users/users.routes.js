const express = require('express');
const router = express.Router();
const usersController = require('./users.controller');
const { requireAuth } = require('../../shared/middleware/auth.middleware');

router.get('/me', requireAuth, usersController.getMe);

module.exports = router;
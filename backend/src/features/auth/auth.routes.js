const express = require('express');
const router = express.Router();
const authController = require('./auth.controller');

router.post('/login', authController.login);
router.post('/signup/send-otp', authController.sendSignupOtp);
router.post('/signup/student', authController.signupStudent);
router.post('/signup/faculty', authController.signupFaculty);
router.post('/google', authController.googleLogin);
router.post('/google/complete-profile', authController.completeGoogleSignup);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

module.exports = router;
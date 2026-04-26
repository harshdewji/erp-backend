const express = require('express');
const router  = express.Router();
const { registerUser, loginUser } = require('../controllers/authController');
const { sendForgotOTP, verifyOTP, resetPassword } = require('../controllers/forgotPasswordController');

router.post('/register',        registerUser);
router.post('/login',           loginUser);
router.post('/forgot-password', sendForgotOTP);
router.post('/verify-otp',      verifyOTP);
router.post('/reset-password',  resetPassword);

module.exports = router;

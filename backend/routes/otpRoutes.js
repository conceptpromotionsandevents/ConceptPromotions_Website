import express from 'express';
import { sendOTP, verifyOTP, resendOTP } from '../controllers/otpController.js';

const router = express.Router();

// @route   POST /api/otp/send
// @desc    Send OTP to phone number
// @access  Public
router.post('/send', sendOTP);

// @route   POST /api/otp/verify
// @desc    Verify OTP
// @access  Public
router.post('/verify', verifyOTP);

// @route   POST /api/otp/resend
// @desc    Resend OTP
// @access  Public
router.post('/resend', resendOTP);

export default router;

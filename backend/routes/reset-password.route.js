import express from "express";
import {
    initiatePasswordReset,
    resetPassword,
} from "../controllers/reset-password.controller.js";

const router = express.Router();

// @route   POST /api/password-reset/initiate
// @desc    Verify phone number is registered and prepare for password reset
// @access  Public
router.post("/initiate", initiatePasswordReset);

// @route   POST /api/password-reset/reset
// @desc    Verify OTP and reset password
// @access  Public
router.post("/reset", resetPassword);

export default router;

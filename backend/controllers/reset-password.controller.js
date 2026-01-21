import { Retailer } from "../models/retailer.model.js";
import { Employee, ClientAdmin } from "../models/user.js";
import { otpStore } from "../utils/sms/otpStore.js";

// Helper function to find user across all models
const findUserByPhone = async (cleanPhone) => {
    // Try to find in Retailer
    let user = await Retailer.findOne({ contactNo: cleanPhone });
    if (user) return { user, userType: "retailer" };

    // Try to find in Employee
    user = await Employee.findOne({ phone: cleanPhone });
    if (user) return { user, userType: "employee" };

    // Try to find in ClientAdmin
    user = await ClientAdmin.findOne({ contactNo: cleanPhone });
    if (user) return { user, userType: "client" };

    return { user: null, userType: null };
};

// Step 1: Initiate password reset (send OTP)
export const initiatePasswordReset = async (req, res) => {
    try {
        const { phone } = req.body;
        console.log("📞 Received phone:", phone);

        const cleanPhone = phone?.toString().trim().replace(/\D/g, "");
        console.log("🧹 Cleaned phone:", cleanPhone);

        if (!cleanPhone || cleanPhone.length !== 10) {
            return res.status(400).json({
                success: false,
                message: "Please provide a valid 10-digit phone number",
            });
        }

        // Search across all user types
        const { user, userType } = await findUserByPhone(cleanPhone);

        if (!user) {
            console.log("🔍 Phone not found in any collection");
            return res.status(404).json({
                success: false,
                message:
                    "Phone number not registered. Please check and try again.",
            });
        }

        console.log(`✅ User found: ${user.name} (Type: ${userType})`);

        // Mark this OTP as password reset type
        if (otpStore.setResetFlag) {
            otpStore.setResetFlag(cleanPhone, true);
        }

        // Store user type for the reset step
        const existingOTPData = otpStore.get(cleanPhone);
        if (existingOTPData) {
            existingOTPData.userType = userType;
        }

        res.status(200).json({
            success: true,
            message: "Phone number verified. Please request OTP to proceed.",
            phoneExists: true,
            userType: userType, // Return user type for frontend reference
        });
    } catch (error) {
        console.error("Password Reset Initiation Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to initiate password reset",
            error: error.message,
        });
    }
};

// Step 2: Verify OTP and reset password
export const resetPassword = async (req, res) => {
    console.log("✅ resetPassword controller called");

    try {
        const { phone, otp, newPassword } = req.body;

        const cleanPhone = phone?.toString().trim().replace(/\D/g, "");

        if (!cleanPhone || cleanPhone.length !== 10) {
            return res.status(400).json({
                success: false,
                message: "Invalid phone number",
            });
        }

        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters long",
            });
        }

        if (!otp || otp.length !== 6) {
            return res.status(400).json({
                success: false,
                message: "Invalid OTP format",
            });
        }

        // Verify OTP
        const storedData = otpStore.get(cleanPhone);

        if (!storedData) {
            return res.status(404).json({
                success: false,
                message: "OTP not found. Please request a new one.",
            });
        }

        if (otpStore.isExpired(cleanPhone)) {
            otpStore.delete(cleanPhone);
            return res.status(410).json({
                success: false,
                message: "OTP expired. Please request a new one.",
            });
        }

        if (storedData.attempts >= 5) {
            otpStore.delete(cleanPhone);
            return res.status(429).json({
                success: false,
                message: "Maximum verification attempts exceeded",
            });
        }

        if (storedData.otp !== otp) {
            otpStore.incrementAttempts(cleanPhone);
            return res.status(401).json({
                success: false,
                message: "Invalid OTP",
            });
        }

        // Find user across all models
        const { user, userType } = await findUserByPhone(cleanPhone);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        console.log(`🔄 Resetting password for ${userType}: ${user.name}`);

        // Update password based on user type
        // All schemas have password field and pre-save hooks for hashing
        user.password = newPassword;

        // For employees, reset first login flag since they're setting a new password
        if (userType === "employee" && user.isFirstLogin !== undefined) {
            user.isFirstLogin = false;
        }

        await user.save();

        // Delete OTP
        otpStore.delete(cleanPhone);

        console.log(`✅ Password reset successful for ${userType}`);

        res.status(200).json({
            success: true,
            message: "Password reset successfully",
            userType: userType,
        });
    } catch (error) {
        console.error("Password Reset Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to reset password",
            error: error.message,
        });
    }
};

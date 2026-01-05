// admin/auth.controller.js
import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import { Admin, ClientAdmin } from "../../models/user.js";

// ====== ADMIN LOGIN ======
export const loginAdmin = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password)
            return res
                .status(400)
                .json({ message: "Email and password required" });

        const admin = await Admin.findOne({ email });
        if (!admin) return res.status(404).json({ message: "Admin not found" });

        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch)
            return res.status(401).json({ message: "Invalid credentials" });

        const token = jwt.sign(
            { id: admin._id, email: admin.email, role: "admin" },
            process.env.JWT_SECRET || "supremeSecretKey",
            { expiresIn: "1d" }
        );

        res.status(200).json({
            message: "Admin login successful",
            token,
            admin: { id: admin._id, name: admin.name, email: admin.email },
        });
    } catch (error) {
        console.error("Admin login error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// ====== CLIENT ADMIN LOGIN ======
export const loginClientAdmin = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password)
            return res
                .status(400)
                .json({ message: "Email and password required" });

        const clientAdmin = await ClientAdmin.findOne({ email });
        if (!clientAdmin)
            return res.status(404).json({ message: "Client admin not found" });

        const isMatch = await bcrypt.compare(password, clientAdmin.password);
        if (!isMatch)
            return res.status(401).json({ message: "Invalid credentials" });

        const token = jwt.sign(
            {
                id: clientAdmin._id,
                email: clientAdmin.email,
                role: "client-admin",
            },
            process.env.JWT_SECRET || "supremeSecretKey",
            { expiresIn: "1d" }
        );

        res.status(200).json({
            message: "Client admin login successful",
            token,
            clientAdmin: {
                id: clientAdmin._id,
                name: clientAdmin.name,
                email: clientAdmin.email,
                organizationName: clientAdmin.organizationName,
            },
        });
    } catch (error) {
        console.error("Client admin login error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// ====== FORGOT PASSWORD ======
export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email)
            return res.status(400).json({ message: "Email is required" });

        const admin = await Admin.findOne({ email });
        if (!admin) return res.status(404).json({ message: "Admin not found" });

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Hash OTP before saving
        const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");

        admin.resetPasswordToken = hashedOtp;
        admin.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // valid for 10 minutes
        await admin.save();

        // Email setup (Gmail)
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        // Email content
        const mailOptions = {
            from: `"Supreme Admin Support" <${process.env.EMAIL_USER}>`,
            to: admin.email,
            subject: "Your OTP for Password Reset",
            html: `
        <p>Hi ${admin.name || "Admin"},</p>
        <p>Your OTP for password reset is:</p>
        <h2>${otp}</h2>
        <p>This OTP is valid for 10 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `,
        };

        await transporter.sendMail(mailOptions);

        res.status(200).json({
            message: "OTP sent successfully to registered email",
        });
    } catch (error) {
        console.error("Forgot password error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// ====== RESET PASSWORD ======
export const resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;

        if (!email || !otp || !newPassword)
            return res
                .status(400)
                .json({ message: "Email, OTP, and new password are required" });

        const admin = await Admin.findOne({ email });
        if (!admin) return res.status(404).json({ message: "Admin not found" });

        // Hash the provided OTP to compare
        const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");

        if (
            admin.resetPasswordToken !== hashedOtp ||
            admin.resetPasswordExpires < Date.now()
        ) {
            return res.status(400).json({ message: "Invalid or expired OTP" });
        }

        // Update password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        admin.password = hashedPassword;

        // Clear OTP fields
        admin.resetPasswordToken = undefined;
        admin.resetPasswordExpires = undefined;

        await admin.save();

        res.status(200).json({ message: "Password reset successfully" });
    } catch (error) {
        console.error("Reset password error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

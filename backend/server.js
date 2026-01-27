import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";

import adminRoutes from "./routes/adminRoutes.js";
import careerRoutes from "./routes/careerRoutes.js"; // ✅ added
import clientRoutes from "./routes/clientRoutes.js";
import contactRoutes from "./routes/contactUsRoutes.js";
import employeeRoutes from "./routes/employeeRoutes.js";
import otpRoutes from "./routes/otpRoutes.js";
import paymentRoutes from "./routes/payment.route.js";
import reportRoutes from "./routes/report.route.js";
import passwordReset from "./routes/reset-password.route.js";
import retailerRoutes from "./routes/retailerRoutes.js";
import tdsCertificateRoutes from "./routes/tdsCertificateRoutes.js";
import tdsRoutes from "./routes/tds.route.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ===== MongoDB Connection =====
const connectDB = async () => {
    try {
        let db = process.env.MONGO_URI;
        await mongoose.connect(db);
        console.log("✅ MongoDB connected successfully");
    } catch (err) {
        console.error("❌ DB connection error:", err.message);
        process.exit(1);
    }
};

connectDB();

// ===== Middleware =====
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ===== Routes =====
app.use("/api/admin", adminRoutes);
app.use("/api/retailer", retailerRoutes);
app.use("/api/employee", employeeRoutes);
app.use("/api/client", clientRoutes);
app.use("/api/career", careerRoutes); // ✅ Career API
app.use("/api/contact", contactRoutes);
app.use("/api/budgets", paymentRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/tds-certificates", tdsCertificateRoutes);
app.use("/api/otp", otpRoutes);
app.use("/api/password-reset", passwordReset);
app.use("/api/tds", tdsRoutes);
console.log("✅ Password reset routes registered at /api/password-reset");

// ===== Health Check =====
app.get("/", (req, res) => {
    res.status(200).send("Supreme Backend API is running");
});

app.get("/api/ci-cd", (req, res) => {
    res.json({
        status: "ok",
        version: "CI_TEST_001",
        time: new Date().toISOString(),
    });
});

// ===== Global Error Handler =====
app.use((err, req, res, next) => {
    console.error("Global error:", err);
    res.status(500).json({
        message: "Internal Server Error",
        error: err.message,
    });
});

// ===== Start Server =====
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

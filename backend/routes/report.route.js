// routes/report.routes.js
import express from "express";
import {
    createReport,
    getAllReports,
    getReportById,
    updateReport,
    deleteReport,
    getReportsByCampaign,
    getReportsByEmployee,
    getReportsByRetailer,
    getAllClientReports,
} from "../controllers/report.controller.js";
import { protect } from "../middleware/authMiddleware.js";
import { upload } from "../middleware/upload.js";

const router = express.Router();

/* ===============================
   PUBLIC/AUTHENTICATED ROUTES
=============================== */

// Create new report (Employee, Retailer, or Admin)
router.post(
    "/create",
    protect,
    upload.fields([
        { name: "shopDisplayImages", maxCount: 20 },
        { name: "billCopies", maxCount: 20 },
        { name: "files", maxCount: 20 },
    ]),
    createReport
);

// Get all reports with filters (Admin view)
router.get("/all", protect, getAllReports);

// Get client all reports
router.get("/client-reports", protect, getAllClientReports);

// Get single report by ID
router.get("/:id", protect, getReportById);

/* ===============================
   ADMIN ONLY ROUTES
=============================== */

// Update any report (Admin only)
router.put(
    "/update/:id",
    protect,
    upload.fields([
        { name: "shopDisplayImages", maxCount: 20 },
        { name: "billCopies", maxCount: 20 },
        { name: "files", maxCount: 20 },
    ]),
    updateReport
);

// Delete any report (Admin only)
router.delete("/delete/:id", protect, deleteReport);

/* ===============================
   FILTERED QUERY ROUTES
=============================== */

// Get all reports for a specific campaign
router.get("/campaign/:campaignId", protect, getReportsByCampaign);

// Get all reports submitted by a specific employee
router.get("/employee/:employeeId", protect, getReportsByEmployee);

// Get all reports for a specific retailer
router.get("/retailer/:retailerId", protect, getReportsByRetailer);

export default router;

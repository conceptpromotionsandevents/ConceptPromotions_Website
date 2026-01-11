// routes/report.routes.js
import express from "express";
import multer from "multer";
import {
    createReport,
    createReportWithGeotags,
    deleteReport,
    getAllClientReports,
    getAllReports,
    getReportById,
    getReportsByCampaign,
    getReportsByEmployee,
    getReportsByRetailer,
    getSpecificReportsByRetailer,
    streamReportPdf,
    updateReport,
} from "../controllers/report.controller.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

/* ===============================
   MULTER CONFIGURATION FOR CLOUDINARY
=============================== */
const storage = multer.memoryStorage(); // ✅ Stores files in memory as Buffer

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB per file
        files: 20, // Max 20 files total
    },
    fileFilter: (req, file, cb) => {
        // Accept images and documents
        const allowedTypes = [
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/gif",
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        ];

        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(
                new Error(
                    "Invalid file type. Only images and documents are allowed."
                )
            );
        }
    },
});

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

// create with geo tags
router.post(
    "/create-geo",
    protect,
    upload.fields([
        { name: "shopDisplayImages", maxCount: 20 },
        { name: "billCopies", maxCount: 20 },
        { name: "files", maxCount: 20 },
    ]),
    createReportWithGeotags
);

router.get("/:id/pdf", streamReportPdf);
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

// Get non N/A reports by retailer
router.get(
    "/retailer-reports/:retailerId",
    protect,
    getSpecificReportsByRetailer
);

export default router;

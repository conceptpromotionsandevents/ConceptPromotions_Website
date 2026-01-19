// routes/tdsCertificateRoutes.js
import express from "express";
import {
    uploadTDSCertificate,
    getRetailerCertificates,
    getAllCertificates,
    getCertificateById,
    updateCertificate,
    deleteCertificate,
    getMyTDSCertificates,
} from "../controllers/tdsCertificate.controller.js";
import multer from "multer";
import { protect } from "../middleware/authMiddleware.js";

const upload = multer({ storage: multer.memoryStorage() });
const router = express.Router();

// Apply authentication middleware to all routes
router.use(protect);

// ========================================
// TDS CERTIFICATE ROUTES
// ========================================

// Admin routes
router.post("/upload", upload.single("certificate"), uploadTDSCertificate);
router.get("/all", getAllCertificates);
router.put("/:certificateId", upload.single("certificate"), updateCertificate);
router.delete("/:certificateId", deleteCertificate);

// Retailer routes
router.get("/my-certificates", getMyTDSCertificates);

// Shared routes (admin can view any, retailer can view own)
router.get("/retailer/:retailerId", getRetailerCertificates);
router.get("/:certificateId", getCertificateById);

export default router;

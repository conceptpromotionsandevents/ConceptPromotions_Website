import express from "express";
import {
    sendOtp,
    verifyOtp,
    registerRetailer,
    loginRetailer,
    getRetailerProfile,
    getRetailerCampaigns,
    updateCampaignStatus,
    updateRetailer,
    submitRetailerReport,
    getRetailerReports,
    viewBillCopy,
    viewReportImage,
    getRetailerImageStatus,
    getRetailerImage,
    getRetailerCampaignStatus,
    getRetailersByCampaign,
} from "../controllers/retailerController.js";
import multer from "multer";
import { protect } from "../middleware/authMiddleware.js"; // JWT middleware

const storage = multer.memoryStorage();
const upload = multer({ storage });

const uploadFiles = upload.fields([
    { name: "govtIdPhoto", maxCount: 1 },
    { name: "personPhoto", maxCount: 1 },
    { name: "outletPhoto", maxCount: 1 },
    { name: "registrationFormFile", maxCount: 1 },
]);

const router = express.Router();

// -------------------------------
// AUTH
router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);
router.post("/register", uploadFiles, registerRetailer);
router.post("/login", loginRetailer);

// -------------------------------
// PROTECTED ROUTES
router.get("/retailer/me", protect, getRetailerProfile);

// Fetch only campaigns assigned to this retailer
router.get("/campaigns", protect, getRetailerCampaigns);

//  Retailer accepts or rejects a campaign
router.put("/campaigns/:campaignId/status", protect, updateCampaignStatus);
router.get("/campaigns/:campaignId/status", protect, getRetailerCampaignStatus);

router.get("/retailers", protect, getRetailersByCampaign);

router.patch(
    "/me",
    protect,
    upload.fields([
        { name: "govtIdPhoto", maxCount: 1 },
        { name: "personPhoto", maxCount: 1 },
        { name: "registrationFormFile", maxCount: 1 },
        { name: "outletPhoto", maxCount: 1 },
    ]),
    updateRetailer
);
router.post(
    "/retailer/report/submit",
    protect, // Retailer auth
    upload.fields([
        { name: "images", maxCount: 10 },
        { name: "billCopy", maxCount: 1 }, // OPTIONAL if you also want bill copy
    ]),
    submitRetailerReport
);

router.get("/retailer/reports", protect, getRetailerReports);
router.get("/reports/:reportId/images/:imageIndex", protect, viewReportImage);

router.get("/reports/:reportId/bill", protect, viewBillCopy);

router.get("/retailer/image-status", protect, getRetailerImageStatus);
router.get("/retailer/image/:imageType", protect, getRetailerImage);

export default router;

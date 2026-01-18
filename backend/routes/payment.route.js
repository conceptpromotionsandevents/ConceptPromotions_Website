// routes/budgetRoutes.js
import express from "express";
import {
    addCampaignTCA,
    addPayment,
    deleteCampaign,
    deletePayment,
    editPayment,
    getAllBudgets,
    getBudgetById,
    getBudgetByRetailerId,
    getPassbookData,
    updateCampaignTCA,
    bulkAddCampaignTCA,
    bulkAddPayments,
    // NEW: TDS Report Functions
    getRetailerTDSReport,
    getAllRetailersTDSSummary,
} from "../controllers/payment.controller.js";
import multer from "multer";
import { protect } from "../middleware/authMiddleware.js";

const upload = multer({ storage: multer.memoryStorage() });
const router = express.Router();

// Apply authentication middleware to all routes
router.use(protect);

// ========================================
// GET ROUTES
// ========================================
router.get("/", getAllBudgets);

// ✅ MOVE SPECIFIC ROUTES BEFORE DYNAMIC ROUTES
router.get("/passbook", getPassbookData);

// NEW: TDS Report Routes
router.get("/tds/summary", getAllRetailersTDSSummary);
router.get("/tds/retailer/:retailerId", getRetailerTDSReport);

// Specific routes
router.get("/retailer/:retailerId", getBudgetByRetailerId);

// ✅ Dynamic routes should come LAST
router.get("/:budgetId", getBudgetById);

// ========================================
// POST ROUTES
// ========================================
router.post("/set-campaign-tca", addCampaignTCA);
router.post("/add-payment", addPayment);

// Bulk operations
router.post("/campaign-tca/bulk", upload.single("file"), bulkAddCampaignTCA);
router.post("/payments/bulk", upload.single("file"), bulkAddPayments);

// ========================================
// PUT/PATCH ROUTES
// ========================================
router.put("/:budgetId/campaign/:campaignId/installment/:installmentId", editPayment);
router.patch("/:budgetId/campaign/:campaignId/tca", updateCampaignTCA);

// ========================================
// DELETE ROUTES
// ========================================
router.delete("/:budgetId/campaign/:campaignId/installment/:installmentId", deletePayment);
router.delete("/:budgetId/campaign/:campaignId", deleteCampaign);

export default router;

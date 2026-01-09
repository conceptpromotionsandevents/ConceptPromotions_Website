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
    bulkAddPayments
} from "../controllers/payment.controller.js";
import multer from "multer";

import { protect } from "../middleware/authMiddleware.js";
const upload = multer({ storage: multer.memoryStorage() });
const router = express.Router();

// Apply authentication middleware to all routes
router.use(protect);

// GET routes
router.get("/", getAllBudgets);

// ✅ MOVE PASSBOOK ROUTE BEFORE DYNAMIC ROUTES
router.get("/passbook", getPassbookData);

// ✅ Keep specific routes BEFORE dynamic parameter routes
router.get("/retailer/:retailerId", getBudgetByRetailerId);

// ✅ Dynamic routes should come LAST
router.get("/:budgetId", getBudgetById);

// POST routes
router.post("/set-campaign-tca", addCampaignTCA);
router.post("/add-payment", addPayment);

// PUT/PATCH routes
router.put(
    "/:budgetId/campaign/:campaignId/installment/:installmentId",
    editPayment
);
router.patch("/:budgetId/campaign/:campaignId/tca", updateCampaignTCA);

// DELETE routes
router.delete(
    "/:budgetId/campaign/:campaignId/installment/:installmentId",
    deletePayment
);
router.delete("/:budgetId/campaign/:campaignId", deleteCampaign);
router.post(
    "/campaign-tca/bulk",
    protect,
    upload.single("file"),
    bulkAddCampaignTCA
);
router.post(
    "/payments/bulk",
    protect,
    upload.single("file"),
    bulkAddPayments
);


export default router;

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
} from "../controllers/payment.controller.js";
import { protect } from "../middleware/authMiddleware.js";

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

export default router;

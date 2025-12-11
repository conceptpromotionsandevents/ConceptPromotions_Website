// routes/budgetRoutes.js
import express from "express";
import {
    getAllBudgets,
    getBudgetById,
    getBudgetByRetailerId,
    addPayment,
    editPayment,
    deletePayment,
    updateCampaignTCA,
    deleteCampaign,
    getPaymentStatistics,
} from "../controllers/payment.controller.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Apply authentication middleware to all routes
router.use(protect);

// GET routes
router.get("/", getAllBudgets);
router.get("/statistics", getPaymentStatistics);
router.get("/:budgetId", getBudgetById);
router.get("/retailer/:retailerId", getBudgetByRetailerId);

// POST routes
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

import express from "express";
import { protect } from "../controllers/adminController.js";
import {
    createPaymentTransaction,
    getAllPaymentTransactions,
    getPaymentTransactionById,
    updatePaymentTransaction,
    deletePaymentTransaction,
    getCampaignPaymentSummary,
} from "../controllers/payment.controller.js";

const router = express.Router();

// Create payment
router.post("/", protect, createPaymentTransaction);

// Get all payments (with filters)
router.get("/", protect, getAllPaymentTransactions);

// Get single payment by ID
router.get("/:id", protect, getPaymentTransactionById);

// Update payment
router.put("/:id", protect, updatePaymentTransaction);

// Delete payment (soft delete)
router.delete("/:id", protect, deletePaymentTransaction);

// Get payment summary for a campaign
router.get("/campaign/:campaignId/summary", protect, getCampaignPaymentSummary);

export default router;

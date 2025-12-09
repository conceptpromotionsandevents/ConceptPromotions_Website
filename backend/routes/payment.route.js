import express from "express";
import { protect } from "../controllers/adminController.js";
import {
    createPaymentTransaction,
    deletePaymentTransaction,
    getAllPaymentTransactions,
    getPaymentTransactionById,
    updatePaymentTransaction,
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

export default router;

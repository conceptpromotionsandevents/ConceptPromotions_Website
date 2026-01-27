// routes/tds.routes.js
import express from "express";
import {
    getAllTdsByRetailerId,
    getAllTdsRecords,
    getCurrentFinancialYear,
    getRetailersNearThreshold,
    getTdsById,
    getTdsByRetailerId,
    getTdsSummaryByFY,
    recalculateTds,
    updateTdsRate,
} from "../controllers/tds.controller.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

// These are admin-only analytics routes
router.get("/", verifyToken, getAllTdsRecords);
router.get("/current-fy", getCurrentFinancialYear);
router.get("/summary/:financialYear", verifyToken, getTdsSummaryByFY);
router.get("/near-threshold", verifyToken, getRetailersNearThreshold);
router.get("/:tdsId", verifyToken, getTdsById);
router.get("/retailer/:retailerId", verifyToken, getTdsByRetailerId);
router.get("/retailer/:retailerId/all", verifyToken, getAllTdsByRetailerId);
router.post("/recalculate/:retailerId", verifyToken, recalculateTds);
router.put("/update-rate/:retailerId", verifyToken, updateTdsRate);

export default router;

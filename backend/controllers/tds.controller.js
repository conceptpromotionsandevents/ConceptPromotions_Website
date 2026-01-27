// controllers/tds.controller.js
import mongoose from "mongoose";
import { TDSRecord, getFiscalYear } from "../models/tds.model.js";
import { Retailer } from "../models/retailer.model.js";
import { RetailerBudget } from "../models/payments.model.js";

// ✅ GET ALL TDS RECORDS with optional filters
export const getAllTdsRecords = async (req, res) => {
    try {
        const { financialYear, retailerId, state, isActive } = req.query;

        const filter = {};
        if (financialYear) filter.financialYear = financialYear;
        if (retailerId) filter.retailerId = retailerId;
        if (isActive !== undefined) filter.isActive = isActive === "true";

        const tdsRecords = await TDSRecord.find(filter)
            .populate({
                path: "retailerDetails",
                select: "name uniqueId contactNo shopDetails bankDetails",
            })
            .populate("individualTds.campaignId", "name client")
            .populate("cumulativeTds.campaignsIncluded.campaignId", "name")
            .sort({ createdAt: -1 });

        // Filter by state if provided (from populated retailer data)
        let filteredRecords = tdsRecords;
        if (state) {
            filteredRecords = tdsRecords.filter(
                (record) =>
                    record.retailerDetails?.shopDetails?.shopAddress?.state ===
                    state,
            );
        }

        // Calculate aggregate statistics
        const stats = {
            totalRecords: filteredRecords.length,
            totalTdsAmount: filteredRecords.reduce(
                (sum, r) => sum + r.totalTdsAmount,
                0,
            ),
            totalIndividualTds: filteredRecords.reduce(
                (sum, r) => sum + r.totalIndividualTdsAmount,
                0,
            ),
            totalCumulativeTds: filteredRecords.reduce(
                (sum, r) => sum + r.totalCumulativeTdsAmount,
                0,
            ),
            retailersWithCumulativeTds: filteredRecords.filter(
                (r) => r.cumulativeThresholdCrossed,
            ).length,
        };

        res.status(200).json({
            success: true,
            count: filteredRecords.length,
            stats,
            tdsRecords: filteredRecords,
        });
    } catch (error) {
        console.error("Error fetching TDS records:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch TDS records",
            error: error.message,
        });
    }
};

// ✅ GET TDS RECORD BY RETAILER ID (for specific FY or current FY)
export const getTdsByRetailerId = async (req, res) => {
    try {
        const { retailerId } = req.params;
        const { financialYear } = req.query;

        if (!mongoose.Types.ObjectId.isValid(retailerId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid retailer ID",
            });
        }

        const fy = financialYear || getFiscalYear();

        const tdsRecord = await TDSRecord.findOne({
            retailerId,
            financialYear: fy,
        })
            .populate({
                path: "retailerDetails",
                select: "name uniqueId contactNo shopDetails bankDetails",
            })
            .populate("individualTds.campaignId", "name client")
            .populate("cumulativeTds.campaignsIncluded.campaignId", "name");

        if (!tdsRecord) {
            return res.status(404).json({
                success: false,
                message: `No TDS record found for retailer in FY ${fy}`,
            });
        }

        res.status(200).json({
            success: true,
            tdsRecord,
        });
    } catch (error) {
        console.error("Error fetching TDS record:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch TDS record",
            error: error.message,
        });
    }
};

// ✅ GET ALL TDS RECORDS FOR A RETAILER (across all FYs)
export const getAllTdsByRetailerId = async (req, res) => {
    try {
        const { retailerId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(retailerId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid retailer ID",
            });
        }

        const tdsRecords = await TDSRecord.find({ retailerId })
            .populate({
                path: "retailerDetails",
                select: "name uniqueId contactNo shopDetails bankDetails",
            })
            .populate("individualTds.campaignId", "name client")
            .populate("cumulativeTds.campaignsIncluded.campaignId", "name")
            .sort({ financialYear: -1 });

        if (!tdsRecords || tdsRecords.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No TDS records found for this retailer",
            });
        }

        const summary = {
            totalFYs: tdsRecords.length,
            totalTdsAllTime: tdsRecords.reduce(
                (sum, r) => sum + r.totalTdsAmount,
                0,
            ),
            financialYears: tdsRecords.map((r) => r.financialYear),
        };

        res.status(200).json({
            success: true,
            summary,
            tdsRecords,
        });
    } catch (error) {
        console.error("Error fetching TDS records:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch TDS records",
            error: error.message,
        });
    }
};

// ✅ GET TDS RECORD BY ID
export const getTdsById = async (req, res) => {
    try {
        const { tdsId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(tdsId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid TDS record ID",
            });
        }

        const tdsRecord = await TDSRecord.findById(tdsId)
            .populate({
                path: "retailerDetails",
                select: "name uniqueId contactNo shopDetails bankDetails",
            })
            .populate("individualTds.campaignId", "name client")
            .populate("cumulativeTds.campaignsIncluded.campaignId", "name");

        if (!tdsRecord) {
            return res.status(404).json({
                success: false,
                message: "TDS record not found",
            });
        }

        res.status(200).json({
            success: true,
            tdsRecord,
        });
    } catch (error) {
        console.error("Error fetching TDS record:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch TDS record",
            error: error.message,
        });
    }
};

// ✅ MANUALLY TRIGGER TDS RECALCULATION for a retailer
export const recalculateTds = async (req, res) => {
    try {
        const { retailerId } = req.params;
        const { financialYear } = req.body;

        if (!mongoose.Types.ObjectId.isValid(retailerId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid retailer ID",
            });
        }

        const fy = financialYear || getFiscalYear();

        // Fetch retailer
        const retailer = await Retailer.findById(retailerId);
        if (!retailer) {
            return res.status(404).json({
                success: false,
                message: "Retailer not found",
            });
        }

        // Fetch retailer budget
        const budget = await RetailerBudget.findOne({ retailerId });
        if (!budget) {
            return res.status(404).json({
                success: false,
                message: "No budget found for this retailer",
            });
        }

        // Get or create TDS record
        const tdsRecord = await TDSRecord.getOrCreateTdsRecord(
            retailerId,
            retailer,
            fy,
        );

        // Prepare campaigns data
        const campaignsData = budget.campaigns.map((c) => ({
            campaignId: c.campaignId,
            campaignName: c.campaignName,
            tca: c.tca,
        }));

        // Recalculate all TDS
        tdsRecord.recalculateAllTds(campaignsData);
        await tdsRecord.save();

        // Populate before sending response
        await tdsRecord.populate([
            {
                path: "retailerDetails",
                select: "name uniqueId contactNo shopDetails bankDetails",
            },
            { path: "individualTds.campaignId", select: "name client" },
            {
                path: "cumulativeTds.campaignsIncluded.campaignId",
                select: "name",
            },
        ]);

        res.status(200).json({
            success: true,
            message: "TDS recalculated successfully",
            tdsRecord,
        });
    } catch (error) {
        console.error("Error recalculating TDS:", error);
        res.status(500).json({
            success: false,
            message: "Failed to recalculate TDS",
            error: error.message,
        });
    }
};

// ✅ GET TDS SUMMARY BY FINANCIAL YEAR
export const getTdsSummaryByFY = async (req, res) => {
    try {
        const { financialYear } = req.params;

        const tdsRecords = await TDSRecord.find({
            financialYear,
            isActive: true,
        }).populate({
            path: "retailerDetails",
            select: "name uniqueId shopDetails.shopAddress.state",
        });

        if (!tdsRecords || tdsRecords.length === 0) {
            return res.status(404).json({
                success: false,
                message: `No TDS records found for FY ${financialYear}`,
            });
        }

        // Group by state
        const stateWiseSummary = {};
        const tdsRateWiseSummary = {
            "1%": { count: 0, totalTds: 0 },
            "2%": { count: 0, totalTds: 0 },
            "20%": { count: 0, totalTds: 0 },
        };

        tdsRecords.forEach((record) => {
            const state =
                record.retailerDetails?.shopDetails?.shopAddress?.state ||
                "Unknown";

            if (!stateWiseSummary[state]) {
                stateWiseSummary[state] = {
                    count: 0,
                    totalTds: 0,
                    totalTCA: 0,
                };
            }

            stateWiseSummary[state].count++;
            stateWiseSummary[state].totalTds += record.totalTdsAmount;
            stateWiseSummary[state].totalTCA += record.totalTCA;

            // TDS rate summary
            const rateKey = `${record.applicableTdsRate}%`;
            if (tdsRateWiseSummary[rateKey]) {
                tdsRateWiseSummary[rateKey].count++;
                tdsRateWiseSummary[rateKey].totalTds += record.totalTdsAmount;
            }
        });

        const summary = {
            financialYear,
            totalRetailers: tdsRecords.length,
            totalTdsAmount: tdsRecords.reduce(
                (sum, r) => sum + r.totalTdsAmount,
                0,
            ),
            totalTCA: tdsRecords.reduce((sum, r) => sum + r.totalTCA, 0),
            retailersWithCumulativeTds: tdsRecords.filter(
                (r) => r.cumulativeThresholdCrossed,
            ).length,
            stateWiseSummary,
            tdsRateWiseSummary,
        };

        res.status(200).json({
            success: true,
            summary,
        });
    } catch (error) {
        console.error("Error fetching TDS summary:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch TDS summary",
            error: error.message,
        });
    }
};

// ✅ GET CURRENT FINANCIAL YEAR
export const getCurrentFinancialYear = async (req, res) => {
    try {
        const currentFY = getFiscalYear();
        const [startYear, endYear] = currentFY.split("-");

        res.status(200).json({
            success: true,
            financialYear: currentFY,
            details: {
                fy: currentFY,
                startDate: `01-04-${startYear}`,
                endDate: `31-03-${endYear}`,
                startYear: parseInt(startYear),
                endYear: parseInt(endYear),
            },
        });
    } catch (error) {
        console.error("Error getting current FY:", error);
        res.status(500).json({
            success: false,
            message: "Failed to get current financial year",
            error: error.message,
        });
    }
};

// ✅ GET RETAILERS APPROACHING 1L THRESHOLD
export const getRetailersNearThreshold = async (req, res) => {
    try {
        const { financialYear, threshold } = req.query;
        const fy = financialYear || getFiscalYear();
        const thresholdAmount = threshold ? parseInt(threshold) : 100000;
        const warningThreshold = thresholdAmount * 0.9; // 90% of threshold

        const tdsRecords = await TDSRecord.find({
            financialYear: fy,
            cumulativeThresholdCrossed: false,
            totalTCA: { $gte: warningThreshold },
        })
            .populate({
                path: "retailerDetails",
                select: "name uniqueId contactNo shopDetails",
            })
            .sort({ totalTCA: -1 });

        const retailersNearThreshold = tdsRecords.map((record) => ({
            retailerId: record.retailerId,
            retailerName: record.retailerDetails?.name,
            outletCode: record.retailerDetails?.uniqueId,
            totalTCA: record.totalTCA,
            peakTotalTCA: record.peakTotalTCA,
            remainingAmount: thresholdAmount - record.totalTCA,
            percentageOfThreshold: (
                (record.totalTCA / thresholdAmount) *
                100
            ).toFixed(2),
            applicableTdsRate: record.applicableTdsRate,
        }));

        res.status(200).json({
            success: true,
            count: retailersNearThreshold.length,
            threshold: thresholdAmount,
            warningThreshold,
            retailers: retailersNearThreshold,
        });
    } catch (error) {
        console.error("Error fetching retailers near threshold:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch retailers near threshold",
            error: error.message,
        });
    }
};

// ✅ UPDATE TDS RATE (for cases where PAN or ownership changes)
export const updateTdsRate = async (req, res) => {
    try {
        const { retailerId } = req.params;
        const { financialYear } = req.body;

        if (!mongoose.Types.ObjectId.isValid(retailerId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid retailer ID",
            });
        }

        const fy = financialYear || getFiscalYear();

        // Fetch retailer with updated details
        const retailer = await Retailer.findById(retailerId);
        if (!retailer) {
            return res.status(404).json({
                success: false,
                message: "Retailer not found",
            });
        }

        // Get TDS record
        const tdsRecord = await TDSRecord.findOne({
            retailerId,
            financialYear: fy,
        });

        if (!tdsRecord) {
            return res.status(404).json({
                success: false,
                message: `No TDS record found for FY ${fy}`,
            });
        }

        // Determine new TDS rate
        const newTdsRate = TDSRecord.determineTdsRate(
            retailer.shopDetails?.ownershipType,
            retailer.shopDetails?.PANCard,
        );

        const oldTdsRate = tdsRecord.applicableTdsRate;

        if (oldTdsRate === newTdsRate) {
            return res.status(200).json({
                success: true,
                message: "TDS rate is already up to date",
                tdsRecord,
            });
        }

        // Update TDS rate
        tdsRecord.applicableTdsRate = newTdsRate;

        // Recalculate all TDS with new rate
        const budget = await RetailerBudget.findOne({ retailerId });
        if (budget) {
            const campaignsData = budget.campaigns.map((c) => ({
                campaignId: c.campaignId,
                campaignName: c.campaignName,
                tca: c.tca,
            }));
            tdsRecord.recalculateAllTds(campaignsData);
        }

        await tdsRecord.save();

        res.status(200).json({
            success: true,
            message: `TDS rate updated from ${oldTdsRate}% to ${newTdsRate}%`,
            tdsRecord,
        });
    } catch (error) {
        console.error("Error updating TDS rate:", error);
        res.status(500).json({
            success: false,
            message: "Failed to update TDS rate",
            error: error.message,
        });
    }
};

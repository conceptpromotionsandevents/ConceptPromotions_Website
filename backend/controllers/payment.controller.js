// controllers/payment.controller.js
import mongoose from "mongoose";
import XLSX from "xlsx";
import { Campaign } from "../models/user.js";
import { Retailer } from "../models/retailer.model.js";
import { RetailerBudget } from "../models/payments.model.js";

// ✅ GET ALL BUDGETS with optional filters (UPDATED WITH TDS STATS)
export const getAllBudgets = async (req, res) => {
    try {
        const { state, retailerId, campaignId, outletCode } = req.query;

        const filter = {};
        if (state) filter.state = state;
        if (retailerId) filter.retailerId = retailerId;
        if (outletCode) filter.outletCode = outletCode;
        if (campaignId) filter["campaigns.campaignId"] = campaignId;

        const budgets = await RetailerBudget.find(filter)
            .populate("retailerId", "name uniqueId shopDetails")
            .populate("campaigns.campaignId", "name client")
            .sort({ createdAt: -1 });

        // Calculate aggregate statistics (UPDATED WITH TDS)
        const stats = {
            totalRetailers: budgets.length,
            totalTAR: budgets.reduce((sum, b) => sum + b.tar, 0),
            totalPaid: budgets.reduce((sum, b) => sum + b.taPaid, 0),
            totalPending: budgets.reduce((sum, b) => sum + b.taPending, 0),
            totalInstallments: budgets.reduce((sum, b) => {
                return (
                    sum +
                    b.campaigns.reduce(
                        (cSum, c) => cSum + c.installments.length,
                        0
                    )
                );
            }, 0),
            // NEW: TDS Stats
            totalTDS: budgets.reduce((sum, b) => sum + (b.fyTotalTDS || 0), 0),
            totalNetPayable: budgets.reduce((sum, b) => sum + (b.fyTotalNetPayable || 0), 0),
        };

        res.status(200).json({
            success: true,
            count: budgets.length,
            stats,
            budgets,
        });
    } catch (error) {
        console.error("Error fetching budgets:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch budgets",
            error: error.message,
        });
    }
};

// ✅ GET SINGLE BUDGET BY ID (NO CHANGES)
export const getBudgetById = async (req, res) => {
    try {
        const { budgetId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(budgetId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid budget ID",
            });
        }

        const budget = await RetailerBudget.findById(budgetId)
            .populate("retailerId", "name uniqueId shopDetails state")
            .populate("campaigns.campaignId", "name client");

        if (!budget) {
            return res.status(404).json({
                success: false,
                message: "Budget not found",
            });
        }

        res.status(200).json({
            success: true,
            budget,
        });
    } catch (error) {
        console.error("Error fetching budget:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch budget",
            error: error.message,
        });
    }
};

// ✅ GET BUDGET BY RETAILER ID (NO CHANGES)
export const getBudgetByRetailerId = async (req, res) => {
    try {
        const { retailerId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(retailerId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid retailer ID",
            });
        }

        const budget = await RetailerBudget.findOne({ retailerId })
            .populate("retailerId", "name uniqueId shopDetails state")
            .populate("campaigns.campaignId", "name client");

        if (!budget) {
            return res.status(404).json({
                success: false,
                message: "No budget found for this retailer",
            });
        }

        res.status(200).json({
            success: true,
            budget,
        });
    } catch (error) {
        console.error("Error fetching retailer budget:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch retailer budget",
            error: error.message,
        });
    }
};

// ✅ ADD CAMPAIGN TCA (TDS CALCULATED AUTOMATICALLY IN SCHEMA)
export const addCampaignTCA = async (req, res) => {
    try {
        const {
            retailerId,
            retailerName,
            state,
            shopName,
            outletCode,
            campaignId,
            campaignName,
            tca,
        } = req.body;

        // Validation
        if (!retailerId || !campaignId || !tca) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields: retailerId, campaignId, tca",
            });
        }

        if (tca <= 0) {
            return res.status(400).json({
                success: false,
                message: "TCA must be greater than 0",
            });
        }

        // Validate ObjectIds
        if (
            !mongoose.Types.ObjectId.isValid(retailerId) ||
            !mongoose.Types.ObjectId.isValid(campaignId)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid retailer ID or campaign ID",
            });
        }

        // Find existing budget or create new
        let budget = await RetailerBudget.findOne({ retailerId });

        if (!budget) {
            // Create new budget entry
            budget = new RetailerBudget({
                retailerId,
                retailerName,
                state,
                shopName,
                outletCode,
                campaigns: [
                    {
                        campaignId,
                        campaignName,
                        tca: parseFloat(tca),
                        installments: [],
                    },
                ],
            });
        } else {
            // Check if campaign already exists
            const campaignExists = budget.campaigns.some(
                (c) => c.campaignId.toString() === campaignId.toString()
            );

            if (campaignExists) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Campaign budget already exists for this retailer. Use update to modify.",
                });
            }

            // Add new campaign to existing budget
            budget.campaigns.push({
                campaignId,
                campaignName,
                tca: parseFloat(tca),
                installments: [],
            });
        }

        // Save (pre-save middleware will calculate TDS automatically)
        await budget.save();
        
        // Populate retailer details for response
        await budget.populate('retailerId', 'name shopDetails');

        res.status(201).json({
            success: true,
            message: "Campaign TCA added successfully",
            budget,
            // NEW: Include TDS info in response
            tdsInfo: {
                financialYear: budget.financialYear,
                totalTCA: budget.fyTotalTCA,
                totalTDS: budget.fyTotalTDS,
                totalNetPayable: budget.fyTotalNetPayable,
            }
        });
    } catch (error) {
        console.error("Error adding campaign TCA:", error);
        res.status(500).json({
            success: false,
            message: "Failed to add campaign TCA",
            error: error.message,
        });
    }
};

// ✅ ADD PAYMENT (UPDATED TO VALIDATE AGAINST NET PAYABLE)
export const addPayment = async (req, res) => {
    try {
        const {
            retailerId,
            retailerName,
            state,
            shopName,
            outletCode,
            campaignId,
            campaignName,
            tca,
            installment, // { installmentNo, installmentAmount, dateOfInstallment, utrNumber, remarks }
        } = req.body;

        // Validation
        if (!retailerId || !campaignId || !installment) {
            return res.status(400).json({
                success: false,
                message:
                    "Missing required fields: retailerId, campaignId, installment",
            });
        }

        if (
            !installment.installmentAmount ||
            !installment.utrNumber ||
            !installment.dateOfInstallment
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Installment must have installmentAmount, utrNumber, and dateOfInstallment",
            });
        }

        // Check for duplicate UTR number
        const existingUTR = await RetailerBudget.findOne({
            "campaigns.installments.utrNumber": installment.utrNumber,
        });

        if (existingUTR) {
            return res.status(400).json({
                success: false,
                message:
                    "UTR number already exists. Please use a unique UTR number.",
            });
        }

        // Add timestamps to installment
        installment.createdAt = new Date();
        installment.updatedAt = new Date();

        // Find existing budget or create new
        let budget = await RetailerBudget.findOne({ retailerId });

        if (!budget) {
            // Create new budget entry
            budget = new RetailerBudget({
                retailerId,
                retailerName,
                state,
                shopName,
                outletCode,
                campaigns: [
                    {
                        campaignId,
                        campaignName,
                        tca: tca || 0,
                        installments: [installment],
                    },
                ],
            });
        } else {
            // Update existing budget
            const campaignIndex = budget.campaigns.findIndex(
                (c) => c.campaignId.toString() === campaignId.toString()
            );

            if (campaignIndex === -1) {
                // Add new campaign to existing budget
                budget.campaigns.push({
                    campaignId,
                    campaignName,
                    tca: tca || 0,
                    installments: [installment],
                });
            } else {
                // UPDATED: Validate against netPayable (not TCA)
                const campaign = budget.campaigns[campaignIndex];
                const baseAmount = campaign.netPayable > 0 ? campaign.netPayable : campaign.tca;
                const currentPaid = campaign.cPaid || 0;
                const availableBalance = baseAmount - currentPaid;

                if (installment.installmentAmount > availableBalance) {
                    return res.status(400).json({
                        success: false,
                        message: `Installment amount ₹${installment.installmentAmount} exceeds available balance ₹${availableBalance.toFixed(2)}`,
                        details: {
                            tca: campaign.tca,
                            tdsDeducted: campaign.tdsAmount || 0,
                            netPayable: campaign.netPayable || campaign.tca,
                            paid: currentPaid,
                            available: availableBalance,
                        }
                    });
                }
                
                // Update existing campaign
                if (tca !== undefined && tca !== null) {
                    budget.campaigns[campaignIndex].tca = tca;
                }

                // Add installment to existing campaign
                budget.campaigns[campaignIndex].installments.push(installment);
            }
        }

        // Save (pre-save middleware will calculate all totals)
        await budget.save();

        res.status(201).json({
            success: true,
            message: "Payment added successfully",
            budget,
        });
    } catch (error) {
        console.error("Error adding payment:", error);
        res.status(500).json({
            success: false,
            message: "Failed to add payment",
            error: error.message,
        });
    }
};

// ✅ EDIT PAYMENT (UPDATED TO VALIDATE AGAINST NET PAYABLE)
export const editPayment = async (req, res) => {
    try {
        const { budgetId, campaignId, installmentId } = req.params;
        const updateData = req.body; // { installmentAmount, dateOfInstallment, utrNumber, remarks, installmentNo }

        // Validation
        if (
            !mongoose.Types.ObjectId.isValid(budgetId) ||
            !mongoose.Types.ObjectId.isValid(campaignId) ||
            !mongoose.Types.ObjectId.isValid(installmentId)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid ID format",
            });
        }

        const budget = await RetailerBudget.findById(budgetId);

        if (!budget) {
            return res.status(404).json({
                success: false,
                message: "Budget not found",
            });
        }

        // Find campaign
        const campaign = budget.campaigns.id(campaignId);
        if (!campaign) {
            return res.status(404).json({
                success: false,
                message: "Campaign not found in budget",
            });
        }

        // Find installment
        const installment = campaign.installments.id(installmentId);
        if (!installment) {
            return res.status(404).json({
                success: false,
                message: "Installment not found",
            });
        }

        // UPDATED: Validate new amount against netPayable if amount is being changed
        if (updateData.installmentAmount !== undefined && updateData.installmentAmount !== installment.installmentAmount) {
            const baseAmount = campaign.netPayable > 0 ? campaign.netPayable : campaign.tca;
            const currentPaid = campaign.installments.reduce((sum, inst) => {
                // Exclude current installment from total
                if (inst._id.toString() === installmentId) return sum;
                return sum + (inst.installmentAmount || 0);
            }, 0);
            const availableBalance = baseAmount - currentPaid;

            if (updateData.installmentAmount > availableBalance) {
                return res.status(400).json({
                    success: false,
                    message: `Updated amount ₹${updateData.installmentAmount} exceeds available balance ₹${availableBalance.toFixed(2)}`,
                });
            }
        }

        // Check for duplicate UTR if being changed
        if (
            updateData.utrNumber &&
            updateData.utrNumber !== installment.utrNumber
        ) {
            const existingUTR = await RetailerBudget.findOne({
                "campaigns.installments.utrNumber": updateData.utrNumber,
            });

            if (existingUTR) {
                return res.status(400).json({
                    success: false,
                    message: "UTR number already exists",
                });
            }
        }

        // Update installment fields
        if (updateData.installmentAmount !== undefined)
            installment.installmentAmount = updateData.installmentAmount;
        if (updateData.dateOfInstallment)
            installment.dateOfInstallment = updateData.dateOfInstallment;
        if (updateData.utrNumber) installment.utrNumber = updateData.utrNumber;
        if (updateData.remarks !== undefined)
            installment.remarks = updateData.remarks;
        if (updateData.installmentNo !== undefined)
            installment.installmentNo = updateData.installmentNo;
        installment.updatedAt = new Date();

        // Update TCA if provided (UPDATED: Will trigger TDS recalculation)
        if (updateData.tca !== undefined && updateData.tca !== null) {
            campaign.tca = updateData.tca;
            // Reset TDS fields to trigger recalculation
            campaign.tdsApplicable = undefined;
            campaign.netPayable = 0;
        }

        // Save (pre-save middleware will recalculate all totals)
        await budget.save();

        res.status(200).json({
            success: true,
            message: "Payment updated successfully",
            budget,
        });
    } catch (error) {
        console.error("Error editing payment:", error);
        res.status(500).json({
            success: false,
            message: "Failed to edit payment",
            error: error.message,
        });
    }
};

// ✅ DELETE PAYMENT (NO CHANGES)
export const deletePayment = async (req, res) => {
    try {
        const { budgetId, campaignId, installmentId } = req.params;

        // Validation
        if (
            !mongoose.Types.ObjectId.isValid(budgetId) ||
            !mongoose.Types.ObjectId.isValid(campaignId) ||
            !mongoose.Types.ObjectId.isValid(installmentId)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid ID format",
            });
        }

        const budget = await RetailerBudget.findById(budgetId);

        if (!budget) {
            return res.status(404).json({
                success: false,
                message: "Budget not found",
            });
        }

        // Find campaign
        const campaign = budget.campaigns.id(campaignId);
        if (!campaign) {
            return res.status(404).json({
                success: false,
                message: "Campaign not found in budget",
            });
        }

        // Find and remove installment
        const installmentIndex = campaign.installments.findIndex(
            (inst) => inst._id.toString() === installmentId
        );

        if (installmentIndex === -1) {
            return res.status(404).json({
                success: false,
                message: "Installment not found",
            });
        }

        // Remove installment
        campaign.installments.splice(installmentIndex, 1);

        // Save (pre-save middleware will recalculate all totals)
        await budget.save();

        res.status(200).json({
            success: true,
            message: "Payment deleted successfully",
            budget,
        });
    } catch (error) {
        console.error("Error deleting payment:", error);
        res.status(500).json({
            success: false,
            message: "Failed to delete payment",
            error: error.message,
        });
    }
};

// ✅ UPDATE CAMPAIGN TCA (UPDATED TO TRIGGER TDS RECALCULATION)
export const updateCampaignTCA = async (req, res) => {
    try {
        const { budgetId, campaignId } = req.params;
        const { tca } = req.body;

        if (!tca || tca < 0) {
            return res.status(400).json({
                success: false,
                message: "Valid TCA amount is required",
            });
        }

        const budget = await RetailerBudget.findById(budgetId);

        if (!budget) {
            return res.status(404).json({
                success: false,
                message: "Budget not found",
            });
        }

        const campaign = budget.campaigns.id(campaignId);
        if (!campaign) {
            return res.status(404).json({
                success: false,
                message: "Campaign not found",
            });
        }

        campaign.tca = tca;
        // UPDATED: Reset TDS fields to trigger recalculation in pre-save
        campaign.tdsApplicable = undefined;
        campaign.netPayable = 0;
        
        await budget.save();

        res.status(200).json({
            success: true,
            message: "Campaign TCA updated successfully",
            budget,
            tdsInfo: {
                tca: campaign.tca,
                tdsAmount: campaign.tdsAmount,
                netPayable: campaign.netPayable,
                tdsRate: campaign.tdsRate,
            }
        });
    } catch (error) {
        console.error("Error updating TCA:", error);
        res.status(500).json({
            success: false,
            message: "Failed to update TCA",
            error: error.message,
        });
    }
};

// ✅ DELETE ENTIRE CAMPAIGN FROM BUDGET (NO CHANGES)
export const deleteCampaign = async (req, res) => {
    try {
        const { budgetId, campaignId } = req.params;

        const budget = await RetailerBudget.findById(budgetId);

        if (!budget) {
            return res.status(404).json({
                success: false,
                message: "Budget not found",
            });
        }

        const campaignIndex = budget.campaigns.findIndex(
            (c) => c._id.toString() === campaignId
        );

        if (campaignIndex === -1) {
            return res.status(404).json({
                success: false,
                message: "Campaign not found",
            });
        }

        budget.campaigns.splice(campaignIndex, 1);
        await budget.save();

        res.status(200).json({
            success: true,
            message: "Campaign deleted successfully",
            budget,
        });
    } catch (error) {
        console.error("Error deleting campaign:", error);
        res.status(500).json({
            success: false,
            message: "Failed to delete campaign",
            error: error.message,
        });
    }
};

// ✅ GET PASSBOOK (NO CHANGES)
export const getPassbookData = async (req, res) => {
    try {
        const { state, campaignId, retailerId } = req.query;

        // ✅ Validate that at least retailerId is provided
        if (!retailerId) {
            return res.status(400).json({
                success: false,
                message: "Retailer ID is required",
            });
        }

        // Build filter based on query parameters
        const filter = { retailerId }; // retailerId is mandatory

        if (state) filter.state = state;
        if (campaignId) filter["campaigns.campaignId"] = campaignId;

        console.log("Filter applied:", filter); // ✅ Debug log

        // ✅ Fetch only schema data with populated references
        const budgets = await RetailerBudget.find(filter)
            .populate({
                path: "retailerId",
                select: "uniqueId shopDetails contactDetails",
            })
            .populate({
                path: "campaigns.campaignId",
                select: "name client type",
            })
            .sort({ createdAt: -1 }) // Most recent first
            .lean(); // Convert to plain JavaScript objects

        // ✅ Check if any data found
        if (!budgets || budgets.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No passbook data found for this retailer",
                data: [],
            });
        }

        res.status(200).json({
            success: true,
            count: budgets.length,
            data: budgets,
        });
    } catch (error) {
        console.error("Error fetching passbook data:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch passbook data",
            error: error.message,
        });
    }
};

// ✅ BULK ADD CAMPAIGN TCA (TDS CALCULATED AUTOMATICALLY)
export const bulkAddCampaignTCA = async (req, res) => {
    try {
        // ADMIN CHECK
        if (!req.user || req.user.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "Only admins can upload campaign budget",
            });
        }

        // FILE CHECK
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Excel/CSV file is required",
            });
        }

        // READ EXCEL
        const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, {
            raw: false,
            defval: ""
        });

        const failedRows = [];
        const successfulRows = [];

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];

            // Extract fields (case-insensitive normalization)
            const campaignName = String(row.campaignName || "").trim();
            const outletCode = String(row.outletCode || "").trim();
            const budget = row.Budget || row.budget; // Handle both cases

            // Display-only fields (not used in backend logic)
            const outletName = row.outletName;
            const retailerName = row.retailerName;
            const state = row.State || row.state;

            // BASIC VALIDATION
            const missingFields = [];
            if (!campaignName) missingFields.push("campaignName");
            if (!outletCode) missingFields.push("outletCode");
            if (budget == null || budget === "") missingFields.push("Budget");

            if (missingFields.length > 0) {
                failedRows.push({
                    rowNumber: i + 2,
                    reason: `Missing required fields: ${missingFields.join(", ")}`,
                    data: {
                        campaignName,
                        outletCode,
                        budget,
                    },
                });
                continue;
            }

            // Validate budget is a positive number
            const budgetValue = Number(budget);
            if (isNaN(budgetValue) || budgetValue <= 0) {
                failedRows.push({
                    rowNumber: i + 2,
                    reason: "Budget must be a positive number greater than 0",
                    data: {
                        campaignName,
                        outletCode,
                        budget,
                    },
                });
                continue;
            }

            // FETCH CAMPAIGN (case-insensitive)
            const campaign = await Campaign.findOne({
                name: {
                    $regex: `^${campaignName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`,
                    $options: "i",
                },
            });

            if (!campaign) {
                failedRows.push({
                    rowNumber: i + 2,
                    reason: `Campaign not found: ${campaignName}`,
                    data: {
                        campaignName,
                        outletCode,
                        budget,
                    },
                });
                continue;
            }

            // FETCH RETAILER using uniqueId (outletCode)
            const retailer = await Retailer.findOne({
                uniqueId: {
                    $regex: `^${outletCode.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`,
                    $options: "i",
                },
            });

            if (!retailer) {
                failedRows.push({
                    rowNumber: i + 2,
                    reason: `Retailer not found with outlet code: ${outletCode}`,
                    data: {
                        campaignName,
                        outletCode,
                        budget,
                    },
                });
                continue;
            }

            // Check if retailer is assigned to this campaign
            const isRetailerAssigned = campaign.assignedRetailers.some(
                (r) => r.retailerId.equals(retailer._id)
            );

            if (!isRetailerAssigned) {
                failedRows.push({
                    rowNumber: i + 2,
                    reason: `Retailer ${outletCode} is not assigned to campaign '${campaign.name}'`,
                    data: {
                        campaignName,
                        outletCode,
                        budget,
                    },
                });
                continue;
            }

            // FIND / CREATE BUDGET
            let budgetDoc = await RetailerBudget.findOne({
                retailerId: retailer._id,
            });

            const campaignExists =
                budgetDoc &&
                budgetDoc.campaigns.some((c) =>
                    c.campaignId.equals(campaign._id)
                );

            if (campaignExists) {
                failedRows.push({
                    rowNumber: i + 2,
                    reason: `Budget already set for this retailer in campaign '${campaign.name}'`,
                    data: {
                        campaignName,
                        outletCode,
                        budget,
                    },
                });
                continue;
            }

            if (!budgetDoc) {
                budgetDoc = new RetailerBudget({
                    retailerId: retailer._id,
                    retailerName: retailer.name,
                    state: retailer.shopDetails?.shopAddress?.state,
                    shopName: retailer.shopDetails?.shopName,
                    outletCode: retailer.uniqueId,
                    campaigns: [],
                });
            }

            budgetDoc.campaigns.push({
                campaignId: campaign._id,
                campaignName: campaign.name,
                tca: budgetValue, // Store as TCA in backend
                installments: [],
            });

            await budgetDoc.save(); // pre-save hook calculates TDS automatically

            successfulRows.push({
                campaignName: campaign.name,
                outletCode: retailer.uniqueId,
                outletName: retailer.shopDetails?.shopName,
                retailerName: retailer.name,
                budget: budgetValue,
            });
        }

        // FINAL RESPONSE
        const response = {
            success: true,
            summary: {
                totalRows: rows.length,
                successful: successfulRows.length,
                failed: failedRows.length,
                successRate: rows.length > 0
                    ? `${((successfulRows.length / rows.length) * 100).toFixed(2)}%`
                    : "0%",
            },
            successfulRows,
            failedRows,
        };

        if (successfulRows.length === 0) {
            return res.status(400).json({
                success: false,
                message: "No budgets were set. All rows failed validation.",
                ...response,
            });
        }

        if (failedRows.length > 0) {
            return res.status(207).json({
                success: true,
                message: `${successfulRows.length} budgets set, ${failedRows.length} rows failed`,
                ...response,
            });
        }

        return res.status(201).json({
            success: true,
            message: `All ${successfulRows.length} budgets set successfully`,
            ...response,
        });
    } catch (error) {
        console.error("❌ Bulk budget error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        });
    }
};

// ✅ BULK ADD PAYMENTS (UPDATED TO CHECK AGAINST NET PAYABLE)
export const bulkAddPayments = async (req, res) => {
    try {
        /* ---------------- ADMIN CHECK ---------------- */
        if (!req.user || req.user.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "Only admins can add payments",
            });
        }

        /* ---------------- FILE CHECK ---------------- */
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Excel/CSV file is required",
            });
        }

        /* ---------------- READ EXCEL ---------------- */
        const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, {
            raw: false,
            defval: ""
        });

        const failedRows = [];
        const successfulRows = [];

        /* ---------------- PROCESS EACH ROW ---------------- */
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];

            // Extract fields from template (case-insensitive)
            const campaignName = String(row.campaignName || "").trim();
            const outletCode = String(row.outletCode || "").trim();
            const amount = row.Amount || row.amount;
            const date = String(row.Date || row.date || "").trim();
            const utrNumber = String(row["UTR Number"] || row.utrNumber || row.UTRNumber || "").trim();

            // Display-only fields (not used in backend logic)
            const outletName = row.OutletName || row.outletName;
            const retailerName = row.RetailerName || row.retailerName;
            const remarks = row.Remarks || row.remarks || "";

            /* -------- BASIC VALIDATION -------- */
            const missingFields = [];
            if (!campaignName) missingFields.push("campaignName");
            if (!outletCode) missingFields.push("outletCode");
            if (amount == null || amount === "") missingFields.push("Amount");
            if (!date) missingFields.push("Date");
            if (!utrNumber) missingFields.push("UTR Number");

            if (missingFields.length > 0) {
                failedRows.push({
                    rowNumber: i + 2,
                    reason: `Missing required fields: ${missingFields.join(", ")}`,
                    data: {
                        campaignName,
                        outletCode,
                        amount,
                        date,
                        utrNumber,
                    },
                });
                continue;
            }

            // Validate amount is a positive number
            const installmentAmount = Number(amount);
            if (isNaN(installmentAmount) || installmentAmount <= 0) {
                failedRows.push({
                    rowNumber: i + 2,
                    reason: "Amount must be a positive number greater than 0",
                    data: {
                        campaignName,
                        outletCode,
                        amount,
                        date,
                        utrNumber,
                    },
                });
                continue;
            }

            /* -------- DUPLICATE UTR CHECK -------- */
            const existingUTR = await RetailerBudget.findOne({
                "campaigns.installments.utrNumber": utrNumber,
            });

            if (existingUTR) {
                failedRows.push({
                    rowNumber: i + 2,
                    reason: `UTR number already exists: ${utrNumber}`,
                    data: {
                        campaignName,
                        outletCode,
                        amount,
                        date,
                        utrNumber,
                    },
                });
                continue;
            }

            /* -------- FETCH CAMPAIGN (case-insensitive) -------- */
            const campaign = await Campaign.findOne({
                name: {
                    $regex: `^${campaignName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`,
                    $options: "i",
                },
            });

            if (!campaign) {
                failedRows.push({
                    rowNumber: i + 2,
                    reason: `Campaign not found: ${campaignName}`,
                    data: {
                        campaignName,
                        outletCode,
                        amount,
                        date,
                        utrNumber,
                    },
                });
                continue;
            }

            /* -------- FETCH RETAILER using uniqueId (outletCode) -------- */
            const retailer = await Retailer.findOne({
                uniqueId: {
                    $regex: `^${outletCode.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`,
                    $options: "i",
                },
            });

            if (!retailer) {
                failedRows.push({
                    rowNumber: i + 2,
                    reason: `Retailer not found with outlet code: ${outletCode}`,
                    data: {
                        campaignName,
                        outletCode,
                        amount,
                        date,
                        utrNumber,
                    },
                });
                continue;
            }

            /* -------- FIND BUDGET -------- */
            let budget = await RetailerBudget.findOne({
                retailerId: retailer._id,
            });

            if (!budget) {
                failedRows.push({
                    rowNumber: i + 2,
                    reason: `No budget found for retailer ${outletCode}. Please set budget first.`,
                    data: {
                        campaignName,
                        outletCode,
                        amount,
                        date,
                        utrNumber,
                    },
                });
                continue;
            }

            const campaignIndex = budget.campaigns.findIndex(
                (c) => c.campaignId.equals(campaign._id)
            );

            if (campaignIndex === -1) {
                failedRows.push({
                    rowNumber: i + 2,
                    reason: `Budget not set for campaign '${campaignName}'. Please set budget first.`,
                    data: {
                        campaignName,
                        outletCode,
                        amount,
                        date,
                        utrNumber,
                    },
                });
                continue;
            }

            /* -------- CHECK AVAILABLE BALANCE (UPDATED: Use netPayable) -------- */
            const campaignBudget = budget.campaigns[campaignIndex];
            const currentPaid = campaignBudget.cPaid || 0;
            
            // UPDATED: Check against netPayable (after TDS) instead of TCA
            const baseAmount = campaignBudget.netPayable > 0 ? campaignBudget.netPayable : campaignBudget.tca;
            const availableBalance = baseAmount - currentPaid;

            if (installmentAmount > availableBalance) {
                failedRows.push({
                    rowNumber: i + 2,
                    reason: `Amount ₹${installmentAmount} exceeds available balance ₹${availableBalance.toFixed(2)} (TCA: ₹${campaignBudget.tca}, TDS: ₹${campaignBudget.tdsAmount || 0}, Net Payable: ₹${baseAmount}, Paid: ₹${currentPaid})`,
                    data: {
                        campaignName,
                        outletCode,
                        amount,
                        date,
                        utrNumber,
                    },
                });
                continue;
            }

            /* -------- AUTO-CALCULATE INSTALLMENT NUMBER -------- */
            const existingInstallments = campaignBudget.installments || [];
            const nextInstallmentNo = existingInstallments.length + 1;

            /* -------- ADD INSTALLMENT -------- */
            budget.campaigns[campaignIndex].installments.push({
                installmentNo: nextInstallmentNo,
                installmentAmount: installmentAmount,
                dateOfInstallment: date,
                utrNumber: utrNumber,
                remarks: remarks,
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            await budget.save(); // pre-save hook recalculates totals

            successfulRows.push({
                campaignName: campaign.name,
                outletCode: retailer.uniqueId,
                outletName: retailer.shopDetails?.shopName,
                installmentNo: nextInstallmentNo,
                amount: installmentAmount,
                date: date,
                utrNumber: utrNumber,
                availableBalanceBefore: availableBalance,
                availableBalanceAfter: availableBalance - installmentAmount,
            });
        }

        /* ---------------- FINAL RESPONSE ---------------- */
        const response = {
            success: true,
            summary: {
                totalRows: rows.length,
                successful: successfulRows.length,
                failed: failedRows.length,
                successRate: rows.length > 0
                    ? `${((successfulRows.length / rows.length) * 100).toFixed(2)}%`
                    : "0%",
            },
            successfulRows,
            failedRows,
        };

        if (successfulRows.length === 0) {
            return res.status(400).json({
                success: false,
                message: "No payments were added. All rows failed validation.",
                ...response,
            });
        }

        if (failedRows.length > 0) {
            return res.status(207).json({
                success: true,
                message: `${successfulRows.length} payments added, ${failedRows.length} rows failed`,
                ...response,
            });
        }

        return res.status(201).json({
            success: true,
            message: `All ${successfulRows.length} payments added successfully`,
            ...response,
        });
    } catch (error) {
        console.error("❌ Bulk add payments error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        });
    }
};

// ========================================
// NEW TDS REPORT CONTROLLERS
// ========================================

// ✅ GET TDS REPORT FOR SPECIFIC RETAILER
export const getRetailerTDSReport = async (req, res) => {
    try {
        const { retailerId } = req.params;
        const { financialYear } = req.query;

        if (!mongoose.Types.ObjectId.isValid(retailerId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid retailer ID",
            });
        }

        // Get current FY if not provided
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        const currentFY = financialYear || (month >= 3 ? `${year}-${year + 1}` : `${year - 1}-${year}`);

        const budgets = await RetailerBudget.find({
            retailerId,
            financialYear: currentFY
        }).populate('retailerId', 'name shopDetails');

        if (!budgets || budgets.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No TDS data found for this retailer",
            });
        }

        // Aggregate TDS data
        let totalTCA = 0;
        let totalTDS = 0;
        let totalNetPayable = 0;
        const campaigns = [];

        budgets.forEach(budget => {
            totalTCA += budget.fyTotalTCA || 0;
            totalTDS += budget.fyTotalTDS || 0;
            totalNetPayable += budget.fyTotalNetPayable || 0;

            budget.campaigns.forEach(campaign => {
                if (campaign.tdsApplicable) {
                    campaigns.push({
                        campaignName: campaign.campaignName,
                        tca: campaign.tca,
                        tdsRate: campaign.tdsRate,
                        tdsAmount: campaign.tdsAmount,
                        netPayable: campaign.netPayable,
                        thresholdReason: campaign.thresholdReason,
                        paid: campaign.cPaid,
                        pending: campaign.cPending,
                    });
                }
            });
        });

        const retailer = budgets[0].retailerId;

        res.status(200).json({
            success: true,
            report: {
                retailerName: retailer.name,
                panCard: retailer.shopDetails?.PANCard,
                ownershipType: retailer.shopDetails?.ownershipType,
                financialYear: currentFY,
                totalTCA,
                totalTDS,
                totalNetPayable,
                campaigns,
                summary: {
                    totalCampaigns: campaigns.length,
                    averageTdsRate: totalTCA > 0 ? ((totalTDS / totalTCA) * 100).toFixed(2) : 0
                }
            }
        });

    } catch (error) {
        console.error("Error generating TDS report:", error);
        res.status(500).json({
            success: false,
            message: "Failed to generate TDS report",
            error: error.message,
        });
    }
};

// ✅ GET ALL RETAILERS TDS SUMMARY
export const getAllRetailersTDSSummary = async (req, res) => {
    try {
        const { financialYear, state } = req.query;

        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        const currentFY = financialYear || (month >= 3 ? `${year}-${year + 1}` : `${year - 1}-${year}`);

        const filter = { financialYear: currentFY };
        if (state) filter.state = state;

        const budgets = await RetailerBudget.find(filter)
            .populate('retailerId', 'name shopDetails')
            .sort({ fyTotalTDS: -1 });

        const summary = budgets.map(budget => ({
            retailerId: budget.retailerId._id,
            retailerName: budget.retailerName,
            outletCode: budget.outletCode,
            state: budget.state,
            panCard: budget.retailerId?.shopDetails?.PANCard,
            ownershipType: budget.retailerId?.shopDetails?.ownershipType,
            totalTCA: budget.fyTotalTCA,
            totalTDS: budget.fyTotalTDS,
            totalNetPayable: budget.fyTotalNetPayable,
            tdsPercentage: budget.fyTotalTCA > 0 
                ? ((budget.fyTotalTDS / budget.fyTotalTCA) * 100).toFixed(2)
                : 0,
            campaignCount: budget.campaigns.length,
        }));

        const aggregate = {
            totalRetailers: summary.length,
            totalTCA: summary.reduce((sum, s) => sum + s.totalTCA, 0),
            totalTDS: summary.reduce((sum, s) => sum + s.totalTDS, 0),
            totalNetPayable: summary.reduce((sum, s) => sum + s.totalNetPayable, 0),
            retailersWithoutPAN: summary.filter(s => !s.panCard).length,
        };

        res.status(200).json({
            success: true,
            financialYear: currentFY,
            aggregate,
            retailers: summary,
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

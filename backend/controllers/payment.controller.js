// controllers/payment.controller.js
import mongoose from "mongoose";
import { RetailerBudget } from "../models/payments.model.js";

// ✅ GET ALL BUDGETS with optional filters
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

        // Calculate aggregate statistics
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

// ✅ GET SINGLE BUDGET BY ID
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

// ✅ GET BUDGET BY RETAILER ID
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

// ✅ ADD CAMPAIGN TCA (Set budget for a campaign without payment)
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

        // Save (pre-save middleware will calculate all totals)
        await budget.save();

        res.status(201).json({
            success: true,
            message: "Campaign TCA added successfully",
            budget,
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

// ✅ ADD PAYMENT (Add installment to existing campaign)
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

// ✅ EDIT PAYMENT (Edit installment to existing campaign)
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

        // Update TCA if provided
        if (updateData.tca !== undefined && updateData.tca !== null) {
            campaign.tca = updateData.tca;
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

// ✅ DELETE PAYMENT (Delete installment to existing campaign)
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

// ✅ UPDATE CAMPAIGN TCA
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
        await budget.save();

        res.status(200).json({
            success: true,
            message: "Campaign TCA updated successfully",
            budget,
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

// ✅ DELETE ENTIRE CAMPAIGN FROM BUDGET
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

// ✅ GET PASSBOOK
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
export const bulkAddCampaignTCA = async (req, res) => {
    try {
        // ADMIN CHECK
        if (!req.user || req.user.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "Only admins can upload campaign TCA",
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
        const rows = XLSX.utils.sheet_to_json(sheet);

        const failedRows = [];
        let successCount = 0;

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];

            const {
                sno,
                campaignName,
                retailerCode,
                tca,
                retailerName,
                state,
                shopName,
                outletCode,
            } = row;

            // BASIC VALIDATION
            if (!campaignName || !retailerCode || tca == null) {
                failedRows.push({
                    sno: sno || i + 1,
                    rowNumber: i + 2,
                    reason: "campaignName, retailerCode and tca are required",
                    data: row,
                });
                continue;
            }

            if (Number(tca) <= 0) {
                failedRows.push({
                    sno: sno || i + 1,
                    rowNumber: i + 2,
                    reason: "TCA must be greater than 0",
                    data: row,
                });
                continue;
            }

            // FETCH CAMPAIGN
            const campaign = await Campaign.findOne({ name: campaignName });
            if (!campaign) {
                failedRows.push({
                    sno: sno || i + 1,
                    rowNumber: i + 2,
                    reason: `Campaign not found: ${campaignName}`,
                    data: row,
                });
                continue;
            }

            // FETCH RETAILER
            const retailer = await Retailer.findOne({ retailerCode });
            if (!retailer) {
                failedRows.push({
                    sno: sno || i + 1,
                    rowNumber: i + 2,
                    reason: `Retailer not found: ${retailerCode}`,
                    data: row,
                });
                continue;
            }

            // FIND / CREATE BUDGET
            let budget = await RetailerBudget.findOne({
                retailerId: retailer._id,
            });

            const campaignExists =
                budget &&
                budget.campaigns.some((c) =>
                    c.campaignId.equals(campaign._id)
                );

            if (campaignExists) {
                failedRows.push({
                    sno: sno || i + 1,
                    rowNumber: i + 2,
                    reason:
                        "Campaign TCA already exists for this retailer",
                    data: row,
                });
                continue;
            }

            if (!budget) {
                budget = new RetailerBudget({
                    retailerId: retailer._id,
                    retailerName,
                    state,
                    shopName,
                    outletCode,
                    campaigns: [],
                });
            }

            budget.campaigns.push({
                campaignId: campaign._id,
                campaignName: campaign.name,
                tca: Number(tca),
                installments: [],
            });

            await budget.save(); // pre-save calculates totals
            successCount++;
        }

        // FINAL RESPONSE
        if (successCount === 0) {
            return res.status(400).json({
                success: false,
                message: "No rows were added. All rows failed validation.",
                summary: {
                    totalRows: rows.length,
                    successful: 0,
                    failed: failedRows.length,
                },
                failedRows,
            });
        }

        if (failedRows.length > 0) {
            return res.status(207).json({
                success: true,
                message:
                    "Bulk TCA upload completed with partial success",
                summary: {
                    totalRows: rows.length,
                    successful: successCount,
                    failed: failedRows.length,
                },
                failedRows,
            });
        }

        return res.status(201).json({
            success: true,
            message: "Bulk TCA upload completed successfully",
            summary: {
                totalRows: rows.length,
                successful: successCount,
                failed: 0,
            },
        });
    } catch (error) {
        console.error("Bulk TCA error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message,
        });
    }
};
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
        const rows = XLSX.utils.sheet_to_json(sheet);

        const failedRows = [];
        let successCount = 0;

        /* ---------------- PROCESS EACH ROW ---------------- */
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];

            const {
                sno,
                retailerCode,
                campaignName,
                installmentNo,
                installmentAmount,
                dateOfInstallment,
                utrNumber,
                remarks,
            } = row;

            /* -------- BASIC VALIDATION -------- */
            if (
                !retailerCode ||
                !campaignName ||
                !installmentNo ||
                !installmentAmount ||
                !dateOfInstallment ||
                !utrNumber
            ) {
                failedRows.push({
                    sno: sno || i + 1,
                    rowNumber: i + 2,
                    reason:
                        "retailerCode, campaignName, installmentNo, installmentAmount, dateOfInstallment and utrNumber are required",
                    data: row,
                });
                continue;
            }

            if (Number(installmentAmount) <= 0) {
                failedRows.push({
                    sno: sno || i + 1,
                    rowNumber: i + 2,
                    reason: "installmentAmount must be greater than 0",
                    data: row,
                });
                continue;
            }

            /* -------- DUPLICATE UTR CHECK -------- */
            const existingUTR = await RetailerBudget.findOne({
                "campaigns.installments.utrNumber": utrNumber,
            });

            if (existingUTR) {
                failedRows.push({
                    sno: sno || i + 1,
                    rowNumber: i + 2,
                    reason: `UTR number already exists: ${utrNumber}`,
                    data: row,
                });
                continue;
            }

            /* -------- FETCH RETAILER -------- */
            const retailer = await Retailer.findOne({ retailerCode });
            if (!retailer) {
                failedRows.push({
                    sno: sno || i + 1,
                    rowNumber: i + 2,
                    reason: `Retailer not found: ${retailerCode}`,
                    data: row,
                });
                continue;
            }

            /* -------- FETCH CAMPAIGN -------- */
            const campaign = await Campaign.findOne({ name: campaignName });
            if (!campaign) {
                failedRows.push({
                    sno: sno || i + 1,
                    rowNumber: i + 2,
                    reason: `Campaign not found: ${campaignName}`,
                    data: row,
                });
                continue;
            }

            /* -------- FIND BUDGET -------- */
            let budget = await RetailerBudget.findOne({
                retailerId: retailer._id,
            });

            if (!budget) {
                failedRows.push({
                    sno: sno || i + 1,
                    rowNumber: i + 2,
                    reason:
                        "Retailer budget not found. Add TCA before adding payments.",
                    data: row,
                });
                continue;
            }

            const campaignIndex = budget.campaigns.findIndex(
                (c) => c.campaignId.equals(campaign._id)
            );

            if (campaignIndex === -1) {
                failedRows.push({
                    sno: sno || i + 1,
                    rowNumber: i + 2,
                    reason:
                        "Campaign not found in retailer budget. Add TCA first.",
                    data: row,
                });
                continue;
            }

            /* -------- ADD INSTALLMENT -------- */
            budget.campaigns[campaignIndex].installments.push({
                installmentNo: Number(installmentNo),
                installmentAmount: Number(installmentAmount),
                dateOfInstallment,
                utrNumber,
                remarks: remarks || "",
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            await budget.save(); // pre-save recalculates totals
            successCount++;
        }

        /* ---------------- FINAL RESPONSE ---------------- */
        if (successCount === 0) {
            return res.status(400).json({
                success: false,
                message: "No payments were added. All rows failed validation.",
                summary: {
                    totalRows: rows.length,
                    successful: 0,
                    failed: failedRows.length,
                },
                failedRows,
            });
        }

        if (failedRows.length > 0) {
            return res.status(207).json({
                success: true,
                message:
                    "Bulk payment upload completed with partial success",
                summary: {
                    totalRows: rows.length,
                    successful: successCount,
                    failed: failedRows.length,
                },
                failedRows,
            });
        }

        return res.status(201).json({
            success: true,
            message: "Bulk payment upload completed successfully",
            summary: {
                totalRows: rows.length,
                successful: successCount,
                failed: 0,
            },
        });
    } catch (error) {
        console.error("Bulk add payments error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message,
        });
    }
};

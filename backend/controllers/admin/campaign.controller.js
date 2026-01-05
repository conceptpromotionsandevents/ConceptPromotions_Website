// admin/campaign.controller.js
import { Retailer } from "../../models/retailer.model.js";
import {
    Campaign,
    ClientAdmin,
    Employee,
    EmployeeReport,
    Payment,
} from "../../models/user.js";

// ====== GET ALL CAMPAIGNS ======
export const getAllCampaigns = async (req, res) => {
    try {
        const campaigns = await Campaign.find()
            .populate("createdBy", "name email")
            .populate("assignedEmployees.employeeId", "name email")
            .populate("assignedRetailers.retailerId", "name contactNo");

        res.status(200).json({ campaigns });
    } catch (error) {
        console.error("Get campaigns error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// ====== ADD CAMPAIGN ======
export const addCampaign = async (req, res) => {
    try {
        /* =========================
       AUTH CHECK
    ========================== */
        if (!req.user || req.user.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "Only admins can create campaigns",
            });
        }

        /* =========================
       EXTRACT BODY
    ========================== */
        let {
            name,
            client,
            type,
            regions,
            states,
            campaignStartDate,
            campaignEndDate,

            // TEXT T&C
            termsAndConditions,

            // GRATIFICATION
            gratificationType,
            gratificationAmount,
            gratificationDescription,
            gratificationConditions,
        } = req.body;

        /* =========================
       REQUIRED FIELD VALIDATION
    ========================== */
        if (
            !name ||
            !client ||
            !type ||
            !regions ||
            !states ||
            !campaignStartDate ||
            !campaignEndDate ||
            !termsAndConditions
        ) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields",
            });
        }

        /* =========================
       PARSE ARRAYS (MULTIPART SAFE)
    ========================== */
        try {
            if (typeof regions === "string") regions = JSON.parse(regions);
            if (typeof states === "string") states = JSON.parse(states);
        } catch (err) {
            return res.status(400).json({
                success: false,
                message: "regions and states must be valid JSON arrays",
            });
        }

        if (!Array.isArray(regions) || regions.length === 0) {
            return res.status(400).json({
                success: false,
                message: "At least one region is required",
            });
        }

        if (!Array.isArray(states) || states.length === 0) {
            return res.status(400).json({
                success: false,
                message: "At least one state is required",
            });
        }

        /* =========================
       VALIDATE CLIENT
    ========================== */
        const clientOrg = await ClientAdmin.findOne({
            organizationName: client,
        }).select("_id");

        if (!clientOrg) {
            return res.status(404).json({
                success: false,
                message: `Client organization '${client}' does not exist`,
            });
        }

        /* =========================
       DATE VALIDATION
    ========================== */
        const startDate = new Date(campaignStartDate);
        const endDate = new Date(campaignEndDate);

        if (isNaN(startDate) || isNaN(endDate)) {
            return res.status(400).json({
                success: false,
                message: "Invalid campaign date format",
            });
        }

        if (startDate > endDate) {
            return res.status(400).json({
                success: false,
                message: "Campaign start date cannot be after end date",
            });
        }

        /* =========================
       UPLOAD BANNERS (IMAGES)
    ========================== */
        const banners = [];

        if (req.files?.banners?.length) {
            for (const file of req.files.banners) {
                const result = await uploadToCloudinary(
                    file.buffer,
                    "campaigns/banners",
                    "image"
                );

                banners.push({
                    url: result.secure_url,
                    publicId: result.public_id,
                });
            }
        }

        /* =========================
       CREATE CAMPAIGN
    ========================== */
        const campaign = new Campaign({
            name,
            client,
            type,
            regions,
            states,
            createdBy: req.user.id,
            campaignStartDate: startDate,
            campaignEndDate: endDate,

            banners,

            termsAndConditions,

            gratification: {
                type: gratificationType || "",
                amount: gratificationAmount || null,
                description: gratificationDescription || "",
                conditions: gratificationConditions || "",
            },
        });

        await campaign.save();

        return res.status(201).json({
            success: true,
            message: "Campaign created successfully",
            campaign,
        });
    } catch (error) {
        console.error("Add campaign error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message,
        });
    }
};

// ====== UPDATE CAMPAIGN STATUS ======
export const updateCampaignStatus = async (req, res) => {
    try {
        if (!req.user || req.user.role !== "admin") {
            return res
                .status(403)
                .json({ message: "Only admins can update campaign status" });
        }

        const { id } = req.params;
        const { isActive } = req.body;

        if (isActive === undefined) {
            return res
                .status(400)
                .json({ message: "isActive field is required (true/false)" });
        }

        //  Find campaign
        const campaign = await Campaign.findById(id);
        if (!campaign) {
            return res.status(404).json({ message: "Campaign not found" });
        }

        //  Update status
        campaign.isActive = isActive;
        await campaign.save();

        res.status(200).json({
            message: `Campaign ${
                isActive ? "activated" : "deactivated"
            } successfully`,
            campaign,
        });
    } catch (error) {
        console.error("Update campaign status error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// ====== GET CAMPAIGN BY ID ======
export const getCampaignById = async (req, res) => {
    try {
        if (!req.user || req.user.role !== "admin") {
            return res
                .status(403)
                .json({ message: "Only admins can view campaign details" });
        }

        const { id } = req.params;

        const campaign = await Campaign.findById(id);
        if (!campaign) {
            return res.status(404).json({ message: "Campaign not found" });
        }

        res.status(200).json({ campaign });
    } catch (error) {
        console.error("Get campaign by ID error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// ====== GET EMPLOYEE CAMPAIGNS ======
export const getEmployeeCampaigns = async (req, res) => {
    try {
        const employee = await Employee.findById(req.user.id);
        if (!employee) {
            return res.status(404).json({ message: "Employee not found" });
        }

        const campaigns = await Campaign.find({
            "assignedEmployees.employeeId": employee._id,
        })
            .populate("createdBy", "name email")
            .populate("assignedEmployees.employeeId", "name email")
            .populate("assignedRetailers.retailerId", "name contactNo")
            .sort({ createdAt: -1 });

        res.status(200).json({
            message: "Campaigns fetched successfully",
            employee: {
                id: employee._id,
                name: employee.name,
                email: employee.email,
            },
            campaigns,
        });
    } catch (error) {
        console.error("Get employee campaigns error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// ====== DELETE CAMPAIGN ======
export const deleteCampaign = async (req, res) => {
    try {
        const { id } = req.params;

        if (!req.user || req.user.role !== "admin")
            return res
                .status(403)
                .json({ message: "Only admins can delete campaigns" });

        const campaign = await Campaign.findByIdAndDelete(id);
        if (!campaign)
            return res.status(404).json({ message: "Campaign not found" });

        res.status(200).json({ message: "Campaign deleted successfully" });
    } catch (error) {
        console.error("Delete campaign error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// ====== ASSIGN CAMPAIGN (employees + retailers) ======
export const assignCampaign = async (req, res) => {
    try {
        const { campaignId, employeeIds = [], retailerIds = [] } = req.body;

        // -------------------------------
        // Admin check
        // -------------------------------
        if (!req.user || req.user.role !== "admin") {
            return res
                .status(403)
                .json({ message: "Only admins can assign campaigns" });
        }

        if (!campaignId) {
            return res.status(400).json({ message: "Campaign ID is required" });
        }

        const campaign = await Campaign.findById(campaignId);

        if (!campaign) {
            return res.status(404).json({ message: "Campaign not found" });
        }

        // -------------------------------
        // FIX: Use campaign.states (correct field)
        // -------------------------------
        const allowedStates = Array.isArray(campaign.states)
            ? campaign.states
            : [campaign.states];

        const startDate = campaign.campaignStartDate;
        const endDate = campaign.campaignEndDate;

        // Ensure arrays exist
        campaign.assignedEmployees ||= [];
        campaign.assignedRetailers ||= [];

        /* =========================================================================
       ASSIGN EMPLOYEES
    ========================================================================= */
        for (const empId of employeeIds) {
            if (!empId) continue;

            const employee = await Employee.findById(empId);
            if (!employee) continue;

            const employeeState = employee?.correspondenceAddress?.state;

            const isAllowed =
                allowedStates.includes("All") ||
                (employeeState && allowedStates.includes(employeeState));

            if (!isAllowed) {
                return res.status(400).json({
                    message: `❌ Employee '${employee.name}' cannot be assigned because their state '${employeeState}' is not allowed in this campaign.`,
                });
            }

            // Check duplication
            const exists = campaign.assignedEmployees.some(
                (e) => e.employeeId.toString() === empId.toString()
            );

            if (!exists) {
                campaign.assignedEmployees.push({
                    employeeId: empId,
                    status: "pending",
                    assignedAt: new Date(),
                    updatedAt: new Date(),
                    startDate,
                    endDate,
                });
            }

            // Update employee's assigned campaigns list
            await Employee.findByIdAndUpdate(empId, {
                $addToSet: { assignedCampaigns: campaign._id },
            });
        }

        /* =========================================================================
       ASSIGN RETAILERS
    ========================================================================= */
        for (const retId of retailerIds) {
            if (!retId) continue;

            const retailer = await Retailer.findById(retId);
            if (!retailer) continue;

            const retailerState = retailer?.shopDetails?.shopAddress?.state;

            const isAllowed =
                allowedStates.includes("All") ||
                (retailerState && allowedStates.includes(retailerState));

            if (!isAllowed) {
                return res.status(400).json({
                    message: `❌ Retailer '${retailer.name}' cannot be assigned because their state '${retailerState}' is not allowed in this campaign.`,
                });
            }

            // Check duplicate assignment
            const exists = campaign.assignedRetailers.some(
                (r) => r.retailerId.toString() === retId.toString()
            );

            if (!exists) {
                campaign.assignedRetailers.push({
                    retailerId: retId,
                    status: "pending",
                    assignedAt: new Date(),
                    updatedAt: new Date(),
                    startDate,
                    endDate,
                });
            }

            // Update retailer's assigned campaigns
            await Retailer.findByIdAndUpdate(retId, {
                $addToSet: { assignedCampaigns: campaign._id },
            });

            // Create default payment record only once
            const existingPayment = await Payment.findOne({
                campaign: campaign._id,
                retailer: retId,
            });

            if (!existingPayment) {
                await Payment.create({
                    campaign: campaign._id,
                    retailer: retId,
                    totalAmount: 0,
                    amountPaid: 0,
                    paymentStatus: "Pending",
                });
            }
        }

        // Save updated campaign
        await campaign.save();

        res.status(200).json({
            message: "Campaign assigned successfully",
            campaign,
        });
    } catch (error) {
        console.error("Assign campaign error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// ====== UPDATE CAMPAIGN DETAILS ======
export const updateCampaign = async (req, res) => {
    try {
        const { id } = req.params;

        if (!req.user || req.user.role !== "admin") {
            return res
                .status(403)
                .json({ message: "Only admins can edit campaigns" });
        }

        const campaign = await Campaign.findById(id);
        if (!campaign) {
            return res.status(404).json({ message: "Campaign not found" });
        }

        const {
            name,
            client,
            type,
            regions,
            states,
            campaignStartDate,
            campaignEndDate,
            isActive,

            assignedRetailers,
            assignedEmployees,
        } = req.body;

        /* -----------------------------------------------------
       UPDATE BASIC FIELDS (only if provided)
    ------------------------------------------------------ */
        if (name) campaign.name = name;
        if (client) campaign.client = client;
        if (type) campaign.type = type;
        if (regions) campaign.regions = regions;
        if (states) campaign.states = states;

        if (campaignStartDate)
            campaign.campaignStartDate = new Date(campaignStartDate);
        if (campaignEndDate)
            campaign.campaignEndDate = new Date(campaignEndDate);

        if (isActive !== undefined) campaign.isActive = isActive;

        /* -----------------------------------------------------
       UPDATE ASSIGNED RETAILERS (add / update / remove)
    ------------------------------------------------------ */
        if (assignedRetailers) {
            assignedRetailers.forEach((item) => {
                const existing = campaign.assignedRetailers.find(
                    (r) => r.retailerId.toString() === item.retailerId
                );

                if (existing) {
                    // update retailer record
                    if (item.status) existing.status = item.status;
                    if (item.startDate)
                        existing.startDate = new Date(item.startDate);
                    if (item.endDate) existing.endDate = new Date(item.endDate);
                    existing.updatedAt = new Date();
                } else {
                    // add new retailer
                    campaign.assignedRetailers.push({
                        retailerId: item.retailerId,
                        status: item.status || "pending",
                        startDate: item.startDate
                            ? new Date(item.startDate)
                            : null,
                        endDate: item.endDate ? new Date(item.endDate) : null,
                        assignedAt: new Date(),
                        updatedAt: new Date(),
                    });
                }
            });
        }

        /* -----------------------------------------------------
       UPDATE ASSIGNED EMPLOYEES (add / update / remove)
    ------------------------------------------------------ */
        if (assignedEmployees) {
            assignedEmployees.forEach((item) => {
                const existing = campaign.assignedEmployees.find(
                    (e) => e.employeeId.toString() === item.employeeId
                );

                if (existing) {
                    if (item.status) existing.status = item.status;
                    if (item.startDate)
                        existing.startDate = new Date(item.startDate);
                    if (item.endDate) existing.endDate = new Date(item.endDate);
                    existing.updatedAt = new Date();
                } else {
                    campaign.assignedEmployees.push({
                        employeeId: item.employeeId,
                        status: item.status || "pending",
                        startDate: item.startDate
                            ? new Date(item.startDate)
                            : null,
                        endDate: item.endDate ? new Date(item.endDate) : null,
                        assignedAt: new Date(),
                        updatedAt: new Date(),
                    });
                }
            });
        }

        await campaign.save();

        res.status(200).json({
            message: "Campaign updated successfully",
            campaign,
        });
    } catch (error) {
        console.error("Update campaign error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// ====== CAMPAIGN RETAILERS WITH EMPLOYEES ======
export const getCampaignRetailersWithEmployees = async (req, res) => {
    try {
        const { campaignId } = req.params;

        const campaign = await Campaign.findById(campaignId)
            .select("name client type assignedEmployees assignedRetailers")
            .lean();

        if (!campaign) {
            return res.status(404).json({ message: "Campaign not found" });
        }

        // -------------------------
        // FULL RETAILER FETCH
        // -------------------------
        const retailerIds = campaign.assignedRetailers.map((r) => r.retailerId);

        const retailers = await Retailer.find({
            _id: { $in: retailerIds },
        }).lean(); // FULL retailer fields

        const retailerMeta = {};
        campaign.assignedRetailers.forEach((r) => {
            retailerMeta[r.retailerId] = {
                status: r.status,
                assignedAt: r.assignedAt,
                startDate: r.startDate,
                endDate: r.endDate,
            };
        });

        const finalRetailers = retailers.map((r) => ({
            ...r,
            ...retailerMeta[r._id],
        }));

        // -------------------------
        // FULL EMPLOYEE FETCH
        // -------------------------
        const employeeIds = campaign.assignedEmployees.map((e) => e.employeeId);

        const employees = await Employee.find({
            _id: { $in: employeeIds },
        }).lean(); // FULL employee fields

        const employeeMeta = {};
        campaign.assignedEmployees.forEach((e) => {
            employeeMeta[e.employeeId] = {
                status: e.status,
                assignedAt: e.assignedAt,
                startDate: e.startDate,
                endDate: e.endDate,
            };
        });

        const finalEmployees = employees.map((e) => ({
            ...e,
            ...employeeMeta[e._id],
        }));

        // -------------------------
        // RESPONSE
        // -------------------------
        res.status(200).json({
            campaignId,
            campaignName: campaign.name,
            client: campaign.client,
            type: campaign.type,

            totalRetailers: finalRetailers.length,
            totalEmployees: finalEmployees.length,

            retailers: finalRetailers,
            employees: finalEmployees,
        });
    } catch (err) {
        console.error("FAST Campaign fetch error:", err);
        res.status(500).json({ message: "Server error" });
    }
};

// ====== CAMPAIGN VISIT SCHEDULES ======
export const getCampaignVisitSchedules = async (req, res) => {
    try {
        const { campaignId } = req.params;

        const visits = await VisitSchedule.find({ campaignId })
            .populate("employeeId", "name phone position")
            .populate("retailerId", "name contactNo shopDetails")
            .sort({ visitDate: 1 })
            .lean();

        res.status(200).json({
            campaignId,
            totalVisits: visits.length,
            visits,
        });
    } catch (err) {
        console.error("Fetch campaign visits error:", err);
        res.status(500).json({ message: "Server error" });
    }
};

// ====== ADMIN GET RETAILER REPORTS IN CAMPAIGN ======
export const adminGetRetailerReportsInCampaign = async (req, res) => {
    try {
        const { role } = req.user;

        if (role !== "admin") {
            return res.status(403).json({ message: "Access denied" });
        }

        const { campaignId, retailerId, fromDate, toDate } = req.query;

        if (!campaignId) {
            return res.status(400).json({ message: "campaignId is required" });
        }

        // -----------------------------------------------
        // Build Filter
        // -----------------------------------------------
        const filter = { campaignId };

        if (retailerId) filter.retailerId = retailerId;

        if (fromDate || toDate) {
            filter.createdAt = {};
            if (fromDate) filter.createdAt.$gte = new Date(fromDate);
            if (toDate) filter.createdAt.$lte = new Date(toDate);
        }

        // -----------------------------------------------
        // Fetch Reports with Population
        // -----------------------------------------------
        const reports = await EmployeeReport.find(filter)
            .populate(
                "retailerId",
                "name uniqueId retailerCode contactNo shopDetails"
            )
            .populate("employeeId", "name phone email position employeeId") // 👈 Added employeeId field
            .populate("campaignId", "name type client")
            .populate("visitScheduleId", "visitDate status visitType")
            .sort({ createdAt: -1 });

        if (!reports.length) {
            return res.status(200).json({
                message: "No retailer reports found for this campaign",
                totalReports: 0,
                reports: [],
            });
        }

        // -----------------------------------------------
        // Buffer → Base64 Helpers
        // -----------------------------------------------
        const convertImages = (imgs = []) =>
            imgs.map((img) => ({
                fileName: img.fileName || "",
                contentType: img.contentType || "image/jpeg",
                base64: `data:${img.contentType};base64,${img.data.toString(
                    "base64"
                )}`,
            }));

        const convertBillCopy = (bill) => {
            if (!bill || !bill.data) return null;

            return {
                fileName: bill.fileName || "",
                contentType: bill.contentType || "application/pdf",
                base64: `data:${bill.contentType};base64,${bill.data.toString(
                    "base64"
                )}`,
            };
        };

        // -----------------------------------------------
        // Final Frontend-Aligned Response
        // -----------------------------------------------
        const finalReports = reports.map((r) => ({
            ...r._doc,

            // Correct images & bill copy formats
            images: convertImages(r.images),
            billCopy: convertBillCopy(r.billCopy),

            // Employee info
            employeeName: r.employeeId?.name || "",
            employeePhone: r.employeeId?.phone || "",
            employeeEmail: r.employeeId?.email || "",
            employeePosition: r.employeeId?.position || "",

            // 🔥 Added employee's unique auto-generated ID
            employeeUniqueId: r.employeeId?.employeeId || "",

            // Retailer info
            retailerName: r.retailerId?.name || "",
            retailerUniqueId: r.retailerId?.uniqueId || "",
            retailerCode: r.retailerId?.retailerCode || "",
            retailerContact: r.retailerId?.contactNo || "",

            shopName: r.retailerId?.shopDetails?.shopName || "",
            shopCity: r.retailerId?.shopDetails?.shopAddress?.city || "",
            shopState: r.retailerId?.shopDetails?.shopAddress?.state || "",
            shopPincode: r.retailerId?.shopDetails?.shopAddress?.pincode || "",

            // Campaign info
            campaignName: r.campaignId?.name || "",
            campaignType: r.campaignId?.type || "",
            clientName: r.campaignId?.client || "",

            // Visit details
            visitDate: r.visitScheduleId?.visitDate || "",
            visitStatus: r.visitScheduleId?.status || "",
            visitType: r.visitScheduleId?.visitType || "",

            // Report fields
            reportType: r.reportType || "",
            frequency: r.frequency || "",
            stockType: r.stockType || "",
            productType: r.productType || "",
            brand: r.brand || "",
            product: r.product || "",
            sku: r.sku || "",
            quantity: r.quantity || "",
            location: r.location || "",
            attended: r.attended || "",
            notVisitedReason: r.notVisitedReason || "",
            otherReasonText: r.otherReasonText || "",
            extraField: r.extraField || "",
            submittedByRole: r.submittedByRole || "",
        }));

        return res.status(200).json({
            message: "Retailer reports for campaign fetched successfully",
            totalReports: finalReports.length,
            reports: finalReports,
        });
    } catch (err) {
        console.error("Admin retailer campaign reports error:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

// ====== UPDATE CAMPAIGN PAYMENT ======
export const updateCampaignPayment = async (req, res) => {
    try {
        const { campaignId, retailerId, amountPaid, utrNumber } = req.body;

        if (!req.user || req.user.role !== "admin")
            return res
                .status(403)
                .json({ message: "Only admins can update payments" });

        const campaign = await Campaign.findById(campaignId);
        if (!campaign)
            return res.status(404).json({ message: "Campaign not found" });

        const assignedRetailer = campaign.assignedRetailers.find(
            (r) => r.retailerId.toString() === retailerId.toString()
        );

        if (!assignedRetailer || assignedRetailer.status !== "accepted")
            return res.status(400).json({
                message: "Retailer has not accepted this campaign yet",
            });

        const payment = await Payment.findOne({
            campaign: campaignId,
            retailer: retailerId,
        });
        if (!payment)
            return res.status(404).json({ message: "Payment plan not found" });

        // Update amountPaid
        if (amountPaid !== undefined) {
            payment.amountPaid += amountPaid; // add the new payment
        }

        // Track UTR numbers as an array
        if (utrNumber) {
            payment.utrNumbers = payment.utrNumbers || [];
            payment.utrNumbers.push({
                utrNumber,
                amount: amountPaid || 0,
                date: new Date(),
                updatedBy: req.user._id,
            });
        }

        // Update remaining amount
        payment.remainingAmount = payment.totalAmount - payment.amountPaid;
        payment.lastUpdatedByAdmin = req.user._id;

        // Update payment status
        if (payment.amountPaid === 0) {
            payment.paymentStatus = "Pending";
        } else if (payment.amountPaid < payment.totalAmount) {
            payment.paymentStatus = "Partially Paid";
        } else {
            payment.paymentStatus = "Completed";
        }

        await payment.save();

        res.status(200).json({
            message: "Payment updated successfully",
            payment,
        });
    } catch (error) {
        console.error("Error updating campaign payment:", error);
        res.status(500).json({ message: error.message });
    }
};

// ====== GET CAMPAIGN PAYMENTS ======
export const getCampaignPayments = async (req, res) => {
    try {
        const { campaignId } = req.params;
        const payments = await Payment.find({ campaign: campaignId })
            .populate("retailer", "name email")
            .populate("createdByClient", "name")
            .populate("lastUpdatedByAdmin", "name")
            .sort({ updatedAt: -1 });

        res.status(200).json({ payments });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

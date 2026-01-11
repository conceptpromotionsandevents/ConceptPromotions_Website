import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import nodemailer from "nodemailer";
import XLSX from "xlsx";
import { Retailer } from "../models/retailer.model.js";
import {
    Admin,
    Campaign,
    CareerApplication,
    ClientAdmin,
    ClientUser,
    Employee,
   
    Job,
    JobApplication,
   
    // Retailer,
    VisitSchedule,
} from "../models/user.js";



export const updateEmployeeReport = async (req, res) => {
    try {
        const { reportId } = req.params;

        const report = await EmployeeReport.findById(reportId);
        if (!report) {
            return res.status(404).json({ message: "Report not found" });
        }

        // Only admin or the employee who created it
        const isAdmin = req.user.role === "admin";
        const isOwner = req.user.id === report.submittedByEmployee?.toString();

        if (!isAdmin && !isOwner) {
            return res.status(403).json({ message: "Permission denied" });
        }

        // Make sure req.body exists
        const body = req.body || {};

        const fields = [
            "visitType",
            "attended",
            "notVisitedReason",
            "otherReasonText",
            "reportType",
            "frequency",
            "fromDate",
            "toDate",
            "extraField",
            "stockType",
            "brand",
            "product",
            "sku",
            "productType",
            "quantity",
            "location",
        ];

        fields.forEach((field) => {
            if (Object.prototype.hasOwnProperty.call(body, field)) {
                if (field === "location") {
                    try {
                        report.location =
                            typeof body.location === "string"
                                ? JSON.parse(body.location)
                                : body.location;
                    } catch {
                        console.log("Invalid location JSON");
                    }
                } else {
                    report[field] = body[field];
                }
            }
        });

        // --- Remove old images ----
        if (body.removedImageIndices) {
            try {
                const removeList = JSON.parse(body.removedImageIndices);
                report.images = report.images.filter(
                    (_, i) => !removeList.includes(i)
                );
            } catch {
                console.log("Invalid removedImageIndices");
            }
        }

        // --- Add NEW images ---
        if (req.files?.images?.length > 0) {
            const newImages = req.files.images.map((img) => ({
                data: img.buffer,
                contentType: img.mimetype,
                fileName: img.originalname,
            }));
            report.images = [...(report.images || []), ...newImages];
        }

        /* ---------------------------------------------------------
       🔥 MULTIPLE BILL COPIES SUPPORT (ONLY THIS PART ADDED)
    --------------------------------------------------------- */

        // Ensure billCopies array exists
        if (!Array.isArray(report.billCopies)) {
            report.billCopies = [];
        }

        // Add NEW bill copy files
        if (req.files?.billCopy?.length > 0) {
            const newBills = req.files.billCopy.map((file) => ({
                data: file.buffer,
                contentType: file.mimetype,
                fileName: file.originalname,
            }));

            report.billCopies = [...report.billCopies, ...newBills];
        }

        // Optional: remove bill copies by index
        if (body.removedBillIndices) {
            try {
                const removeList = JSON.parse(body.removedBillIndices);
                report.billCopies = report.billCopies.filter(
                    (_, i) => !removeList.includes(i)
                );
            } catch {
                console.log("Invalid removedBillIndices");
            }
        }

        /* ------------------------------------------------------- */

        await report.save();

        res.status(200).json({ message: "Report updated", report });
    } catch (error) {
        console.error("Update report error:", error);
        return res
            .status(500)
            .json({ message: "Server error", error: error.message });
    }
};
/* ======================================================
   GET ALL REPORTS OF LOGGED-IN EMPLOYEE (WITH FILTERS)
====================================================== */
export const getAllEmployeeReports = async (req, res) => {
    try {
        const { role } = req.user;
        const { campaignId, employeeId, retailerId, fromDate, toDate } =
            req.query;

        // ----------------------------------------------------
        // Admin / Client Admin ONLY
        // ----------------------------------------------------
        if (!["admin", "client_admin", "client_user"].includes(role)) {
            return res.status(403).json({ message: "Access denied" });
        }

        // ----------------------------------------------------
        // Campaign is REQUIRED
        // ----------------------------------------------------
        if (!campaignId) {
            return res.status(400).json({ message: "campaignId is required" });
        }

        // ----------------------------------------------------
        // Build filter
        // ----------------------------------------------------
        const filter = { campaignId };

        if (employeeId) filter.employeeId = employeeId;
        if (retailerId) filter.retailerId = retailerId;

        if (fromDate || toDate) {
            filter.createdAt = {};
            if (fromDate) filter.createdAt.$gte = new Date(fromDate);
            if (toDate) filter.createdAt.$lte = new Date(toDate);
        }

        // ----------------------------------------------------
        // Fetch reports
        // ----------------------------------------------------
        const reports = await EmployeeReport.find(filter)
            .populate("employeeId", "name email phone position")
            .populate("campaignId", "name type client")
            .populate(
                "retailerId",
                "name uniqueId retailerCode contactNo shopDetails"
            )
            .populate("visitScheduleId", "visitDate status visitType")
            .sort({ createdAt: -1 })
            .lean();

        if (!reports.length) {
            return res.status(200).json({
                message: "No reports found for this campaign",
                totalReports: 0,
                reports: [],
            });
        }

        // ----------------------------------------------------
        // Flatten for frontend
        // ----------------------------------------------------
        const finalReports = reports.map((r) => ({
            ...r,

            employeeName: r.employeeId?.name || "",
            employeePhone: r.employeeId?.phone || "",
            employeeEmail: r.employeeId?.email || "",
            employeePosition: r.employeeId?.position || "",

            retailerName: r.retailerId?.name || "",
            retailerUniqueId: r.retailerId?.uniqueId || "",
            retailerCode: r.retailerId?.retailerCode || "",
            retailerContact: r.retailerId?.contactNo || "",
            shopName: r.retailerId?.shopDetails?.shopName || "",
            shopCity: r.retailerId?.shopDetails?.shopAddress?.city || "",
            shopState: r.retailerId?.shopDetails?.shopAddress?.state || "",
            shopPincode: r.retailerId?.shopDetails?.shopAddress?.pincode || "",

            campaignName: r.campaignId?.name || "",
            campaignType: r.campaignId?.type || "",
            clientName: r.campaignId?.client || "",

            visitDate: r.visitScheduleId?.visitDate || null,
            visitStatus: r.visitScheduleId?.status || "",
            visitType: r.visitScheduleId?.visitType || "",
        }));

        return res.status(200).json({
            message: "Reports fetched successfully",
            totalReports: finalReports.length,
            reports: finalReports,
        });
    } catch (error) {
        console.error("Get all employee reports error:", error);
        res.status(500).json({
            message: "Server error",
            error: error.message,
        });
    }
};

export const getReportsByEmployeeId = async (req, res) => {
    try {
        const { employeeId } = req.params;

        if (!employeeId) {
            return res.status(400).json({ message: "employeeId is required" });
        }

        const reports = await EmployeeReport.find({ employeeId })
            .populate("campaignId") // full campaign details
            .populate("employeeId") // full employee details
            .populate({
                path: "retailerId",
                populate: [
                    { path: "shopDetails.shopAddress" },
                    { path: "shopDetails.outletPhoto" },
                ],
            })
            .populate("submittedByEmployee", "name email phone position")
            .populate("submittedByAdmin", "name email phone")
            .populate("submittedByRetailer", "name contactNo email uniqueId")
            .sort({ createdAt: -1 })
            .lean();

        // ⭐ Add frequency to each report (no other changes)
        const finalReports = reports.map((r) => ({
            ...r,
            frequency: r.frequency || "",
        }));

        res.status(200).json({
            message: "Reports fetched successfully",
            totalReports: finalReports.length,
            reports: finalReports,
        });
    } catch (err) {
        console.error("Error fetching employee reports:", err);
        res.status(500).json({ message: "Server error" });
    }
};

/* ======================================================
   DELETE EMPLOYEE REPORT (ADMIN ONLY)
   DELETE /api/reports/:reportId
====================================================== */
export const deleteEmployeeReport = async (req, res) => {
    try {
        const { reportId } = req.params;

        // Validate admin
        if (!req.user || req.user.role !== "admin") {
            return res.status(403).json({
                message: "Only admins can delete reports",
            });
        }

        // Validate ID
        if (!mongoose.Types.ObjectId.isValid(reportId)) {
            return res.status(400).json({ message: "Invalid report ID" });
        }

        // Check if exists
        const report = await EmployeeReport.findById(reportId);
        if (!report) {
            return res.status(404).json({ message: "Report not found" });
        }

        // Delete the report
        await EmployeeReport.deleteOne({ _id: reportId });

        return res.status(200).json({
            message: "Report deleted successfully",
            deletedReportId: reportId,
        });
    } catch (error) {
        console.error("Delete Employee Report Error:", error);
        return res.status(500).json({
            message: "Server error",
            error: error.message,
        });
    }
};

export const adminGetReportsByRetailer = async (req, res) => {
    try {
        const { role } = req.user;

        if (role !== "admin") {
            return res.status(403).json({ message: "Access denied" });
        }

        const { retailerId } = req.params;
        const { campaignId, fromDate, toDate } = req.query;

        if (!retailerId) {
            return res.status(400).json({ message: "retailerId is required" });
        }

        const filter = { retailerId };

        if (campaignId) filter.campaignId = campaignId;

        if (fromDate || toDate) {
            filter.createdAt = {};
            if (fromDate) filter.createdAt.$gte = new Date(fromDate);
            if (toDate) filter.createdAt.$lte = new Date(toDate);
        }

        const reports = await EmployeeReport.find(filter)
            .populate("campaignId", "name type client")
            .populate(
                "retailerId",
                "name uniqueId retailerCode contactNo shopDetails"
            )
            .populate("employeeId", "name email phone position")
            .populate("visitScheduleId", "visitDate status visitType")
            .sort({ createdAt: -1 })
            .lean();

        if (!reports.length) {
            return res.status(200).json({
                message: "No reports found for this retailer",
                totalReports: 0,
                reports: [],
            });
        }

        const finalReports = reports.map((r) => ({
            ...r,

            submittedByRole: r.submittedByRole,

            retailerName: r.retailerId?.name || "",
            retailerCode: r.retailerId?.retailerCode || "",
            retailerUniqueId: r.retailerId?.uniqueId || "",
            retailerContact: r.retailerId?.contactNo || "",

            shopName: r.retailerId?.shopDetails?.shopName || "",
            shopCity: r.retailerId?.shopDetails?.shopAddress?.city || "",
            shopState: r.retailerId?.shopDetails?.shopAddress?.state || "",
            shopPincode: r.retailerId?.shopDetails?.shopAddress?.pincode || "",

            campaignName: r.campaignId?.name || "",
            campaignType: r.campaignId?.type || "",
            clientName: r.campaignId?.client || "",

            employeeName: r.employeeId?.name || "",
            employeePhone: r.employeeId?.phone || "",
            employeeEmail: r.employeeId?.email || "",
            employeePosition: r.employeeId?.position || "",

            visitDate: r.visitScheduleId?.visitDate || "",
            visitStatus: r.visitScheduleId?.status || "",
            visitType: r.visitScheduleId?.visitType || "",
        }));

        res.status(200).json({
            message: "Retailer-specific reports fetched successfully",
            totalReports: finalReports.length,
            reports: finalReports,
        });
    } catch (err) {
        console.error("Admin retailer reports error:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

export const adminSetPaymentPlan = async (req, res) => {
    try {
        const { campaignId, retailerId, totalAmount, notes } = req.body;

        // 🔐 Only ADMIN allowed
        if (!req.user || req.user.role !== "admin") {
            return res
                .status(403)
                .json({ message: "Only admins can set payment plans" });
        }

        // 1️⃣ Validate Campaign
        const campaign = await Campaign.findById(campaignId);
        if (!campaign)
            return res.status(404).json({ message: "Campaign not found" });

        // 2️⃣ Check retailer is assigned to this campaign
        const isAssigned = campaign.assignedRetailers.some(
            (r) => r.retailerId.toString() === retailerId.toString()
        );

        if (!isAssigned) {
            return res
                .status(400)
                .json({ message: "Retailer is not assigned to this campaign" });
        }

        // 3️⃣ Avoid duplicate payment plan creation
        const existing = await Payment.findOne({
            campaign: campaignId,
            retailer: retailerId,
        });

        if (existing) {
            return res.status(400).json({
                message:
                    "Payment plan already exists for this retailer in this campaign",
                payment: existing,
            });
        }

        // 4️⃣ Create new payment plan
        const payment = await Payment.create({
            retailer: retailerId,
            campaign: campaignId,
            totalAmount,
            amountPaid: 0,
            remainingAmount: totalAmount,
            paymentStatus: "Pending",
            notes,
            lastUpdatedByAdmin: req.user._id,
        });

        return res.status(201).json({
            message: "Payment plan created successfully by admin",
            payment,
        });
    } catch (error) {
        console.error("Admin Set Payment Error:", error);
        res.status(500).json({ message: error.message });
    }
};

export const adminUpdatePaymentPlan = async (req, res) => {
    try {
        const { campaignId, retailerId, amountPaid, utrNumber } = req.body;

        // 🔐 Only admin can access this
        if (!req.user || req.user.role !== "admin") {
            return res
                .status(403)
                .json({ message: "Only admins can update payments" });
        }

        // 1️⃣ Validate Campaign
        const campaign = await Campaign.findById(campaignId);
        if (!campaign) {
            return res.status(404).json({ message: "Campaign not found" });
        }

        // 2️⃣ Check retailer is part of campaign & accepted
        const assigned = campaign.assignedRetailers.find(
            (r) => r.retailerId.toString() === retailerId.toString()
        );

        if (!assigned || assigned.status !== "accepted") {
            return res.status(400).json({
                message:
                    "Retailer has not accepted this campaign yet or is not assigned",
            });
        }

        // 3️⃣ Fetch payment plan
        const payment = await Payment.findOne({
            campaign: campaignId,
            retailer: retailerId,
        });

        if (!payment) {
            return res.status(404).json({ message: "Payment plan not found" });
        }

        // 4️⃣ Apply updates
        let updated = false;

        // Add amount
        if (amountPaid !== undefined) {
            payment.amountPaid += amountPaid;
            updated = true;
        }

        // Add UTR entry
        if (utrNumber) {
            payment.utrNumbers.push({
                utrNumber,
                amount: amountPaid || 0,
                date: new Date(),
                updatedBy: req.user._id,
            });
            updated = true;
        }

        // Update balances
        payment.remainingAmount = payment.totalAmount - payment.amountPaid;

        // Prevent negative balance
        if (payment.remainingAmount < 0) {
            return res
                .status(400)
                .json({ message: "Paid amount exceeds total amount!" });
        }

        // Update payment status
        if (payment.amountPaid === 0) {
            payment.paymentStatus = "Pending";
        } else if (payment.amountPaid < payment.totalAmount) {
            payment.paymentStatus = "Partially Paid";
        } else {
            payment.paymentStatus = "Completed";
        }

        // Save updater admin
        payment.lastUpdatedByAdmin = req.user._id;

        // Save
        if (updated) await payment.save();

        res.status(200).json({
            message: "Payment updated successfully by admin",
            payment,
        });
    } catch (error) {
        console.error("Admin payment update error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
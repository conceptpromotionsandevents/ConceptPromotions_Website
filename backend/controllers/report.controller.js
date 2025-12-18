// controllers/report.controller.js
import {
    Report,
    WindowDisplayReport,
    StockReport,
    OthersReport,
} from "../models/report.model.js";
import { Employee } from "../models/user.js";
import { Retailer } from "../models/user.js";
import { VisitSchedule } from "../models/user.js";
import { Campaign } from "../models/user.js";

/* ===============================
   HELPER: GET CORRECT MODEL BY REPORT TYPE
=============================== */
const getReportModel = (reportType) => {
    switch (reportType) {
        case "Window Display":
            return WindowDisplayReport;
        case "Stock":
            return StockReport;
        case "Others":
            return OthersReport;
        default:
            return Report;
    }
};

/* ===============================
   CREATE REPORT
=============================== */
export const createReport = async (req, res) => {
    try {
        const {
            reportType,
            campaignId,
            submittedBy,
            retailer,
            employee,
            visitScheduleId,
            typeOfVisit,
            attendedVisit,
            reasonForNonAttendance,
            frequency,
            dateOfSubmission,
            remarks,
            location,
            // Type-specific fields
            stockType,
            brand,
            product,
            sku,
            productType,
            quantity,
        } = req.body;

        // Validate required fields
        if (!reportType || !campaignId || !submittedBy || !retailer) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields",
            });
        }

        // Validate campaign exists
        const campaign = await Campaign.findById(campaignId);
        if (!campaign) {
            return res.status(404).json({
                success: false,
                message: "Campaign not found",
            });
        }

        // Validate retailer exists
        const retailerDoc = await Retailer.findById(retailer.retailerId);
        if (!retailerDoc) {
            return res.status(404).json({
                success: false,
                message: "Retailer not found",
            });
        }

        // If employee submission, validate employee
        if (submittedBy.role === "Employee" && employee?.employeeId) {
            const employeeDoc = await Employee.findById(employee.employeeId);
            if (!employeeDoc) {
                return res.status(404).json({
                    success: false,
                    message: "Employee not found",
                });
            }
        }

        // If attendedVisit is 'no', we don't need frequency or type-specific data
        if (attendedVisit === "no") {
            if (
                !reasonForNonAttendance?.reason ||
                (reasonForNonAttendance.reason === "others" &&
                    !reasonForNonAttendance.otherReason)
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Reason for non-attendance is required",
                });
            }
        }

        // Build base report data
        const baseReportData = {
            reportType,
            campaignId,
            submittedBy,
            retailer,
            employee: employee || undefined,
            visitScheduleId: visitScheduleId || undefined,
            typeOfVisit: typeOfVisit || undefined,
            attendedVisit: attendedVisit || undefined,
            reasonForNonAttendance:
                attendedVisit === "no" ? reasonForNonAttendance : undefined,
            frequency: attendedVisit === "yes" ? frequency : undefined,
            dateOfSubmission: dateOfSubmission || new Date(),
            remarks,
            location: location || undefined,
        };

        // Get appropriate model based on report type
        const ReportModel = getReportModel(reportType);

        let reportData = { ...baseReportData };

        // Add type-specific data only if visit was attended
        if (attendedVisit === "yes" || submittedBy.role !== "Employee") {
            if (reportType === "Stock") {
                reportData = {
                    ...reportData,
                    stockType,
                    brand,
                    product,
                    sku,
                    productType,
                    quantity,
                };
            }
        }

        // Handle file uploads (images/bills/files)
        if (req.files) {
            if (
                reportType === "Window Display" &&
                req.files.shopDisplayImages
            ) {
                const images = Array.isArray(req.files.shopDisplayImages)
                    ? req.files.shopDisplayImages
                    : [req.files.shopDisplayImages];

                reportData.shopDisplayImages = images.map((file) => ({
                    data: file.data,
                    contentType: file.mimetype,
                    fileName: file.name,
                }));
            }

            if (reportType === "Stock" && req.files.billCopies) {
                const bills = Array.isArray(req.files.billCopies)
                    ? req.files.billCopies
                    : [req.files.billCopies];

                reportData.billCopies = bills.map((file) => ({
                    data: file.data,
                    contentType: file.mimetype,
                    fileName: file.name,
                }));
            }

            if (reportType === "Others" && req.files.files) {
                const otherFiles = Array.isArray(req.files.files)
                    ? req.files.files
                    : [req.files.files];

                reportData.files = otherFiles.map((file) => ({
                    data: file.data,
                    contentType: file.mimetype,
                    fileName: file.name,
                }));
            }
        }

        // Create report
        const newReport = new ReportModel(reportData);
        await newReport.save();

        // If visit was attended and linked to schedule, update visit status
        if (visitScheduleId && attendedVisit === "yes") {
            await VisitSchedule.findByIdAndUpdate(visitScheduleId, {
                status: "Completed",
            });
        } else if (visitScheduleId && attendedVisit === "no") {
            await VisitSchedule.findByIdAndUpdate(visitScheduleId, {
                status: "Missed",
            });
        }

        return res.status(201).json({
            success: true,
            message: "Report created successfully",
            report: newReport,
        });
    } catch (error) {
        console.error("Create report error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error while creating report",
            error: error.message,
        });
    }
};

/* ===============================
   GET ALL REPORTS (WITH FILTERS)
=============================== */
export const getAllReports = async (req, res) => {
    try {
        const {
            campaignId,
            reportType,
            submittedByRole,
            retailerId,
            employeeId,
            startDate,
            endDate,
            page = 1,
            limit = 50,
        } = req.query;

        // Build filter object
        const filter = {};

        if (campaignId) filter.campaignId = campaignId;
        if (reportType) filter.reportType = reportType;
        if (submittedByRole) filter["submittedBy.role"] = submittedByRole;
        if (retailerId) filter["retailer.retailerId"] = retailerId;
        if (employeeId) filter["employee.employeeId"] = employeeId;

        if (startDate || endDate) {
            filter.dateOfSubmission = {};
            if (startDate) filter.dateOfSubmission.$gte = new Date(startDate);
            if (endDate) filter.dateOfSubmission.$lte = new Date(endDate);
        }

        // Pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const reports = await Report.find(filter)
            .populate("campaignId", "name client type")
            .populate("retailer.retailerId", "name shopDetails.shopName")
            .populate("employee.employeeId", "name employeeId")
            .populate("visitScheduleId")
            .sort({ dateOfSubmission: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Report.countDocuments(filter);

        return res.status(200).json({
            success: true,
            reports,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / parseInt(limit)),
            },
        });
    } catch (error) {
        console.error("Get reports error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error while fetching reports",
            error: error.message,
        });
    }
};

/* ===============================
   GET SINGLE REPORT BY ID
=============================== */
export const getReportById = async (req, res) => {
    try {
        const { id } = req.params;

        const report = await Report.findById(id)
            .populate("campaignId")
            .populate("retailer.retailerId")
            .populate("employee.employeeId")
            .populate("visitScheduleId")
            .populate("submittedBy.userId");

        if (!report) {
            return res.status(404).json({
                success: false,
                message: "Report not found",
            });
        }

        return res.status(200).json({
            success: true,
            report,
        });
    } catch (error) {
        console.error("Get report by ID error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error while fetching report",
            error: error.message,
        });
    }
};

/* ===============================
   UPDATE REPORT (ADMIN ONLY)
=============================== */
export const updateReport = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        // Find existing report
        const existingReport = await Report.findById(id);
        if (!existingReport) {
            return res.status(404).json({
                success: false,
                message: "Report not found",
            });
        }

        // If changing report type, need to handle discriminator change
        if (
            updateData.reportType &&
            updateData.reportType !== existingReport.reportType
        ) {
            // Delete old report and create new one with different type
            const oldData = existingReport.toObject();
            await Report.findByIdAndDelete(id);

            // Get new model
            const NewReportModel = getReportModel(updateData.reportType);

            // Merge old data with updates
            const newReportData = {
                ...oldData,
                ...updateData,
                _id: id, // Keep same ID
                reportType: updateData.reportType,
            };

            // Remove type-specific fields from old type
            delete newReportData.__v;
            delete newReportData.createdAt;
            delete newReportData.updatedAt;

            const newReport = new NewReportModel(newReportData);
            await newReport.save();

            return res.status(200).json({
                success: true,
                message: "Report type changed and updated successfully",
                report: newReport,
            });
        }

        // Handle file updates if provided
        if (req.files) {
            if (
                existingReport.reportType === "Window Display" &&
                req.files.shopDisplayImages
            ) {
                const images = Array.isArray(req.files.shopDisplayImages)
                    ? req.files.shopDisplayImages
                    : [req.files.shopDisplayImages];

                updateData.shopDisplayImages = images.map((file) => ({
                    data: file.data,
                    contentType: file.mimetype,
                    fileName: file.name,
                }));
            }

            if (existingReport.reportType === "Stock" && req.files.billCopies) {
                const bills = Array.isArray(req.files.billCopies)
                    ? req.files.billCopies
                    : [req.files.billCopies];

                updateData.billCopies = bills.map((file) => ({
                    data: file.data,
                    contentType: file.mimetype,
                    fileName: file.name,
                }));
            }

            if (existingReport.reportType === "Others" && req.files.files) {
                const otherFiles = Array.isArray(req.files.files)
                    ? req.files.files
                    : [req.files.files];

                updateData.files = otherFiles.map((file) => ({
                    data: file.data,
                    contentType: file.mimetype,
                    fileName: file.name,
                }));
            }
        }

        // Regular update for same report type
        const updatedReport = await Report.findByIdAndUpdate(id, updateData, {
            new: true,
            runValidators: true,
        });

        return res.status(200).json({
            success: true,
            message: "Report updated successfully",
            report: updatedReport,
        });
    } catch (error) {
        console.error("Update report error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error while updating report",
            error: error.message,
        });
    }
};

/* ===============================
   DELETE REPORT (ADMIN ONLY)
=============================== */
export const deleteReport = async (req, res) => {
    try {
        const { id } = req.params;

        const report = await Report.findByIdAndDelete(id);

        if (!report) {
            return res.status(404).json({
                success: false,
                message: "Report not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Report deleted successfully",
        });
    } catch (error) {
        console.error("Delete report error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error while deleting report",
            error: error.message,
        });
    }
};

/* ===============================
   GET REPORTS BY CAMPAIGN
=============================== */
export const getReportsByCampaign = async (req, res) => {
    try {
        const { campaignId } = req.params;
        const { reportType } = req.query;

        const filter = { campaignId };
        if (reportType) filter.reportType = reportType;

        const reports = await Report.find(filter)
            .populate("retailer.retailerId", "name shopDetails")
            .populate("employee.employeeId", "name employeeId")
            .sort({ dateOfSubmission: -1 });

        return res.status(200).json({
            success: true,
            count: reports.length,
            reports,
        });
    } catch (error) {
        console.error("Get campaign reports error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error while fetching campaign reports",
            error: error.message,
        });
    }
};

/* ===============================
   GET REPORTS BY EMPLOYEE
=============================== */
export const getReportsByEmployee = async (req, res) => {
    try {
        const { employeeId } = req.params;

        const reports = await Report.find({
            "employee.employeeId": employeeId,
        })
            .populate("campaignId", "name client")
            .populate("retailer.retailerId", "name shopDetails.shopName")
            .sort({ dateOfSubmission: -1 });

        return res.status(200).json({
            success: true,
            count: reports.length,
            reports,
        });
    } catch (error) {
        console.error("Get employee reports error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error while fetching employee reports",
            error: error.message,
        });
    }
};

/* ===============================
   GET REPORTS BY RETAILER
=============================== */
export const getReportsByRetailer = async (req, res) => {
    try {
        const { retailerId } = req.params;

        const reports = await Report.find({
            "retailer.retailerId": retailerId,
        })
            .populate("campaignId", "name client")
            .populate("employee.employeeId", "name employeeId")
            .sort({ dateOfSubmission: -1 });

        return res.status(200).json({
            success: true,
            count: reports.length,
            reports,
        });
    } catch (error) {
        console.error("Get retailer reports error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error while fetching retailer reports",
            error: error.message,
        });
    }
};

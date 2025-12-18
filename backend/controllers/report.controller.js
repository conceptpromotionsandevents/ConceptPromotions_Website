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
        console.log("BODY:", req.body);
        console.log("FILES:", req.files);

        // When using multer with FormData, nested objects like submittedBy / retailer
        // should be sent from frontend as bracket-style fields:
        // submittedBy[role], submittedBy[userId], retailer[retailerId], etc.
        // So we reconstruct them here.
        const {
            reportType,
            campaignId,
            visitScheduleId,
            typeOfVisit,
            attendedVisit,
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

        const submittedBy =
            req.body.submittedBy && typeof req.body.submittedBy === "object"
                ? req.body.submittedBy
                : {
                      role: req.body["submittedBy[role]"],
                      userId: req.body["submittedBy[userId]"],
                  };

        const retailerObj =
            req.body.retailer && typeof req.body.retailer === "object"
                ? req.body.retailer
                : {
                      retailerId: req.body["retailer[retailerId]"],
                      outletName: req.body["retailer[outletName]"],
                      retailerName: req.body["retailer[retailerName]"],
                      outletCode: req.body["retailer[outletCode]"],
                  };

        let employeeObj;
        if (req.body.employee && typeof req.body.employee === "object") {
            employeeObj = req.body.employee;
        } else if (req.body["employee[employeeId]"]) {
            employeeObj = {
                employeeId: req.body["employee[employeeId]"],
                employeeName: req.body["employee[employeeName]"],
                employeeCode: req.body["employee[employeeCode]"],
            };
        }

        const reasonForNonAttendance =
            req.body.reasonForNonAttendance &&
            typeof req.body.reasonForNonAttendance === "object"
                ? req.body.reasonForNonAttendance
                : req.body["reasonForNonAttendance[reason]"]
                ? {
                      reason: req.body["reasonForNonAttendance[reason]"],
                      otherReason:
                          req.body["reasonForNonAttendance[otherReason]"],
                  }
                : undefined;

        // Validate required fields
        if (!reportType || !campaignId || !submittedBy || !retailerObj) {
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
        const retailerDoc = await Retailer.findById(retailerObj.retailerId);
        if (!retailerDoc) {
            return res.status(404).json({
                success: false,
                message: "Retailer not found",
            });
        }

        // If employee submission, validate employee
        if (submittedBy.role === "Employee" && employeeObj?.employeeId) {
            const employeeDoc = await Employee.findById(employeeObj.employeeId);
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
            retailer: retailerObj,
            employee: employeeObj || undefined,
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

        // Handle file uploads (images/bills/files) with multer (memoryStorage)
        // upload.fields([{ name: "shopDisplayImages" }, { name: "billCopies" }, { name: "files" }])
        if (req.files) {
            if (
                reportType === "Window Display" &&
                req.files.shopDisplayImages
            ) {
                const images = Array.isArray(req.files.shopDisplayImages)
                    ? req.files.shopDisplayImages
                    : [req.files.shopDisplayImages];

                reportData.shopDisplayImages = images.map((file) => ({
                    data: file.buffer, // multer: buffer
                    contentType: file.mimetype,
                    fileName: file.originalname,
                }));
            }

            if (reportType === "Stock" && req.files.billCopies) {
                const bills = Array.isArray(req.files.billCopies)
                    ? req.files.billCopies
                    : [req.files.billCopies];

                reportData.billCopies = bills.map((file) => ({
                    data: file.buffer,
                    contentType: file.mimetype,
                    fileName: file.originalname,
                }));
            }

            if (reportType === "Others" && req.files.files) {
                const otherFiles = Array.isArray(req.files.files)
                    ? req.files.files
                    : [req.files.files];

                reportData.files = otherFiles.map((file) => ({
                    data: file.buffer,
                    contentType: file.mimetype,
                    fileName: file.originalname,
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
   UPDATE REPORT (ADMIN ONLY) - FIXED VERSION
=============================== */
export const updateReport = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = { ...req.body };

        console.log("UPDATE BODY:", req.body);
        console.log("UPDATE FILES:", req.files);

        // Reconstruct nested objects if needed
        if (req.body["retailer[retailerId]"]) {
            updateData.retailer = {
                retailerId: req.body["retailer[retailerId]"],
                outletName: req.body["retailer[outletName]"],
                retailerName: req.body["retailer[retailerName]"],
                outletCode: req.body["retailer[outletCode]"],
            };
        }
        if (req.body["employee[employeeId]"]) {
            updateData.employee = {
                employeeId: req.body["employee[employeeId]"],
                employeeName: req.body["employee[employeeName]"],
                employeeCode: req.body["employee[employeeCode]"],
            };
        }

        // Find existing report
        const existingReport = await Report.findById(id);
        if (!existingReport) {
            return res.status(404).json({
                success: false,
                message: "Report not found",
            });
        }

        const oldReportType = existingReport.reportType;
        const newReportType = updateData.reportType || oldReportType;

        // ✅ Process new file uploads BEFORE type change
        const processedFiles = {};

        if (req.files && Object.keys(req.files).length > 0) {
            if (req.files.shopDisplayImages) {
                const images = Array.isArray(req.files.shopDisplayImages)
                    ? req.files.shopDisplayImages
                    : [req.files.shopDisplayImages];

                processedFiles.shopDisplayImages = images.map((file) => ({
                    data: file.buffer,
                    contentType: file.mimetype,
                    fileName: file.originalname,
                    uploadedAt: new Date(),
                }));
            }

            if (req.files.billCopies) {
                const bills = Array.isArray(req.files.billCopies)
                    ? req.files.billCopies
                    : [req.files.billCopies];

                processedFiles.billCopies = bills.map((file) => ({
                    data: file.buffer,
                    contentType: file.mimetype,
                    fileName: file.originalname,
                    uploadedAt: new Date(),
                }));
            }

            if (req.files.files) {
                const otherFiles = Array.isArray(req.files.files)
                    ? req.files.files
                    : [req.files.files];

                processedFiles.files = otherFiles.map((file) => ({
                    data: file.buffer,
                    contentType: file.mimetype,
                    fileName: file.originalname,
                    uploadedAt: new Date(),
                }));
            }
        }

        // ✅ HANDLE REPORT TYPE CHANGE
        if (newReportType !== oldReportType) {
            console.log(
                `🔄 Changing report type from ${oldReportType} to ${newReportType}`
            );

            // Delete old report
            await Report.findByIdAndDelete(id);

            // Get new discriminator model
            const NewReportModel = getReportModel(newReportType);

            // Build new report data - ONLY keep base fields
            const newReportData = {
                _id: id,
                reportType: newReportType,
                campaignId: existingReport.campaignId,
                submittedBy:
                    updateData.submittedBy || existingReport.submittedBy,
                retailer: updateData.retailer || existingReport.retailer,
                employee: updateData.employee || existingReport.employee,
                frequency: updateData.frequency || existingReport.frequency,
                dateOfSubmission:
                    updateData.dateOfSubmission ||
                    existingReport.dateOfSubmission,
                remarks: updateData.remarks || existingReport.remarks,
                visitScheduleId: existingReport.visitScheduleId,
                typeOfVisit: existingReport.typeOfVisit,
                attendedVisit: existingReport.attendedVisit,
                reasonForNonAttendance: existingReport.reasonForNonAttendance,
                location: existingReport.location,
            };

            // ✅ Add type-specific fields based on NEW report type
            if (newReportType === "Stock") {
                newReportData.stockType = updateData.stockType;
                newReportData.brand = updateData.brand;
                newReportData.product = updateData.product;
                newReportData.sku = updateData.sku;
                newReportData.productType = updateData.productType;
                newReportData.quantity = updateData.quantity;

                // Add new bill copies if uploaded
                if (processedFiles.billCopies) {
                    newReportData.billCopies = processedFiles.billCopies;
                }
            } else if (newReportType === "Window Display") {
                // Add new shop display images if uploaded
                if (processedFiles.shopDisplayImages) {
                    newReportData.shopDisplayImages =
                        processedFiles.shopDisplayImages;
                }
            } else if (newReportType === "Others") {
                // Add new files if uploaded
                if (processedFiles.files) {
                    newReportData.files = processedFiles.files;
                }
            }

            // Create and save new report
            const newReport = new NewReportModel(newReportData);
            await newReport.save();

            console.log(
                `✅ Report type changed successfully. New files: ${JSON.stringify(
                    Object.keys(processedFiles)
                )}`
            );

            return res.status(200).json({
                success: true,
                message: "Report type changed and updated successfully",
                report: newReport,
            });
        }

        // ✅ SAME REPORT TYPE - Regular update
        // Add processed files to updateData based on current report type
        if (
            oldReportType === "Window Display" &&
            processedFiles.shopDisplayImages
        ) {
            updateData.shopDisplayImages = processedFiles.shopDisplayImages;
        } else if (oldReportType === "Stock" && processedFiles.billCopies) {
            updateData.billCopies = processedFiles.billCopies;
        } else if (oldReportType === "Others" && processedFiles.files) {
            updateData.files = processedFiles.files;
        }

        // Update the report
        const updatedReport = await Report.findByIdAndUpdate(id, updateData, {
            new: true,
            runValidators: true,
        });

        console.log("✅ Report updated successfully (same type)");

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

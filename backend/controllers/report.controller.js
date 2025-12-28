// controllers/report.controller.js
import {
    OthersReport,
    Report,
    StockReport,
    WindowDisplayReport,
} from "../models/report.model.js";
import { Employee } from "../models/user.js";
// import { Retailer } from "../models/user.js";
import { Retailer } from "../models/retailer.model.js";
import { Campaign, VisitSchedule } from "../models/user.js";

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
        if (!campaignId || !submittedBy || !retailerObj) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields",
            });
        }

        // Additional validation for attended visits
        if (attendedVisit === "yes" && !reportType) {
            return res.status(400).json({
                success: false,
                message: "reportType is required for attended visits",
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
            campaignId,
            submittedBy,
            retailer: retailerObj,
            employee: employeeObj || undefined,
            visitScheduleId: visitScheduleId || undefined,
            typeOfVisit: typeOfVisit || undefined,
            attendedVisit: attendedVisit || undefined,
            reasonForNonAttendance:
                attendedVisit === "no" ? reasonForNonAttendance : undefined,
            frequency:
                submittedBy.role === "Retailer" ||
                (submittedBy.role === "Employee" && attendedVisit === "yes")
                    ? frequency
                    : undefined,
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
   GET ALL CLIENT REPORTS (WITH FILTERS)
=============================== */
export const getAllClientReports = async (req, res) => {
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

        // Add filter to only include specific reportTypes
        filter.reportType = {
            $in: ["Window Display", "Stock", "Others"],
        };

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

        // Parse removed indices (they come as JSON strings from FormData)
        const removedImageIndices = req.body.removedImageIndices
            ? JSON.parse(req.body.removedImageIndices)
            : [];
        const removedBillIndices = req.body.removedBillIndices
            ? JSON.parse(req.body.removedBillIndices)
            : [];
        const removedFileIndices = req.body.removedFileIndices
            ? JSON.parse(req.body.removedFileIndices)
            : [];

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

        // Process new file uploads into plain objects
        const newFiles = {};

        if (req.files && Object.keys(req.files).length > 0) {
            if (req.files.shopDisplayImages) {
                const images = Array.isArray(req.files.shopDisplayImages)
                    ? req.files.shopDisplayImages
                    : [req.files.shopDisplayImages];

                newFiles.shopDisplayImages = images.map((file) => ({
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

                newFiles.billCopies = bills.map((file) => ({
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

                newFiles.files = otherFiles.map((file) => ({
                    data: file.buffer,
                    contentType: file.mimetype,
                    fileName: file.originalname,
                    uploadedAt: new Date(),
                }));
            }
        }

        // ---------- HANDLE REPORT TYPE CHANGE ----------
        if (newReportType !== oldReportType) {
            console.log(
                `🔄 Changing report type from ${oldReportType} to ${newReportType}`
            );

            await Report.findByIdAndDelete(id);
            const NewReportModel = getReportModel(newReportType);

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
                remarks:
                    updateData.remarks !== undefined
                        ? updateData.remarks
                        : existingReport.remarks,
                visitScheduleId: existingReport.visitScheduleId,
                typeOfVisit: existingReport.typeOfVisit,
                attendedVisit: existingReport.attendedVisit,
                reasonForNonAttendance: existingReport.reasonForNonAttendance,
                location: existingReport.location,
            };

            // Add type-specific fields based on NEW report type
            if (newReportType === "Stock") {
                newReportData.stockType = updateData.stockType;
                newReportData.brand = updateData.brand;
                newReportData.product = updateData.product;
                newReportData.sku = updateData.sku;
                newReportData.productType = updateData.productType;
                newReportData.quantity = updateData.quantity;

                if (newFiles.billCopies) {
                    newReportData.billCopies = newFiles.billCopies;
                }
            } else if (newReportType === "Window Display") {
                if (newFiles.shopDisplayImages) {
                    newReportData.shopDisplayImages =
                        newFiles.shopDisplayImages;
                }
            } else if (newReportType === "Others") {
                if (newFiles.files) {
                    newReportData.files = newFiles.files;
                }
            }

            const newReport = new NewReportModel(newReportData);
            await newReport.save();

            return res.status(200).json({
                success: true,
                message: "Report type changed and updated successfully",
                report: newReport,
            });
        }

        // ---------- SAME REPORT TYPE: HANDLE ARRAYS ON DOC, THEN SAVE ----------

        // Update common scalar fields on the existing doc
        if (updateData.frequency !== undefined) {
            existingReport.frequency = updateData.frequency;
        }
        if (updateData.remarks !== undefined) {
            existingReport.remarks = updateData.remarks;
        }
        if (updateData.retailer) {
            existingReport.retailer = updateData.retailer;
        }
        if (updateData.employee) {
            existingReport.employee = updateData.employee;
        }

        // Stock-specific scalar fields
        if (oldReportType === "Stock") {
            if (updateData.stockType)
                existingReport.stockType = updateData.stockType;
            if (updateData.brand) existingReport.brand = updateData.brand;
            if (updateData.product) existingReport.product = updateData.product;
            if (updateData.sku) existingReport.sku = updateData.sku;
            if (updateData.productType)
                existingReport.productType = updateData.productType;
            if (updateData.quantity)
                existingReport.quantity = updateData.quantity;
        }

        // Now handle file arrays directly on existingReport
        if (oldReportType === "Window Display") {
            let existingImages = existingReport.shopDisplayImages || [];

            console.log("Before removal - Image count:", existingImages.length);

            if (removedImageIndices.length > 0) {
                existingImages = existingImages.filter(
                    (_, idx) => !removedImageIndices.includes(idx)
                );
                console.log(
                    "After removal - Image count:",
                    existingImages.length
                );
            }

            if (newFiles.shopDisplayImages) {
                console.log(
                    "Adding new images:",
                    newFiles.shopDisplayImages.length
                );
                existingImages = [
                    ...existingImages,
                    ...newFiles.shopDisplayImages,
                ];
                console.log(
                    "After addition - Image count:",
                    existingImages.length
                );
            }

            existingReport.shopDisplayImages = existingImages;
            existingReport.markModified("shopDisplayImages");
        } else if (oldReportType === "Stock") {
            let existingBills = existingReport.billCopies || [];

            console.log("Before removal - Bill count:", existingBills.length);

            if (removedBillIndices.length > 0) {
                existingBills = existingBills.filter(
                    (_, idx) => !removedBillIndices.includes(idx)
                );
                console.log(
                    "After removal - Bill count:",
                    existingBills.length
                );
            }

            if (newFiles.billCopies) {
                console.log("Adding new bills:", newFiles.billCopies.length);
                existingBills = [...existingBills, ...newFiles.billCopies];
                console.log(
                    "After addition - Bill count:",
                    existingBills.length
                );
            }

            existingReport.billCopies = existingBills;
            existingReport.markModified("billCopies");
        } else if (oldReportType === "Others") {
            let existingFilesArr = existingReport.files || [];

            console.log(
                "Before removal - File count:",
                existingFilesArr.length
            );

            if (removedFileIndices.length > 0) {
                existingFilesArr = existingFilesArr.filter(
                    (_, idx) => !removedFileIndices.includes(idx)
                );
                console.log(
                    "After removal - File count:",
                    existingFilesArr.length
                );
            }

            if (newFiles.files) {
                console.log("Adding new files:", newFiles.files.length);
                existingFilesArr = [...existingFilesArr, ...newFiles.files];
                console.log(
                    "After addition - File count:",
                    existingFilesArr.length
                );
            }

            existingReport.files = existingFilesArr;
            existingReport.markModified("files");
        }

        // Finally save the existing document
        await existingReport.save();

        console.log("✅ Report updated and saved to MongoDB");

        return res.status(200).json({
            success: true,
            message: "Report updated successfully",
            report: existingReport,
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

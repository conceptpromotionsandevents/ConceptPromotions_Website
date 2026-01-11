// controllers/report.controller.js
import PDFDocument from "pdfkit";
import {
    OthersReport,
    Report,
    StockReport,
    WindowDisplayReport,
} from "../models/report.model.js";
import { Retailer } from "../models/retailer.model.js";
import { Campaign, Employee, VisitSchedule } from "../models/user.js";
import {
    deleteFromCloudinary,
    uploadToCloudinary,
    uploadToCloudinaryWithDetailsOverlay,
} from "../utils/cloudinary.config.js";
import { getResourceType } from "../utils/cloudinary.helper.js";

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
   CREATE REPORT - UPDATED FOR CLOUDINARY
=============================== */
export const createReport = async (req, res) => {
    try {
        console.log("BODY:", req.body);
        console.log("FILES:", req.files);

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

        /* =========================
           VALIDATION
        ========================== */
        if (!campaignId || !submittedBy || !retailerObj) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields",
            });
        }

        if (attendedVisit === "yes" && !reportType) {
            return res.status(400).json({
                success: false,
                message: "reportType is required for attended visits",
            });
        }

        const campaign = await Campaign.findById(campaignId);
        if (!campaign) {
            return res.status(404).json({
                success: false,
                message: "Campaign not found",
            });
        }

        const retailerDoc = await Retailer.findById(retailerObj.retailerId);
        if (!retailerDoc) {
            return res.status(404).json({
                success: false,
                message: "Retailer not found",
            });
        }

        if (submittedBy.role === "Employee" && employeeObj?.employeeId) {
            const employeeDoc = await Employee.findById(employeeObj.employeeId);
            if (!employeeDoc) {
                return res.status(404).json({
                    success: false,
                    message: "Employee not found",
                });
            }
        }

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

        /* =========================
           BUILD BASE REPORT DATA
        ========================== */
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

        const ReportModel = getReportModel(reportType);

        let reportData = { ...baseReportData };

        /* =========================
           ADD TYPE-SPECIFIC DATA
        ========================== */
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

        /* =========================
           UPLOAD FILES TO CLOUDINARY
        ========================== */
        if (req.files) {
            // Window Display Images
            if (
                reportType === "Window Display" &&
                req.files.shopDisplayImages
            ) {
                const images = Array.isArray(req.files.shopDisplayImages)
                    ? req.files.shopDisplayImages
                    : [req.files.shopDisplayImages];

                const uploadedImages = [];
                for (const file of images) {
                    try {
                        const result = await uploadToCloudinary(
                            file.buffer,
                            "reports/window-display",
                            "image"
                        );

                        uploadedImages.push({
                            url: result.secure_url,
                            publicId: result.public_id,
                            fileName: file.originalname,
                        });
                    } catch (err) {
                        return res.status(500).json({
                            success: false,
                            message: "Shop display image upload failed",
                            error: err.message,
                        });
                    }
                }
                reportData.shopDisplayImages = uploadedImages;
            }

            // Stock Bill Copies
            if (reportType === "Stock" && req.files.billCopies) {
                const bills = Array.isArray(req.files.billCopies)
                    ? req.files.billCopies
                    : [req.files.billCopies];

                const uploadedBills = [];
                for (const file of bills) {
                    try {
                        const result = await uploadToCloudinary(
                            file.buffer,
                            "reports/bills",
                            "raw" // For PDFs
                        );

                        uploadedBills.push({
                            url: result.secure_url,
                            publicId: result.public_id,
                            fileName: file.originalname,
                        });
                    } catch (err) {
                        return res.status(500).json({
                            success: false,
                            message: "Bill copy upload failed",
                            error: err.message,
                        });
                    }
                }
                reportData.billCopies = uploadedBills;
            }

            // Other Files
            if (reportType === "Others" && req.files.files) {
                const otherFiles = Array.isArray(req.files.files)
                    ? req.files.files
                    : [req.files.files];

                const uploadedFiles = [];
                for (const file of otherFiles) {
                    try {
                        const result = await uploadToCloudinary(
                            file.buffer,
                            "reports/others",
                            "raw" // For various file types
                        );

                        uploadedFiles.push({
                            url: result.secure_url,
                            publicId: result.public_id,
                            fileName: file.originalname,
                        });
                    } catch (err) {
                        return res.status(500).json({
                            success: false,
                            message: "File upload failed",
                            error: err.message,
                        });
                    }
                }
                reportData.files = uploadedFiles;
            }
        }

        /* =========================
           CREATE REPORT
        ========================== */
        const newReport = new ReportModel(reportData);
        await newReport.save();

        /* =========================
           UPDATE VISIT SCHEDULE
        ========================== */
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
   CREATE REPORT WITH GEOTAGS - NEW
=============================== */
export const createReportWithGeotags = async (req, res) => {
    try {
        console.log("BODY:", req.body);
        console.log("FILES:", req.files);

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

        /* =========================
           VALIDATION
        ========================== */
        if (!campaignId || !submittedBy || !retailerObj) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields",
            });
        }

        if (attendedVisit === "yes" && !reportType) {
            return res.status(400).json({
                success: false,
                message: "reportType is required for attended visits",
            });
        }

        const campaign = await Campaign.findById(campaignId);
        if (!campaign) {
            return res.status(404).json({
                success: false,
                message: "Campaign not found",
            });
        }

        const retailerDoc = await Retailer.findById(retailerObj.retailerId);
        if (!retailerDoc) {
            return res.status(404).json({
                success: false,
                message: "Retailer not found",
            });
        }

        if (submittedBy.role === "Employee" && employeeObj?.employeeId) {
            const employeeDoc = await Employee.findById(employeeObj.employeeId);
            if (!employeeDoc) {
                return res.status(404).json({
                    success: false,
                    message: "Employee not found",
                });
            }
        }

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

        /* =========================
           BUILD BASE REPORT DATA
        ========================== */
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

        const ReportModel = getReportModel(reportType);

        let reportData = { ...baseReportData };

        /* =========================
           ADD TYPE-SPECIFIC DATA
        ========================== */
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

        /* =========================
           UPLOAD FILES TO CLOUDINARY WITH GEOTAGS
        ========================== */
        if (req.files) {
            // ✅ Window Display Images WITH GEOTAGS - FIXED
            // ✅ Window Display Images WITH FULL DETAILS OVERLAY
            if (
                reportType === "Window Display" &&
                req.files.shopDisplayImages
            ) {
                const images = Array.isArray(req.files.shopDisplayImages)
                    ? req.files.shopDisplayImages
                    : [req.files.shopDisplayImages];

                const uploadedImages = [];

                // ✅ DEBUG: Log metadata structure
                console.log("🔍 All req.body keys:", Object.keys(req.body));
                console.log("🔍 shopDisplayImageMetadata type:", typeof req.body.shopDisplayImageMetadata);
                console.log("🔍 shopDisplayImageMetadata value:", req.body.shopDisplayImageMetadata);

                for (let i = 0; i < images.length; i++) {
                    const file = images[i];

                    // Check buffer
                    if (!file.buffer || file.buffer.length === 0) {
                        return res.status(400).json({
                            success: false,
                            message: `Image ${i + 1} has no data`,
                        });
                    }

                    // ✅ FIX: Access array element instead of string key
                    let geotag = {
                        latitude: 0,
                        longitude: 0,
                        accuracy: 0,
                        altitude: 0,
                    };

                    // Check if shopDisplayImageMetadata exists as an array
                    if (Array.isArray(req.body.shopDisplayImageMetadata) &&
                        req.body.shopDisplayImageMetadata[i]) {
                        try {
                            const metadataString = req.body.shopDisplayImageMetadata[i];
                            console.log(`🔍 Metadata string for image ${i}:`, metadataString);

                            const parsedGeotag = JSON.parse(metadataString);
                            console.log(`📍 Parsed geotag for image ${i}:`, parsedGeotag);

                            // ✅ Safe assignment
                            geotag.latitude = parsedGeotag.latitude || 0;
                            geotag.longitude = parsedGeotag.longitude || 0;
                            geotag.accuracy = parsedGeotag.accuracy || 0;
                            geotag.altitude = parsedGeotag.altitude || 0;
                            geotag.timestamp =
                                parsedGeotag.timestamp ||
                                new Date().toISOString();

                            console.log(`✅ Final geotag object for image ${i}:`, geotag);
                        } catch (e) {
                            console.log(
                                `⚠️ Invalid metadata for image ${i}:`,
                                e.message
                            );
                            geotag = { latitude: 0, longitude: 0 }; // Default fallback
                        }
                    } else {
                        console.log(`⚠️ No metadata found in array for image ${i}`);
                    }


                    console.log(`🚀 Uploading image ${i + 1} with geotag:`, {
                        lat: geotag.latitude,
                        lng: geotag.longitude,
                        hasCoords: geotag.latitude !== 0 && geotag.longitude !== 0
                    });

                    try {
                        // ✅ Upload with full details overlay
                        const result =
                            await uploadToCloudinaryWithDetailsOverlay(
                                file.buffer,
                                "reports/window-display-geotagged",
                                geotag
                            );

                        uploadedImages.push({
                            url: result.secure_url, // ✅ Has all details overlaid
                            publicId: result.public_id,
                            fileName: file.originalname,
                            geotag: {
                                latitude: geotag.latitude,
                                longitude: geotag.longitude,
                                accuracy: geotag.accuracy,
                                placeName:
                                    result.context?.custom?.geotag_place || "Unknown",
                                timestamp: geotag.timestamp,
                            },
                            hasOverlay: true,
                            width: result.width,
                            height: result.height,
                        });

                        console.log(
                            `✅ Image ${i + 1} uploaded successfully:`,
                            result.secure_url
                        );
                        console.log(`   Cloudinary context:`, result.context);
                    } catch (err) {
                        console.error(`❌ Image ${i + 1} failed:`, err.message);
                        return res.status(500).json({
                            success: false,
                            message: `Image ${i + 1} processing failed: ${
                                err.message
                            }`,
                        });
                    }
                }

                reportData.shopDisplayImages = uploadedImages;
            }

            // ✅ Stock Bill Copies
            if (reportType === "Stock" && req.files.billCopies) {
                const bills = Array.isArray(req.files.billCopies)
                    ? req.files.billCopies
                    : [req.files.billCopies];

                const uploadedBills = [];
                for (const file of bills) {
                    try {
                        const result = await uploadToCloudinary(
                            file.buffer,
                            "reports/bills",
                            "raw" // For PDFs
                        );

                        uploadedBills.push({
                            url: result.secure_url,
                            publicId: result.public_id,
                            fileName: file.originalname,
                        });
                    } catch (err) {
                        return res.status(500).json({
                            success: false,
                            message: "Bill copy upload failed",
                            error: err.message,
                        });
                    }
                }
                reportData.billCopies = uploadedBills;
            }

            // ✅ Other Files
            if (reportType === "Others" && req.files.files) {
                const otherFiles = Array.isArray(req.files.files)
                    ? req.files.files
                    : [req.files.files];

                const uploadedFiles = [];
                for (const file of otherFiles) {
                    try {
                        const result = await uploadToCloudinary(
                            file.buffer,
                            "reports/others",
                            "raw"
                        );

                        uploadedFiles.push({
                            url: result.secure_url,
                            publicId: result.public_id,
                            fileName: file.originalname,
                        });
                    } catch (err) {
                        return res.status(500).json({
                            success: false,
                            message: "File upload failed",
                            error: err.message,
                        });
                    }
                }
                reportData.files = uploadedFiles;
            }
        }

        /* =========================
           CREATE REPORT
        ========================== */
        const newReport = new ReportModel(reportData);
        await newReport.save();

        /* =========================
           UPDATE VISIT SCHEDULE
        ========================== */
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
            message: "Report created successfully with geotags",
            report: newReport,
        });
    } catch (error) {
        console.error("Create report with geotags error:", error);
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

        filter.reportType = {
            $in: ["Window Display", "Stock", "Others"],
        };

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
   UPDATE REPORT - UPDATED FOR CLOUDINARY
=============================== */
/* ===============================
   UPDATE REPORT (ADMIN ONLY) - WITH CLOUDINARY
=============================== */
export const updateReport = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = { ...req.body };

        console.log("UPDATE BODY:", req.body);
        console.log("UPDATE FILES:", req.files);

        // Parse removed indices
        const removedImageIndices = req.body.removedImageIndices
            ? JSON.parse(req.body.removedImageIndices)
            : [];
        const removedBillIndices = req.body.removedBillIndices
            ? JSON.parse(req.body.removedBillIndices)
            : [];
        const removedFileIndices = req.body.removedFileIndices
            ? JSON.parse(req.body.removedFileIndices)
            : [];

        // Reconstruct nested objects
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

        const existingReport = await Report.findById(id);
        if (!existingReport) {
            return res.status(404).json({
                success: false,
                message: "Report not found",
            });
        }

        const oldReportType = existingReport.reportType;
        const newReportType = updateData.reportType || oldReportType;

        /* =========================
           UPLOAD NEW FILES TO CLOUDINARY
        ========================== */
        const newFiles = {};

        if (req.files && Object.keys(req.files).length > 0) {
            // Upload shop display images
            if (req.files.shopDisplayImages) {
                const images = Array.isArray(req.files.shopDisplayImages)
                    ? req.files.shopDisplayImages
                    : [req.files.shopDisplayImages];

                const uploadedImages = [];
                for (const file of images) {
                    try {
                        const result = await uploadToCloudinary(
                            file.buffer,
                            "reports/window-display",
                            "image"
                        );

                        uploadedImages.push({
                            url: result.secure_url,
                            publicId: result.public_id,
                            fileName: file.originalname,
                        });
                    } catch (err) {
                        return res.status(500).json({
                            success: false,
                            message: "Image upload failed",
                            error: err.message,
                        });
                    }
                }
                newFiles.shopDisplayImages = uploadedImages;
            }

            // Upload bill copies
            if (req.files.billCopies) {
                const bills = Array.isArray(req.files.billCopies)
                    ? req.files.billCopies
                    : [req.files.billCopies];

                const uploadedBills = [];
                for (const file of bills) {
                    try {
                        const result = await uploadToCloudinary(
                            file.buffer,
                            "reports/bills",
                            "raw"
                        );

                        uploadedBills.push({
                            url: result.secure_url,
                            publicId: result.public_id,
                            fileName: file.originalname,
                        });
                    } catch (err) {
                        return res.status(500).json({
                            success: false,
                            message: "Bill upload failed",
                            error: err.message,
                        });
                    }
                }
                newFiles.billCopies = uploadedBills;
            }

            // Upload other files
            if (req.files.files) {
                const otherFiles = Array.isArray(req.files.files)
                    ? req.files.files
                    : [req.files.files];

                const uploadedFiles = [];
                for (const file of otherFiles) {
                    try {
                        const result = await uploadToCloudinary(
                            file.buffer,
                            "reports/others",
                            "raw"
                        );

                        uploadedFiles.push({
                            url: result.secure_url,
                            publicId: result.public_id,
                            fileName: file.originalname,
                        });
                    } catch (err) {
                        return res.status(500).json({
                            success: false,
                            message: "File upload failed",
                            error: err.message,
                        });
                    }
                }
                newFiles.files = uploadedFiles;
            }
        }

        // ---------- HANDLE REPORT TYPE CHANGE ----------
        if (newReportType !== oldReportType) {
            console.log(
                `🔄 Changing report type from ${oldReportType} to ${newReportType}`
            );

            /* =========================
               DELETE OLD FILES FROM CLOUDINARY
            ========================== */
            if (existingReport.shopDisplayImages) {
                for (const img of existingReport.shopDisplayImages) {
                    try {
                        await deleteFromCloudinary(img.publicId, "image");
                    } catch (err) {
                        console.error(
                            `Failed to delete image ${img.publicId}:`,
                            err
                        );
                    }
                }
            }
            if (existingReport.billCopies) {
                for (const bill of existingReport.billCopies) {
                    try {
                        await deleteFromCloudinary(bill.publicId, "raw");
                    } catch (err) {
                        console.error(
                            `Failed to delete bill ${bill.publicId}:`,
                            err
                        );
                    }
                }
            }
            if (existingReport.files) {
                for (const file of existingReport.files) {
                    try {
                        await deleteFromCloudinary(file.publicId, "raw");
                    } catch (err) {
                        console.error(
                            `Failed to delete file ${file.publicId}:`,
                            err
                        );
                    }
                }
            }

            // Delete old files from Cloudinary before type change
            if (
                oldReportType === "Window Display" &&
                existingReport.shopDisplayImages
            ) {
                for (const img of existingReport.shopDisplayImages) {
                    if (img.publicId) {
                        await deleteFromCloudinary(img.publicId, "image");
                    }
                }
            } else if (oldReportType === "Stock" && existingReport.billCopies) {
                for (const bill of existingReport.billCopies) {
                    if (bill.publicId) {
                        await deleteFromCloudinary(
                            bill.publicId,
                            getResourceType("application/pdf")
                        );
                    }
                }
            } else if (oldReportType === "Others" && existingReport.files) {
                for (const file of existingReport.files) {
                    if (file.publicId) {
                        await deleteFromCloudinary(file.publicId, "raw");
                    }
                }
            }

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

            // Add type-specific fields and upload new files to Cloudinary
            if (newReportType === "Stock") {
                newReportData.stockType = updateData.stockType;
                newReportData.brand = updateData.brand;
                newReportData.product = updateData.product;
                newReportData.sku = updateData.sku;
                newReportData.productType = updateData.productType;
                newReportData.quantity = updateData.quantity;

                if (req.files?.billCopies) {
                    const bills = Array.isArray(req.files.billCopies)
                        ? req.files.billCopies
                        : [req.files.billCopies];

                    const uploadedBills = [];
                    for (const file of bills) {
                        const result = await uploadToCloudinary(
                            file.buffer,
                            "reports/stock_bills",
                            getResourceType(file.mimetype)
                        );
                        uploadedBills.push({
                            url: result.secure_url,
                            publicId: result.public_id,
                            fileName: file.originalname,
                            uploadedAt: new Date(),
                        });
                    }
                    newReportData.billCopies = uploadedBills;
                }
            } else if (newReportType === "Window Display") {
                if (newFiles.shopDisplayImages) {
                    newReportData.shopDisplayImages =
                        newFiles.shopDisplayImages;
                }
            } else if (newReportType === "Others") {
                if (req.files?.files) {
                    const otherFiles = Array.isArray(req.files.files)
                        ? req.files.files
                        : [req.files.files];

                    const uploadedFiles = [];
                    for (const file of otherFiles) {
                        const result = await uploadToCloudinary(
                            file.buffer,
                            "reports/other_files",
                            getResourceType(file.mimetype)
                        );
                        uploadedFiles.push({
                            url: result.secure_url,
                            publicId: result.public_id,
                            fileName: file.originalname,
                            uploadedAt: new Date(),
                        });
                    }
                    newReportData.files = uploadedFiles;
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

        // ---------- SAME REPORT TYPE: HANDLE ARRAYS WITH CLOUDINARY ----------

        // Update common scalar fields
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

        // Handle file arrays with Cloudinary deletion
        if (oldReportType === "Window Display") {
            let existingImages = existingReport.shopDisplayImages || [];

            console.log("Before removal - Image count:", existingImages.length);

            /* =========================
               DELETE REMOVED IMAGES FROM CLOUDINARY
            ========================== */
            if (removedImageIndices.length > 0) {
                const imagesToDelete = removedImageIndices.map(
                    (idx) => existingImages[idx]
                );

                for (const img of imagesToDelete) {
                    if (img?.publicId) {
                        try {
                            await deleteFromCloudinary(img.publicId, "image");
                        } catch (err) {
                            console.error(
                                `Failed to delete image ${img.publicId}:`,
                                err
                            );
                        }
                    }
                }

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

            /* =========================
               DELETE REMOVED BILLS FROM CLOUDINARY
            ========================== */
            if (removedBillIndices.length > 0) {
                const billsToDelete = removedBillIndices.map(
                    (idx) => existingBills[idx]
                );

                for (const bill of billsToDelete) {
                    if (bill?.publicId) {
                        try {
                            await deleteFromCloudinary(bill.publicId, "raw");
                        } catch (err) {
                            console.error(
                                `Failed to delete bill ${bill.publicId}:`,
                                err
                            );
                        }
                    }
                }

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

            /* =========================
               DELETE REMOVED FILES FROM CLOUDINARY
            ========================== */
            if (removedFileIndices.length > 0) {
                const filesToDelete = removedFileIndices.map(
                    (idx) => existingFilesArr[idx]
                );

                for (const file of filesToDelete) {
                    if (file?.publicId) {
                        try {
                            await deleteFromCloudinary(file.publicId, "raw");
                        } catch (err) {
                            console.error(
                                `Failed to delete file ${file.publicId}:`,
                                err
                            );
                        }
                    }
                }

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
   DELETE REPORT - UPDATED FOR CLOUDINARY
=============================== */
/* ===============================
   DELETE REPORT (ADMIN ONLY) - WITH CLOUDINARY CLEANUP
=============================== */
export const deleteReport = async (req, res) => {
    try {
        const { id } = req.params;

        const report = await Report.findById(id);

        if (!report) {
            return res.status(404).json({
                success: false,
                message: "Report not found",
            });
        }

        /* =========================
           DELETE FILES FROM CLOUDINARY
        ========================== */
        // Delete shop display images
        if (report.shopDisplayImages && report.shopDisplayImages.length > 0) {
            for (const img of report.shopDisplayImages) {
                try {
                    await deleteFromCloudinary(img.publicId, "image");
                } catch (err) {
                    console.error(
                        `Failed to delete image ${img.publicId}:`,
                        err
                    );
                }
            }
        }

        // Delete bill copies
        if (report.billCopies && report.billCopies.length > 0) {
            for (const bill of report.billCopies) {
                try {
                    await deleteFromCloudinary(bill.publicId, "raw");
                } catch (err) {
                    console.error(
                        `Failed to delete bill ${bill.publicId}:`,
                        err
                    );
                }
            }
        }

        // Delete other files
        if (report.files && report.files.length > 0) {
            for (const file of report.files) {
                try {
                    await deleteFromCloudinary(file.publicId, "raw");
                } catch (err) {
                    console.error(
                        `Failed to delete file ${file.publicId}:`,
                        err
                    );
                }
            }
        }

        /* =========================
           DELETE REPORT FROM DATABASE
        ========================== */
        await Report.findByIdAndDelete(id);

        return res.status(200).json({
            success: true,
            message: "Report and associated files deleted successfully",
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

/* ===============================
   STREAM REPORT PDF (NO STORAGE)
=============================== */
export const streamReportPdf = async (req, res) => {
    try {
        const { id } = req.params;

        const report = await Report.findById(id)
            .populate("campaignId")
            .populate("retailer.retailerId")
            .populate("employee.employeeId");

        if (!report) {
            return res.status(404).json({
                success: false,
                message: "Report not found",
            });
        }

        /* =========================
           RESPONSE HEADERS
        ========================== */
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
            "Content-Disposition",
            `inline; filename=Report_${report.reportType || "Unknown"}.pdf`
        );

        const doc = new PDFDocument({ size: "A4", margin: 40 });
        doc.pipe(res);

        /* =========================
           HELPERS
        ========================== */
        const sectionTitle = (title) => {
            doc.moveDown()
                .fontSize(14)
                .fillColor("#E4002B")
                .text(title)
                .moveDown(0.5)
                .fillColor("black");
        };

        const row = (label, value) => {
            doc.fontSize(11)
                .text(`${label}: `, { continued: true, width: 150 })
                .font("Helvetica-Bold")
                .text(value || "N/A")
                .font("Helvetica");
        };

        const formatDate = (date) =>
            date
                ? new Date(date).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                  })
                : "N/A";

        /* =========================
           TITLE
        ========================== */
        doc.fontSize(18)
            .fillColor("#E4002B")
            .text("REPORT DETAILS", { align: "center" })
            .moveDown();

        /* =========================
           BASIC INFORMATION
        ========================== */
        sectionTitle("Basic Information");
        row("Report Type", report.reportType);
        row("Frequency", report.frequency);
        row(
            "Date of Submission",
            formatDate(report.dateOfSubmission || report.createdAt)
        );
        row("Submitted By", report.submittedBy?.role);

        /* =========================
           CAMPAIGN INFORMATION
        ========================== */
        sectionTitle("Campaign Information");
        row("Campaign Name", report.campaignId?.name);
        row("Campaign Type", report.campaignId?.type);
        row("Client", report.campaignId?.client);

        /* =========================
           EMPLOYEE INFORMATION
        ========================== */
        if (report.employee?.employeeId) {
            sectionTitle("Employee Information");
            row("Employee Name", report.employee.employeeId.name);
            row("Employee Code", report.employee.employeeId.employeeId);
            if (report.employee.employeeId.phone) {
                row("Contact", report.employee.employeeId.phone);
            }
        }

        /* =========================
           VISIT DETAILS
        ========================== */
        if (report.submittedBy?.role === "Employee") {
            sectionTitle("Visit Details");
            row("Type of Visit", report.typeOfVisit);
            row(
                "Attendance Status",
                report.attendedVisit === "yes" ? "Attended" : "Not Attended"
            );

            if (
                report.attendedVisit === "no" &&
                report.reasonForNonAttendance
            ) {
                row("Reason", report.reasonForNonAttendance.reason);
                if (report.reasonForNonAttendance.reason === "others") {
                    row(
                        "Additional Details",
                        report.reasonForNonAttendance.otherReason
                    );
                }
            }
        }

        /* =========================
           STOCK INFORMATION
        ========================== */
        if (report.reportType === "Stock") {
            sectionTitle("Product / Stock Information");
            row("Stock Type", report.stockType);
            row("Brand", report.brand);
            row("Product", report.product);
            row("SKU", report.sku);
            row("Product Type", report.productType);
            row("Quantity", report.quantity);
        }

        /* =========================
           REMARKS
        ========================== */
        if (report.remarks) {
            sectionTitle("Remarks");
            doc.fontSize(11).text(report.remarks, {
                align: "left",
            });
        }

        /* =========================
           IMAGES (Window Display / Bills / Others)
           Uses EXISTING URLs (no storage)
        ========================== */
        const renderImages = async (title, files) => {
            if (!files || files.length === 0) return;

            doc.addPage();
            sectionTitle(title);

            for (let i = 0; i < files.length; i++) {
                const url = files[i].url || files[i].secure_url || files[i];

                if (!url) continue;

                const response = await fetch(url);
                const buffer = await response.arrayBuffer();

                if (i > 0 && i % 2 === 0) doc.addPage();

                doc.image(Buffer.from(buffer), {
                    fit: [500, 350],
                    align: "center",
                });

                doc.moveDown(0.5)
                    .fontSize(10)
                    .text(`Image ${i + 1}`, {
                        align: "center",
                    });
            }
        };

        if (report.reportType === "Window Display") {
            await renderImages("Shop Display Images", report.shopDisplayImages);
        }

        if (report.reportType === "Stock") {
            await renderImages("Bill Copies", report.billCopies);
        }

        if (report.reportType === "Others") {
            await renderImages("Other Files", report.files);
        }

        doc.end();
    } catch (error) {
        console.error("PDF error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to generate report PDF",
        });
    }
};

/* ===============================
   GET REPORTS BY RETAILER (EXCLUDING N/A REPORTS)
=============================== */
export const getSpecificReportsByRetailer = async (req, res) => {
    try {
        const { retailerId } = req.params;

        const reports = await Report.find({
            "retailer.retailerId": retailerId,
            reportType: {
                $in: ["Window Display", "Stock", "Others"],
            },
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

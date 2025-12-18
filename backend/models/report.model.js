// models/report.model.js
import mongoose from "mongoose";

const { Schema, model } = mongoose;

// Base Report Schema with common fields
const baseReportOptions = {
    discriminatorKey: "reportType",
    collection: "reports",
    timestamps: true,
};

const baseReportSchema = new Schema(
    {
        // Campaign reference
        campaignId: {
            type: Schema.Types.ObjectId,
            ref: "Campaign",
            required: true,
        },

        // Who is submitting
        submittedBy: {
            role: {
                type: String,
                enum: ["Admin", "Retailer", "Employee"],
                required: true,
            },
            userId: {
                type: Schema.Types.ObjectId,
                required: true,
                refPath: "submittedBy.role",
            },
        },

        // Retailer information
        retailer: {
            retailerId: {
                type: Schema.Types.ObjectId,
                ref: "Retailer",
                required: true,
            },
            outletName: {
                type: String,
                required: true,
            },
            retailerName: {
                type: String,
                required: true,
            },
            outletCode: {
                type: String,
                required: true,
            },
        },

        // Employee information (conditional - for admin/employee submissions)
        employee: {
            employeeId: {
                type: Schema.Types.ObjectId,
                ref: "Employee",
            },
            employeeName: String,
            employeeCode: String, // This will store Employee.employeeId (string format)
        },

        // Visit-related fields (only for employee submissions)
        visitScheduleId: {
            type: Schema.Types.ObjectId,
            ref: "VisitSchedule",
        },
        typeOfVisit: {
            type: String,
            enum: ["scheduled", "unscheduled"],
        },
        attendedVisit: {
            type: String,
            enum: ["yes", "no"],
        },

        // If attendedVisit === 'no'
        reasonForNonAttendance: {
            reason: {
                type: String,
                enum: ["outlet closed", "retailer not available", "others"],
            },
            otherReason: String, // Only if reason === 'others'
        },

        // Common fields for all attended visits or admin/retailer submissions
        frequency: {
            type: String,
            enum: ["Daily", "Weekly", "Fortnightly", "Monthly", "Adhoc"],
        },
        dateOfSubmission: {
            type: Date,
            default: Date.now,
        },
        remarks: String,

        // Geo location (optional - for field verification)
        location: {
            latitude: Number,
            longitude: Number,
        },
    },
    baseReportOptions
);

// Indexes for better query performance
baseReportSchema.index({ campaignId: 1, "retailer.retailerId": 1 });
baseReportSchema.index({ "submittedBy.userId": 1, dateOfSubmission: -1 });
baseReportSchema.index({ reportType: 1, status: 1 });
baseReportSchema.index({ visitScheduleId: 1 });

// Base model
const Report = model("Report", baseReportSchema);

// ==============================
// WINDOW DISPLAY REPORT SCHEMA
// ==============================
const windowDisplaySchema = new Schema({
    shopDisplayImages: [
        {
            data: Buffer,
            contentType: String,
            fileName: String,
            uploadedAt: {
                type: Date,
                default: Date.now,
            },
        },
    ],
});

// ==============================
// STOCK REPORT SCHEMA
// ==============================
const stockSchema = new Schema({
    stockType: {
        type: String,
        enum: [
            "Opening Stock",
            "Closing Stock",
            "Purchase Stock",
            "Sold Stock",
        ],
        required: true,
    },
    brand: {
        type: String,
        required: true,
    },
    product: {
        type: String,
        required: true,
    },
    sku: {
        type: String,
        required: true,
    },
    productType: {
        type: String,
        enum: ["Focus", "All"],
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
        min: 0,
    },
    billCopies: [
        {
            data: Buffer,
            contentType: String,
            fileName: String,
            uploadedAt: {
                type: Date,
                default: Date.now,
            },
        },
    ],
});

// ==============================
// OTHERS REPORT SCHEMA
// ==============================
const othersSchema = new Schema({
    files: [
        {
            data: Buffer,
            contentType: String,
            fileName: String,
            uploadedAt: {
                type: Date,
                default: Date.now,
            },
        },
    ],
});

// ==============================
// CREATE DISCRIMINATOR MODELS
// ==============================
const WindowDisplayReport = Report.discriminator(
    "Window Display",
    windowDisplaySchema
);

const StockReport = Report.discriminator("Stock", stockSchema);

const OthersReport = Report.discriminator("Others", othersSchema);

export { Report, WindowDisplayReport, StockReport, OthersReport };

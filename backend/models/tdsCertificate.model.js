// models/tdsCertificate.model.js
import mongoose from "mongoose";

const tdsCertificateSchema = new mongoose.Schema(
    {
        retailerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Retailer",
            required: true,
            index: true,
        },
        retailerName: {
            type: String,
            required: true,
        },
        outletCode: {
            type: String,
            required: true,
        },
        
        financialYear: {
            type: String,
            required: true,
            index: true,
        },
        
        quarter: {
            type: String,
            enum: ['Q1', 'Q2', 'Q3', 'Q4'],
            required: true,
        },
        
        // Quarter date ranges for reference
        quarterPeriod: {
            startDate: {
                type: String, // e.g., "01/04/2025"
                required: true,
            },
            endDate: {
                type: String, // e.g., "30/06/2025"
                required: true,
            },
        },
        
        // TDS Details
        totalTDSAmount: {
            type: Number,
            required: true,
            min: 0,
        },
        
        certificateNumber: {
            type: String,
            trim: true,
        },
        
        // Certificate File (Cloudinary)
        certificate: {
            url: {
                type: String,
                required: true,
            },
            publicId: {
                type: String,
                required: true,
            },
        },
        
        // Upload Details
        uploadedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Admin",
            required: true,
        },
        
        uploadedAt: {
            type: Date,
            default: Date.now,
        },
        
        remarks: {
            type: String,
            default: "",
        },
        
        // Status
        status: {
            type: String,
            enum: ['active', 'replaced', 'deleted'],
            default: 'active',
        },
    },
    {
        timestamps: true,
    }
);

// Compound index for efficient queries
tdsCertificateSchema.index({
    retailerId: 1,
    financialYear: 1,
    quarter: 1,
});

// Index for admin queries
tdsCertificateSchema.index({
    uploadedBy: 1,
    uploadedAt: -1,
});

// Virtual for quarter display name
tdsCertificateSchema.virtual("quarterName").get(function () {
    const quarterNames = {
        Q1: "April - June",
        Q2: "July - September",
        Q3: "October - December",
        Q4: "January - March",
    };
    return quarterNames[this.quarter];
});

// Static method to get quarter from date
tdsCertificateSchema.statics.getQuarterFromDate = function(date) {
    const d = new Date(date);
    const month = d.getMonth(); // 0-indexed
    
    // Financial year quarters
    if (month >= 3 && month <= 5) return 'Q1'; // Apr-Jun
    if (month >= 6 && month <= 8) return 'Q2'; // Jul-Sep
    if (month >= 9 && month <= 11) return 'Q3'; // Oct-Dec
    return 'Q4'; // Jan-Mar
};

// Static method to get quarter date range
tdsCertificateSchema.statics.getQuarterDateRange = function(quarter, financialYear) {
    const [startYear] = financialYear.split('-');
    const year = parseInt(startYear);
    
    const ranges = {
        Q1: { startDate: `01/04/${year}`, endDate: `30/06/${year}` },
        Q2: { startDate: `01/07/${year}`, endDate: `30/09/${year}` },
        Q3: { startDate: `01/10/${year}`, endDate: `31/12/${year}` },
        Q4: { startDate: `01/01/${year + 1}`, endDate: `31/03/${year + 1}` },
    };
    
    return ranges[quarter];
};

export const TDSCertificate = mongoose.model("TDSCertificate", tdsCertificateSchema);

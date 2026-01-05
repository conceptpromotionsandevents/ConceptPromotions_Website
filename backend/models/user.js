// models/user.js
import bcrypt from "bcryptjs";
import mongoose from "mongoose";

const { Schema, model, Types } = mongoose;

/* ===============================
   STATE CODE MAP
=============================== */
const stateCodes = {
    "Andhra Pradesh": "AP",
    "Arunachal Pradesh": "AR",
    Assam: "AS",
    Bihar: "BR",
    Chhattisgarh: "CG",
    Goa: "GA",
    Gujarat: "GJ",
    Haryana: "HR",
    "Himachal Pradesh": "HP",
    Jharkhand: "JH",
    Karnataka: "KA",
    Kerala: "KL",
    "Madhya Pradesh": "MP",
    Maharashtra: "MH",
    Manipur: "MN",
    Meghalaya: "ML",
    Mizoram: "MZ",
    Nagaland: "NL",
    Odisha: "OD",
    Punjab: "PB",
    Rajasthan: "RJ",
    Sikkim: "SK",
    "Tamil Nadu": "TN",
    Telangana: "TS",
    Tripura: "TR",
    "Uttar Pradesh": "UP",
    Uttarakhand: "UK",
    "West Bengal": "WB",
    "Andaman and Nicobar Islands": "AN",
    Chandigarh: "CH",
    "Dadra and Nagar Haveli and Daman and Diu": "DN",
    Delhi: "DL",
    "Jammu and Kashmir": "JK",
    Ladakh: "LA",
    Lakshadweep: "LD",
    Puducherry: "PY",
};

/* ===============================
   ADMIN SCHEMA
=============================== */
const adminSchema = new Schema(
    {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },

        // 🔒 For password reset functionality
        resetPasswordToken: { type: String },
        resetPasswordExpires: { type: Date },
    },
    { timestamps: true }
);
export const Admin = model("Admin", adminSchema);

/* ===============================
   CLIENT ADMIN SCHEMA
=============================== */
const clientAdminSchema = new Schema(
    {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        contactNo: String,
        password: { type: String, required: true },
        organizationName: { type: String, required: true },

        states: [
            {
                type: String,
                required: true,
            },
        ],

        regions: [
            {
                type: String,
            },
        ],

        role: {
            type: String,
            required: true,
        },

        registrationDetails: {
            username: { type: String, required: true },
            password: { type: String, required: true },
        },
    },
    { timestamps: true }
);

export const ClientAdmin = model("ClientAdmin", clientAdminSchema);

/* ===============================
   CLIENT USER SCHEMA
=============================== */
const clientUserSchema = new Schema(
    {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        contactNo: String,
        password: { type: String, required: true },
        roleProfile: {
            type: String,
            enum: ["National", "Regional", "State", "Key Account"],
        },
        parentClientAdmin: { type: Schema.Types.ObjectId, ref: "ClientAdmin" },
    },
    { timestamps: true }
);
export const ClientUser = model("ClientUser", clientUserSchema);

/* ===============================
   EMPLOYEE SCHEMA - UPDATED FOR CLOUDINARY
=============================== */
const employeeSchema = new Schema(
    {
        // -------- Basic Account Info (set by Admin) --------
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        phone: { type: String, required: true },
        password: { type: String },
        isFirstLogin: { type: Boolean, default: true },

        position: { type: String, required: false },
        isActive: {
            type: Boolean,
            default: true,
        },

        employeeId: {
            type: String,
            unique: true,
        },

        // Linked organization/admin
        organization: { type: Schema.Types.ObjectId, ref: "ClientAdmin" },
        createdByAdmin: { type: Schema.Types.ObjectId, ref: "Admin" },

        // -------- Employee Type --------
        employeeType: {
            type: String,
            enum: ["Permanent", "Contractual"],
            required: false,
        },

        // -------- Personal Details --------
        gender: String,
        dob: Date,
        highestQualification: String,
        maritalStatus: String,
        fathersName: String,
        fatherDob: Date,
        motherName: String,
        motherDob: Date,
        spouseName: String,
        spouseDob: Date,
        child1Name: String,
        child1Dob: Date,
        child2Name: String,
        child2Dob: Date,
        alternatePhone: String,

        // -------- Address Details --------
        correspondenceAddress: {
            addressLine1: String,
            addressLine2: String,
            city: String,
            state: String,
            pincode: String,
        },
        permanentAddress: {
            addressLine1: String,
            addressLine2: String,
            city: String,
            state: String,
            pincode: String,
        },

        // -------- Identification Details --------
        aadhaarNumber: String,
        panNumber: String,
        uanNumber: String,
        esiNumber: String,
        pfNumber: String,
        esiDispensary: String,

        // -------- Bank Details --------
        bankDetails: {
            accountNumber: String,
            ifsc: String,
            bankName: String,
            branchName: String,
        },

        // -------- Contractual Specific --------
        contractLength: String,

        // -------- Work Experience --------
        experiences: [
            {
                organization: String,
                designation: String,
                from: Date,
                to: Date,
                currentlyWorking: { type: Boolean, default: false },
            },
        ],

        // -------- Uploaded Files - UPDATED FOR CLOUDINARY --------
        files: {
            aadhaarFront: {
                url: String,
                publicId: String,
            },
            aadhaarBack: {
                url: String,
                publicId: String,
            },
            panCard: {
                url: String,
                publicId: String,
            },
            personPhoto: {
                url: String,
                publicId: String,
            },
            familyPhoto: {
                url: String,
                publicId: String,
            },
            bankProof: {
                url: String,
                publicId: String,
            },
            esiForm: {
                url: String,
                publicId: String,
            },
            pfForm: {
                url: String,
                publicId: String,
            },
            employmentForm: {
                url: String,
                publicId: String,
            },
            cv: {
                url: String,
                publicId: String,
            },
        },

        // -------- Campaign Assignment --------
        assignedCampaigns: [
            {
                type: Schema.Types.ObjectId,
                ref: "Campaign",
            },
        ],

        tnc: { type: Boolean },
    },
    { timestamps: true }
);

// ------------------------------------------------------
// 🔥 Auto-generate employeeId (4 letters + 5 digits)
// ------------------------------------------------------
employeeSchema.pre("save", function (next) {
    if (!this.employeeId) {
        const letters = Array.from({ length: 4 }, () =>
            String.fromCharCode(65 + Math.floor(Math.random() * 26))
        ).join("");

        const numbers = Math.floor(10000 + Math.random() * 90000);
        this.employeeId = `${letters}${numbers}`;
    }

    next();
});

/* ===============================
   EMPLOYEE REPORT SCHEMA - UPDATED FOR CLOUDINARY
=============================== */
const employeeReportSchema = new Schema(
    {
        employeeId: { type: Types.ObjectId, ref: "Employee" },
        campaignId: { type: Types.ObjectId, ref: "Campaign", required: true },
        retailerId: { type: Types.ObjectId, ref: "Retailer", required: true },

        visitScheduleId: { type: Types.ObjectId, ref: "VisitSchedule" },

        visitType: String,
        attended: String,
        notVisitedReason: String,
        otherReasonText: String,

        reportType: String,
        frequency: String,
        fromDate: Date,
        toDate: Date,
        extraField: String,

        stockType: String,
        brand: String,
        product: String,
        sku: String,
        productType: String,
        quantity: Number,

        // 📍 Geo Tag
        location: {
            latitude: Number,
            longitude: Number,
        },

        // 📸 Multiple images - UPDATED FOR CLOUDINARY
        images: [
            {
                url: {
                    type: String,
                    required: true,
                },
                publicId: {
                    type: String,
                    required: true,
                },
                fileName: String,
            },
        ],

        // 📄 MULTIPLE BILL COPIES - UPDATED FOR CLOUDINARY
        billCopies: [
            {
                url: {
                    type: String,
                    required: true,
                },
                publicId: {
                    type: String,
                    required: true,
                },
                fileName: String,
            },
        ],

        submittedByRole: {
            type: String,
            enum: ["Employee", "Admin", "Retailer"],
            required: true,
        },

        submittedByEmployee: {
            type: Types.ObjectId,
            ref: "Employee",
            default: null,
        },

        submittedByAdmin: {
            type: Types.ObjectId,
            ref: "Admin",
            default: null,
        },

        submittedByRetailer: {
            type: Types.ObjectId,
            ref: "Retailer",
            default: null,
        },
    },
    { timestamps: true }
);

export const EmployeeReport = model("EmployeeReport", employeeReportSchema);

/* ===========================
   PASSWORD HASH MIDDLEWARE
=========================== */
employeeSchema.pre("save", async function (next) {
    try {
        if (this.isNew && this.phone) {
            this.password = await bcrypt.hash(this.phone.toString(), 10);
            this.isFirstLogin = true;
        }
        next();
    } catch (err) {
        next(err);
    }
});

export const Employee = model("Employee", employeeSchema);

/* ===============================
   CAMPAIGN SCHEMA (NO CHANGES - No file uploads here)
=============================== */
const campaignSchema = new Schema(
    {
        /* =========================
       BASIC DETAILS
    ========================== */
        name: { type: String, required: true, trim: true },

        client: { type: String, required: true, trim: true },

        type: {
            type: String,
            enum: [
                "Retailer Enrolment",
                "Display Payment",
                "Incentive Payment",
                "Others",
            ],
            required: true,
        },

        /* =========================
       REGION SELECTION
    ========================== */
        regions: [
            {
                type: String,
                enum: ["North", "South", "East", "West", "All"],
                required: true,
            },
        ],

        /* =========================
       STATE SELECTION
    ========================== */
        states: [
            {
                type: String,
                required: true,
            },
        ],

        /* =========================
       CREATED BY
    ========================== */
        createdBy: {
            type: Types.ObjectId,
            ref: "Admin",
            required: true,
        },

        /* =========================
       CAMPAIGN DATE WINDOW
    ========================== */
        campaignStartDate: {
            type: Date,
            required: true,
        },

        campaignEndDate: {
            type: Date,
            required: true,
        },

        /* =========================
       STATUS
    ========================== */
        isActive: {
            type: Boolean,
            default: true,
        },

        /* =========================
       🖼️ CAMPAIGN BANNERS (IMAGES)
    ========================== */
        banners: [
            {
                url: { type: String, required: true },
                publicId: { type: String },
                uploadedAt: { type: Date, default: Date.now },
            },
        ],

        /* =========================
       📜 TERMS & CONDITIONS (TEXT)
    ========================== */
        termsAndConditions: {
            type: String,
            required: true,
        },

        /* =========================
       💰 GRATIFICATION DETAILS
    ========================== */
        gratification: {
            type: {
                type: String, // Cash | Gift | Points | Discount | Others
            },
            amount: {
                type: Number,
            },
            description: {
                type: String,
            },
            conditions: {
                type: String,
            },
        },

        /* =========================
       ASSIGNED RETAILERS
    ========================== */
        assignedRetailers: [
            {
                retailerId: {
                    type: Types.ObjectId,
                    ref: "Retailer",
                    required: true,
                },

                status: {
                    type: String,
                    enum: ["pending", "accepted", "rejected"],
                    default: "pending",
                },

                assignedAt: {
                    type: Date,
                    default: Date.now,
                },

                updatedAt: {
                    type: Date,
                },

                startDate: {
                    type: Date,
                },

                endDate: {
                    type: Date,
                },
            },
        ],

        /* =========================
       ASSIGNED EMPLOYEES
    ========================== */
        assignedEmployees: [
            {
                employeeId: {
                    type: Types.ObjectId,
                    ref: "Employee",
                    required: true,
                },

                status: {
                    type: String,
                    enum: ["pending", "accepted", "rejected"],
                    default: "pending",
                },

                assignedAt: {
                    type: Date,
                    default: Date.now,
                },

                updatedAt: {
                    type: Date,
                },

                startDate: {
                    type: Date,
                },

                endDate: {
                    type: Date,
                },
            },
        ],

        /* ==================================================
       EMPLOYEE ↔ RETAILER MAPPING (WITHIN CAMPAIGN)
       ✔ One employee → multiple retailers
       ✔ One retailer → multiple employees
    =================================================== */
        assignedEmployeeRetailers: [
            {
                employeeId: {
                    type: Types.ObjectId,
                    ref: "Employee",
                    required: true,
                },

                retailerId: {
                    type: Types.ObjectId,
                    ref: "Retailer",
                    required: true,
                },

                assignedAt: {
                    type: Date,
                    default: Date.now,
                },
            },
        ],
    },
    { timestamps: true }
);

/* ---------------------------
   ✅ PRE-DELETE HOOK: Clean up Cloudinary files
---------------------------- */
campaignSchema.pre("remove", async function (next) {
    try {
        // Delete all campaign documents from Cloudinary
        if (this.documents && this.documents.length > 0) {
            for (const doc of this.documents) {
                await deleteFromCloudinary(doc.publicId, "raw");
            }
        }

        // Delete all campaign banners from Cloudinary
        if (this.banners && this.banners.length > 0) {
            for (const banner of this.banners) {
                await deleteFromCloudinary(banner.publicId, "image");
            }
        }

        next();
    } catch (error) {
        next(error);
    }
});

export const Campaign = mongoose.model("Campaign", campaignSchema);

/* ===============================
   PAYMENT SCHEMA (NO CHANGES)
=============================== */
const paymentSchema = new mongoose.Schema(
    {
        retailer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Retailer",
            required: true,
        },
        campaign: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Campaign",
            required: true,
        },
        totalAmount: {
            type: Number,
            required: true,
        },
        amountPaid: {
            type: Number,
            default: 0,
        },
        remainingAmount: {
            type: Number,
            default: function () {
                return this.totalAmount - this.amountPaid;
            },
        },
        utrNumbers: [
            {
                utrNumber: { type: String, required: true },
                amount: { type: Number, required: true },
                date: { type: Date, default: Date.now },
                updatedBy: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Admin",
                },
            },
        ],
        paymentStatus: {
            type: String,
            enum: ["Pending", "Partially Paid", "Completed"],
            default: "Pending",
        },
        lastUpdatedByAdmin: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Admin",
        },
    },
    { timestamps: true }
);

/* ===============================
   CAREER APPLICATION SCHEMA - UPDATED FOR CLOUDINARY
=============================== */
const careerApplicationSchema = new mongoose.Schema(
    {
        fullName: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        phone: { type: String },
        city: { type: String, required: true },
        resume: {
            url: {
                type: String,
                required: true,
            },
            publicId: {
                type: String,
                required: true,
            },
            fileName: String,
        },
    },
    { timestamps: true }
);

export const CareerApplication = mongoose.model(
    "CareerApplication",
    careerApplicationSchema
);

/* ===============================
   JOB SCHEMA (NO CHANGES)
=============================== */
const jobSchema = new mongoose.Schema(
    {
        title: { type: String, required: true },
        description: { type: String, required: true },
        location: { type: String, required: true },
        salaryRange: { type: String },
        experienceRequired: { type: String },
        employmentType: {
            type: String,
            enum: ["Full-Time", "Part-Time", "Contract-Based"],
            required: true,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Admin",
            required: true,
        },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

export const Job = mongoose.model("Job", jobSchema);

/* ===============================
   JOB APPLICATION SCHEMA (NO CHANGES)
=============================== */
const jobApplicationSchema = new mongoose.Schema(
    {
        candidate: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "CareerApplication",
            required: true,
        },
        job: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Job",
            required: true,
        },
        status: {
            type: String,
            enum: [
                "Pending",
                "Under Review",
                "Shortlisted",
                "Rejected",
                "Selected",
            ],
            default: "Pending",
        },
        totalRounds: { type: Number, default: 1 },
        currentRound: { type: Number, default: 0 },
    },
    { timestamps: true }
);

export const JobApplication = mongoose.model(
    "JobApplication",
    jobApplicationSchema
);

export default mongoose.model("Payment", paymentSchema);

export const Payment = mongoose.model("Payment", paymentSchema);

/* ===============================
   VISIT SCHEDULE SCHEMA (NO CHANGES)
=============================== */
const visitScheduleSchema = new Schema(
    {
        campaignId: {
            type: Schema.Types.ObjectId,
            ref: "Campaign",
            required: true,
        },

        employeeId: {
            type: Schema.Types.ObjectId,
            ref: "Employee",
            required: true,
        },

        retailerId: {
            type: Schema.Types.ObjectId,
            ref: "Retailer",
            required: true,
        },

        visitDate: {
            type: Date,
            required: true,
        },

        visitType: {
            type: String,
            enum: ["Visit", "Audit", "Follow-Up", "Collection"],
            default: "Visit",
        },

        notes: {
            type: String,
        },

        assignedAt: {
            type: Date,
            default: Date.now,
        },

        isRecurring: {
            type: String,
            enum: ["Yes", "No"],
            default: "No",
        },

        recurrenceInterval: {
            type: String,
            enum: ["Daily", "Weekly", "Fortnightly", "Monthly"],
            default: null,
        },
        status: {
            type: String,
            enum: ["Scheduled", "Completed", "Missed", "Cancelled"],
            default: "Scheduled",
        },

        lastVisitDate: {
            type: Date,
            default: null,
        },
    },
    { timestamps: true }
);

export const VisitSchedule = model("VisitSchedule", visitScheduleSchema);

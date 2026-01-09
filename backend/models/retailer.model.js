import bcrypt from "bcryptjs";
import mongoose from "mongoose";

const { Schema, model, Types } = mongoose;

const retailerSchema = new Schema(
    {
        uniqueId: { type: String, unique: true },
        retailerCode: { type: String, unique: true },
        name: { type: String, required: true },
        contactNo: { type: String, required: true, unique: true },
        altContactNo: { type: String, unique: true },
        dob: { type: Date },
        gender: { type: String },
        govtIdType: String,
        govtIdNumber: String,

        shopDetails: {
            shopName: { type: String, required: true },
            businessType: { type: String, required: true },
            ownershipType: String,
            GSTNo: String,
            PANCard: { type: String, required: true },
            shopAddress: {
                address: { type: String, required: true },
                address2: String,
                city: { type: String, required: true },
                state: { type: String, required: true },
                pincode: { type: String, required: true },
            },
        },

        bankDetails: {
            bankName: { type: String, required: true },
            accountNumber: { type: String, required: true },
            IFSC: { type: String, required: true },
            branchName: { type: String, required: true },
        },

        govtIdPhoto: {
            url: String,
            publicId: String,
        },
        personPhoto: {
            url: String,
            publicId: String,
        },
        registrationFormFile: {
            url: String,
            publicId: String,
        },
        outletPhoto: {
            url: String,
            publicId: String,
        },

        tnc: { type: Boolean },
        pennyCheck: { type: Boolean },

        phoneVerified: { type: Boolean, default: true },
        email: String,
        password: { type: String },

        assignedCampaigns: [
            {
                type: Schema.Types.ObjectId,
                ref: "Campaign",
            },
        ],

        assignedEmployee: {
            type: Schema.Types.ObjectId,
            ref: "Employee",
        },
    },
    { timestamps: true }
);

retailerSchema.index({ email: 1, contactNo: 1 });

/* ======================================================
   PRE-VALIDATE (ONLY MOVED CODE – NO LOGIC CHANGE)
====================================================== */
retailerSchema.pre("validate", function (next) {
   
    if (this.isNew && !this.password) {
        this.password = this.contactNo;
    }

    
    if (!this.uniqueId) {
        const name = this.name.charAt(0).toUpperCase();
        const businessType = this.shopDetails?.businessType || "O";
        const typeLetter = businessType.charAt(0).toUpperCase();

        const state = this.shopDetails?.shopAddress?.state || "NA";
        const city = this.shopDetails?.shopAddress?.city || "NA";

        const stateCode = state.substring(0, 2).toUpperCase();
        const cityCode = city.substring(0, 3).toUpperCase();
        const randomNum = Math.floor(1000 + Math.random() * 9000);

        this.uniqueId = `${name}${typeLetter}${stateCode}${cityCode}${randomNum}`;
    }

    if (!this.retailerCode) {
        const timestamp = Date.now().toString().slice(-6);
        const randomPart = Math.floor(100 + Math.random() * 900);
        this.retailerCode = `R${timestamp}${randomPart}`;
    }

    next();
});

/* ======================================================
   PRE-SAVE (UNCHANGED – PASSWORD HASHING)
====================================================== */
retailerSchema.pre("save", async function (next) {
    try {
        if (this.isModified("password") && this.password) {
            this.password = await bcrypt.hash(this.password, 10);
        }
        next();
    } catch (err) {
        next(err);
    }
});


retailerSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

export const Retailer = model("Retailer", retailerSchema);

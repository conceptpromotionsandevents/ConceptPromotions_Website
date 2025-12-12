// models/payments.model.js
import mongoose from "mongoose";

// Installment/Payment sub-schema
const installmentSchema = new mongoose.Schema(
    {
        installmentNo: {
            type: Number,
            required: true,
        },
        installmentAmount: {
            type: Number,
            required: true,
            min: 0,
        },
        dateOfInstallment: {
            type: String,
            required: true,
        }, // dd/mm/yyyy format
        utrNumber: {
            type: String,
            required: true,
            trim: true,
        },
        remarks: {
            type: String,
            default: "",
        },
        createdAt: {
            type: Date,
            default: Date.now,
        },
        updatedAt: {
            type: Date,
            default: Date.now,
        },
    },
    { _id: true }
);

// Campaign budget sub-schema
const campaignBudgetSchema = new mongoose.Schema(
    {
        campaignId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Campaign",
            required: true,
        },
        campaignName: {
            type: String,
            required: true,
        },
        tca: {
            type: Number,
            required: true,
            default: 0,
            min: 0,
        },
        cPaid: {
            type: Number,
            default: 0,
            min: 0,
        },
        cPending: {
            type: Number,
            default: 0,
        },
        installments: [installmentSchema],
    },
    { _id: true }
);

// Main Retailer Budget schema
const retailerBudgetSchema = new mongoose.Schema(
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
            index: true,
        },
        state: {
            type: String,
            required: true,
            index: true,
        },
        shopName: {
            type: String,
            required: true,
        },
        outletCode: {
            type: String,
            required: true,
            index: true,
        },

        tar: {
            type: Number,
            default: 0,
            min: 0,
        },
        taPaid: {
            type: Number,
            default: 0,
            min: 0,
        },
        taPending: {
            type: Number,
            default: 0,
        },

        campaigns: [campaignBudgetSchema],
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// ✅ PRE-SAVE MIDDLEWARE: Fixed to use installmentAmount
retailerBudgetSchema.pre("save", function (next) {
    try {
        // Calculate per-campaign totals
        this.campaigns.forEach((campaign) => {
            // Sum all installment amounts for this campaign
            campaign.cPaid = campaign.installments.reduce((sum, inst) => {
                return sum + (inst.installmentAmount || 0);
            }, 0);

            // Calculate pending amount
            campaign.cPending = campaign.tca - campaign.cPaid;
        });

        // Calculate retailer-level totals
        this.tar = this.campaigns.reduce((sum, campaign) => {
            return sum + (campaign.tca || 0);
        }, 0);

        this.taPaid = this.campaigns.reduce((sum, campaign) => {
            return sum + (campaign.cPaid || 0);
        }, 0);

        this.taPending = this.tar - this.taPaid;

        next();
    } catch (error) {
        next(error);
    }
});

// Compound index for efficient filtering
retailerBudgetSchema.index({
    state: 1,
    retailerId: 1,
    "campaigns.campaignId": 1,
});

// Virtual for getting UTR list - Fixed field names
retailerBudgetSchema.virtual("utrList").get(function () {
    const utrs = [];
    this.campaigns.forEach((campaign) => {
        campaign.installments.forEach((inst) => {
            utrs.push({
                campaignId: campaign.campaignId,
                campaignName: campaign.campaignName,
                utrNumber: inst.utrNumber,
                installmentAmount: inst.installmentAmount,
                dateOfInstallment: inst.dateOfInstallment,
                installmentNo: inst.installmentNo,
            });
        });
    });
    return utrs;
});

export const RetailerBudget = mongoose.model(
    "RetailerBudget",
    retailerBudgetSchema
);

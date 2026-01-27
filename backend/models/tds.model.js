// models/tds.model.js
import mongoose from "mongoose";

const { Schema, model } = mongoose;

// Helper function to calculate Financial Year
function getFiscalYear(date = new Date()) {
    const year = date.getFullYear();
    const month = date.getMonth(); // 0-indexed (0 = Jan, 3 = Apr)

    // If month is Jan, Feb, or Mar (0,1,2), FY is (year-1)-year
    // If month is Apr onwards (3-11), FY is year-(year+1)
    if (month < 3) {
        return `${year - 1}-${year}`;
    }
    return `${year}-${year + 1}`;
}

// Individual TDS sub-schema
const individualTdsSchema = new Schema(
    {
        campaignId: {
            type: Schema.Types.ObjectId,
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
            min: 0,
        },
        tdsRate: {
            type: Number,
            required: true,
            enum: [1, 2, 20], // 1% for sole proprietorship, 2% for others, 20% for no PAN
        },
        tdsAmount: {
            type: Number,
            required: true,
            min: 0,
        },
        calculatedOn: {
            type: Date,
            default: Date.now,
        },
        remarks: {
            type: String,
            default: "",
        },
    },
    { _id: true },
);

// Cumulative TDS sub-schema (calculated only once when crossing 1L threshold)
const cumulativeTdsSchema = new Schema(
    {
        totalTcaAtCalculation: {
            type: Number,
            required: true,
            min: 0,
        },
        tdsRate: {
            type: Number,
            required: true,
            enum: [1, 2, 20],
        },
        tdsAmount: {
            type: Number,
            required: true,
            min: 0,
        },
        calculatedOn: {
            type: Date,
            default: Date.now,
        },
        campaignsIncluded: [
            {
                campaignId: {
                    type: Schema.Types.ObjectId,
                    ref: "Campaign",
                },
                campaignName: String,
                tca: Number,
            },
        ],
        remarks: {
            type: String,
            default:
                "Cumulative TDS calculated on crossing ₹1,00,000 threshold",
        },
    },
    { _id: true },
);

// Main TDS Record schema
const tdsRecordSchema = new Schema(
    {
        retailerId: {
            type: Schema.Types.ObjectId,
            ref: "Retailer",
            required: true,
            index: true,
        },

        // Financial Year
        financialYear: {
            type: String,
            required: true,
            index: true,
            // Format: "2025-2026" (April 2025 to March 2026)
        },

        // Total TCA across all campaigns (current value, can decrease on edits/deletes)
        totalTCA: {
            type: Number,
            default: 0,
            min: 0,
        },

        // Peak TCA - all-time highest, never decreases even on edits/deletes
        peakTotalTCA: {
            type: Number,
            default: 0,
            min: 0,
        },

        // Flag to check if cumulative threshold (1L) was ever crossed
        cumulativeThresholdCrossed: {
            type: Boolean,
            default: false,
            index: true,
        },

        // Date when cumulative threshold was first crossed
        cumulativeThresholdCrossedDate: {
            type: Date,
            default: null,
        },

        // TDS Rate applicable (determined by ownership type and PAN availability)
        applicableTdsRate: {
            type: Number,
            required: true,
            enum: [1, 2, 20],
            // 1% - Sole Proprietorship with PAN
            // 2% - Others (Partnership, Private Limited, etc.) with PAN
            // 20% - No PAN Card
        },

        // Array of Individual TDS records
        individualTds: [individualTdsSchema],

        // Cumulative TDS record (only one entry, calculated when crossing 1L)
        cumulativeTds: cumulativeTdsSchema,

        // Total TDS amounts (aggregated)
        totalIndividualTdsAmount: {
            type: Number,
            default: 0,
            min: 0,
        },

        totalCumulativeTdsAmount: {
            type: Number,
            default: 0,
            min: 0,
        },

        totalTdsAmount: {
            type: Number,
            default: 0,
            min: 0,
        },

        // Metadata
        lastCalculatedAt: {
            type: Date,
            default: Date.now,
        },

        isActive: {
            type: Boolean,
            default: true,
            index: true,
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    },
);

// ✅ COMPOUND INDEXES for efficient querying
tdsRecordSchema.index({ retailerId: 1, financialYear: 1 }, { unique: true });
tdsRecordSchema.index({ financialYear: 1, isActive: 1 });

// ✅ VIRTUAL: Populate retailer details dynamically
tdsRecordSchema.virtual("retailerDetails", {
    ref: "Retailer",
    localField: "retailerId",
    foreignField: "_id",
    justOne: true,
});

// ✅ PRE-SAVE MIDDLEWARE: Calculate totals
tdsRecordSchema.pre("save", function (next) {
    try {
        // Calculate total individual TDS amount
        this.totalIndividualTdsAmount = this.individualTds.reduce(
            (sum, tds) => sum + (tds.tdsAmount || 0),
            0,
        );

        // Calculate total cumulative TDS amount
        this.totalCumulativeTdsAmount = this.cumulativeTds?.tdsAmount || 0;

        // Calculate total TDS amount
        this.totalTdsAmount =
            this.totalIndividualTdsAmount + this.totalCumulativeTdsAmount;

        // Update last calculated timestamp
        this.lastCalculatedAt = new Date();

        next();
    } catch (error) {
        next(error);
    }
});

// ✅ STATIC METHOD: Determine TDS Rate based on ownership and PAN
tdsRecordSchema.statics.determineTdsRate = function (ownershipType, panCard) {
    // No PAN card → 20% TDS
    if (
        !panCard ||
        panCard === null ||
        panCard === undefined ||
        panCard.trim() === ""
    ) {
        return 20;
    }

    // Sole Proprietorship with PAN → 1% TDS
    if (
        ownershipType &&
        ownershipType.toLowerCase().includes("sole proprietorship")
    ) {
        return 1;
    }

    // Others (Partnership, Private Limited, LLP, etc.) with PAN → 2% TDS
    return 2;
};

// ✅ STATIC METHOD: Get or Create TDS Record for current FY
tdsRecordSchema.statics.getOrCreateTdsRecord = async function (
    retailerId,
    retailerData,
    financialYear = null,
) {
    const fy = financialYear || getFiscalYear();

    let tdsRecord = await this.findOne({
        retailerId: retailerId,
        financialYear: fy,
    });

    if (!tdsRecord) {
        const tdsRate = this.determineTdsRate(
            retailerData.shopDetails?.ownershipType,
            retailerData.shopDetails?.PANCard,
        );

        tdsRecord = new this({
            retailerId: retailerId,
            financialYear: fy,
            applicableTdsRate: tdsRate,
            totalTCA: 0,
            peakTotalTCA: 0,
            cumulativeThresholdCrossed: false,
            individualTds: [],
            cumulativeTds: null,
        });

        await tdsRecord.save();
    }

    return tdsRecord;
};

// ✅ INSTANCE METHOD: Calculate TDS for a new/updated campaign TCA
tdsRecordSchema.methods.calculateTdsForCampaign = function (
    campaignId,
    campaignName,
    newTca,
    previousTca = 0,
) {
    // Update totalTCA
    this.totalTCA = this.totalTCA - previousTca + newTca;

    // Update peakTotalTCA (never decreases)
    if (this.totalTCA > this.peakTotalTCA) {
        this.peakTotalTCA = this.totalTCA;
    }

    const threshold30k = 30000;
    const threshold1L = 100000;

    // Check if cumulative threshold crossed for the first time
    if (!this.cumulativeThresholdCrossed && this.peakTotalTCA >= threshold1L) {
        this.cumulativeThresholdCrossed = true;
        this.cumulativeThresholdCrossedDate = new Date();

        // Calculate cumulative TDS on the entire peakTotalTCA
        const cumulativeTdsAmount =
            (this.peakTotalTCA * this.applicableTdsRate) / 100;

        this.cumulativeTds = {
            totalTcaAtCalculation: this.peakTotalTCA,
            tdsRate: this.applicableTdsRate,
            tdsAmount: cumulativeTdsAmount,
            calculatedOn: new Date(),
            campaignsIncluded: [], // You can populate this from retailerBudget if needed
            remarks: `Cumulative TDS calculated on crossing ₹1,00,000 threshold. Peak TCA: ₹${this.peakTotalTCA}`,
        };

        return {
            type: "cumulative",
            tdsAmount: cumulativeTdsAmount,
            calculatedOn: this.peakTotalTCA,
        };
    }

    // After cumulative threshold is crossed, calculate individual TDS on every campaign
    if (this.cumulativeThresholdCrossed) {
        const individualTdsAmount = (newTca * this.applicableTdsRate) / 100;

        const existingTdsIndex = this.individualTds.findIndex(
            (tds) => tds.campaignId.toString() === campaignId.toString(),
        );

        if (existingTdsIndex > -1) {
            // Update existing individual TDS
            this.individualTds[existingTdsIndex].tca = newTca;
            this.individualTds[existingTdsIndex].tdsAmount =
                individualTdsAmount;
            this.individualTds[existingTdsIndex].calculatedOn = new Date();
        } else {
            // Add new individual TDS
            this.individualTds.push({
                campaignId,
                campaignName,
                tca: newTca,
                tdsRate: this.applicableTdsRate,
                tdsAmount: individualTdsAmount,
                calculatedOn: new Date(),
                remarks: `Individual TDS (peakTotalTCA ≥ ₹1,00,000)`,
            });
        }

        return {
            type: "individual",
            tdsAmount: individualTdsAmount,
            calculatedOn: newTca,
        };
    }

    // Before cumulative threshold is crossed
    // Calculate individual TDS only if single campaign TCA ≥ 30k
    if (newTca >= threshold30k) {
        const individualTdsAmount = (newTca * this.applicableTdsRate) / 100;

        const existingTdsIndex = this.individualTds.findIndex(
            (tds) => tds.campaignId.toString() === campaignId.toString(),
        );

        if (existingTdsIndex > -1) {
            this.individualTds[existingTdsIndex].tca = newTca;
            this.individualTds[existingTdsIndex].tdsAmount =
                individualTdsAmount;
            this.individualTds[existingTdsIndex].calculatedOn = new Date();
        } else {
            this.individualTds.push({
                campaignId,
                campaignName,
                tca: newTca,
                tdsRate: this.applicableTdsRate,
                tdsAmount: individualTdsAmount,
                calculatedOn: new Date(),
                remarks: `Individual TDS (campaign TCA ≥ ₹30,000)`,
            });
        }

        return {
            type: "individual",
            tdsAmount: individualTdsAmount,
            calculatedOn: newTca,
        };
    }

    // No TDS applicable
    return {
        type: "none",
        tdsAmount: 0,
        calculatedOn: newTca,
    };
};

// ✅ INSTANCE METHOD: Recalculate all TDS (useful after edits/deletes)
tdsRecordSchema.methods.recalculateAllTds = function (campaignsData) {
    // campaignsData: Array of { campaignId, campaignName, tca }

    // Reset individual TDS
    this.individualTds = [];

    // Calculate new totalTCA
    this.totalTCA = campaignsData.reduce((sum, c) => sum + c.tca, 0);

    // peakTotalTCA should already be set and never decrease
    if (this.totalTCA > this.peakTotalTCA) {
        this.peakTotalTCA = this.totalTCA;
    }

    // If cumulative threshold was crossed, keep it crossed
    if (this.cumulativeThresholdCrossed) {
        // Recalculate individual TDS for each campaign
        campaignsData.forEach((campaign) => {
            const individualTdsAmount =
                (campaign.tca * this.applicableTdsRate) / 100;

            this.individualTds.push({
                campaignId: campaign.campaignId,
                campaignName: campaign.campaignName,
                tca: campaign.tca,
                tdsRate: this.applicableTdsRate,
                tdsAmount: individualTdsAmount,
                calculatedOn: new Date(),
                remarks: `Individual TDS (recalculated, peakTotalTCA ≥ ₹1,00,000)`,
            });
        });
    } else {
        // Before threshold crossing
        campaignsData.forEach((campaign) => {
            if (campaign.tca >= 30000) {
                const individualTdsAmount =
                    (campaign.tca * this.applicableTdsRate) / 100;

                this.individualTds.push({
                    campaignId: campaign.campaignId,
                    campaignName: campaign.campaignName,
                    tca: campaign.tca,
                    tdsRate: this.applicableTdsRate,
                    tdsAmount: individualTdsAmount,
                    calculatedOn: new Date(),
                    remarks: `Individual TDS (campaign TCA ≥ ₹30,000)`,
                });
            }
        });

        // Check if we should calculate cumulative TDS now
        if (this.peakTotalTCA >= 100000) {
            this.cumulativeThresholdCrossed = true;
            this.cumulativeThresholdCrossedDate = new Date();

            const cumulativeTdsAmount =
                (this.peakTotalTCA * this.applicableTdsRate) / 100;

            this.cumulativeTds = {
                totalTcaAtCalculation: this.peakTotalTCA,
                tdsRate: this.applicableTdsRate,
                tdsAmount: cumulativeTdsAmount,
                calculatedOn: new Date(),
                campaignsIncluded: campaignsData.map((c) => ({
                    campaignId: c.campaignId,
                    campaignName: c.campaignName,
                    tca: c.tca,
                })),
                remarks: `Cumulative TDS calculated on crossing ₹1,00,000 threshold. Peak TCA: ₹${this.peakTotalTCA}`,
            };
        }
    }

    return this;
};

// ✅ VIRTUAL: Get Financial Year details
tdsRecordSchema.virtual("fyDetails").get(function () {
    const [startYear, endYear] = this.financialYear.split("-");
    return {
        fy: this.financialYear,
        startDate: `01-04-${startYear}`,
        endDate: `31-03-${endYear}`,
        startYear: parseInt(startYear),
        endYear: parseInt(endYear),
    };
});

// Export model and helper function
export const TDSRecord = model("TDSRecord", tdsRecordSchema);
export { getFiscalYear };

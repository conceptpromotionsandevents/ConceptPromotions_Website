import mongoose from "mongoose";

// Installment/Payment sub-schema (NO CHANGES - keeping old logic)
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

// Campaign budget sub-schema (ADDED TDS FIELDS)
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

        // ========== TDS FIELDS ==========
        tdsApplicable: {
            type: Boolean,
            default: false,
        },
        tdsRate: {
            type: Number,
            enum: [0, 1, 2, 20],
            default: 0,
        },
        tdsAmount: {
            type: Number,
            default: 0,
            min: 0,
        },
        netPayable: {
            type: Number,
            default: 0,
        },
        thresholdReason: {
            type: String,
            enum: ['SINGLE_PAYMENT', 'ANNUAL_AGGREGATE', 'BOTH', 'NONE'],
            default: 'NONE',
        },
        taxableAmount: {
            type: Number,
            default: 0,
            min: 0,
        },
        // ====================================

        installments: [installmentSchema],
    },
    { _id: true }
);

// Main Retailer Budget schema (ADDED FY TRACKING FIELDS)
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

        // ========== FY TRACKING FIELDS ==========
        financialYear: {
            type: String,
            index: true,
        },
        fyTotalTCA: {
            type: Number,
            default: 0,
            min: 0,
        },
        fyTotalTDS: {
            type: Number,
            default: 0,
            min: 0,
        },
        fyTotalNetPayable: {
            type: Number,
            default: 0,
            min: 0,
        },
        // ============================================

        campaigns: [campaignBudgetSchema],
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// ========================================
// TDS HELPER FUNCTIONS
// ========================================

/**
 * Get current Financial Year (Apr-Mar)
 */
function getCurrentFinancialYear() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth(); // 0-indexed (0 = January)

    // FY starts in April (month 3)
    return month >= 3 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
}

/**
 * Determine TDS rate based on ownership type and PAN
 */
function determineTDSRate(ownershipType, panCard) {
    // No PAN = 20%
    if (!panCard || panCard.trim() === '') {
        return 20;
    }

    // Map ownership types to TDS rates
    switch (ownershipType) {
        case 'Sole Proprietorship':
            return 1;
        case 'Partnership':
            return 2;
        case 'Private Ltd':
            return 2;
        case 'LLP':
            return 2;
        default:
            return 2; // Default to 2% for unknown types
    }
}

/**
 * Check if TDS threshold is crossed (Section 194C)
 * RULES:
 * 1. If campaign >= ₹30,000 → TDS on FULL amount
 * 2. If campaign < ₹30,000 BUT FY crosses ₹1,00,000 → TDS on EXCESS only
 * 3. If campaign < ₹30,000 AND FY already > ₹1,00,000 → TDS on FULL amount
 */
function checkTDSThreshold(tcaAmount, previousFYTotal) {
    const singlePaymentThreshold = 30000;
    const annualThreshold = 100000;

    const meetsSinglePayment = tcaAmount >= singlePaymentThreshold;
    const newFYTotal = previousFYTotal + tcaAmount;
    const wasAboveThreshold = previousFYTotal > annualThreshold;
    const crossesThreshold = previousFYTotal <= annualThreshold && newFYTotal > annualThreshold;

    // CASE 1: Campaign >= ₹30,000 → TDS on full amount
    if (meetsSinglePayment) {
        return {
            applicable: true,
            reason: newFYTotal > annualThreshold ? 'BOTH' : 'SINGLE_PAYMENT',
            taxableAmount: tcaAmount
        };
    }

    // CASE 2: Campaign < ₹30,000 BUT crosses ₹1L threshold → TDS on EXCESS only
    if (crossesThreshold) {
        const excessAmount = newFYTotal - annualThreshold;
        return {
            applicable: true,
            reason: 'ANNUAL_AGGREGATE',
            taxableAmount: excessAmount
        };
    }

    // CASE 3: Campaign < ₹30,000 AND FY already > ₹1L → TDS on full amount
    if (wasAboveThreshold) {
        return {
            applicable: true,
            reason: 'ANNUAL_AGGREGATE',
            taxableAmount: tcaAmount
        };
    }

    // CASE 4: No TDS applicable
    return {
        applicable: false,
        reason: 'NONE',
        taxableAmount: 0
    };
}

/**
 * Calculate TDS for a campaign TCA
 */
async function calculateCampaignTDS(campaign, retailerId, currentFYTotal) {
    try {
        // Import Retailer model dynamically to avoid circular dependency
        const Retailer = mongoose.model('Retailer');
        const retailer = await Retailer.findById(retailerId).select('shopDetails');

        if (!retailer) {
            console.error('Retailer not found for TDS calculation');
            return {
                tdsApplicable: false,
                tdsRate: 0,
                tdsAmount: 0,
                netPayable: campaign.tca,
                thresholdReason: 'NONE',
                taxableAmount: 0,
            };
        }

        const ownershipType = retailer.shopDetails?.ownershipType;
        const panCard = retailer.shopDetails?.PANCard;

        // Check threshold
        const thresholdCheck = checkTDSThreshold(campaign.tca, currentFYTotal);

        if (!thresholdCheck.applicable) {
            return {
                tdsApplicable: false,
                tdsRate: 0,
                tdsAmount: 0,
                netPayable: campaign.tca,
                thresholdReason: 'NONE',
                taxableAmount: 0,
            };
        }

        // Determine TDS rate
        const tdsRate = determineTDSRate(ownershipType, panCard);

        // Calculate TDS on taxableAmount (not full tca)
        const tdsAmount = Math.round((thresholdCheck.taxableAmount * tdsRate) / 100);

        // Calculate net payable
        const netPayable = campaign.tca - tdsAmount;

        return {
            tdsApplicable: true,
            tdsRate,
            tdsAmount,
            netPayable,
            thresholdReason: thresholdCheck.reason,
            taxableAmount: thresholdCheck.taxableAmount,
        };

    } catch (error) {
        console.error('Error calculating TDS:', error);
        // Return safe defaults if error
        return {
            tdsApplicable: false,
            tdsRate: 0,
            tdsAmount: 0,
            netPayable: campaign.tca,
            thresholdReason: 'NONE',
            taxableAmount: 0,
        };
    }
}

// ========================================
// UPDATED PRE-SAVE MIDDLEWARE
// ========================================
retailerBudgetSchema.pre("save", async function (next) {
    try {
        // Set financial year if not set
        if (!this.financialYear) {
            this.financialYear = getCurrentFinancialYear();
        }

        // ✅ FIX: Get existing FY total from OTHER campaigns FIRST
        let fyTotalTCA = 0;
        let fyTotalTDS = 0;
        let fyTotalNetPayable = 0;

        // Track which campaigns are new (for TDS calculation)
        const newCampaigns = [];

        if (this.isNew) {
            // All campaigns are new
            newCampaigns.push(...this.campaigns);
        } else if (this.isModified('campaigns')) {
            // Find newly added campaigns (those without TDS fields set)
            this.campaigns.forEach(campaign => {
                if (campaign.tdsApplicable === undefined || campaign.netPayable === 0) {
                    newCampaigns.push(campaign);
                } else {
                    // ✅ ADD EXISTING CAMPAIGN TOTALS FIRST
                    fyTotalTCA += campaign.tca || 0;
                    fyTotalTDS += campaign.tdsAmount || 0;
                    fyTotalNetPayable += campaign.netPayable || 0;
                }
            });
        }

        // ✅ FIX: Also get totals from OTHER budget documents for same retailer in same FY
        if (!this.isNew) {
            try {
                const RetailerBudget = this.constructor;
                const otherBudgets = await RetailerBudget.find({
                    retailerId: this.retailerId,
                    financialYear: this.financialYear,
                    _id: { $ne: this._id }  // Exclude current document
                });

                otherBudgets.forEach(budget => {
                    fyTotalTCA += budget.fyTotalTCA || 0;
                    fyTotalTDS += budget.fyTotalTDS || 0;
                    fyTotalNetPayable += budget.fyTotalNetPayable || 0;
                });
            } catch (err) {
                console.error('Error fetching other budgets:', err);
            }
        }

        // Now calculate TDS for new campaigns with correct FY total
        for (const campaign of newCampaigns) {
            const tdsCalc = await calculateCampaignTDS(
                campaign,
                this.retailerId,
                fyTotalTCA  // ✅ Now has correct previous total
            );

            // Update campaign with TDS details
            campaign.tdsApplicable = tdsCalc.tdsApplicable;
            campaign.tdsRate = tdsCalc.tdsRate;
            campaign.tdsAmount = tdsCalc.tdsAmount;
            campaign.netPayable = tdsCalc.netPayable;
            campaign.thresholdReason = tdsCalc.thresholdReason;
            campaign.taxableAmount = tdsCalc.taxableAmount;

            // Add this campaign's totals
            fyTotalTCA += campaign.tca;
            fyTotalTDS += tdsCalc.tdsAmount;
            fyTotalNetPayable += tdsCalc.netPayable;
        }

        // Calculate per-campaign installment totals
        this.campaigns.forEach((campaign) => {
            campaign.cPaid = campaign.installments.reduce((sum, inst) => {
                return sum + (inst.installmentAmount || 0);
            }, 0);

            const baseAmount = campaign.netPayable > 0 ? campaign.netPayable : campaign.tca;
            campaign.cPending = baseAmount - campaign.cPaid;
        });

        // Calculate retailer-level totals
        this.tar = this.campaigns.reduce((sum, campaign) => {
            return sum + (campaign.tca || 0);
        }, 0);

        this.taPaid = this.campaigns.reduce((sum, campaign) => {
            return sum + (campaign.cPaid || 0);
        }, 0);

        this.taPending = this.tar - this.taPaid;

        // ✅ FIX: Store only THIS document's totals (not accumulated from others)
        let thisFyTotalTCA = 0;
        let thisFyTotalTDS = 0;
        let thisFyTotalNetPayable = 0;

        this.campaigns.forEach(campaign => {
            thisFyTotalTCA += campaign.tca || 0;
            thisFyTotalTDS += campaign.tdsAmount || 0;
            thisFyTotalNetPayable += campaign.netPayable || 0;
        });

        this.fyTotalTCA = thisFyTotalTCA;
        this.fyTotalTDS = thisFyTotalTDS;
        this.fyTotalNetPayable = thisFyTotalNetPayable;

        next();
    } catch (error) {
        console.error('Pre-save middleware error:', error);
        next(error);
    }
});

// Compound index for efficient filtering (OLD)
retailerBudgetSchema.index({
    state: 1,
    retailerId: 1,
    "campaigns.campaignId": 1,
});

// NEW: Index for financial year queries
retailerBudgetSchema.index({
    retailerId: 1,
    financialYear: 1,
});

// ========================================
// VIRTUAL FIELDS
// ========================================

// OLD VIRTUAL - Updated to include TDS info
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
                // NEW: Add TDS info
                campaignTDS: campaign.tdsAmount,
                campaignNetPayable: campaign.netPayable,
            });
        });
    });
    return utrs;
});

// NEW VIRTUAL - TDS Report
retailerBudgetSchema.virtual("tdsReport").get(function () {
    const report = {
        retailerName: this.retailerName,
        outletCode: this.outletCode,
        financialYear: this.financialYear,
        totalTCA: this.fyTotalTCA,
        totalTDS: this.fyTotalTDS,
        totalNetPayable: this.fyTotalNetPayable,
        campaigns: []
    };

    this.campaigns.forEach((campaign) => {
        if (campaign.tdsApplicable) {
            report.campaigns.push({
                campaignName: campaign.campaignName,
                tca: campaign.tca,
                tdsRate: campaign.tdsRate,
                tdsAmount: campaign.tdsAmount,
                netPayable: campaign.netPayable,
                thresholdReason: campaign.thresholdReason,
                paid: campaign.cPaid,
                pending: campaign.cPending,
            });
        }
    });

    return report;
});

// ========================================
// STATIC METHODS
// ========================================

// Get FY aggregate for a retailer across all budget documents
retailerBudgetSchema.statics.getFYAggregate = async function (retailerId, financialYear) {
    const fy = financialYear || getCurrentFinancialYear();

    const budgets = await this.find({
        retailerId,
        financialYear: fy
    });

    if (!budgets || budgets.length === 0) {
        return {
            financialYear: fy,
            totalTCA: 0,
            totalTDS: 0,
            totalNetPayable: 0,
            thresholdCrossed: false
        };
    }

    let totalTCA = 0;
    let totalTDS = 0;
    let totalNetPayable = 0;

    budgets.forEach(budget => {
        totalTCA += budget.fyTotalTCA || 0;
        totalTDS += budget.fyTotalTDS || 0;
        totalNetPayable += budget.fyTotalNetPayable || 0;
    });

    return {
        financialYear: fy,
        totalTCA,
        totalTDS,
        totalNetPayable,
        thresholdCrossed: totalTCA > 100000
    };
};

export const RetailerBudget = mongoose.model(
    "RetailerBudget",
    retailerBudgetSchema
);

// services/tds.service.js
import { TDSRecord, getFiscalYear } from "../models/tds.model.js";
import { Retailer } from "../models/retailer.model.js";

class TDSService {
    /**
     * Get or create TDS record and calculate TDS for retailer
     * @param {ObjectId} retailerId
     * @param {Array} campaignsData - Array of { campaignId, campaignName, tca }
     * @param {String} financialYear - Optional FY, defaults to current
     * @returns {Object} TDS information
     */
    async calculateAndStoreTDS(
        retailerId,
        campaignsData,
        financialYear = null,
    ) {
        try {
            const fy = financialYear || getFiscalYear();

            // Fetch retailer details
            const retailer = await Retailer.findById(retailerId);
            if (!retailer) {
                throw new Error("Retailer not found");
            }

            // Get or create TDS record
            const tdsRecord = await TDSRecord.getOrCreateTdsRecord(
                retailerId,
                retailer,
                fy,
            );

            // Recalculate all TDS
            tdsRecord.recalculateAllTds(campaignsData);
            await tdsRecord.save();

            // Return formatted TDS info
            return this.formatTDSInfo(tdsRecord);
        } catch (error) {
            console.error("Error in calculateAndStoreTDS:", error);
            throw error;
        }
    }

    /**
     * Get TDS information for a retailer
     * @param {ObjectId} retailerId
     * @param {String} financialYear - Optional FY
     * @returns {Object} TDS information or null
     */
    async getTDSInfo(retailerId, financialYear = null) {
        try {
            const fy = financialYear || getFiscalYear();
            const tdsRecord = await TDSRecord.findOne({
                retailerId,
                financialYear: fy,
            });

            if (!tdsRecord) {
                return null;
            }

            return this.formatTDSInfo(tdsRecord);
        } catch (error) {
            console.error("Error in getTDSInfo:", error);
            return null;
        }
    }

    /**
     * Format TDS record for API responses
     * @param {Object} tdsRecord - Mongoose TDS document
     * @returns {Object} Formatted TDS info
     */
    formatTDSInfo(tdsRecord) {
        return {
            financialYear: tdsRecord.financialYear,
            totalTCA: tdsRecord.totalTCA,
            peakTotalTCA: tdsRecord.peakTotalTCA,
            applicableTdsRate: tdsRecord.applicableTdsRate,
            tdsBreakdown: {
                individualTds: tdsRecord.totalIndividualTdsAmount,
                cumulativeTds: tdsRecord.totalCumulativeTdsAmount,
                totalTds: tdsRecord.totalTdsAmount,
            },
            thresholdStatus: {
                cumulativeThresholdCrossed:
                    tdsRecord.cumulativeThresholdCrossed,
                cumulativeThresholdCrossedDate:
                    tdsRecord.cumulativeThresholdCrossedDate,
                remainingToThreshold: Math.max(0, 100000 - tdsRecord.totalTCA),
            },
            individualTdsRecords: tdsRecord.individualTds.map((tds) => ({
                campaignId: tds.campaignId,
                campaignName: tds.campaignName,
                tca: tds.tca,
                tdsRate: tds.tdsRate,
                tdsAmount: tds.tdsAmount,
                calculatedOn: tds.calculatedOn,
            })),
            cumulativeTdsRecord: tdsRecord.cumulativeTds
                ? {
                      totalTcaAtCalculation:
                          tdsRecord.cumulativeTds.totalTcaAtCalculation,
                      tdsRate: tdsRecord.cumulativeTds.tdsRate,
                      tdsAmount: tdsRecord.cumulativeTds.tdsAmount,
                      calculatedOn: tdsRecord.cumulativeTds.calculatedOn,
                  }
                : null,
            lastCalculatedAt: tdsRecord.lastCalculatedAt,
        };
    }

    /**
     * Get campaign-specific TDS info
     * @param {ObjectId} retailerId
     * @param {ObjectId} campaignId
     * @returns {Object} Campaign TDS info or null
     */
    async getCampaignTDSInfo(retailerId, campaignId, financialYear = null) {
        try {
            const fy = financialYear || getFiscalYear();
            const tdsRecord = await TDSRecord.findOne({
                retailerId,
                financialYear: fy,
            });

            if (!tdsRecord) {
                return null;
            }

            const campaignTds = tdsRecord.individualTds.find(
                (tds) => tds.campaignId.toString() === campaignId.toString(),
            );

            return campaignTds
                ? {
                      campaignId: campaignTds.campaignId,
                      campaignName: campaignTds.campaignName,
                      tca: campaignTds.tca,
                      tdsRate: campaignTds.tdsRate,
                      tdsAmount: campaignTds.tdsAmount,
                      calculatedOn: campaignTds.calculatedOn,
                  }
                : null;
        } catch (error) {
            console.error("Error in getCampaignTDSInfo:", error);
            return null;
        }
    }
}

export default new TDSService();

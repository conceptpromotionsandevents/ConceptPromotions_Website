import mongoose from "mongoose";
import dotenv from "dotenv";
import { Retailer, Campaign } from "../backend/models/user.js";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/your-db-name";

async function fixCampaignRetailers() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");

    const campaigns = await Campaign.find({});
    console.log(`Found ${campaigns.length} campaigns.`);

    for (const campaign of campaigns) {
      let updated = false;

      // Loop through assignedRetailers
      for (const ar of campaign.assignedRetailers) {
        if (!ar.retailerId) {
          // Try to fetch retailer by uniqueId or some other logic
          const retailer = await Retailer.findOne({ uniqueId: ar.uniqueId });
          if (retailer) {
            ar.retailerId = retailer._id;
            ar.status = ar.status || "pending";
            ar.assignedAt = ar.assignedAt || new Date();
            updated = true;
            console.log(`✅ Assigned retailer ${retailer.uniqueId} to campaign ${campaign.name}`);
          } else {
            console.warn(`⚠️ No retailer found for campaign ${campaign.name}, uniqueId: ${ar.uniqueId}`);
          }
        }
      }

      if (updated) {
        await campaign.save();
      }
    }

    console.log("✅ All campaigns updated successfully.");
    mongoose.disconnect();
  } catch (err) {
    console.error("❌ Error updating campaigns:", err);
    mongoose.disconnect();
  }
}

fixCampaignRetailers();

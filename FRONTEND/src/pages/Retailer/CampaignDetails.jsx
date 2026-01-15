import React, { useState } from "react";
import Info from "./Info";
import Gratification from "./Gratification";
import Report from "./RetailerViewReports";
import Period from "./Period";
import Status from "./Status";
import Leaderboard from "./Leaderboard";
import SubmitReport from "./SubmitReport";

const CampaignDetails = ({ campaign, onBack }) => {
  const [activeTab, setActiveTab] = useState("info");

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return "Invalid date";
    }
  };

  // ✅ Use campaign prop directly (it already has all data including info and gratification)
  const campaignForComponents = campaign ? {
    _id: campaign._id,
    name: campaign.name,
    startDate: formatDate(campaign.retailerStatus?.startDate || campaign.campaignStartDate),
    endDate: formatDate(campaign.retailerStatus?.endDate || campaign.campaignEndDate),
    client: campaign.client,
    type: campaign.type,
    status: campaign.retailerStatus?.status || 'pending',
    isActive: campaign.isActive,
    regions: campaign.regions || [],
    states: campaign.states || [],
    createdBy: campaign.createdBy,
    assignedAt: campaign.retailerStatus?.assignedAt,
    updatedAt: campaign.retailerStatus?.updatedAt,
    assignedEmployees: campaign.assignedEmployees || [],

    // ✅ Info section
    info: {
      description: campaign.info?.description || "",
      tnc: campaign.info?.tnc || "",
      banners: campaign.info?.banners || []
    },

    // ✅ Gratification section
    gratification: {
      type: campaign.gratification?.type || "",
      description: campaign.gratification?.description || "",
      images: campaign.gratification?.images || []
    }
  } : null;

  if (!campaign) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md">
        <button
          onClick={onBack}
          className="mb-4 text-[#E4002B] font-medium hover:underline flex items-center gap-2"
        >
          <span>←</span> Back
        </button>
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg">
          <p>No campaign data available.</p>
        </div>
      </div>
    );
  }

  const tabComponents = {
    info: <Info campaign={campaignForComponents} />,
    gratification: <Gratification campaign={campaignForComponents} />,
    report: <Report campaign={campaignForComponents} />,
    period: <Period campaign={campaignForComponents} />,
    status: <Status campaign={campaignForComponents} />,
    leaderboard: <Leaderboard campaign={campaignForComponents} />,
    submitReport: <SubmitReport campaign={campaignForComponents} />,
  };

  return (
    <div className="p-6 bg-[#EDEDED] rounded-lg shadow-md">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="mb-4 text-[#E4002B] font-medium hover:underline flex items-center gap-2 transition-colors cursor-pointer"
      >
        <span>←</span> Back to Campaigns
      </button>

      {/* Campaign Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[#E4002B] mb-2">
          {campaign.name}
        </h2>
        <p className="text-gray-600 text-sm">
          Client: <span className="font-medium">{campaign.client}</span>
        </p>
      </div>

      {/* Submit Report Button */}
      <button
        onClick={() => setActiveTab("submitReport")}
        className="px-6 py-2.5 rounded-lg bg-[#E4002B] text-white font-medium shadow-md hover:bg-[#c60025] transition-colors mb-4 cursor-pointer"
      >
        Submit Report
      </button>

      {/* Divider */}
      <div className="w-full h-[1px] bg-gray-300 mb-6"></div>

      {/* Tab Navigation Grid */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { key: "info", label: "Info" },
          { key: "gratification", label: "Gratification" },
          { key: "report", label: "View Report" },
          { key: "period", label: "Period" },
          { key: "status", label: "Status" },
          { key: "leaderboard", label: "Leaderboard" },
        ].map((item) => (
          <button
            key={item.key}
            className={`p-4 border-2 rounded-lg text-center font-medium transition-all cursor-pointer
              ${activeTab === item.key
                ? "bg-[#E4002B] text-white border-[#E4002B] shadow-lg"
                : "bg-white text-gray-700 border-gray-300 hover:border-[#E4002B] hover:shadow-md"
              }`}
            onClick={() => setActiveTab(item.key)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Content Section */}
      <div className="mt-6 border-2 border-[#E4002B] rounded-lg p-6 bg-gray-50">
        {tabComponents[activeTab]}
      </div>
    </div>
  );
};

export default CampaignDetails;

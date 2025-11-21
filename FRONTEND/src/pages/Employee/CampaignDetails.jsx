import React, { useState } from "react";

import Info from "./Info";
import Gratification from "./Gratification";
import Report from "./Report";
import Period from "./Period";
import Status from "./Status";
import OutletsAssigned from "./OutletsAssigned";
import SubmitReport from "./SubmitReport";

const dummyData = {
  1: {
    name: "Monte Carlo Winter Festival",
    startDate: "01-Apr-25",
    endDate: "15-Apr-25",
    description: "Employee incentive campaign for promoting winter wear.",
    status: "Active",
    gratification: "Earn bonus points for each sale",
    terms: [
      "Only valid for registered employees.",
      "Applicable only on winter category products.",
      "Performance will be reviewed weekly.",
    ],
  },

  2: {
    name: "ABCD Employee Drive",
    startDate: "10-Apr-25",
    endDate: "25-Apr-25",
    description: "Sales push campaign with performance rewards.",
    status: "Active",
    gratification: "Top performers receive gift vouchers",
    terms: [
      "Only valid for active employees.",
      "Daily reporting is mandatory.",
      "Employees must follow product guidelines.",
    ],
  },

  3: {
    name: "Winter Dhamaka 2025",
    startDate: "05-Apr-25",
    endDate: "20-Apr-25",
    description: "Sales performance campaign for winter collection.",
    status: "Active",
    gratification: "Earn up to ₹5000 bonus based on targets",
    terms: [
      "Employees must meet minimum weekly targets.",
      "Only sales of eligible winter items count.",
      "Bonus will be credited post-campaign.",
    ],
  },
};

const CampaignDetails = ({ campaignId, onBack }) => {
  const campaign = dummyData[campaignId];
  const [activeTab, setActiveTab] = useState("info");

  if (!campaign) return <p>No campaign found.</p>;

  const tabComponents = {
    info: <Info campaign={campaign} />,
    gratification: <Gratification campaign={campaign} />,
    report: <Report campaign={campaign} />,
    period: <Period campaign={campaign} />,
    status: <Status campaign={campaign} />,
    outlets: <OutletsAssigned campaign={campaign} />,
    submitReport: <SubmitReport campaign={campaign} />,
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">

      {/* Back */}
      <button
        onClick={onBack}
        className="mb-4 text-[#E4002B] font-medium hover:underline"
      >
        ← Back
      </button>

      {/* Heading */}
      <h2 className="text-2xl font-bold text-[#E4002B] mb-6">
        {campaign.name}
      </h2>

      {/* Submit Report Button under heading */}
      <button
        onClick={() => setActiveTab("submitReport")}
        className="px-4 py-2 rounded-lg bg-[#E4002B] text-white font-medium shadow-md hover:bg-[#c60025] mb-4"
      >
        Submit Report
      </button>

      {/* Black separation line */}
      <div className="w-full h-[1px] bg-black mb-6"></div>

      {/* 3×2 Grid Buttons */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { key: "info", label: "Info" },
          { key: "gratification", label: "Gratification" },
          { key: "report", label: "View Report" },
          { key: "period", label: "Period" },
          { key: "outlets", label: "Outlets Assigned" },
          { key: "status", label: "Status" },
        ].map((item) => (
          <button
            key={item.key}
            className={`p-4 border rounded-lg text-center shadow-sm font-medium
              ${activeTab === item.key ? "bg-[#E4002B] text-white" : "hover:shadow-md"}`}
            onClick={() => setActiveTab(item.key)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* CONTENT SECTION */}
      <div className="mt-6 border-2 border-[#E4002B] rounded-lg p-6">
        {tabComponents[activeTab]}
      </div>
    </div>
  );
};

export default CampaignDetails;

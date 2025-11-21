import React from "react";

const visitTypeLabels = {
  scheduled: "Scheduled",
  unscheduled: "Unscheduled",
};

const reasonLabels = {
  outlet_closed: "Outlet Closed",
  retailer_not_available: "Retailer Not Available",
  other: "Other",
};

const LastVisitDetails = ({ data, onBack }) => {
  if (!data) return null;

  const isLastVisitNA = data.lastVisit === "NA";

  return (
    <div className="p-6 bg-white shadow rounded-lg">
      <button
        className="text-[#E4002B] mb-4 font-medium hover:underline"
        onClick={onBack}
      >
        ← Back
      </button>

      <h2 className="text-2xl font-bold text-[#E4002B] mb-4">
        Last Visit Details
      </h2>

      <div className="space-y-3 text-gray-800">
        <p><strong>Retailer:</strong> {data.retailerName}</p>
        <p><strong>Last Visit:</strong> {data.lastVisit}</p>
        <p><strong>Upcoming Visit:</strong> {data.upcomingVisit}</p>

        {/* IF NO LAST VISIT */}
        {isLastVisitNA ? (
          <div className="mt-4 p-4 border rounded bg-gray-50 space-y-2">
            <h3 className="font-semibold text-lg mb-2">Visit Information</h3>

            <p>
              <strong>Type of Visit:</strong>{" "}
              {visitTypeLabels[data.typeOfVisit?.toLowerCase()] || "Not Provided"}
            </p>

            <p>
              <strong>Visit Attended:</strong>{" "}
              {data.attended ? "Yes" : "No"}
            </p>

            {!data.attended && (
              <p>
                <strong>Reason:</strong>{" "}
                {reasonLabels[data.reason?.toLowerCase()] || data.reason || "Not Provided"}
              </p>
            )}
          </div>
        ) : (
          // IF LAST VISIT EXISTS
          <div className="mt-4 p-4 border rounded bg-gray-50 space-y-2">
            <h3 className="font-semibold text-lg mb-2">Visit Summary</h3>

            <p>
              <strong>Type of Visit:</strong>{" "}
              {visitTypeLabels[data.typeOfVisit?.toLowerCase()] || "Not Provided"}
            </p>

            <p>
              <strong>Visit Attended:</strong>{" "}
              {data.attended ? "Yes" : "No"}
            </p>

            {data.attended && (
              <p>
                <strong>Summary:</strong>{" "}
                {data.summary || "No summary provided"}
              </p>
            )}

            {!data.attended && (
              <p>
                <strong>Reason:</strong>{" "}
                {reasonLabels[data.reason?.toLowerCase()] || data.reason}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LastVisitDetails;

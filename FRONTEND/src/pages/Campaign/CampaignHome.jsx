import React, { useEffect, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const CampaignHome = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCampaigns = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        "https://supreme-419p.onrender.com/api/admin/campaigns",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || "Error fetching campaigns", { theme: "dark" });
        return;
      }

      setCampaigns(data.campaigns || []);
    } catch (error) {
      console.error(error);
      toast.error("Server error", { theme: "dark" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  return (
    <>
      <ToastContainer />

      <div className="w-full p-4">
        <h1 className="text-2xl font-bold text-[#E4002B] mb-6 text-center">
          Campaigns
        </h1>

        {/* Loading */}
        {loading && (
          <p className="text-center text-gray-500 text-lg">Loading...</p>
        )}

        {/* No Data */}
        {!loading && campaigns.length === 0 && (
          <p className="text-center text-gray-500 text-lg">
            No campaigns found.
          </p>
        )}

        {/* Card Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {campaigns.map((c) => (
            <div
              key={c._id}
              className="bg-white shadow-md rounded-xl border border-gray-200 p-6 hover:shadow-lg transition"
            >
              {/* Title */}
              <h2 className="text-xl font-bold text-gray-800">
                {c.name}
              </h2>

              {/* Client */}
              <p className="mt-2 text-gray-600">
                <strong>Client:</strong> {c.client}
              </p>

              {/* Type */}
              <p className="text-gray-600">
                <strong>Type:</strong> {c.type}
              </p>

              {/* Region / State */}
              <p className="text-gray-600">
                <strong>Region:</strong> {c.region}
              </p>

              <p className="text-gray-600">
                <strong>State:</strong> {c.state}
              </p>

              {/* Created By */}
              {c.createdBy?.name && (
                <p className="text-gray-600">
                  <strong>Created By:</strong> {c.createdBy.name}
                </p>
              )}

              {/* Assigned */}
              <div className="w-full h-[1px] bg-gray-200 my-3"></div>

              <div className="flex justify-between items-center">
                <div>
                  <p className="text-gray-600 text-sm">
                    <strong>Employees:</strong>{" "}
                    {c.assignedEmployees?.length || 0}
                  </p>
                  <p className="text-gray-600 text-sm">
                    <strong>Retailers:</strong>{" "}
                    {c.assignedRetailers?.length || 0}
                  </p>
                </div>

                {/* View Button */}
                <button className="bg-[#E4002B] text-white px-4 py-1 rounded-md text-sm hover:bg-[#C3002B]">
                  View
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default CampaignHome;

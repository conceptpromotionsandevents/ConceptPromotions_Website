import React, { useEffect, useState } from "react";
import { FaMapMarkerAlt, FaPen } from "react-icons/fa";

const UpdateCampaign = ({ onEdit }) => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem("token");

      const res = await fetch(
        "https://supreme-419p.onrender.com/api/admin/campaigns",
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();

      if (res.ok && data.campaigns) {
        setCampaigns(data.campaigns);
      } else {
        setError(data.message || "Failed to fetch campaigns.");
      }
    } catch (err) {
      console.error("Error fetching campaigns:", err);
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 pt-4 px-4 md:px-10 pb-10">
      <h1 className="text-2xl font-bold mb-6 text-center text-[#E4002B]">
        Edit Campaigns
      </h1>

      {loading ? (
        <p className="text-gray-600">Loading campaigns...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : campaigns.length === 0 ? (
        <p className="text-gray-500">No campaigns found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns.map((c) => (
            <div
              key={c._id}
              className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 hover:shadow-md transition flex flex-col justify-between"
            >
              <h3 className="text-lg font-bold text-gray-900 mb-1">
                {c.name}
              </h3>

              <p className="text-sm text-gray-700 mb-3">{c.client}</p>

              <div className="text-sm text-gray-700 space-y-1">
                <p className="flex items-center gap-2">
                  <FaMapMarkerAlt className="text-gray-500" />
                  {c.state}
                </p>
                <p>Type: {c.type}</p>
                <p>Region: {c.region}</p>
                <p>Status: {c.isActive ? "Active" : "Inactive"}</p>
              </div>

              <button
                onClick={() => onEdit(c._id)}
                className="mt-5 flex items-center justify-center gap-2 w-full py-2 rounded-lg bg-[#E4002B] text-white font-medium hover:bg-[#C3002B] transition"
              >
                <FaPen /> Edit
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UpdateCampaign;

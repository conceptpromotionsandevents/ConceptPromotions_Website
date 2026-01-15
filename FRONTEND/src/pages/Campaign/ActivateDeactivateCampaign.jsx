import React, { useEffect, useState } from "react";
import { FaArrowLeft } from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { API_URL } from "../../url/base";

const ActivateDeactivateCampaign = ({ campaignId, onBack }) => {
  const [campaign, setCampaign] = useState(null);
  const [status, setStatus] = useState(null);
  const [saving, setSaving] = useState(false);

  // ✅ Fetch Campaign details
  const fetchCampaignDetails = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await fetch(`${API_URL}/admin/campaigns/${campaignId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Unable to fetch campaign", { theme: "dark" });
        return;
      }

      setCampaign(data.campaign);
      setStatus(data.campaign.isActive ? "active" : "inactive");
    } catch (err) {
      console.error("Error:", err);
      toast.error("Something went wrong", { theme: "dark" });
    }
  };

  useEffect(() => {
    if (campaignId) fetchCampaignDetails();
  }, [campaignId]);

  // ✅ Update Campaign Status
  const handleStatusUpdate = async () => {
    setSaving(true);

    try {
      const token = localStorage.getItem("token");
      
      const payload = {
        isActive: status === "active"
      };

      const res = await fetch(`${API_URL}/admin/campaigns/${campaignId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Update failed", { theme: "dark" });
      } else {
        setCampaign(data.campaign);
        toast.success(data.message || "Status updated", { theme: "dark" });
      }
    } catch (err) {
      console.error("Error:", err);
      toast.error("Something went wrong", { theme: "dark" });
    }

    setSaving(false);
  };

  if (!campaign) {
    return <p className="text-center mt-10 text-gray-200">Loading...</p>;
  }

  return (
    <>
      <ToastContainer />

      <div className="min-h-screen bg-[#171717] pt-8 px-6 md:px-20 pb-10">
        {/* ✅ BACK BUTTON */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-[#E4002B] mb-6 hover:underline font-medium cursor-pointer"
        >
          <FaArrowLeft /> Back to Campaigns
        </button>

        <div className="bg-[#EDEDED] p-6 shadow-md rounded-xl border max-w-3xl mx-auto w-full">
          <h2 className="text-2xl font-bold text-[#E4002B]">
            {campaign.name}
          </h2>

          <p className="text-gray-600 mt-2">
            <strong>Client:</strong> {campaign.client}
          </p>

          <p className="text-gray-600">
            <strong>Region(s):</strong> {campaign.regions.join(", ")}
          </p>

          <p className="text-gray-600">
            <strong>State(s):</strong> {campaign.states.join(", ")}
          </p>

          {campaign.description && (
            <p className="mt-3 text-gray-700">{campaign.description}</p>
          )}

          <p className="mt-3 text-sm text-gray-500">
            Created on: {new Date(campaign.createdAt).toLocaleDateString()}
          </p>

          {/* STATUS SECTION */}
          <div className="mt-6">
            <strong>Status:</strong>

            <div className="flex gap-6 mt-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="active"
                  checked={status === "active"}
                  onChange={(e) => setStatus(e.target.value)}
                />
                Active
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="inactive"
                  checked={status === "inactive"}
                  onChange={(e) => setStatus(e.target.value)}
                />
                Inactive
              </label>
            </div>

            <button
              onClick={handleStatusUpdate}
              disabled={saving}
              className="mt-6 bg-[#E4002B] text-white px-6 py-2 rounded-md hover:bg-[#C3002B] transition cursor-pointer disabled:bg-gray-400"
            >
              {saving ? "Updating..." : "Update Status"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ActivateDeactivateCampaign;

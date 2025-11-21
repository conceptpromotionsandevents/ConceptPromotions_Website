import React, { useEffect, useState } from "react";
import { FaArrowLeft } from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const EditCampaign = ({ campaignId, onBack }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    client: "",
    type: "",
    region: "",
    state: "",
  });

  const API_BASE = "https://supreme-419p.onrender.com";

  // ✅ Fetch campaign details
  useEffect(() => {
    const fetchCampaign = async () => {
      try {
        if (!campaignId) return;
        setLoading(true);

        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE}/api/admin/campaigns/${campaignId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          setError("Failed to load campaign");
          return;
        }

        const data = await res.json();
        const c = data.campaign;

        setFormData({
          name: c?.name || "",
          client: c?.client || "",
          type: c?.type || "",
          region: c?.region || "",
          state: c?.state || "",
        });
      } catch (err) {
        console.error(err);
        setError("Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    fetchCampaign();
  }, [campaignId]);

  // ✅ Input handler
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // ✅ Save updates
  const handleSave = async () => {
    try {
      setSaving(true);

      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/admin/campaigns/${campaignId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Failed to update campaign", {
          theme: "dark",
        });
        return;
      }

      toast.success("✅ Campaign updated!", { theme: "dark" });

      setTimeout(() => {
        if (onBack) onBack();
      }, 900);
    } catch (err) {
      console.error(err);
      toast.error("Error updating campaign", { theme: "dark" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-center mt-20">Loading...</p>;
  if (error)
    return <p className="text-center mt-20 text-red-500 font-semibold">{error}</p>;

  return (
    <>
      <ToastContainer />

      <div className="min-h-screen bg-gray-50 pt-10 px-6 md:px-20 pb-10">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-[#E4002B] mb-6 font-medium hover:underline"
        >
          <FaArrowLeft /> Back
        </button>

        <div className="bg-white p-6 shadow-md rounded-xl border">
          <h1 className="text-2xl font-bold text-[#E4002B] mb-6 text-center">
            Edit Campaign
          </h1>

          <div className="space-y-5">
            <div>
              <label className="block font-medium mb-1">Campaign Name</label>
              <input
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full p-3 border rounded-lg"
              />
            </div>

            <div>
              <label className="block font-medium mb-1">Client</label>
              <input
                name="client"
                value={formData.client}
                onChange={handleChange}
                className="w-full p-3 border rounded-lg"
              />
            </div>

            <div>
              <label className="block font-medium mb-1">Type</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full p-3 border rounded-lg bg-white"
              >
                <option value="Retailer Enrolment">Retailer Enrolment</option>
                <option value="Display Payment">Display Payment</option>
                <option value="Incentive Payment">Incentive Payment</option>
                <option value="Others">Others</option>
              </select>
            </div>

            <div>
              <label className="block font-medium mb-1">Region</label>
              <select
                name="region"
                value={formData.region}
                onChange={handleChange}
                className="w-full p-3 border rounded-lg bg-white"
              >
                <option value="North">North</option>
                <option value="South">South</option>
                <option value="East">East</option>
                <option value="West">West</option>
                <option value="All">All</option>
              </select>
            </div>

            <div>
              <label className="block font-medium mb-1">State</label>
              <input
                name="state"
                value={formData.state}
                onChange={handleChange}
                className="w-full p-3 border rounded-lg"
              />
            </div>

            <div className="flex justify-end gap-4 mt-8">
              <button
                onClick={onBack}
                className="px-6 py-3 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
              >
                Cancel
              </button>

              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-3 bg-[#E4002B] text-white rounded-lg hover:bg-[#c10024] transition disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default EditCampaign;

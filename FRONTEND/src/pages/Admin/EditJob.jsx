import React, { useEffect, useState } from "react";
import { FaArrowLeft } from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const EditJob = ({ jobId, onBack }) => {  // ✅ receive jobId and onBack as props
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    salaryRange: "",
    experienceRequired: "",
    employmentType: "",
  });

  // ✅ Fetch job details using jobId prop
  useEffect(() => {
    const fetchJob = async () => {
      if (!jobId) return;
      try {
        setLoading(true);
        const token = localStorage.getItem("token");

        const res = await fetch(
          `https://supreme-419p.onrender.com/api/admin/career/jobs/${jobId}`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (res.status === 404) {
          setError("❌ Job not found.");
          return;
        }

        if (!res.ok) {
          throw new Error(`Failed to fetch job (Status: ${res.status})`);
        }

        const data = await res.json();
        const job = data.job || data;

        setFormData({
          title: job.title || "",
          description: job.description || "",
          location: job.location || "",
          salaryRange: job.salaryRange || "",
          experienceRequired: job.experienceRequired || "",
          employmentType: job.employmentType || "",
        });
      } catch (err) {
        console.error("Fetch job error:", err);
        setError("⚠️ Something went wrong while fetching job details.");
      } finally {
        setLoading(false);
      }
    };

    fetchJob();
  }, [jobId]);

  // ✅ Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // ✅ Save changes
  const handleSave = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem("token");

      const res = await fetch(
        `https://supreme-419p.onrender.com/api/admin/jobs/${jobId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "❌ Failed to update job.", { theme: "dark" });
        return;
      }

      toast.success("✅ Job updated successfully!", { theme: "dark" });

      setTimeout(() => {
        if (onBack) onBack(); // ✅ go back to UpdateJob view inside dashboard
      }, 1500);
    } catch (err) {
      console.error("Update job error:", err);
      toast.error("⚠️ Failed to update job. Please try again.", { theme: "dark" });
    } finally {
      setSaving(false);
    }
  };

  // ✅ UI
  if (loading)
    return <div className="text-center mt-20 text-gray-500">Loading job details...</div>;
  if (error)
    return <div className="text-center mt-20 text-red-500 font-semibold">{error}</div>;

  return (
    <>
      <ToastContainer />
      <div className="min-h-screen bg-gray-50 pt-10 px-6 md:px-20 pb-10">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-[#E4002B] mb-6 font-medium hover:underline"
        >
          <FaArrowLeft /> Back to Jobs
        </button>

        <div className="bg-white shadow-sm border border-gray-200 rounded-xl p-6 space-y-5">
          <h1 className="text-2xl font-bold mb-4 text-center mb-8 text-[#E4002B]">{"Edit Job"}</h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block font-semibold mb-2">Job Title</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="w-full p-3 border rounded-lg"
              />
            </div>

            <div>
              <label className="block font-semibold mb-2">Location</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="w-full p-3 border rounded-lg"
              />
            </div>

            <div>
              <label className="block font-semibold mb-2">Salary Range</label>
              <input
                type="text"
                name="salaryRange"
                value={formData.salaryRange}
                onChange={handleChange}
                className="w-full p-3 border rounded-lg"
              />
            </div>

            <div>
              <label className="block font-semibold mb-2">Experience Required</label>
              <input
                type="text"
                name="experienceRequired"
                value={formData.experienceRequired}
                onChange={handleChange}
                className="w-full p-3 border rounded-lg"
              />
            </div>

            <div>
              <label className="block font-semibold mb-2">Employment Type</label>
              <select
                name="employmentType"
                value={formData.employmentType}
                onChange={handleChange}
                className="w-full p-3 border rounded-lg bg-white"
              >
                <option value="Full-Time">Full-Time</option>
                <option value="Part-Time">Part-Time</option>
                <option value="Contract-Based">Contract-Based</option>
              </select>
            </div>
          </div>

          <div className="mt-6">
            <label className="block font-semibold mb-2">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="6"
              className="w-full p-3 border rounded-lg"
            ></textarea>
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
              className="px-6 py-3 bg-[#E4002B] text-white rounded-lg hover:bg-[#c10024] transition"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default EditJob;

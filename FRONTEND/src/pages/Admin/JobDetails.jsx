import React, { useEffect, useState } from "react";
import { FaArrowLeft } from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { API_URL } from "../../url/base";

const JobDetails = ({ jobId, onBack }) => {
  const [job, setJob] = useState(null);
  const [status, setStatus] = useState(null);
  const [saving, setSaving] = useState(false);

  // ✅ Fetch Job Details
  const fetchJobDetails = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await fetch(
        `${API_URL}/admin/career/jobs/${jobId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Unable to fetch job", { theme: "dark" });
        return;
      }

      setJob(data.job);
      setStatus(data.job.isActive ? "active" : "inactive");
    } catch (err) {
      console.error("Error:", err);
      toast.error("Something went wrong", { theme: "dark" });
    }
  };

  useEffect(() => {
    fetchJobDetails();
  }, [jobId]);

  // ✅ Update Status & GO BACK
  const handleStatusUpdate = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem("token");

      const res = await fetch(
        `${API_URL}/admin/jobs/${jobId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            isActive: status === "active",
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Update failed", { theme: "dark" });
      } else {
        setJob(data.job);
        toast.success("Status updated", { theme: "dark" });

        // ✅ GO BACK TO JOB TRACKING AFTER UPDATE
        setTimeout(() => {
          if (onBack) onBack();
        }, 1000);
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong", { theme: "dark" });
    } finally {
      setSaving(false);
    }
  };

  if (!job)
    return (
      <p className="text-gray-200 text-center mt-20">
        Loading job details...
      </p>
    );

  return (
    <>
      <ToastContainer />

      <div className="min-h-screen bg-[#171717] pt-10 px-6 md:px-20 pb-10">
        {/* BACK BUTTON */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-[#E4002B] mb-6 font-medium hover:underline cursor-pointer"
        >
          <FaArrowLeft /> Back to Jobs
        </button>

        <div className="bg-[#EDEDED] shadow-sm border-2 border-gray-500 rounded-xl p-6 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-[#E4002B] mb-2">
            {job.title}
          </h2>

          <p className="text-gray-600">{job.location}</p>
          <p className="my-4 text-gray-700">{job.description}</p>

          <div className="space-y-2">
            <p>
              <strong>Experience Required:</strong>{" "}
              {job.experienceRequired || "N/A"}
            </p>
            <p>
              <strong>Salary:</strong> {job.salaryRange || "N/A"}
            </p>
            <p>
              <strong>Employment Type:</strong>{" "}
              {job.employmentType || "N/A"}
            </p>
          </div>

          <p className="mt-4 text-sm text-gray-500">
            Created on: {new Date(job.createdAt).toLocaleDateString()}
          </p>

          {/* STATUS */}
          <div className="mt-8">
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
              className="mt-6 bg-[#E4002B] text-white px-6 py-2 rounded-md hover:bg-[#c10024] transition cursor-pointer disabled:bg-gray-400"
            >
              {saving ? "Updating..." : "Save"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default JobDetails;

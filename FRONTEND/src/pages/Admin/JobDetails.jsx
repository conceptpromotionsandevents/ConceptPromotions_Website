import React, { useEffect, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const JobDetails = ({ jobId, onBack }) => {
  const [job, setJob] = useState(null);
  const [status, setStatus] = useState(null);
  const [saving, setSaving] = useState(false);

  // ✅ Fetch Job Details
  const fetchJobDetails = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await fetch(
        `https://supreme-419p.onrender.com/api/admin/career/jobs/${jobId}`,
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
      console.log("Error:", err);
      toast.error("Something went wrong", { theme: "dark" });
    }
  };

  useEffect(() => {
    fetchJobDetails();
  }, [jobId]);

  // ✅ Update Status
  const handleStatusUpdate = async () => {
    setSaving(true);

    try {
      const token = localStorage.getItem("token");

      const res = await fetch(
        `https://supreme-419p.onrender.com/api/admin/jobs/${jobId}`,
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
        toast.success("Status updated ✅", { theme: "dark" });
      }
    } catch (err) {
      console.log(err);
      toast.error("Something went wrong", { theme: "dark" });
    }

    setSaving(false);
  };

  if (!job) return <p>Loading...</p>;

  return (
    <div>
      <ToastContainer />

      <button
        onClick={onBack}
        className="bg-gray-300 px-3 py-1 mb-4 rounded"
      >
        Back
      </button>

      <h2 className="text-2xl font-bold">{job.title}</h2>
      <p className="text-gray-600">{job.location}</p>
      <p className="my-2">{job.description}</p>

      <p><strong>Experience Required:</strong> {job.experienceRequired}</p>
      <p><strong>Salary:</strong> {job.salaryRange}</p>
      <p><strong>Type:</strong> {job.employmentType}</p>

      <p className="mt-2 text-sm text-gray-500">
        Created: {new Date(job.createdAt).toLocaleDateString()}
      </p>

      <div className="mt-6">
        <strong>Status: </strong>

        {/* ✅ Radio Buttons */}
        <div className="flex gap-4 mt-2">
          <label className="flex items-center gap-1">
            <input
              type="radio"
              value="active"
              checked={status === "active"}
              onChange={(e) => setStatus(e.target.value)}
            />
            Active
          </label>

          <label className="flex items-center gap-1">
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
          className="mt-4 bg-[#E4002B] text-white px-4 py-2 rounded-md disabled:bg-gray-400"
        >
          {saving ? "Updating..." : "Save"}
        </button>
      </div>
    </div>
  );
};

export default JobDetails;

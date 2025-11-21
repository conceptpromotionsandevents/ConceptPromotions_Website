import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaMapMarkerAlt,
  FaBriefcase,
  FaRupeeSign,
  FaPen,
} from "react-icons/fa";

const UpdateJob = ({ onEditJob }) => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Fetch jobs from backend
  const fetchJobs = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      if (!token) {
        setError("Unauthorized: Please log in as admin.");
        setLoading(false);
        return;
      }

      const response = await fetch(
        "https://supreme-419p.onrender.com/api/admin/jobs",
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok && data.jobs) {
        // ✅ Only active jobs
        const activeJobs = data.jobs.filter((job) => job.isActive === true);
        setJobs(activeJobs);
      } else {
        setError(data.message || "Failed to fetch jobs.");
      }
    } catch (err) {
      console.error("Error fetching jobs:", err);
      setError("Something went wrong while fetching jobs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  return (
    <>
      {/* Job Cards Section */}
      <div className="min-h-screen bg-gray-50 pt-4 px-4 md:px-10 pb-10">
        <h1 className="text-2xl font-bold mb-6 text-center text-[#E4002B]">
          Job Listings
        </h1>

        {loading ? (
          <p className="text-gray-600">Loading jobs...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : jobs.length === 0 ? (
          <p className="text-gray-500">No active jobs found.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobs.map((job) => (
              <div
                key={job._id}
                className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  {/* Job Title */}
                  <h3 className="text-lg font-bold text-gray-900 mb-1">
                    {job.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    {job.description || "No description provided."}
                  </p>

                  {/* Job Info */}
                  <div className="text-sm text-gray-700 space-y-1">
                    <p className="flex items-center gap-2">
                      <FaMapMarkerAlt className="text-gray-500" />
                      {job.location || "Not specified"}
                    </p>
                    <p className="flex items-center gap-2">
                      <FaBriefcase className="text-gray-500" />
                      {job.employmentType || "N/A"} •{" "}
                      {job.experienceRequired || "Experience not specified"}
                    </p>
                    <p className="flex items-center gap-2">
                      <FaRupeeSign className="text-gray-500" />
                      {job.salaryRange || "Not specified"}
                    </p>
                  </div>
                </div>

                {/* Edit Button */}
                <button
                  onClick={() => onEditJob(job._id)}
                  className="mt-5 flex items-center justify-center gap-2 w-full py-2 rounded-lg bg-[#E4002B] text-white font-medium hover:bg-[#C3002B] transition"
                >
                  <FaPen /> Edit
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default UpdateJob;

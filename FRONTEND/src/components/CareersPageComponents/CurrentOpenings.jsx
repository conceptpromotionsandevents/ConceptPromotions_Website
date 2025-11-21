import React, { useEffect, useState } from "react";
import { FaMapMarkerAlt, FaBriefcase, FaArrowRight, FaMoneyBill, FaUserTie } from "react-icons/fa";

const CurrentOpenings = () => {
  const [jobOpenings, setJobOpenings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Scroll to Job Seekers section
  const scrollToJobSeekers = () => {
    const section = document.getElementById("job-seekers");
    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Fetch jobs from backend
  const fetchJobs = async () => {
    try {
      setLoading(true);
      const res = await fetch("https://supreme-419p.onrender.com/api/career/jobs");
      const data = await res.json();

      if (res.ok && data.jobs) {
        setJobOpenings(data.jobs);
      } else {
        setError(data.message || "Failed to load job openings.");
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
    <section className="bg-gradient-to-b from-black via-gray-900 to-red-950 text-white py-20 px-6 md:px-16 mt-10">
      <div className="max-w-6xl mx-auto text-center">
        {/* Heading */}
        <h2 className="text-4xl md:text-5xl font-extrabold mb-4">
          Current <span className="text-red-500">Openings</span>
        </h2>
        <p className="text-gray-300 text-lg mb-12 max-w-2xl mx-auto">
          Join our growing team of professionals dedicated to excellence, innovation, and service.
          Explore our current opportunities and take the next step in your career.
        </p>

        {/* Job Cards Grid */}
        {loading ? (
          <p className="text-gray-400 text-center">Loading job openings...</p>
        ) : error ? (
          <p className="text-red-500 text-center">{error}</p>
        ) : jobOpenings.length === 0 ? (
          <p className="text-gray-400 text-center">No job openings available.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 items-stretch">
            {jobOpenings.map((job, index) => (
              <div
                key={job._id || index}
                className="flex flex-col justify-between bg-white/10 border border-red-700/30 hover:border-red-500 transition-all duration-300 rounded-2xl p-6 text-left"
              >
                <div>
                  <h3 className="text-2xl font-semibold text-red-500 mb-2">
                    {job.title}
                  </h3>
                  <div className="flex flex-wrap items-center text-gray-400 text-sm mb-4 gap-4">
                    <span className="flex items-center gap-1">
                      <FaBriefcase /> {job.department || job.employmentType || "N/A"}
                    </span>
                    <span className="flex items-center gap-1">
                      <FaMapMarkerAlt /> {job.location || "Not specified"}
                    </span>
                    <span className="flex items-center gap-1">
                      <FaMoneyBill /> {job.salaryRange || "As per industry standards"}
                    </span>
                    <span className="flex items-center gap-1">
                      <FaUserTie /> {job.experienceRequired || "Experience not specified"}
                    </span>
                  </div>
                  <p className="text-gray-300 text-sm mb-6">
                    {job.description || "No description provided."}
                  </p>
                </div>

                {/* Apply Now Link */}
                <button
                  onClick={scrollToJobSeekers}
                  className="flex items-center gap-2 text-red-500 font-semibold text-sm hover:underline underline-offset-4 hover:decoration-red-500 transition-all duration-300 mt-auto cursor-pointer"
                >
                  Apply Now <FaArrowRight className="text-xs" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default CurrentOpenings;

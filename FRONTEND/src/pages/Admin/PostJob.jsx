import React, { useState } from "react";
import Select from "react-select";
import { API_URL } from "../../url/base";
import {
  FaBriefcase,
  FaMapMarkerAlt,
  FaMoneyBill,
  FaUserTie,
} from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import customSelectStyles from "../../components/common/selectStyles";

const employmentOptions = [
  { value: "full-time", label: "Full-Time" },
  { value: "part-time", label: "Part-Time" },
  { value: "contract-based", label: "Contract-Based" },
];

const PostJob = () => {
  const [jobTitle, setJobTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [salaryFrom, setSalaryFrom] = useState("");
  const [salaryTo, setSalaryTo] = useState("");
  const [asPerIndustry, setAsPerIndustry] = useState(false);
  const [experience, setExperience] = useState("");
  const [employmentType, setEmploymentType] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!jobTitle || !description || !location || !employmentType) {
      toast.error("Please fill all required fields!", {
        theme: "dark",
      });
      return;
    }

    if (!asPerIndustry && (!salaryFrom || !salaryTo)) {
      toast.error("Enter salary range or select 'As per industry standards'", {
        theme: "dark",
      });
      return;
    }

    const jobData = {
      title: jobTitle,
      description,
      location,
      salaryRange: asPerIndustry
        ? "As per industry standards"
        : `${salaryFrom} - ${salaryTo}`,
      experienceRequired: experience,
      employmentType: employmentType.label,
    };

    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/admin/jobs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(jobData),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Job posted successfully!", { theme: "dark" });

        // Reset form
        setJobTitle("");
        setDescription("");
        setLocation("");
        setSalaryFrom("");
        setSalaryTo("");
        setAsPerIndustry(false);
        setExperience("");
        setEmploymentType(null);
      } else {
        toast.error(data.message || "Failed to create job!", {
          theme: "dark",
        });
      }
    } catch (error) {
      toast.error("Network error, please try again later!", {
        theme: "dark",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ToastContainer />

      <div className="min-h-screen flex justify-center items-center bg-[#171717] px-4 pt-8 pb-10">
        <div className="w-full max-w-lg bg-[#EDEDED] p-6 rounded-lg shadow-lg border border-gray-400">
          <h1 className="text-2xl font-bold text-center mb-6 text-[#E4002B]">
            Create a New Job Posting
          </h1>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Job Title */}
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">
                Job Title <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <FaBriefcase className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="Enter job title"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#E4002B]"
                  required
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">
                Job Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter job description"
                rows="4"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#E4002B] resize-none"
                required
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">
                Job Location <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <FaMapMarkerAlt className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Enter job location"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#E4002B]"
                  required
                />
              </div>
            </div>

            {/* Salary Range */}
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">
                Salary Range <span className="text-red-500">*</span>
              </label>

              <div className="flex space-x-3">
                <div className="relative w-1/2">
                  <FaMoneyBill className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    value={salaryFrom}
                    onChange={(e) => setSalaryFrom(e.target.value)}
                    placeholder="From (₹)"
                    disabled={asPerIndustry}
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg outline-none focus:ring-2 ${
                      asPerIndustry
                        ? "bg-gray-100 border-gray-300 text-gray-400"
                        : "border-gray-300 focus:ring-[#E4002B]"
                    }`}
                  />
                </div>

                <div className="relative w-1/2">
                  <FaMoneyBill className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    value={salaryTo}
                    onChange={(e) => setSalaryTo(e.target.value)}
                    placeholder="To (₹)"
                    disabled={asPerIndustry}
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg outline-none focus:ring-2 ${
                      asPerIndustry
                        ? "bg-gray-100 border-gray-300 text-gray-400"
                        : "border-gray-300 focus:ring-[#E4002B]"
                    }`}
                  />
                </div>
              </div>

              <div className="mt-2 flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={asPerIndustry}
                  onChange={() => {
                    setAsPerIndustry(!asPerIndustry);
                    setSalaryFrom("");
                    setSalaryTo("");
                  }}
                  className="w-4 h-4 accent-[#E4002B]"
                />
                <span className="text-sm text-gray-600">
                  Salary as per current industry standards
                </span>
              </div>
            </div>

            {/* Experience */}
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">
                Experience Required
              </label>
              <div className="relative">
                <FaUserTie className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  placeholder="e.g. 2 years, Fresher"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#E4002B]"
                />
              </div>
            </div>

            {/* Employment Type */}
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">
                Employment Type <span className="text-red-500">*</span>
              </label>
              <Select
                styles={customSelectStyles}
                options={employmentOptions}
                value={employmentType}
                onChange={setEmploymentType}
                isSearchable
                placeholder="Select employment type"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full bg-gradient-to-r from-[#E4002B] to-[#C3002B] text-white py-2 rounded-lg font-medium transition-all shadow-md ${
                loading ? "opacity-70 cursor-not-allowed" : "hover:from-[#C3002B] hover:to-[#E4002B]"
              }`}
            >
              {loading ? "Posting..." : "Post Job"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default PostJob;

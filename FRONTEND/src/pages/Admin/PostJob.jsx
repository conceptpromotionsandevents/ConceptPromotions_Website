import React, { useState } from "react";
import {
  FaBriefcase,
  FaMapMarkerAlt,
  FaMoneyBill,
  FaUserTie,
  FaSpinner,
} from "react-icons/fa";
import { IoIosArrowDown } from "react-icons/io";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const PostJob = () => {
  const [jobTitle, setJobTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [salaryFrom, setSalaryFrom] = useState("");
  const [salaryTo, setSalaryTo] = useState("");
  const [asPerIndustry, setAsPerIndustry] = useState(false);
  const [experience, setExperience] = useState("");
  const [loading, setLoading] = useState(false);

  // Employment Type Dropdown
  const [employmentSearch, setEmploymentSearch] = useState("");
  const [selectedEmployment, setSelectedEmployment] = useState("Full-Time");
  const [showEmploymentList, setShowEmploymentList] = useState(false);

  const employmentTypes = ["Full-Time", "Part-Time", "Contract-Based"];
  const filteredEmployment = employmentTypes.filter((type) =>
    type.toLowerCase().includes(employmentSearch.toLowerCase())
  );

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!jobTitle || !description || !location || !selectedEmployment) {
      toast.error("Please fill all required fields!", {
        position: "top-right",
        autoClose: 3000,
        theme: "dark",
      });
      return;
    }

    if (!asPerIndustry && (!salaryFrom || !salaryTo)) {
      toast.error("Enter salary range or select 'As per industry standards'", {
        position: "top-right",
        autoClose: 3000,
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
      employmentType: selectedEmployment,
    };

    try {
      setLoading(true);
      const response = await fetch("https://supreme-419p.onrender.com/api/admin/jobs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(jobData),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Job posted successfully! ✅", {
          position: "top-right",
          autoClose: 3000,
          theme: "dark",
        });

        // Reset form
        setJobTitle("");
        setDescription("");
        setLocation("");
        setSalaryFrom("");
        setSalaryTo("");
        setAsPerIndustry(false);
        setExperience("");
        setSelectedEmployment("Full-Time");
      } else {
        toast.error(data.message || "Failed to create job!", {
          position: "top-right",
          autoClose: 3000,
          theme: "dark",
        });
      }
    } catch (error) {
      toast.error("Network error, please try again later!", {
        position: "top-right",
        autoClose: 3000,
        theme: "dark",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="min-h-screen flex justify-center items-center bg-white px-4 pt-8 pb-10">
        <div className="w-full max-w-lg bg-white p-6 rounded-lg shadow-lg border border-gray-200">
          <h1 className="text-2xl font-bold text-center mb-6 text-[#E4002B]">
            Job Details
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
              ></textarea>
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
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg outline-none focus:ring-2 ${asPerIndustry
                        ? "bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed"
                        : "border-gray-300 focus:ring-[#E4002B]"
                      }`}
                    disabled={asPerIndustry}
                  />
                </div>

                <div className="relative w-1/2">
                  <FaMoneyBill className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    value={salaryTo}
                    onChange={(e) => setSalaryTo(e.target.value)}
                    placeholder="To (₹)"
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg outline-none focus:ring-2 ${asPerIndustry
                        ? "bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed"
                        : "border-gray-300 focus:ring-[#E4002B]"
                      }`}
                    disabled={asPerIndustry}
                  />
                </div>
              </div>

              <div className="mt-2 flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="industryCheckbox"
                  checked={asPerIndustry}
                  onChange={() => {
                    setAsPerIndustry(!asPerIndustry);
                    if (!asPerIndustry) {
                      setSalaryFrom("");
                      setSalaryTo("");
                    }
                  }}
                  className="w-4 h-4 accent-[#E4002B] cursor-pointer"
                />
                
                <label htmlFor="industryCheckbox" className="text-sm cursor-pointer text-gray-600">
                  Salary as per current industry standards
                </label>
              </div>
            </div>

            {/* Experience */}
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">
                Experience Required <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <FaUserTie className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  placeholder="e.g. 2 years, Fresher, etc."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#E4002B]"
                />
              </div>
            </div>

            {/* Employment Type */}
            <div className="relative">
              <label className="block text-sm font-medium mb-1 text-gray-700">
                Employment Type <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search or select type"
                  value={selectedEmployment || employmentSearch}
                  onChange={(e) => {
                    setEmploymentSearch(e.target.value);
                    setSelectedEmployment("");
                    setShowEmploymentList(true);
                  }}
                  onFocus={() => setShowEmploymentList(true)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#E4002B]"
                  required
                />
                <IoIosArrowDown className="absolute right-3 top-3 text-gray-400" />
              </div>
              {showEmploymentList && (
                <ul className="absolute z-50 w-full bg-white border border-gray-300 rounded-lg max-h-40 overflow-y-auto mt-1">
                  {filteredEmployment.length > 0 ? (
                    filteredEmployment.map((type, index) => (
                      <li
                        key={index}
                        onClick={() => {
                          setSelectedEmployment(type);
                          setShowEmploymentList(false);
                        }}
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                      >
                        {type}
                      </li>
                    ))
                  ) : (
                    <li className="px-4 py-2 text-gray-500">No match found</li>
                  )}
                </ul>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full flex justify-center items-center gap-2 bg-gradient-to-r from-[#E4002B] to-[#C3002B] hover:from-[#C3002B] hover:to-[#E4002B] text-white py-2 rounded-lg font-medium transition-all shadow-md ${loading ? "opacity-70 cursor-not-allowed" : ""
                }`}
            >
              {loading ? (
                <>
                  <FaSpinner className="animate-spin text-white" />
                  Posting...
                </>
              ) : (
                "Post Job"
              )}
            </button>
          </form>
        </div>
      </div>

      <ToastContainer />
    </>
  );
};

export default PostJob;

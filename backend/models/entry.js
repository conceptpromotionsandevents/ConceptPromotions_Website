import React, { useState, useEffect, useRef } from "react";
import {
  FaUser,
  FaPhoneAlt,
  FaEnvelope,
  FaCity,
  FaBriefcase,
  FaUpload,
  FaTimes,
  FaChevronDown,
} from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const JobSeekers = () => {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [selectedJob, setSelectedJob] = useState("");
  const [selectedJobId, setSelectedJobId] = useState("");
  const [jobs, setJobs] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("Upload your CV");
  const [fileSelected, setFileSelected] = useState(false);
  const dropdownRef = useRef(null);

  // ✅ Fetch job roles
  useEffect(() => {
    fetch("https://supreme-419p.onrender.com/api/career/jobs")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setJobs(data);
        else if (Array.isArray(data.jobs)) setJobs(data.jobs);
      })
      .catch((err) => console.error("Error fetching jobs:", err));
  }, []);

  // ✅ Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ✅ File change
  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      setFileName(selected.name);
      setFileSelected(true);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setFileName("Upload your CV");
    setFileSelected(false);
    document.getElementById("cv-upload").value = "";
  };

  // ✅ Submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!fullName || !email || !phone || !city || !selectedJobId || !file) {
      toast.error("Please fill all required fields!", {
        position: "top-right",
        autoClose: 3000,
        theme: "dark",
      });
      return;
    }

    const formData = new FormData();
formData.append("fullName", fullName);
formData.append("email", email);
formData.append("phone", phone);

formData.append("jobId", selectedJobId);
formData.append("resume", file);

    try {
      const response = await fetch("https://supreme-419p.onrender.com/api/career/apply", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || "Application submission failed!", {
          position: "top-right",
          autoClose: 3000,
          theme: "dark",
        });
        return;
      }

      toast.success("Application submitted successfully! ✅", {
        position: "top-right",
        autoClose: 3000,
        theme: "dark",
      });

      // Reset form
      setFullName("");
      setPhone("");
      setEmail("");
      setCity("");
      setSelectedJob("");
      setSelectedJobId("");
      setFile(null);
      setFileName("Upload your CV");
      setFileSelected(false);
    } catch (error) {
      toast.error("Network error, please try again later!", {
        position: "top-right",
        autoClose: 3000,
        theme: "dark",
      });
    }
  };

  return (
    <section className="relative bg-gradient-to-t from-black via-gray-900 to-red-950 text-white px-6 pb-10 overflow-hidden">
      <div className="relative max-w-xl mx-auto bg-gray-900/80 border border-red-700/40 rounded-2xl p-6 shadow-2xl backdrop-blur-sm">
        <h2 className="text-3xl font-extrabold text-center mb-2">
          Job <span className="text-red-500">Seekers</span>
        </h2>
        <p className="text-gray-300 text-center mb-6 text-sm">
          Fill in your details below and apply for exciting opportunities with us.
        </p>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {/* Full Name */}
          <div className="flex items-center gap-3">
            <label className="w-28 text-xs font-semibold text-gray-300">
              Full Name: <span className="text-red-500">*</span>
            </label>
            <div className="relative flex-1">
              <FaUser className="absolute left-3 top-2.5 text-gray-400 text-xs" />
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full pl-8 pr-3 py-2 rounded-md bg-gray-800 text-white text-xs border border-gray-700 focus:ring-1 focus:ring-red-500 outline-none"
              />
            </div>
          </div>

          {/* Phone */}
          <div className="flex items-center gap-3">
            <label className="w-28 text-xs font-semibold text-gray-300">
              Phone: <span className="text-red-500">*</span>
            </label>
            <div className="relative flex-1">
              <FaPhoneAlt className="absolute left-3 top-2.5 text-gray-400 text-xs" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter your phone number"
                className="w-full pl-8 pr-3 py-2 rounded-md bg-gray-800 text-white text-xs border border-gray-700 focus:ring-1 focus:ring-red-500 outline-none"
              />
            </div>
          </div>

          {/* Email */}
          <div className="flex items-center gap-3">
            <label className="w-28 text-xs font-semibold text-gray-300">
              Email: <span className="text-red-500">*</span>
            </label>
            <div className="relative flex-1">
              <FaEnvelope className="absolute left-3 top-2.5 text-gray-400 text-xs" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className="w-full pl-8 pr-3 py-2 rounded-md bg-gray-800 text-white text-xs border border-gray-700 focus:ring-1 focus:ring-red-500 outline-none"
              />
            </div>
          </div>

          {/* City */}
          <div className="flex items-center gap-3">
            <label className="w-28 text-xs font-semibold text-gray-300">
              City: <span className="text-red-500">*</span>
            </label>
            <div className="relative flex-1">
              <FaCity className="absolute left-3 top-2.5 text-gray-400 text-xs" />
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Enter your city"
                className="w-full pl-8 pr-3 py-2 rounded-md bg-gray-800 text-white text-xs border border-gray-700 focus:ring-1 focus:ring-red-500 outline-none"
              />
            </div>
          </div>

          {/* Job Role */}
          <div className="flex items-center gap-3" ref={dropdownRef}>
            <label className="w-28 text-xs font-semibold text-gray-300">
              Job Role: <span className="text-red-500">*</span>
            </label>
            <div className="relative flex-1">
              <FaBriefcase className="absolute left-3 top-2.5 text-gray-400 text-xs" />
              <input
                type="text"
                placeholder="Search or select a job"
                value={searchTerm || selectedJob}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setDropdownOpen(true);
                }}
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="w-full pl-8 pr-8 py-2 rounded-md bg-gray-800 text-white text-xs border border-gray-700 focus:ring-1 focus:ring-red-500 outline-none cursor-pointer"
              />
              <FaChevronDown className="absolute right-3 top-3 text-gray-400 text-xs" />

              {dropdownOpen && (
                <ul className="absolute w-full bg-gray-800 border border-gray-700 mt-1 rounded-md max-h-40 overflow-y-auto text-xs z-10">
                  {jobs
                    .filter((job) =>
                      (job.title || job.name || "")
                        .toLowerCase()
                        .includes(searchTerm.toLowerCase())
                    )
                    .map((job, index) => (
                      <li
                        key={index}
                        onClick={() => {
                          setSelectedJob(job.title || job.name || job);
                          setSelectedJobId(job._id || job.id || "");
                          setSearchTerm("");
                          setDropdownOpen(false);
                        }}
                        className="px-3 py-2 hover:bg-red-600 hover:text-white cursor-pointer"
                      >
                        {job.title || job.name || job}
                      </li>
                    ))}
                </ul>
              )}
            </div>
          </div>

          {/* Upload CV */}
          <div className="flex items-start gap-3">
            <label className="w-28 text-xs font-semibold text-gray-300 mt-2">
              Upload CV: <span className="text-red-500">*</span>
            </label>
            <div className="flex-1">
              <div className="relative border-2 border-dashed border-red-600 rounded-md p-2 hover:border-red-400 transition-all cursor-pointer text-center">
                {!fileSelected ? (
                  <>
                    <input
                      type="file"
                      id="cv-upload"
                      accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <label
                      htmlFor="cv-upload"
                      className="flex items-center justify-center gap-2 text-gray-300 hover:text-white text-xs font-medium"
                    >
                      <FaUpload className="text-red-500" />
                      {fileName}
                    </label>
                  </>
                ) : (
                  <div className="flex items-center justify-between text-xs px-2 text-gray-200">
                    <span className="truncate">{fileName}</span>
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      className="text-red-400 hover:text-red-600 transition-colors flex items-center gap-1"
                    >
                      <FaTimes size={10} />
                      Remove
                    </button>
                  </div>
                )}
              </div>

              <p className="mt-1 text-[10px] text-gray-400 text-left">
                Accepted formats: JPG, JPEG, PNG, PDF, DOC (Max size: 1MB)
              </p>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full mt-4 bg-gradient-to-r from-red-700 to-red-500 hover:from-red-500 hover:to-red-700 text-white font-semibold py-2 rounded-md transition-all shadow-md text-xs"
          >
            Submit Application
          </button>
        </form>
      </div>

      <ToastContainer />
    </section>
  );
};

export default JobSeekers;
import React, { useEffect, useState } from "react";
import Select from "react-select";
import { FaSearch } from "react-icons/fa";
import { API_URL } from "../../url/base";

/* ✅ Same styles as Passbook */
const customSelectStyles = {
  control: (provided, state) => ({
    ...provided,
    borderColor: state.isFocused ? "#E4002B" : "#d1d5db",
    boxShadow: state.isFocused ? "0 0 0 1px #E4002B" : "none",
    "&:hover": { borderColor: "#E4002B" },
    minHeight: "42px",
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isFocused ? "#FEE2E2" : "white",
    color: "#333",
    "&:active": { backgroundColor: "#FECACA" },
  }),
  menu: (provided) => ({
    ...provided,
    zIndex: 20,
  }),
};

const JobTracking = ({ onViewJob }) => {
  const [allJobs, setAllJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [status, setStatus] = useState({ value: "active", label: "Active" });
  const [department, setDepartment] = useState(null);
  const [state, setState] = useState(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const normalize = (dt) => {
    const d = new Date(dt);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  // Fetch jobs
  const fetchJobs = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/admin/jobs`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (res.ok) {
        setAllJobs(data.jobs || []);
        setFilteredJobs(
          (data.jobs || []).filter((job) => job.isActive)
        );
      }
    } catch (err) {
      console.error("Error fetching jobs:", err);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const departments = [...new Set(allJobs.map((j) => j.title))].map((d) => ({
    label: d,
    value: d,
  }));

  const states = [...new Set(allJobs.map((j) => j.location))].map((d) => ({
    label: d,
    value: d,
  }));

  const statusOptions = [
    { label: "Active", value: "active" },
    { label: "Inactive", value: "inactive" },
    { label: "All", value: "all" },
  ];

  const applyFilters = () => {
    let filtered = [...allJobs];

    if (status.value !== "all") {
      filtered = filtered.filter((job) =>
        status.value === "active" ? job.isActive : !job.isActive
      );
    }

    if (searchTerm.trim()) {
      filtered = filtered.filter(
        (job) =>
          job.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          job.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (department) {
      filtered = filtered.filter((job) => job.title === department.value);
    }

    if (state) {
      filtered = filtered.filter((job) => job.location === state.value);
    }

    if (dateFrom || dateTo) {
      const from = dateFrom ? normalize(dateFrom) : null;
      const to = dateTo ? normalize(dateTo) : null;

      filtered = filtered.filter((job) => {
        const jd = normalize(job.createdAt);
        if (from && to) return jd >= from && jd <= to;
        if (from) return jd >= from;
        if (to) return jd <= to;
        return true;
      });
    }

    setFilteredJobs(filtered);
  };

  const resetFilters = () => {
    setSearchTerm("");
    setStatus({ value: "active", label: "Active" });
    setDepartment(null);
    setState(null);
    setDateFrom("");
    setDateTo("");
    setFilteredJobs(allJobs.filter((job) => job.isActive));
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-[#E4002B] mb-6">
        Job Tracking
      </h2>

      {/* FILTER CARD */}
      <div className="bg-[#EDEDED] rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">
          Filter Jobs
        </h3>

        {/* 🔍 SEARCH BAR (NORMAL, NOT CENTERED) */}
        <div className="mb-4">
          <div className="flex items-center bg-white rounded-lg px-3">
            <FaSearch className="text-gray-400" />
            <input
              type="text"
              placeholder="Search by title or description"
              className="w-full px-2 py-2 outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* FILTER ROW */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <Select
            value={status}
            onChange={setStatus}
            options={statusOptions}
            styles={customSelectStyles}
          />

          <Select
            value={department}
            onChange={setDepartment}
            options={departments}
            styles={customSelectStyles}
            placeholder="Department"
            isClearable
          />

          <Select
            value={state}
            onChange={setState}
            options={states}
            styles={customSelectStyles}
            placeholder="State"
            isClearable
          />
        </div>

        {/* DATE RANGE */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="border rounded-md px-3 py-2"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="border rounded-md px-3 py-2"
          />
        </div>

        {/* BUTTONS */}
        <div className="flex gap-4">
          <button
            onClick={applyFilters}
            className="bg-[#E4002B] text-white px-6 py-2 rounded-md hover:bg-[#C3002B] transition cursor-pointer"
          >
            Search
          </button>

          <button
            onClick={resetFilters}
            className="text-red-600 font-semibold hover:underline cursor-pointer"
          >
            Reset
          </button>
        </div>
      </div>

      {/* RESULTS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredJobs.map((job) => (
          <div
            key={job._id}
            className="bg-white border border-gray-300 rounded-lg p-4 flex flex-col justify-between"
          >
            <div>
              <h3 className="font-semibold text-gray-800">{job.title}</h3>
              <p className="text-sm text-gray-600">{job.location}</p>
              <p className="text-xs text-gray-500">
                {new Date(job.createdAt).toLocaleDateString()}
              </p>
              <p className="mt-2 text-sm text-gray-700">
                {job.description}
              </p>
            </div>

            <button
              onClick={() => onViewJob(job._id)}
              className="mt-4 w-full bg-[#E4002B] text-white py-2 rounded-md hover:bg-[#C3002B] cursor-pointer"
            >
              View Details
            </button>
          </div>
        ))}
      </div>

      {filteredJobs.length === 0 && (
        <p className="text-gray-500 text-center mt-10">
          No jobs found for the selected filters.
        </p>
      )}
    </div>
  );
};

export default JobTracking;

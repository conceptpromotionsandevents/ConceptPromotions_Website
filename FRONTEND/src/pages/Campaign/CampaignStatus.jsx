import React, { useEffect, useState } from "react";
import Select from "react-select";

const CampaignStatus = ({ onViewCampaign }) => {
  const [allCampaigns, setAllCampaigns] = useState([]);
  const [filteredCampaigns, setFilteredCampaigns] = useState([]);

  const [status, setStatus] = useState("active");   // ✅ default

  // Fetch campaigns
  const fetchCampaigns = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("https://supreme-419p.onrender.com/api/admin/campaigns", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (res.ok) {
        setAllCampaigns(data.campaigns || []);
        setFilteredCampaigns([]); // empty initially
      }
    } catch (err) {
      console.log("Error fetching campaigns:", err);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  // ✅ Apply filters
  const applyFilters = () => {
    let filtered = [...allCampaigns];

    // Status filter
    if (status !== "all") {
      filtered = filtered.filter((c) =>
        status === "active" ? c.isActive === true : c.isActive === false
      );
    }

    setFilteredCampaigns(filtered);
  };

  const resetFilters = () => {
    setStatus("active");
    setFilteredCampaigns([]);
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold text-[#E4002B] mb-4">
        Campaign Status
      </h2>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {/* ✅ Status Dropdown */}
        <Select
          value={{
            value: status,
            label:
              status === "active"
                ? "Activated"
                : status === "inactive"
                ? "Deactivated"
                : "All",
          }}
          onChange={(e) => setStatus(e.value)}
          options={[
            { label: "Activated", value: "active" },
            { label: "Deactivated", value: "inactive" },
            { label: "All", value: "all" },
          ]}
          className="w-44"
          isSearchable
        />

        {/* Search Button */}
        <button
          onClick={applyFilters}
          className="bg-[#E4002B] text-white px-4 py-2 rounded-md"
        >
          Search
        </button>

        {/* Reset */}
        <button
          onClick={resetFilters}
          className="text-red-600 font-semibold"
        >
          Reset
        </button>
      </div>

      {/* ✅ Results */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCampaigns.map((c) => (
          <div
            key={c._id}
            className="border border-gray-300 bg-white rounded-lg p-4 flex flex-col justify-between"
          >
            <div>
              <h3 className="font-semibold text-gray-800">{c.name}</h3>
              <p className="text-sm text-gray-600">Client: {c.client}</p>
              <p className="text-sm text-gray-600">Region: {c.region}</p>
              <p className="text-sm text-gray-600">State: {c.state}</p>

              <p
                className={`mt-2 text-sm font-semibold ${
                  c.isActive ? "text-green-600" : "text-red-600"
                }`}
              >
                Status: {c.isActive ? "Active" : "Inactive"}
              </p>
            </div>

            {/* ✅ View Details */}
            <button
              className="mt-4 w-full bg-[#E4002B] text-white py-2 rounded-md hover:bg-red-700 transition"
              onClick={() => onViewCampaign(c._id)}
            >
              View Details
            </button>
          </div>
        ))}
      </div>

      {filteredCampaigns.length === 0 && (
        <p className="text-gray-500 text-center mt-10">
          No campaigns found. Apply filters & search.
        </p>
      )}
    </div>
  );
};

export default CampaignStatus;

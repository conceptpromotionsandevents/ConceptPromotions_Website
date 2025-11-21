import React, { useState, useRef, useEffect } from "react";
import { FaUser, FaBuilding } from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const CreateCampaign = () => {
  // ==== FORM STATE ====
  const [campaignName, setCampaignName] = useState("");
  const [client, setClient] = useState("");

  const [selectedCampaign, setSelectedCampaign] = useState("");
  const [campaignSearch, setCampaignSearch] = useState("");
  const [showCampaignList, setShowCampaignList] = useState(false);

  const [selectedRegion, setSelectedRegion] = useState("");
  const [regionSearch, setRegionSearch] = useState("");
  const [showRegionList, setShowRegionList] = useState(false);

  const [selectedState, setSelectedState] = useState("");
  const [stateSearch, setStateSearch] = useState("");
  const [showStateList, setShowStateList] = useState(false);

  const [loading, setLoading] = useState(false);

  // Refs for closing dropdown on outside click
  const campaignRef = useRef();
  const regionRef = useRef();
  const stateRef = useRef();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (campaignRef.current && !campaignRef.current.contains(e.target)) {
        setShowCampaignList(false);
      }
      if (regionRef.current && !regionRef.current.contains(e.target)) {
        setShowRegionList(false);
      }
      if (stateRef.current && !stateRef.current.contains(e.target)) {
        setShowStateList(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Dropdown values
  const campaignTypes = ["Retailer Enrolment", "Display Payment", "Incentive Payment", "Others"];
  const regions = ["North", "East", "West", "South", "All"];

  const regionStates = {
    North: [
      "Jammu and Kashmir",
      "Ladakh",
      "Himachal Pradesh",
      "Punjab",
      "Haryana",
      "Uttarakhand",
      "Uttar Pradesh",
      "Delhi",
      "Chandigarh",
    ],
    South: [
      "Andhra Pradesh",
      "Karnataka",
      "Kerala",
      "Tamil Nadu",
      "Telangana",
      "Puducherry",
      "Lakshadweep",
    ],
    East: [
      "Bihar",
      "Jharkhand",
      "Odisha",
      "West Bengal",
      "Sikkim",
      "Andaman and Nicobar Islands",
      "Arunachal Pradesh",
      "Assam",
      "Manipur",
      "Meghalaya",
      "Mizoram",
      "Nagaland",
      "Tripura",
    ],
    West: [
      "Rajasthan",
      "Gujarat",
      "Maharashtra",
      "Madhya Pradesh",
      "Goa",
      "Chhattisgarh",
      "Dadra and Nagar Haveli and Daman and Diu",
    ],
  };

  const statesToShow =
    selectedRegion && selectedRegion !== "All"
      ? regionStates[selectedRegion] || []
      : ["All States", ...Object.values(regionStates).flat()];

  const filteredCampaigns = campaignTypes.filter((c) =>
    c.toLowerCase().includes(campaignSearch.toLowerCase())
  );

  const filteredRegions = regions.filter((r) =>
    r.toLowerCase().includes(regionSearch.toLowerCase())
  );

  const filteredStates = statesToShow.filter((s) =>
    s.toLowerCase().includes(stateSearch.toLowerCase())
  );

  // SUBMIT HANDLER
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!campaignName || !client || !selectedCampaign || !selectedRegion || !selectedState) {
      toast.error("All fields are required!", { theme: "dark" });
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem("token");

      const response = await fetch("https://supreme-419p.onrender.com/api/admin/campaigns", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: campaignName,
          client,
          type: selectedCampaign,
          region: selectedRegion,
          state: selectedState,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || "Error creating campaign", { theme: "dark" });
      } else {
        toast.success("✅ Campaign created successfully!", { theme: "dark" });
        resetForm();
      }
    } catch (error) {
      console.error(error);
      toast.error("Server error", { theme: "dark" });
    }
    setLoading(false);
  };

  const resetForm = () => {
    setCampaignName("");
    setClient("");
    setSelectedCampaign("");
    setCampaignSearch("");
    setSelectedRegion("");
    setRegionSearch("");
    setSelectedState("");
    setStateSearch("");
  };

  return (
    <>
      <ToastContainer />

      <div className="w-full max-w-lg bg-white shadow-md rounded-xl p-8 mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-[#E4002B]">Create a Campaign</h1>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          {/* Campaign Name */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Campaign Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <FaUser className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Type campaign name here"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#E4002B]"
              />
            </div>
          </div>

          {/* Client */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Client <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <FaBuilding className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Client Name"
                value={client}
                onChange={(e) => setClient(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#E4002B]"
              />
            </div>
          </div>

          {/* Type of Campaign */}
          <div className="relative" ref={campaignRef}>
            <label className="block text-sm font-medium mb-1">
              Type of Campaign <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Search or select type"
              value={selectedCampaign || campaignSearch}
              onChange={(e) => {
                setCampaignSearch(e.target.value);
                setSelectedCampaign("");
                setShowCampaignList(true);
              }}
              onFocus={() => setShowCampaignList(true)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#E4002B]"
            />

            {showCampaignList && (
              <ul className="absolute z-50 w-full bg-white border border-gray-300 rounded-lg max-h-48 overflow-y-auto mt-1">
                {filteredCampaigns.length > 0 ? (
                  filteredCampaigns.map((campaign, index) => (
                    <li
                      key={index}
                      onClick={() => {
                        setSelectedCampaign(campaign);
                        setCampaignSearch("");
                        setShowCampaignList(false);
                      }}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                    >
                      {campaign}
                    </li>
                  ))
                ) : (
                  <li className="px-4 py-2 text-gray-500">No match found</li>
                )}
              </ul>
            )}
          </div>

          {/* Region */}
          <div className="relative" ref={regionRef}>
            <label className="block text-sm font-medium mb-1">
              Region <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Search or select region"
              value={selectedRegion || regionSearch}
              onChange={(e) => {
                setRegionSearch(e.target.value);
                setSelectedRegion("");
                setShowRegionList(true);
              }}
              onFocus={() => setShowRegionList(true)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#E4002B]"
            />

            {showRegionList && (
              <ul className="absolute z-50 w-full bg-white border border-gray-300 rounded-lg max-h-48 overflow-y-auto mt-1">
                {filteredRegions.length > 0 ? (
                  filteredRegions.map((region, index) => (
                    <li
                      key={index}
                      onClick={() => {
                        setSelectedRegion(region);
                        setRegionSearch("");
                        setShowRegionList(false);
                        setSelectedState("");
                        setStateSearch("");
                      }}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                    >
                      {region}
                    </li>
                  ))
                ) : (
                  <li className="px-4 py-2 text-gray-500">No match found</li>
                )}
              </ul>
            )}
          </div>

          {/* State */}
          <div className="relative" ref={stateRef}>
            <label className="block text-sm font-medium mb-1">
              State <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder={selectedRegion ? "Search or select state" : "Select region first"}
              value={selectedState || stateSearch}
              onChange={(e) => {
                setStateSearch(e.target.value);
                setSelectedState("");
                setShowStateList(true);
              }}
              onFocus={() => setShowStateList(true)}
              disabled={!selectedRegion}
              className={`w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 ${
                selectedRegion ? "focus:ring-[#E4002B]" : "bg-gray-100 cursor-not-allowed"
              }`}
            />

            {showStateList && selectedRegion && (
              <ul className="absolute z-50 w-full bg-white border border-gray-300 rounded-lg max-h-48 overflow-y-auto mt-1">
                {filteredStates.length > 0 ? (
                  filteredStates.map((state, index) => (
                    <li
                      key={index}
                      onClick={() => {
                        setSelectedState(state);
                        setStateSearch("");
                        setShowStateList(false);
                      }}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                    >
                      {state}
                    </li>
                  ))
                ) : (
                  <li className="px-4 py-2 text-gray-500">No match found</li>
                )}
              </ul>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#E4002B] text-white py-2 rounded-lg font-medium hover:bg-[#C3002B] transition mb-10 disabled:opacity-60"
          >
            {loading ? "Creating..." : "Create Campaign"}
          </button>
        </form>
      </div>
    </>
  );
};

export default CreateCampaign;

import React, { useState } from "react";
import { FaUser, FaBuilding } from "react-icons/fa";

const SignUp = () => {
    // States for dropdowns
    const [stateSearch, setStateSearch] = useState("");
    const [selectedState, setSelectedState] = useState("");
    const [showStateList, setShowStateList] = useState(false);

    const [campaignSearch, setCampaignSearch] = useState("");
    const [selectedCampaign, setSelectedCampaign] = useState("");
    const [showCampaignList, setShowCampaignList] = useState(false);

    const [regionSearch, setRegionSearch] = useState("");
    const [selectedRegion, setSelectedRegion] = useState("");
    const [showRegionList, setShowRegionList] = useState(false);

    //  Region to State mapping
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

    const campaignTypes = [
        "Retailer Enrolment",
        "Display Payment",
        "Incentive Payment",
        "Others",
    ];

    const regions = ["North", "East", "West", "South", "All"];

    // Filter states based on region + search
    const statesToShow =
        selectedRegion && selectedRegion !== "All"
            ? regionStates[selectedRegion] || []
            : ["All States", ...Object.values(regionStates).flat()];

    const filteredStates = statesToShow.filter((state) =>
        state.toLowerCase().includes(stateSearch.toLowerCase())
    );

    const filteredCampaigns = campaignTypes.filter((campaign) =>
        campaign.toLowerCase().includes(campaignSearch.toLowerCase())
    );

    const filteredRegions = regions.filter((region) =>
        region.toLowerCase().includes(regionSearch.toLowerCase())
    );

    return (
        <>
            {/* Navbar */}
            <nav className="fixed top-0 w-full z-50 bg-white shadow-md px-6 md:px-10">
                <div className="flex justify-between items-center py-4 max-w-screen-xl mx-auto">
                    <img src="cpLogo.png" alt="Logo" className="h-14 cursor-pointer" />
                    <h2 className="absolute left-1/2 transform -translate-x-1/2 text-xl md:text-2xl font-bold text-[#E4002B]">
                        Campaign Registration Page
                    </h2>
                </div>
            </nav>

            {/* Form Container */}
            <div className="min-h-screen flex justify-center items-center bg-white px-4 pt-28 pb-10">
                <div className="w-full max-w-sm">
                    <div className="mb-8 text-center">
                        <h1 className="text-2xl font-bold">Create an Account</h1>
                        <p className="text-gray-600 mt-2">
                            Join us and start your journey today.
                        </p>
                    </div>

                    {/* Form */}
                    <form className="space-y-5">
                        {/* Campaign Name */}
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Campaign Name
                            </label>
                            <div className="relative">
                                <FaUser className="absolute left-3 top-3 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Type campaign name here"
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#E4002B]"
                                    required
                                />
                            </div>
                        </div>

                        {/* Client */}
                        <div>
                            <label className="block text-sm font-medium mb-1">Client</label>
                            <div className="relative">
                                <FaBuilding className="absolute left-3 top-3 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Client Name"
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#E4002B]"
                                    required
                                />
                            </div>
                        </div>

                        {/* Type of Campaign */}
                        <div className="relative">
                            <label className="block text-sm font-medium mb-1">
                                Type of Campaign
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
                        <div className="relative">
                            <label className="block text-sm font-medium mb-1">Region</label>
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
                                                    setShowRegionList(false);
                                                    setSelectedState(""); // reset state when region changes
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
                        <div className="relative">
                            <label className="block text-sm font-medium mb-1">State</label>
                            <input
                                type="text"
                                placeholder={
                                    selectedRegion
                                        ? "Search or select state"
                                        : "Select region first"
                                }
                                value={selectedState || stateSearch}
                                onChange={(e) => {
                                    setStateSearch(e.target.value);
                                    setSelectedState("");
                                    setShowStateList(true);
                                }}
                                onFocus={() => setShowStateList(true)}
                                disabled={!selectedRegion}
                                className={`w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 ${selectedRegion
                                    ? "focus:ring-[#E4002B]"
                                    : "bg-gray-100 cursor-not-allowed"
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
                            className="w-full bg-[#E4002B] text-white py-2 rounded-lg font-medium hover:bg-[#C3002B] transition mb-10"
                        >
                            Sign Up
                        </button>
                    </form>
                </div>
            </div>
        </>
    );
};

export default SignUp;

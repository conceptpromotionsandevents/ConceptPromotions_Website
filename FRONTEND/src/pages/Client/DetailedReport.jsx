import React, { useState } from "react";
import Select from "react-select";
import { FaFileDownload, FaFilter } from "react-icons/fa";

const DetailedReport = () => {
    const campaignOptions = [
        { value: "campaign1", label: "Campaign A" },
        { value: "campaign2", label: "Campaign B" },
        { value: "campaign3", label: "Campaign C" },
    ];

    const regionOptions = [
        { value: "north", label: "North" },
        { value: "south", label: "South" },
        { value: "east", label: "East" },
        { value: "west", label: "West" },
    ];

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

    const dateOptions = [
        { value: "today", label: "Today" },
        { value: "yesterday", label: "Yesterday" },
        { value: "last7days", label: "Last 7 Days" },
        { value: "last30days", label: "Last 30 Days" },
        { value: "thisMonth", label: "This Month" },
        { value: "lastMonth", label: "Last Month" },
        { value: "custom", label: "Custom Range" },
    ];

    const paymentOptions = [
        { value: "paid", label: "Paid" },
        { value: "pending", label: "Pending" },
        { value: "failed", label: "Failed" },
    ];

    const outlets = ["Outlet 101", "Outlet 102", "Outlet 103"];

    const statusOptions = [
        { value: "enrolled", label: "Enrolled" },
        { value: "activated", label: "Activated" },
        { value: "reported", label: "Reported" },
        { value: "paid", label: "Paid" },
    ];

    // State variables
    const [selectedCampaigns, setSelectedCampaigns] = useState([]);
    const [selectedRegions, setSelectedRegions] = useState([]);
    const [selectedStates, setSelectedStates] = useState([]);
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [selectedDateRange, setSelectedDateRange] = useState(null);
    const [selectedOutlet, setSelectedOutlet] = useState(null);
    const [selectedStatus, setSelectedStatus] = useState(null);
    const [showCustomDate, setShowCustomDate] = useState(false);
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");

    // Get state options based on selected regions
    const getStateOptions = () => {
        if (selectedRegions.length === 0) {
            const allStates = Object.values(regionStates).flat();
            return allStates.map((state) => ({
                value: state.toLowerCase().replace(/\s+/g, "-"),
                label: state,
            }));
        }

        const filteredStates = selectedRegions.flatMap((region) => {
            const regionKey = region.label;
            return regionStates[regionKey] || [];
        });

        return filteredStates.map((state) => ({
            value: state.toLowerCase().replace(/\s+/g, "-"),
            label: state,
        }));
    };

    const stateOptions = getStateOptions();

    // Handle region change
    const handleRegionChange = (selected) => {
        setSelectedRegions(selected);
        if (selected.length > 0) {
            const validStateLabels = selected.flatMap(
                (region) => regionStates[region.label] || []
            );
            const filteredStates = selectedStates.filter((state) =>
                validStateLabels.some(
                    (validState) =>
                        validState.toLowerCase().replace(/\s+/g, "-") === state.value
                )
            );
            setSelectedStates(filteredStates);
        }
    };

    // Handle date change
    const handleDateChange = (selected) => {
        setSelectedDateRange(selected);
        if (selected?.value === "custom") {
            setShowCustomDate(true);
        } else {
            setShowCustomDate(false);
            setFromDate("");
            setToDate("");
        }
    };

    // Custom styling with red theme
    const reportStyles = {
        control: (base, state) => ({
            ...base,
            borderColor: state.isFocused ? "#E4002B" : "#d1d5db",
            boxShadow: state.isFocused ? "0 0 0 1px #E4002B" : "none",
            "&:hover": { borderColor: "#E4002B" },
            borderRadius: "8px",
            minHeight: "42px",
        }),
        option: (base, state) => ({
            ...base,
            backgroundColor: state.isFocused ? "#FEE2E2" : "white",
            color: "#333",
            "&:active": { backgroundColor: "#FECACA" },
        }),
        multiValue: (base) => ({
            ...base,
            backgroundColor: "#FEE2E2",
        }),
        multiValueLabel: (base) => ({
            ...base,
            color: "#E4002B",
        }),
        multiValueRemove: (base) => ({
            ...base,
            color: "#E4002B",
            ":hover": {
                backgroundColor: "#E4002B",
                color: "white",
            },
        }),
        menu: (base) => ({
            ...base,
            zIndex: 20,
        }),
    };

    // Sample report data
    const reportData = [
        {
            id: 1,
            outlet: "Outlet 101",
            outletCode: "OUT101",
            region: "North",
            state: "Delhi",
            campaign: "Campaign A",
            status: "Paid",
            enrollDate: "01-Jan-25",
            activationDate: "05-Jan-25",
            reportDate: "15-Jan-25",
            paymentDate: "20-Jan-25",
            amount: "5000",
            payment: "Paid",
        },
        {
            id: 2,
            outlet: "Outlet 102",
            outletCode: "OUT102",
            region: "South",
            state: "Karnataka",
            campaign: "Campaign B",
            status: "Reported",
            enrollDate: "02-Jan-25",
            activationDate: "06-Jan-25",
            reportDate: "16-Jan-25",
            paymentDate: "-",
            amount: "4500",
            payment: "Pending",
        },
        {
            id: 3,
            outlet: "Outlet 103",
            outletCode: "OUT103",
            region: "West",
            state: "Maharashtra",
            campaign: "Campaign C",
            status: "Activated",
            enrollDate: "03-Jan-25",
            activationDate: "07-Jan-25",
            reportDate: "-",
            paymentDate: "-",
            amount: "-",
            payment: "Pending",
        },
    ];

    // Handle export
    const handleExport = () => {
        console.log("Exporting report data...");
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-[#E4002B]">Detailed Report</h2>
                <button
                    onClick={handleExport}
                    className="bg-[#E4002B] text-white px-6 py-2.5 rounded-lg font-medium hover:bg-[#C3002B] transition-colors flex items-center gap-2"
                >
                    <FaFileDownload />
                    Export Report
                </button>
            </div>

            {/* FILTERS */}
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                <div className="flex items-center gap-2 mb-4">
                    <FaFilter className="text-[#E4002B]" />
                    <h3 className="text-lg font-semibold text-gray-700">Filters</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    {/* Campaign Dropdown */}
                    <div>
                        <label className="block text-sm font-medium mb-1.5 text-gray-700">
                            Campaign
                        </label>
                        <Select
                            options={campaignOptions}
                            value={selectedCampaigns}
                            onChange={setSelectedCampaigns}
                            placeholder="Select Campaign"
                            isSearchable
                            isMulti
                            styles={reportStyles}
                        />
                    </div>

                    {/* Region Dropdown */}
                    <div>
                        <label className="block text-sm font-medium mb-1.5 text-gray-700">
                            Region
                        </label>
                        <Select
                            options={regionOptions}
                            value={selectedRegions}
                            onChange={handleRegionChange}
                            placeholder="Select Region"
                            isSearchable
                            isMulti
                            styles={reportStyles}
                        />
                    </div>

                    {/* State Dropdown */}
                    <div>
                        <label className="block text-sm font-medium mb-1.5 text-gray-700">
                            State
                        </label>
                        <Select
                            options={stateOptions}
                            value={selectedStates}
                            onChange={setSelectedStates}
                            placeholder="Select State"
                            isSearchable
                            isMulti
                            styles={reportStyles}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    {/* Payment Dropdown */}
                    <div>
                        <label className="block text-sm font-medium mb-1.5 text-gray-700">
                            Payment Status
                        </label>
                        <Select
                            options={paymentOptions}
                            value={selectedPayment}
                            onChange={setSelectedPayment}
                            placeholder="Select Payment"
                            isSearchable
                            styles={reportStyles}
                        />
                    </div>

                    {/* Status Dropdown */}
                    <div>
                        <label className="block text-sm font-medium mb-1.5 text-gray-700">
                            Outlet Status
                        </label>
                        <Select
                            options={statusOptions}
                            value={selectedStatus}
                            onChange={setSelectedStatus}
                            placeholder="Select Status"
                            isSearchable
                            styles={reportStyles}
                        />
                    </div>

                    {/* Outlet Dropdown */}
                    <div>
                        <label className="block text-sm font-medium mb-1.5 text-gray-700">
                            Outlet
                        </label>
                        <Select
                            options={outlets.map((x) => ({ label: x, value: x }))}
                            value={selectedOutlet}
                            onChange={setSelectedOutlet}
                            placeholder="Select Outlet"
                            isSearchable
                            styles={reportStyles}
                        />
                    </div>

                    {/* Date Dropdown */}
                    <div>
                        <label className="block text-sm font-medium mb-1.5 text-gray-700">
                            Date Range
                        </label>
                        <Select
                            options={dateOptions}
                            value={selectedDateRange}
                            onChange={handleDateChange}
                            placeholder="Select Date"
                            isSearchable
                            styles={reportStyles}
                        />
                    </div>
                </div>

                {/* Custom Date Range */}
                {showCustomDate && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1.5 text-gray-700">
                                From Date
                            </label>
                            <input
                                type="date"
                                className="border border-gray-300 rounded-lg px-3 py-2.5 w-full focus:ring-1 focus:ring-[#E4002B] focus:border-[#E4002B] focus:outline-none transition-colors"
                                value={fromDate}
                                onChange={(e) => setFromDate(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1.5 text-gray-700">
                                To Date
                            </label>
                            <input
                                type="date"
                                className="border border-gray-300 rounded-lg px-3 py-2.5 w-full focus:ring-1 focus:ring-[#E4002B] focus:border-[#E4002B] focus:outline-none transition-colors"
                                value={toDate}
                                onChange={(e) => setToDate(e.target.value)}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* REPORT TABLE */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-[#E4002B] text-white">
                                <th className="px-4 py-3 text-left font-semibold">S.No</th>
                                <th className="px-4 py-3 text-left font-semibold">Outlet Name</th>
                                <th className="px-4 py-3 text-left font-semibold">Outlet Code</th>
                                <th className="px-4 py-3 text-left font-semibold">Region</th>
                                <th className="px-4 py-3 text-left font-semibold">State</th>
                                <th className="px-4 py-3 text-left font-semibold">Campaign</th>
                                <th className="px-4 py-3 text-left font-semibold">Status</th>
                                <th className="px-4 py-3 text-left font-semibold">Enroll Date</th>
                                <th className="px-4 py-3 text-left font-semibold">Activation Date</th>
                                <th className="px-4 py-3 text-left font-semibold">Report Date</th>
                                <th className="px-4 py-3 text-left font-semibold">Payment Date</th>
                                <th className="px-4 py-3 text-left font-semibold">Amount</th>
                                <th className="px-4 py-3 text-left font-semibold">Payment</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reportData.map((item, index) => (
                                <tr
                                    key={item.id}
                                    className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                                >
                                    <td className="px-4 py-3">{index + 1}</td>
                                    <td className="px-4 py-3 font-medium">{item.outlet}</td>
                                    <td className="px-4 py-3">{item.outletCode}</td>
                                    <td className="px-4 py-3">{item.region}</td>
                                    <td className="px-4 py-3">{item.state}</td>
                                    <td className="px-4 py-3">{item.campaign}</td>
                                    <td className="px-4 py-3">
                                        <span
                                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                item.status === "Paid"
                                                    ? "bg-green-100 text-green-700"
                                                    : item.status === "Reported"
                                                    ? "bg-blue-100 text-blue-700"
                                                    : item.status === "Activated"
                                                    ? "bg-yellow-100 text-yellow-700"
                                                    : "bg-gray-100 text-gray-700"
                                            }`}
                                        >
                                            {item.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">{item.enrollDate}</td>
                                    <td className="px-4 py-3">{item.activationDate}</td>
                                    <td className="px-4 py-3">{item.reportDate}</td>
                                    <td className="px-4 py-3">{item.paymentDate}</td>
                                    <td className="px-4 py-3 font-medium">
                                        {item.amount !== "-" ? `₹${item.amount}` : "-"}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span
                                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                item.payment === "Paid"
                                                    ? "bg-green-100 text-green-700"
                                                    : item.payment === "Pending"
                                                    ? "bg-orange-100 text-orange-700"
                                                    : "bg-red-100 text-red-700"
                                            }`}
                                        >
                                            {item.payment}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {reportData.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                        No data available. Please adjust your filters.
                    </div>
                )}
            </div>

            {/* Summary Section */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
                <div className="bg-white p-4 rounded-lg shadow-md text-center">
                    <p className="text-gray-600 text-sm mb-1">Total Outlets</p>
                    <p className="text-2xl font-bold text-[#E4002B]">{reportData.length}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-md text-center">
                    <p className="text-gray-600 text-sm mb-1">Total Paid</p>
                    <p className="text-2xl font-bold text-green-600">
                        {reportData.filter((r) => r.payment === "Paid").length}
                    </p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-md text-center">
                    <p className="text-gray-600 text-sm mb-1">Total Pending</p>
                    <p className="text-2xl font-bold text-orange-600">
                        {reportData.filter((r) => r.payment === "Pending").length}
                    </p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-md text-center">
                    <p className="text-gray-600 text-sm mb-1">Total Amount</p>
                    <p className="text-2xl font-bold text-[#E4002B]">
                        ₹
                        {reportData
                            .filter((r) => r.amount !== "-")
                            .reduce((sum, r) => sum + parseFloat(r.amount), 0)
                            .toLocaleString()}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default DetailedReport;
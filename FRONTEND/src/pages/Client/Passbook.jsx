import React, { useState } from "react";
import Select from "react-select";

const Passbook = () => {
    // Updated options to match ClientHome
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

    // State variables matching ClientHome functionality
    const [selectedCampaigns, setSelectedCampaigns] = useState([]);
    const [selectedRegions, setSelectedRegions] = useState([]);
    const [selectedStates, setSelectedStates] = useState([]);
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [selectedDateRange, setSelectedDateRange] = useState(null);
    const [selectedOutlet, setSelectedOutlet] = useState(null);
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

    // Table data
    const rows = [
        {
            outlet: "Outlet 101",
            date: "01-Apr-25",
            particulars: "Opening Balance",
            debit: "",
            credit: "",
            balance: "0.00",
        },
        {
            outlet: "Outlet 101",
            date: "10-Apr-25",
            particulars: "Monte Carlo Campaign",
            debit: "1000",
            credit: "",
            balance: "1000.00",
        },
        {
            outlet: "Outlet 102",
            date: "11-Apr-25",
            particulars: "ABCD Campaign",
            debit: "",
            credit: "1000",
            balance: "0.00",
        },
    ];

    // Filter data based on selected outlet
    const filteredRows = selectedOutlet
        ? rows.filter((row) => row.outlet === selectedOutlet.value)
        : rows;

    // Passbook styling for dropdowns with red theme
    const passbookStyles = {
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

    return (
        <div className="p-6">
            <h2 className="text-3xl font-bold mb-6 text-[#E4002B]">Passbook</h2>

            {/* FILTERS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {/* Campaign Dropdown (Multi-select) */}
                <Select
                    options={campaignOptions}
                    value={selectedCampaigns}
                    onChange={setSelectedCampaigns}
                    placeholder="Select Campaign"
                    isSearchable
                    isMulti
                    styles={passbookStyles}
                />

                {/* Region Dropdown (Multi-select) */}
                <Select
                    options={regionOptions}
                    value={selectedRegions}
                    onChange={handleRegionChange}
                    placeholder="Select Region"
                    isSearchable
                    isMulti
                    styles={passbookStyles}
                />

                {/* State Dropdown (Multi-select) */}
                <Select
                    options={stateOptions}
                    value={selectedStates}
                    onChange={setSelectedStates}
                    placeholder="Select State"
                    isSearchable
                    isMulti
                    styles={passbookStyles}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {/* Payment Dropdown */}
                <Select
                    options={paymentOptions}
                    value={selectedPayment}
                    onChange={setSelectedPayment}
                    placeholder="Select Payment"
                    isSearchable
                    styles={passbookStyles}
                />

                {/* Outlet Dropdown */}
                <Select
                    options={outlets.map((x) => ({ label: x, value: x }))}
                    value={selectedOutlet}
                    onChange={setSelectedOutlet}
                    placeholder="Select Outlet"
                    isSearchable
                    styles={passbookStyles}
                />

                {/* Date Dropdown */}
                <div>
                    <Select
                        options={dateOptions}
                        value={selectedDateRange}
                        onChange={handleDateChange}
                        placeholder="Select Date"
                        isSearchable
                        styles={passbookStyles}
                    />
                </div>
            </div>

            {/* Custom Date Range */}
            {showCustomDate && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                        <label className="block text-sm font-medium mb-1.5 text-gray-700">From Date</label>
                        <input
                            type="date"
                            className="border border-gray-300 rounded-lg px-3 py-2.5 w-full focus:ring-1 focus:ring-[#E4002B] focus:border-[#E4002B] focus:outline-none transition-colors"
                            value={fromDate}
                            onChange={(e) => setFromDate(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1.5 text-gray-700">To Date</label>
                        <input
                            type="date"
                            className="border border-gray-300 rounded-lg px-3 py-2.5 w-full focus:ring-1 focus:ring-[#E4002B] focus:border-[#E4002B] focus:outline-none transition-colors"
                            value={toDate}
                            onChange={(e) => setToDate(e.target.value)}
                        />
                    </div>
                </div>
            )}

            {/* TABLE */}
            <div className="overflow-x-auto">
                <table className="w-full text-sm border border-black rounded-lg overflow-hidden">
                    <thead>
                        <tr className="bg-[#E4002B] text-white">
                            <th className="border border-black px-3 py-2">Outlet</th>
                            <th className="border border-black px-3 py-2">Date</th>
                            <th className="border border-black px-3 py-2">Particulars</th>
                            <th className="border border-black px-3 py-2">Debit</th>
                            <th className="border border-black px-3 py-2">Credit</th>
                            <th className="border border-black px-3 py-2">Balance</th>
                        </tr>
                    </thead>

                    <tbody>
                        {filteredRows.map((item, i) => (
                            <tr key={i} className="odd:bg-gray-100">
                                <td className="border border-black px-3 py-2">{item.outlet}</td>
                                <td className="border border-black px-3 py-2">{item.date}</td>
                                <td className="border border-black px-3 py-2">{item.particulars}</td>

                                <td className="border border-black px-3 py-2 text-red-600">
                                    {item.debit || "-"}
                                </td>

                                <td className="border border-black px-3 py-2 text-green-600">
                                    {item.credit || "-"}
                                </td>

                                <td className="border border-black px-3 py-2 font-medium">
                                    {item.balance}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {filteredRows.length === 0 && (
                    <p className="text-center text-gray-500 py-4">No records found.</p>
                )}
            </div>
        </div>
    );
};

export default Passbook;
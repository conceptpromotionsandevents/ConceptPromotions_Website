import React, { useState, useEffect } from "react";
import Select from "react-select";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import * as XLSX from 'xlsx-js-style';
import { API_URL } from "../../url/base";

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

const PassbookHome = () => {
    // All Data from APIs
    const [allCampaigns, setAllCampaigns] = useState([]);
    const [allRetailers, setAllRetailers] = useState([]);
    const [allStates, setAllStates] = useState([]);

    // Selected Filters
    const [selectedState, setSelectedState] = useState(null);
    const [selectedCampaign, setSelectedCampaign] = useState(null);
    const [selectedRetailer, setSelectedRetailer] = useState(null);

    // Filtered Options for Dropdowns
    const [stateOptions, setStateOptions] = useState([]);
    const [campaignOptions, setCampaignOptions] = useState([]);
    const [retailerOptions, setRetailerOptions] = useState([]);

    const [loading, setLoading] = useState(true);

    // Passbook Data
    const [passbookData, setPassbookData] = useState(null);
    const [displayedCampaigns, setDisplayedCampaigns] = useState([]);

    // ===============================
    // FETCH ALL DATA ON MOUNT
    // ===============================
    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");

            // Fetch Campaigns
            const campaignsRes = await fetch(
                `${API_URL}/admin/campaigns`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            const campaignsData = await campaignsRes.json();
            const campaigns = (campaignsData.campaigns || []).filter(
                (c) => c.isActive === true
            );

            // Fetch Retailers
            const retailersRes = await fetch(
                `${API_URL}/admin/retailers`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            const retailersData = await retailersRes.json();
            const retailers = retailersData.retailers || [];

            setAllCampaigns(campaigns);
            setAllRetailers(retailers);

            // Extract all unique states from retailers
            const uniqueStates = [
                ...new Set(
                    retailers
                        .map((r) => r.shopDetails?.shopAddress?.state)
                        .filter(Boolean)
                ),
            ];
            setAllStates(uniqueStates);

            // Initialize dropdown options
            setStateOptions(uniqueStates.map((s) => ({ label: s, value: s })));
            setCampaignOptions(
                campaigns.map((c) => ({ label: c.name, value: c._id, data: c }))
            );
            setRetailerOptions(
                retailers.map((r) => ({
                    label: `${r.uniqueId} - ${r.shopDetails?.shopName || "N/A"}`,
                    value: r._id,
                    data: r,
                }))
            );
        } catch (err) {
            console.error("Error fetching data:", err);
            toast.error("Failed to load data", { theme: "dark" });
        } finally {
            setLoading(false);
        }
    };

    // ===============================
    // FETCH PASSBOOK DATA
    // ===============================
    useEffect(() => {
        if (selectedRetailer) {
            fetchPassbookData();
        } else {
            resetPassbookData();
        }
    }, [selectedRetailer, selectedCampaign]);

    const fetchPassbookData = async () => {
        try {
            const token = localStorage.getItem("token");

            // Build query params
            const params = new URLSearchParams();
            if (selectedRetailer) params.append("retailerId", selectedRetailer.value);
            if (selectedState) params.append("state", selectedState.value);
            if (selectedCampaign) params.append("campaignId", selectedCampaign.value);

            const response = await fetch(
                `${API_URL}/budgets/passbook?${params.toString()}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (response.ok) {
                const data = await response.json();
                if (data.success && data.data && data.data.length > 0) {
                    const budgetRecord = data.data[0];
                    setPassbookData(budgetRecord);

                    // Filter campaigns if specific campaign selected
                    if (selectedCampaign) {
                        const filteredCampaigns = budgetRecord.campaigns.filter(
                            (c) => c.campaignId._id === selectedCampaign.value
                        );
                        setDisplayedCampaigns(filteredCampaigns);
                    } else {
                        setDisplayedCampaigns(budgetRecord.campaigns);
                    }
                } else {
                    toast.info("No passbook data found for this retailer", { theme: "dark" });
                    resetPassbookData();
                }
            } else {
                toast.error("Failed to fetch passbook data", { theme: "dark" });
                resetPassbookData();
            }
        } catch (error) {
            console.error("Error fetching passbook:", error);
            toast.error("Failed to fetch passbook data", { theme: "dark" });
            resetPassbookData();
        }
    };

    const resetPassbookData = () => {
        setPassbookData(null);
        setDisplayedCampaigns([]);
    };

    // ===============================
    // FILTER LOGIC
    // ===============================
    useEffect(() => {
        if (!selectedState && !selectedCampaign && !selectedRetailer) {
            setStateOptions(allStates.map((s) => ({ label: s, value: s })));
            setCampaignOptions(
                allCampaigns.map((c) => ({ label: c.name, value: c._id, data: c }))
            );
            setRetailerOptions(
                allRetailers.map((r) => ({
                    label: `${r.uniqueId} - ${r.shopDetails?.shopName || "N/A"}`,
                    value: r._id,
                    data: r,
                }))
            );
            return;
        }

        applyFilters();
    }, [selectedState, selectedCampaign, selectedRetailer]);

    const applyFilters = () => {
        let filteredRetailers = [...allRetailers];
        let filteredCampaigns = [...allCampaigns];
        let filteredStates = [...allStates];

        if (selectedState) {
            filteredRetailers = filteredRetailers.filter(
                (r) => r.shopDetails?.shopAddress?.state === selectedState.value
            );

            filteredCampaigns = filteredCampaigns.filter((c) => {
                if (Array.isArray(c.states)) {
                    return c.states.includes(selectedState.value);
                }
                return c.state === selectedState.value;
            });
        }

        if (selectedCampaign) {
            const campaignData = allCampaigns.find(
                (c) => c._id === selectedCampaign.value
            );

            if (campaignData) {
                const campaignStates = Array.isArray(campaignData.states)
                    ? campaignData.states
                    : campaignData.state
                        ? [campaignData.state]
                        : [];

                if (!selectedState) {
                    filteredStates = filteredStates.filter((s) =>
                        campaignStates.includes(s)
                    );
                }

                filteredRetailers = filteredRetailers.filter((r) => {
                    const inCampaignState = campaignStates.includes(
                        r.shopDetails?.shopAddress?.state
                    );
                    const assignedToCampaign =
                        Array.isArray(r.assignedCampaigns) &&
                        r.assignedCampaigns.some(
                            (ac) =>
                                (typeof ac === "string" ? ac : ac._id) ===
                                selectedCampaign.value
                        );
                    return inCampaignState && assignedToCampaign;
                });
            }
        }

        if (selectedRetailer) {
            const retailerData = allRetailers.find(
                (r) => r._id === selectedRetailer.value
            );

            if (retailerData) {
                const retailerState = retailerData.shopDetails?.shopAddress?.state;

                if (!selectedState && retailerState) {
                    filteredStates = [retailerState];
                }

                if (!selectedCampaign) {
                    const retailerCampaignIds = (
                        retailerData.assignedCampaigns || []
                    ).map((ac) => (typeof ac === "string" ? ac : ac._id));

                    filteredCampaigns = filteredCampaigns.filter((c) =>
                        retailerCampaignIds.includes(c._id)
                    );
                }
            }
        }

        setStateOptions(filteredStates.map((s) => ({ label: s, value: s })));
        setCampaignOptions(
            filteredCampaigns.map((c) => ({
                label: c.name,
                value: c._id,
                data: c,
            }))
        );
        setRetailerOptions(
            filteredRetailers.map((r) => ({
                label: `${r.uniqueId} - ${r.shopDetails?.shopName || "N/A"}`,
                value: r._id,
                data: r,
            }))
        );
    };

    // ===============================
    // HANDLE FILTER CHANGES
    // ===============================
    const handleStateChange = (selected) => {
        setSelectedState(selected);
        if (!selected) {
            setSelectedRetailer(null);
        }
    };

    const handleCampaignChange = (selected) => {
        setSelectedCampaign(selected);
    };

    const handleRetailerChange = (selected) => {
        setSelectedRetailer(selected);

        // ✅ Auto-select state when retailer is selected
        if (selected && selected.data) {
            const retailerState = selected.data.shopDetails?.shopAddress?.state;
            if (retailerState) {
                const stateOption = stateOptions.find(s => s.value === retailerState);
                if (stateOption) {
                    setSelectedState(stateOption);
                }
            }
        } else {
            setSelectedState(null);
        }
    };

    const handleClearAllFilters = () => {
        setSelectedState(null);
        setSelectedCampaign(null);
        setSelectedRetailer(null);
        resetPassbookData();
    };

    // ===============================
    // DOWNLOAD PASSBOOK REPORT
    // ===============================
    const handleDownloadPassbook = () => {
        if (!passbookData || displayedCampaigns.length === 0) {
            toast.error("No data to download", { theme: "dark" });
            return;
        }

        const rows = [];

        // Row 1: Title
        rows.push({
            A: "ADMIN PASSBOOK REPORT",
            B: "", C: "", D: "", E: "", F: "", G: "", H: "", I: "", J: "", K: "", L: "", M: ""
        });

        // Row 2: Empty
        rows.push({});

        // Row 3: Retailer Details
        rows.push({
            A: "Outlet Code:",
            B: passbookData.outletCode,
            C: "",
            D: "Shop Name:",
            E: passbookData.shopName,
            F: "",
            G: "State:",
            H: passbookData.state,
            I: "",
            J: "Retailer Name:",
            K: passbookData.retailerName
        });

        // Row 4 & 5: Empty rows
        rows.push({});
        rows.push({});

        // Row 6: Header
        rows.push({
            A: "S.No",
            B: "State",
            C: "Outlet Name",
            D: "Outlet Code",
            E: "Campaign Name",
            F: "Organization Name",
            G: "Type",
            H: "Budget (TCA)",
            I: "Paid",
            J: "Pending",
            K: "Amount",
            L: "Date",
            M: "UTR Number",
            N: "Remarks"
        });

        // Data rows with continuous S.No
        let serialNumber = 1;

        displayedCampaigns.forEach((campaign) => {
            const installments = campaign.installments || [];

            if (installments.length === 0) {
                // No installments - single row
                rows.push({
                    A: serialNumber++,
                    B: passbookData.state,
                    C: passbookData.shopName,
                    D: passbookData.outletCode,
                    E: campaign.campaignName,
                    F: campaign.campaignId?.client || "N/A",
                    G: campaign.campaignId?.type || "N/A",
                    H: campaign.tca,
                    I: campaign.cPaid,
                    J: campaign.cPending,
                    K: "",
                    L: "",
                    M: "",
                    N: ""
                });
            } else {
                // Has installments - each installment gets its own row
                installments.forEach((inst) => {
                    rows.push({
                        A: serialNumber++,
                        B: passbookData.state,
                        C: passbookData.shopName,
                        D: passbookData.outletCode,
                        E: campaign.campaignName,
                        F: campaign.campaignId?.client || "N/A",
                        G: campaign.campaignId?.type || "N/A",
                        H: campaign.tca,
                        I: campaign.cPaid,
                        J: campaign.cPending,
                        K: inst.installmentAmount,
                        L: new Date(inst.dateOfInstallment).toLocaleDateString(),
                        M: inst.utrNumber,
                        N: inst.remarks || "-"
                    });
                });
            }
        });

        // Create worksheet
        const ws = XLSX.utils.json_to_sheet(rows, { skipHeader: true });

        // Styling
        const titleStyle = {
            font: { color: { rgb: "FFFFFF" }, bold: true, sz: 16 },
            alignment: { horizontal: "center", vertical: "center" },
            fill: { fgColor: { rgb: "E4002B" } }
        };

        const headerStyle = {
            font: { bold: true },
            alignment: { horizontal: "center", vertical: "center" },
            fill: { fgColor: { rgb: "E2E8F0" } }
        };

        const dataStyle = {
            alignment: { horizontal: "center", vertical: "center" }
        };

        // Apply styles
        const range = XLSX.utils.decode_range(ws['!ref']);
        for (let R = range.s.r; R <= range.e.r; ++R) {
            for (let C = range.s.c; C <= range.e.c; ++C) {
                const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
                if (ws[cellAddress]) {
                    if (R === 0) {
                        ws[cellAddress].s = titleStyle;
                    } else if (R === 5) { // Header is now at row 6 (index 5)
                        ws[cellAddress].s = headerStyle;
                    } else {
                        ws[cellAddress].s = dataStyle;
                    }
                }
            }
        }

        // Merge cells for title (Row 1, A1:N1)
        if (!ws['!merges']) ws['!merges'] = [];
        ws['!merges'].push({
            s: { r: 0, c: 0 },
            e: { r: 0, c: 13 }
        });

        // Column widths
        ws["!cols"] = [
            { wpx: 60 },   // A: S.No
            { wpx: 100 },  // B: State
            { wpx: 180 },  // C: Outlet Name
            { wpx: 120 },  // D: Outlet Code
            { wpx: 180 },  // E: Campaign Name
            { wpx: 150 },  // F: Organization Name
            { wpx: 100 },  // G: Type
            { wpx: 120 },  // H: Budget (TCA)
            { wpx: 100 },  // I: Paid
            { wpx: 100 },  // J: Pending
            { wpx: 100 },  // K: Amount
            { wpx: 110 },  // L: Date
            { wpx: 120 },  // M: UTR Number
            { wpx: 120 }   // N: Remarks
        ];

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Passbook");

        XLSX.writeFile(
            wb,
            `Passbook_${passbookData.outletCode}_${new Date().toISOString().split('T')[0]}.xlsx`
        );

        toast.success("Passbook downloaded successfully!", { theme: "dark" });
    };

    return (
        <>
            <ToastContainer position="top-right" autoClose={3000} />
            <div className="min-h-screen bg-[#171717] p-6">
                <div className="max-w-7xl mx-auto">
                    <h1 className="text-3xl font-bold text-[#E4002B] mb-8">
                        Passbook
                    </h1>

                    {loading ? (
                        <div className="bg-[#EDEDED] rounded-lg shadow-md p-6">
                            <p className="text-gray-600">Loading data...</p>
                        </div>
                    ) : (
                        <>
                            {/* Filters */}
                            <div className="bg-[#EDEDED] rounded-lg shadow-md p-6 mb-6">
                                <h2 className="text-lg font-semibold mb-4 text-gray-700">
                                    Filter Options
                                </h2>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {/* State Filter */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            State
                                        </label>
                                        <Select
                                            value={selectedState}
                                            onChange={handleStateChange}
                                            options={stateOptions}
                                            styles={customSelectStyles}
                                            placeholder="Select State"
                                            isClearable
                                            isSearchable
                                        />
                                    </div>

                                    {/* Retailer Filter */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Retailer *
                                        </label>
                                        <Select
                                            value={selectedRetailer}
                                            onChange={handleRetailerChange}
                                            options={retailerOptions}
                                            styles={customSelectStyles}
                                            placeholder="Select Retailer"
                                            isClearable
                                            isSearchable
                                        />
                                    </div>

                                    {/* Campaign Filter (Optional) */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Campaign (Optional)
                                        </label>
                                        <Select
                                            value={selectedCampaign}
                                            onChange={handleCampaignChange}
                                            options={campaignOptions}
                                            styles={customSelectStyles}
                                            placeholder="All Campaigns"
                                            isClearable
                                            isSearchable
                                        />
                                    </div>
                                </div>

                                {(selectedState || selectedCampaign || selectedRetailer) && (
                                    <button
                                        onClick={handleClearAllFilters}
                                        className="mt-4 text-sm text-red-600 underline hover:text-red-800"
                                    >
                                        Clear All Filters
                                    </button>
                                )}
                            </div>

                            {/* Retailer Summary */}
                            {passbookData && (
                                <div className="bg-[#EDEDED] rounded-lg shadow-md p-6 mb-6">
                                    <div className="flex justify-between items-center mb-4">
                                        <h2 className="text-lg font-semibold text-gray-700">
                                            Retailer Summary
                                        </h2>
                                        <button
                                            onClick={handleDownloadPassbook}
                                            className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition"
                                        >
                                            Download Passbook
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm mb-4">
                                        <p><strong>Outlet Code:</strong> {passbookData.outletCode}</p>
                                        <p><strong>Shop Name:</strong> {passbookData.shopName}</p>
                                        <p><strong>State:</strong> {passbookData.state}</p>
                                        <p><strong>Retailer Name:</strong> {passbookData.retailerName}</p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="bg-blue-50 p-4 rounded-lg">
                                            <p className="text-sm text-gray-600">Total Budget (TAR)</p>
                                            <p className="text-2xl font-bold text-blue-600">
                                                ₹{passbookData.tar || 0}
                                            </p>
                                        </div>
                                        <div className="bg-green-50 p-4 rounded-lg">
                                            <p className="text-sm text-gray-600">Total Paid</p>
                                            <p className="text-2xl font-bold text-green-600">
                                                ₹{passbookData.taPaid || 0}
                                            </p>
                                        </div>
                                        <div className="bg-yellow-50 p-4 rounded-lg">
                                            <p className="text-sm text-gray-600">Total Pending</p>
                                            <p className="text-2xl font-bold text-yellow-600">
                                                ₹{passbookData.taPending || 0}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Campaign-wise Details */}
                            {displayedCampaigns.length > 0 && displayedCampaigns.map((campaign) => (
                                <div key={campaign._id} className="bg-[#EDEDED] rounded-lg shadow-md p-6 mb-6">
                                    <h3 className="text-lg font-semibold mb-3 text-gray-700">
                                        {campaign.campaignName}
                                    </h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm mb-4">
                                        <p><strong>Oragnization Name:</strong> {campaign.campaignId?.client || "N/A"}</p>
                                        <p><strong>Type:</strong> {campaign.campaignId?.type || "N/A"}</p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                        <div className="bg-blue-50 p-3 rounded-lg">
                                            <p className="text-xs text-gray-600">Campaign Budget (TCA)</p>
                                            <p className="text-xl font-bold text-blue-600">
                                                ₹{campaign.tca || 0}
                                            </p>
                                        </div>
                                        <div className="bg-green-50 p-3 rounded-lg">
                                            <p className="text-xs text-gray-600">Paid</p>
                                            <p className="text-xl font-bold text-green-600">
                                                ₹{campaign.cPaid || 0}
                                            </p>
                                        </div>
                                        <div className="bg-yellow-50 p-3 rounded-lg">
                                            <p className="text-xs text-gray-600">Pending</p>
                                            <p className="text-xl font-bold text-yellow-600">
                                                ₹{campaign.cPending || 0}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Installments Table */}
                                    {campaign.installments && campaign.installments.length > 0 ? (
                                        <div className="overflow-x-auto">
                                            <h4 className="text-sm font-semibold mb-2 text-gray-700">Installments</h4>
                                            <table className="min-w-full divide-y divide-gray-200">
                                                <thead className="bg-gray-100">
                                                    <tr>
                                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">#</th>
                                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">Amount</th>
                                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">Date</th>
                                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">UTR Number</th>
                                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">Remarks</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-gray-200">
                                                    {campaign.installments.map((inst) => (
                                                        <tr key={inst._id} className="hover:bg-gray-50">
                                                            <td className="px-4 py-2 text-sm">{inst.installmentNo}</td>
                                                            <td className="px-4 py-2 text-sm font-semibold text-gray-700">
                                                                ₹{inst.installmentAmount}
                                                            </td>
                                                            <td className="px-4 py-2 text-sm text-gray-600">
                                                                {new Date(inst.dateOfInstallment).toLocaleDateString()}
                                                            </td>
                                                            <td className="px-4 py-2 text-sm text-gray-600">{inst.utrNumber}</td>
                                                            <td className="px-4 py-2 text-sm text-gray-600">{inst.remarks || "-"}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-500 py-2">No installments recorded for this campaign.</p>
                                    )}
                                </div>
                            ))}

                            {!passbookData && selectedRetailer && (
                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
                                    <p className="font-semibold">No Passbook Data Found</p>
                                    <p>No budget or payment records exist for this retailer.</p>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </>
    );
};

export default PassbookHome;


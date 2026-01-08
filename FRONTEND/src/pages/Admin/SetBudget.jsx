import React, { useState, useEffect } from "react";
import Select from "react-select";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
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

const SetBudget = () => {
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

    // Budget Input & Edit Mode
    const [budgetAmount, setBudgetAmount] = useState("");
    const [existingBudget, setExistingBudget] = useState(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [budgetId, setBudgetId] = useState(null);
    const [campaignSubId, setCampaignSubId] = useState(null);

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
    // CHECK EXISTING BUDGET WHEN RETAILER + CAMPAIGN SELECTED
    // ===============================
    useEffect(() => {
        if (selectedRetailer && selectedCampaign) {
            checkExistingBudget();
        } else {
            resetBudgetState();
        }
    }, [selectedRetailer, selectedCampaign]);

    const checkExistingBudget = async (silent = false) => {
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(
                `${API_URL}/budgets/retailer/${selectedRetailer.value}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (response.ok) {
                const data = await response.json();

                // Check if data, data.success, and data.budget exist
                if (data?.success && data?.budget) {
                    const existingCampaign = data.budget.campaigns?.find(
                        (c) =>
                            c.campaignId?._id?.toString() ===
                            selectedCampaign.value.toString()
                    );

                    if (existingCampaign) {
                        setExistingBudget(existingCampaign);
                        setBudgetAmount(existingCampaign.tca.toString());
                        setIsEditMode(true);
                        setBudgetId(data.budget._id);
                        setCampaignSubId(existingCampaign._id);
                        // Only show toast if not silent
                        if (!silent) {
                            toast.info("Budget already exists. You can update or delete it.", {
                                theme: "dark",
                            });
                        }
                    } else {
                        resetBudgetState();
                        if (!silent) {
                            toast.info("No existing budget found. You can create a new one.", {
                                theme: "dark",
                            });
                        }
                    }
                } else {
                    // Handle case where budget is null or undefined
                    resetBudgetState();
                    if (!silent) {
                        toast.info("No existing budget found. You can create a new one.", {
                            theme: "dark",
                        });
                    }
                }
            } else {
                // Handle non-OK response
                resetBudgetState();
                if (!silent) {
                    toast.info("No existing budget found. You can create a new one.", {
                        theme: "dark",
                    });
                }
            }
        } catch (error) {
            console.error("Error checking existing budget:", error);
            resetBudgetState();
            if (!silent) {
                toast.error("Failed to check existing budget. Please try again.", {
                    theme: "dark",
                });
            }
        }
    };

    const resetBudgetState = () => {
        setExistingBudget(null);
        setBudgetAmount("");
        setIsEditMode(false);
        setBudgetId(null);
        setCampaignSubId(null);
    };

    // ===============================
    // FILTER LOGIC - ✅ FIXED
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

        // ✅ PRIORITY 1: If retailer is selected, filter campaigns by retailer's assigned campaigns
        if (selectedRetailer) {
            const retailerData = allRetailers.find(
                (r) => r._id === selectedRetailer.value
            );

            if (retailerData) {
                const retailerState = retailerData.shopDetails?.shopAddress?.state;

                // Set state based on retailer
                if (!selectedState && retailerState) {
                    filteredStates = [retailerState];
                }

                // ✅ FIXED: Only show campaigns assigned to this retailer
                const retailerCampaignIds = (
                    retailerData.assignedCampaigns || []
                ).map((ac) => (typeof ac === "string" ? ac : ac._id));

                filteredCampaigns = allCampaigns.filter((c) =>
                    retailerCampaignIds.includes(c._id)
                );
            }
        }
        // If no retailer selected but state is selected
        else if (selectedState) {
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

        // ✅ PRIORITY 2: If campaign is selected (and no retailer yet), filter retailers by campaign
        if (selectedCampaign && !selectedRetailer) {
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
            setSelectedCampaign(null);
            setSelectedRetailer(null);
        }
    };

    const handleCampaignChange = (selected) => {
        setSelectedCampaign(selected);
        if (!selected) {
            setSelectedRetailer(null);
        }
    };

    const handleRetailerChange = (selected) => {
        setSelectedRetailer(selected);

        // ✅ Auto-select state when retailer is selected
        if (selected && selected.data) {
            const retailerState = selected.data.shopDetails?.shopAddress?.state;
            if (retailerState) {
                // Find and set the state option
                const stateOption = stateOptions.find(s => s.value === retailerState);
                if (stateOption) {
                    setSelectedState(stateOption);
                }
            }
        } else {
            // ✅ Clear state when retailer is cleared
            setSelectedState(null);
        }
    };

    const handleClearAllFilters = () => {
        setSelectedState(null);
        setSelectedCampaign(null);
        setSelectedRetailer(null);
        resetBudgetState();
    };

    // ===============================
    // CREATE BUDGET
    // ===============================
    const handleSetBudget = async () => {
        if (!selectedCampaign) {
            toast.error("Please select a campaign", { theme: "dark" });
            return;
        }
        if (!selectedRetailer) {
            toast.error("Please select a retailer", { theme: "dark" });
            return;
        }
        if (!budgetAmount || parseFloat(budgetAmount) <= 0) {
            toast.error("Please enter a valid budget amount", { theme: "dark" });
            return;
        }

        try {
            const token = localStorage.getItem("token");
            const payload = {
                retailerId: selectedRetailer.value,
                retailerName: selectedRetailer.data.shopDetails?.shopName || "",
                state: selectedRetailer.data.shopDetails?.shopAddress?.state || "",
                shopName: selectedRetailer.data.shopDetails?.shopName || "",
                outletCode: selectedRetailer.data.uniqueId,
                campaignId: selectedCampaign.value,
                campaignName: selectedCampaign.data.name,
                tca: parseFloat(budgetAmount),
            };

            const response = await fetch(
                `${API_URL}/budgets/set-campaign-tca`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(payload),
                }
            );

            const data = await response.json();

            if (response.ok && data.success) {
                toast.success("Budget set successfully!", { theme: "dark" });
                // ✅ Pass true to prevent the extra toast notification
                await checkExistingBudget(true);
            } else {
                toast.error(data.message || "Failed to set budget", {
                    theme: "dark",
                });
            }
        } catch (error) {
            console.error("Error setting budget:", error);
            toast.error("Failed to set budget", { theme: "dark" });
        }
    };

    // ===============================
    // UPDATE BUDGET
    // ===============================
    const handleUpdateBudget = async () => {
        if (!budgetAmount || parseFloat(budgetAmount) <= 0) {
            toast.error("Please enter a valid budget amount", { theme: "dark" });
            return;
        }

        if (!budgetId || !campaignSubId) {
            toast.error("Budget information missing", { theme: "dark" });
            return;
        }

        try {
            const token = localStorage.getItem("token");
            const response = await fetch(
                `${API_URL}/budgets/${budgetId}/campaign/${campaignSubId}/tca`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ tca: parseFloat(budgetAmount) }),
                }
            );

            const data = await response.json();

            if (response.ok && data.success) {
                toast.success("Budget updated successfully!", { theme: "dark" });
                // ✅ Pass true to prevent the extra toast notification
                await checkExistingBudget(true);
            } else {
                toast.error(data.message || "Failed to update budget", {
                    theme: "dark",
                });
            }
        } catch (error) {
            console.error("Error updating budget:", error);
            toast.error("Failed to update budget", { theme: "dark" });
        }
    };

    // ===============================
    // DELETE BUDGET
    // ===============================
    const handleDeleteBudget = async () => {
        if (!window.confirm("Are you sure you want to delete this budget?")) {
            return;
        }

        if (!budgetId || !campaignSubId) {
            toast.error("Budget information missing", { theme: "dark" });
            return;
        }

        try {
            const token = localStorage.getItem("token");
            const response = await fetch(
                `${API_URL}/budgets/${budgetId}/campaign/${campaignSubId}`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = await response.json();

            if (response.ok && data.success) {
                toast.success("Budget deleted successfully!", { theme: "dark" });
                resetBudgetState();
                // Keep filters but clear budget data
            } else {
                toast.error(data.message || "Failed to delete budget", {
                    theme: "dark",
                });
            }
        } catch (error) {
            console.error("Error deleting budget:", error);
            toast.error("Failed to delete budget", { theme: "dark" });
        }
    };

    return (
        <>
            <ToastContainer position="top-right" autoClose={3000} />
            <div className="min-h-screen bg-[#171717] p-6">
                <div className="max-w-7xl mx-auto">
                    <h1 className="text-3xl font-bold text-[#E4002B] mb-8">
                        Set Budget
                    </h1>

                    {loading ? (
                        <div className="bg-[#EDEDED] rounded-lg shadow-md p-6">
                            <p className="text-gray-600">Loading data...</p>
                        </div>
                    ) : (
                        <>
                            {/* Interlinked Filters */}
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

                                    {/* Campaign Filter */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Campaign
                                        </label>
                                        <Select
                                            value={selectedCampaign}
                                            onChange={handleCampaignChange}
                                            options={campaignOptions}
                                            styles={customSelectStyles}
                                            placeholder="Select Campaign"
                                            isClearable
                                            isSearchable
                                        />
                                    </div>

                                    {/* Retailer Filter */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Retailer
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
                                </div>

                                {/* Clear All Button */}
                                {(selectedState ||
                                    selectedCampaign ||
                                    selectedRetailer) && (
                                        <button
                                            onClick={handleClearAllFilters}
                                            className="mt-4 text-sm text-red-600 underline hover:text-red-800"
                                        >
                                            Clear All Filters
                                        </button>
                                    )}
                            </div>

                            {/* Selected Information Display */}
                            {selectedCampaign && (
                                <div className="bg-[#EDEDED] rounded-lg shadow-md p-6 mb-6">
                                    <h2 className="text-lg font-semibold mb-3 text-gray-700">
                                        Selected Campaign Details
                                    </h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                        <p>
                                            <strong>Campaign:</strong>{" "}
                                            {selectedCampaign.data.name}
                                        </p>
                                        <p>
                                            <strong>Client:</strong>{" "}
                                            {selectedCampaign.data.client || "N/A"}
                                        </p>
                                        <p>
                                            <strong>Type:</strong>{" "}
                                            {selectedCampaign.data.type || "N/A"}
                                        </p>
                                        <p>
                                            <strong>Status:</strong>{" "}
                                            <span
                                                className={
                                                    selectedCampaign.data.isActive
                                                        ? "text-green-600 font-semibold"
                                                        : "text-red-600 font-semibold"
                                                }
                                            >
                                                {selectedCampaign.data.isActive
                                                    ? "Active"
                                                    : "Inactive"}
                                            </span>
                                        </p>
                                    </div>
                                </div>
                            )}

                            {selectedRetailer && (
                                <div className="bg-[#EDEDED] rounded-lg shadow-md p-6 mb-6">
                                    <h2 className="text-lg font-semibold mb-3 text-gray-700">
                                        Selected Retailer Details
                                    </h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                        <p>
                                            <strong>Outlet Code:</strong>{" "}
                                            {selectedRetailer.data.uniqueId}
                                        </p>
                                        <p>
                                            <strong>Shop Name:</strong>{" "}
                                            {selectedRetailer.data.shopDetails?.shopName ||
                                                "N/A"}
                                        </p>
                                        <p>
                                            <strong>Business Type:</strong>{" "}
                                            {selectedRetailer.data.shopDetails
                                                ?.businessType || "N/A"}
                                        </p>
                                        <p>
                                            <strong>State:</strong>{" "}
                                            {selectedRetailer.data.shopDetails?.shopAddress
                                                ?.state || "N/A"}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Budget Input Section */}
                            {selectedCampaign && selectedRetailer && (
                                <div className="bg-[#EDEDED] rounded-lg shadow-md p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h2 className="text-lg font-semibold text-gray-700">
                                            {isEditMode ? "Update Budget Amount" : "Set Budget Amount"}
                                        </h2>
                                        {isEditMode && existingBudget && (
                                            <span className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                                                Current: ₹{existingBudget.tca}
                                            </span>
                                        )}
                                    </div>

                                    <div className="max-w-md">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Budget Amount (₹)
                                        </label>
                                        <input
                                            type="number"
                                            value={budgetAmount}
                                            onChange={(e) =>
                                                setBudgetAmount(e.target.value)
                                            }
                                            placeholder="Enter budget amount"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:outline-none"
                                            min="0"
                                            step="0.01"
                                        />
                                    </div>

                                    <div className="mt-6 flex gap-3">
                                        {isEditMode ? (
                                            <>
                                                <button
                                                    onClick={handleUpdateBudget}
                                                    className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
                                                >
                                                    Update Budget
                                                </button>
                                                <button
                                                    onClick={handleDeleteBudget}
                                                    className="px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition"
                                                >
                                                    Delete Budget
                                                </button>
                                            </>
                                        ) : (
                                            <button
                                                onClick={handleSetBudget}
                                                className="px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition"
                                            >
                                                Set Budget
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </>
    );
};

export default SetBudget;

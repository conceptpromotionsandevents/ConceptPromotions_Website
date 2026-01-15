import React, { useState, useEffect } from "react";
import Select from "react-select";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { API_URL } from "../../url/base";
import { FaUpload, FaDownload, FaTimes, FaFileExcel } from "react-icons/fa"; // ✅ ADD THIS
import ExcelJS from "exceljs"; // ✅ ADD THIS

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

    // ✅ BULK UPLOAD STATES (NEW)
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [bulkFile, setBulkFile] = useState(null);
    const [bulkUploading, setBulkUploading] = useState(false);
    const [bulkResult, setBulkResult] = useState(null);

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
            const campaignsRes = await fetch(`${API_URL}/admin/campaigns`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const campaignsData = await campaignsRes.json();
            const campaigns = (campaignsData.campaigns || []).filter(
                (c) => c.isActive === true
            );

            // Fetch Retailers
            const retailersRes = await fetch(`${API_URL}/admin/retailers`, {
                headers: { Authorization: `Bearer ${token}` },
            });
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
                        if (!silent) {
                            toast.info(
                                "Budget already exists. You can update or delete it.",
                                {
                                    theme: "dark",
                                }
                            );
                        }
                    } else {
                        resetBudgetState();
                        if (!silent) {
                            toast.info(
                                "No existing budget found. You can create a new one.",
                                {
                                    theme: "dark",
                                }
                            );
                        }
                    }
                } else {
                    resetBudgetState();
                    if (!silent) {
                        toast.info(
                            "No existing budget found. You can create a new one.",
                            {
                                theme: "dark",
                            }
                        );
                    }
                }
            } else {
                resetBudgetState();
                if (!silent) {
                    toast.info(
                        "No existing budget found. You can create a new one.",
                        {
                            theme: "dark",
                        }
                    );
                }
            }
        } catch (error) {
            console.error("Error checking existing budget:", error);
            resetBudgetState();
            if (!silent) {
                toast.error(
                    "Failed to check existing budget. Please try again.",
                    {
                        theme: "dark",
                    }
                );
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
    // FILTER LOGIC
    // ===============================
    useEffect(() => {
        if (!selectedState && !selectedCampaign && !selectedRetailer) {
            setStateOptions(allStates.map((s) => ({ label: s, value: s })));
            setCampaignOptions(
                allCampaigns.map((c) => ({
                    label: c.name,
                    value: c._id,
                    data: c,
                }))
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

        if (selectedRetailer) {
            const retailerData = allRetailers.find(
                (r) => r._id === selectedRetailer.value
            );

            if (retailerData) {
                const retailerState =
                    retailerData.shopDetails?.shopAddress?.state;

                if (!selectedState && retailerState) {
                    filteredStates = [retailerState];
                }

                const retailerCampaignIds = (
                    retailerData.assignedCampaigns || []
                ).map((ac) => (typeof ac === "string" ? ac : ac._id));

                filteredCampaigns = allCampaigns.filter((c) =>
                    retailerCampaignIds.includes(c._id)
                );
            }
        } else if (selectedState) {
            filteredRetailers = filteredRetailers.filter(
                (r) =>
                    r.shopDetails?.shopAddress?.state === selectedState.value
            );

            filteredCampaigns = filteredCampaigns.filter((c) => {
                if (Array.isArray(c.states)) {
                    return c.states.includes(selectedState.value);
                }
                return c.state === selectedState.value;
            });
        }

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

        if (selected && selected.data) {
            const retailerState =
                selected.data.shopDetails?.shopAddress?.state;
            if (retailerState) {
                const stateOption = stateOptions.find(
                    (s) => s.value === retailerState
                );
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
            toast.error("Please enter a valid budget amount", {
                theme: "dark",
            });
            return;
        }

        try {
            const token = localStorage.getItem("token");
            const payload = {
                retailerId: selectedRetailer.value,
                retailerName:
                    selectedRetailer.data.shopDetails?.shopName || "",
                state:
                    selectedRetailer.data.shopDetails?.shopAddress?.state ||
                    "",
                shopName: selectedRetailer.data.shopDetails?.shopName || "",
                outletCode: selectedRetailer.data.uniqueId,
                campaignId: selectedCampaign.value,
                campaignName: selectedCampaign.data.name,
                tca: parseFloat(budgetAmount),
            };

            const response = await fetch(`${API_URL}/budgets/set-campaign-tca`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                toast.success("Budget set successfully!", { theme: "dark" });
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
            toast.error("Please enter a valid budget amount", {
                theme: "dark",
            });
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
                toast.success("Budget updated successfully!", {
                    theme: "dark",
                });
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
        if (
            !window.confirm("Are you sure you want to delete this budget?")
        ) {
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
                toast.success("Budget deleted successfully!", {
                    theme: "dark",
                });
                resetBudgetState();
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

    // ===============================
    // ✅ BULK UPLOAD FUNCTIONS (NEW)
    // ===============================
    const downloadBulkTemplate = () => {
        const fileName = "Set_Budget_Template.xlsx";
        const publicPath =
            "https://res.cloudinary.com/dltqp0vgg/raw/upload/v1768482373/Set_Budget_Template_biyp3y.xlsx";

        const link = document.createElement("a");
        link.href = publicPath;
        link.download = fileName;
        link.click();

        toast.success("Budget template downloaded", { theme: "dark" });
    };

    const handleBulkFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const fileExtension = file.name.split(".").pop().toLowerCase();
            if (fileExtension !== "xlsx" && fileExtension !== "xls") {
                toast.error(
                    "Please upload only Excel files (.xlsx or .xls)",
                    {
                        theme: "dark",
                    }
                );
                return;
            }
            setBulkFile(file);
            setBulkResult(null);
        }
    };

    const handleBulkUpload = async () => {
        if (!bulkFile) {
            toast.error("Please select an Excel file to upload", {
                theme: "dark",
            });
            return;
        }

        setBulkUploading(true);
        setBulkResult(null);

        try {
            const token = localStorage.getItem("token");
            const formData = new FormData();
            formData.append("file", bulkFile);

            const response = await fetch(
                `${API_URL}/budgets/campaign-tca/bulk`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    body: formData,
                }
            );

            const data = await response.json();

            if (response.ok || response.status === 207) {
                setBulkResult(data);

                if (data.summary?.failed === 0) {
                    toast.success(
                        `All ${data.summary.successful} budgets set successfully!`,
                        { theme: "dark", autoClose: 3000 }
                    );
                } else {
                    toast.warning(
                        `${data.summary.successful} successful, ${data.summary.failed} failed. Check details below.`,
                        { theme: "dark", autoClose: 5000 }
                    );
                }
            } else if (response.status === 400) {
                setBulkResult(data);
                toast.error(
                    data.message ||
                        "Upload failed - All rows failed validation",
                    { theme: "dark" }
                );
            } else {
                toast.error(data.message || "Upload failed", {
                    theme: "dark",
                });
                setBulkResult(data);
            }
        } catch (error) {
            console.error("Bulk upload error:", error);
            toast.error("Network error. Please try again.", {
                theme: "dark",
            });
        } finally {
            setBulkUploading(false);
        }
    };

    const downloadFailedBudgetRows = async () => {
        if (
            !bulkResult ||
            !bulkResult.failedRows ||
            bulkResult.failedRows.length === 0
        ) {
            toast.error("No failed rows to download", { theme: "dark" });
            return;
        }

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Failed Rows");

        worksheet.columns = [
            { header: "Row Number", key: "rowNumber", width: 12 },
            { header: "Reason", key: "reason", width: 50 },
            { header: "Campaign Name", key: "campaignName", width: 30 },
            { header: "Outlet Code", key: "outletCode", width: 20 },
            { header: "Budget", key: "budget", width: 15 },
        ];

        bulkResult.failedRows.forEach((row) => {
            worksheet.addRow({
                rowNumber: row.rowNumber || "-",
                reason: row.reason,
                campaignName: row.data?.campaignName || "-",
                outletCode: row.data?.outletCode || "-",
                budget: row.data?.budget || "-",
            });
        });

        // Style the header row
        worksheet.getRow(1).eachCell((cell) => {
            cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FFFF0000" },
            };
            cell.font = {
                color: { argb: "FFFFFFFF" },
                bold: true,
                size: 12,
            };
            cell.alignment = {
                horizontal: "center",
                vertical: "middle",
            };
        });

        try {
            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], {
                type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = `Failed_Budget_${
                new Date().toISOString().split("T")[0]
            }.xlsx`;
            link.click();
            URL.revokeObjectURL(link.href);
            toast.success("Failed rows downloaded", { theme: "dark" });
        } catch (error) {
            console.error("Error downloading failed rows:", error);
            toast.error("Failed to download file", { theme: "dark" });
        }
    };

    const closeBulkModal = () => {
        setShowBulkModal(false);
        setBulkFile(null);
        setBulkResult(null);
        const fileInput = document.getElementById("bulkBudgetFileUpload");
        if (fileInput) {
            fileInput.value = "";
        }
    };

    // Prevent background scroll when modal is open
    useEffect(() => {
        if (showBulkModal) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [showBulkModal]);

    return (
        <>
            <ToastContainer position="top-right" autoClose={3000} />
            <div className="min-h-screen bg-[#171717] p-6">
                <div className="max-w-7xl mx-auto">
                    {/* ✅ UPDATED HEADER WITH BULK UPLOAD BUTTON */}
                    <div className="flex justify-between items-center mb-8">
                        <h1 className="text-3xl font-bold text-[#E4002B]">
                            Set Budget
                        </h1>
                        <button
                            onClick={() => setShowBulkModal(true)}
                            className="flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition bg-[#E4002B] text-white hover:bg-[#c4001f]"
                        >
                            <FaUpload />
                            Bulk Budget Upload
                        </button>
                    </div>

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
                                            {selectedCampaign.data.client ||
                                                "N/A"}
                                        </p>
                                        <p>
                                            <strong>Type:</strong>{" "}
                                            {selectedCampaign.data.type ||
                                                "N/A"}
                                        </p>
                                        <p>
                                            <strong>Status:</strong>{" "}
                                            <span
                                                className={
                                                    selectedCampaign.data
                                                        .isActive
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
                                            {selectedRetailer.data.shopDetails
                                                ?.shopName || "N/A"}
                                        </p>
                                        <p>
                                            <strong>Business Type:</strong>{" "}
                                            {selectedRetailer.data.shopDetails
                                                ?.businessType || "N/A"}
                                        </p>
                                        <p>
                                            <strong>State:</strong>{" "}
                                            {selectedRetailer.data.shopDetails
                                                ?.shopAddress?.state || "N/A"}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Budget Input Section */}
                            {selectedCampaign && selectedRetailer && (
                                <div className="bg-[#EDEDED] rounded-lg shadow-md p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h2 className="text-lg font-semibold text-gray-700">
                                            {isEditMode
                                                ? "Update Budget Amount"
                                                : "Set Budget Amount"}
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
                                                    onClick={
                                                        handleUpdateBudget
                                                    }
                                                    className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
                                                >
                                                    Update Budget
                                                </button>
                                                <button
                                                    onClick={
                                                        handleDeleteBudget
                                                    }
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

            {/* ✅ BULK UPLOAD MODAL */}
            {showBulkModal && (
                <div className="fixed inset-0 bg-black/10 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full min-h-[50vh] max-h-[90vh] overflow-y-auto">
                        {/* Header */}
                        <div className="sticky top-0 bg-white z-50 border-b border-gray-200 p-6 flex justify-between items-center">
                            <h2 className="text-2xl font-bold text-red-600">
                                Bulk Budget Upload
                            </h2>
                            <button
                                onClick={closeBulkModal}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <FaTimes size={24} />
                            </button>
                        </div>

                        <div className="p-6">
                            {/* Step 1: Download Template */}
                            <div className="mb-6">
                                <h3 className="text-lg font-semibold mb-3 text-gray-700">
                                    Download Budget Template
                                </h3>
                                <div className="mb-3 text-sm text-gray-600">
                                    <p className="font-medium mb-2">
                                        Template columns:
                                    </p>
                                    <p>
                                        <strong>Sno</strong>,{" "}
                                        <strong>campaignName</strong>,{" "}
                                        <strong>outletCode</strong>,{" "}
                                        <strong>Budget</strong>,{" "}
                                        <strong>outletName</strong>,{" "}
                                        <strong>retailerName</strong>,{" "}
                                        <strong>State</strong>
                                        <br />
                                        <span className="text-xs text-red-600 mt-1 block">
                                            Backend validation: campaignName,
                                            outletCode, Budget only
                                        </span>
                                    </p>
                                </div>
                                <button
                                    onClick={downloadBulkTemplate}
                                    className="flex items-center gap-2 bg-[#E4002B] text-white px-6 py-3 rounded-lg hover:bg-[#c4001f] transition"
                                >
                                    <FaDownload />
                                    Download Budget Template
                                </button>
                            </div>

                            {/* Step 2: Upload File */}
                            <div className="mb-6">
                                <h3 className="text-lg font-semibold mb-3 text-gray-700">
                                    Upload Filled Template
                                </h3>
                                <label
                                    htmlFor="bulkBudgetFileUpload"
                                    className="flex flex-col items-center justify-center w-full border-2 border-dashed border-gray-300 rounded-lg p-8 cursor-pointer hover:border-[#E4002B] transition"
                                >
                                    <FaFileExcel className="text-5xl text-green-600 mb-3" />
                                    {!bulkFile ? (
                                        <>
                                            <p className="text-gray-600 mb-2 text-lg">
                                                Click to choose Excel file
                                            </p>
                                            <FaUpload className="text-gray-500 text-2xl" />
                                        </>
                                    ) : (
                                        <p className="text-gray-700 font-medium text-lg">
                                            {bulkFile.name}
                                        </p>
                                    )}
                                    <input
                                        id="bulkBudgetFileUpload"
                                        type="file"
                                        accept=".xlsx, .xls"
                                        onChange={handleBulkFileChange}
                                        className="hidden"
                                    />
                                </label>

                                {bulkFile && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setBulkFile(null);
                                            document.getElementById(
                                                "bulkBudgetFileUpload"
                                            ).value = "";
                                        }}
                                        className="flex items-center gap-2 text-red-500 text-sm hover:underline mt-3"
                                    >
                                        <FaTimes /> Remove File
                                    </button>
                                )}

                                <button
                                    onClick={handleBulkUpload}
                                    disabled={bulkUploading || !bulkFile}
                                    className={`w-full py-3 rounded-lg font-semibold transition mt-4 ${
                                        bulkUploading || !bulkFile
                                            ? "bg-gray-400 cursor-not-allowed text-white"
                                            : "bg-[#E4002B] text-white hover:bg-[#c4001f]"
                                    }`}
                                >
                                    {bulkUploading
                                        ? "Uploading..."
                                        : "Upload & Set Budgets"}
                                </button>
                            </div>

                            {/* Upload Results */}
                            {bulkResult && (
                                <div className="mt-6 bg-gray-50 rounded-lg p-6 border border-gray-200">
                                    <h3 className="text-xl font-bold mb-4 text-gray-800">
                                        Upload Results
                                    </h3>

                                    {/* Summary */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                        <div className="bg-blue-50 p-4 rounded-lg text-center">
                                            <p className="text-sm text-gray-600">
                                                Total Rows
                                            </p>
                                            <p className="text-2xl font-bold text-blue-600">
                                                {bulkResult.summary
                                                    ?.totalRows || 0}
                                            </p>
                                        </div>
                                        <div className="bg-green-50 p-4 rounded-lg text-center">
                                            <p className="text-sm text-gray-600">
                                                Successful
                                            </p>
                                            <p className="text-2xl font-bold text-green-600">
                                                {bulkResult.summary
                                                    ?.successful || 0}
                                            </p>
                                        </div>
                                        <div className="bg-red-50 p-4 rounded-lg text-center">
                                            <p className="text-sm text-gray-600">
                                                Failed
                                            </p>
                                            <p className="text-2xl font-bold text-red-600">
                                                {bulkResult.summary?.failed ||
                                                    0}
                                            </p>
                                        </div>
                                        <div className="bg-purple-50 p-4 rounded-lg text-center">
                                            <p className="text-sm text-gray-600">
                                                Success Rate
                                            </p>
                                            <p className="text-2xl font-bold text-purple-600">
                                                {bulkResult.summary
                                                    ?.successRate || "0%"}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Successful Budgets */}
                                    {bulkResult.successfulRows &&
                                        bulkResult.successfulRows.length >
                                            0 && (
                                            <div className="mb-6">
                                                <h4 className="font-semibold text-green-700 mb-3">
                                                    Successfully Set Budgets (
                                                    {
                                                        bulkResult
                                                            .successfulRows
                                                            .length
                                                    }
                                                    )
                                                </h4>
                                                <div className="max-h-60 overflow-y-auto border border-green-200 rounded-lg">
                                                    <table className="min-w-full divide-y divide-gray-200">
                                                        <thead className="bg-green-50">
                                                            <tr>
                                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">
                                                                    Campaign
                                                                </th>
                                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">
                                                                    Outlet Code
                                                                </th>
                                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">
                                                                    Outlet Name
                                                                </th>
                                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">
                                                                    Budget
                                                                </th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="bg-white divide-y divide-gray-200">
                                                            {bulkResult.successfulRows.map(
                                                                (
                                                                    item,
                                                                    index
                                                                ) => (
                                                                    <tr
                                                                        key={
                                                                            index
                                                                        }
                                                                        className="hover:bg-gray-50"
                                                                    >
                                                                        <td className="px-4 py-2 text-sm">
                                                                            {
                                                                                item.campaignName
                                                                            }
                                                                        </td>
                                                                        <td className="px-4 py-2 text-sm">
                                                                            {
                                                                                item.outletCode
                                                                            }
                                                                        </td>
                                                                        <td className="px-4 py-2 text-sm">
                                                                            {
                                                                                item.outletName
                                                                            }
                                                                        </td>
                                                                        <td className="px-4 py-2 text-sm font-semibold text-green-600">
                                                                            ₹
                                                                            {
                                                                                item.budget
                                                                            }
                                                                        </td>
                                                                    </tr>
                                                                )
                                                            )}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        )}

                                    {/* Failed Rows */}
                                    {bulkResult.failedRows &&
                                        bulkResult.failedRows.length > 0 && (
                                            <div>
                                                <div className="flex items-center justify-between mb-3">
                                                    <h4 className="font-semibold text-red-700">
                                                        Failed Rows (
                                                        {
                                                            bulkResult.failedRows
                                                                .length
                                                        }
                                                        )
                                                    </h4>
                                                    <button
                                                        onClick={
                                                            downloadFailedBudgetRows
                                                        }
                                                        className="flex items-center gap-2 bg-[#E4002B] text-white px-4 py-2 rounded-lg hover:bg-[#c4001f] transition text-sm"
                                                    >
                                                        <FaDownload />
                                                        Download Failed Rows
                                                    </button>
                                                </div>
                                                <div className="max-h-60 overflow-y-auto border border-red-200 rounded-lg">
                                                    <table className="min-w-full divide-y divide-gray-200">
                                                        <thead className="bg-red-50">
                                                            <tr>
                                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">
                                                                    Row #
                                                                </th>
                                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">
                                                                    Reason
                                                                </th>
                                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">
                                                                    Campaign
                                                                </th>
                                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">
                                                                    Outlet Code
                                                                </th>
                                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">
                                                                    Budget
                                                                </th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="bg-white divide-y divide-gray-200">
                                                            {bulkResult.failedRows.map(
                                                                (row, index) => (
                                                                    <tr
                                                                        key={
                                                                            index
                                                                        }
                                                                        className="hover:bg-gray-50"
                                                                    >
                                                                        <td className="px-4 py-2 text-sm font-medium">
                                                                            {
                                                                                row.rowNumber
                                                                            }
                                                                        </td>
                                                                        <td
                                                                            className="px-4 py-2 text-sm text-red-600 max-w-xs"
                                                                            title={
                                                                                row.reason
                                                                            }
                                                                        >
                                                                            {
                                                                                row.reason
                                                                            }
                                                                        </td>
                                                                        <td className="px-4 py-2 text-sm">
                                                                            {row
                                                                                .data
                                                                                ?.campaignName ||
                                                                                "-"}
                                                                        </td>
                                                                        <td className="px-4 py-2 text-sm">
                                                                            {row
                                                                                .data
                                                                                ?.outletCode ||
                                                                                "-"}
                                                                        </td>
                                                                        <td className="px-4 py-2 text-sm">
                                                                            {row
                                                                                .data
                                                                                ?.budget ||
                                                                                "-"}
                                                                        </td>
                                                                    </tr>
                                                                )
                                                            )}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default SetBudget;

import React, { useState, useEffect, useMemo, useRef } from "react";
import Select from "react-select";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import * as XLSX from 'xlsx-js-style';
import axios from "axios";
import { API_URL } from "../../url/base";
import customSelectStyles from "../../components/common/selectStyles";

const EmployeePassbook = () => {
    // Employee Info
    const [employeeInfo, setEmployeeInfo] = useState(null);

    // All Employee-Retailer Mappings
    const [employeeRetailerMappings, setEmployeeRetailerMappings] = useState([]);
    const [budgets, setBudgets] = useState([]);

    // Filters (Multi-select)
    const [selectedRetailers, setSelectedRetailers] = useState([]);
    const [selectedCampaigns, setSelectedCampaigns] = useState([]);
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");

    // Options for dropdowns
    const [retailerOptions, setRetailerOptions] = useState([]);
    const [campaignOptions, setCampaignOptions] = useState([]);

    const [loading, setLoading] = useState(true);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [limit] = useState(2);

    const tableRef = useRef(null);

    // ===============================
    // FETCH EMPLOYEE INFO ON MOUNT
    // ===============================
    useEffect(() => {
        fetchEmployeeInfo();
    }, []);

    const fetchEmployeeInfo = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                toast.error("Please login again", { theme: "dark" });
                return;
            }

            const response = await fetch(`${API_URL}/employee/profile`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!response.ok) {
                throw new Error("Failed to fetch employee info");
            }

            const data = await response.json();
            setEmployeeInfo(data.employee);

            // Fetch employee-retailer mappings with campaigns
            fetchEmployeeRetailerMappings(data.employee._id, token);
        } catch (err) {
            console.error("Error fetching employee info:", err);
            toast.error("Failed to load employee information", { theme: "dark" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (tableRef.current) {
            tableRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, [currentPage]);

    // ===============================
    // FETCH EMPLOYEE-RETAILER MAPPINGS
    // ===============================
    const fetchEmployeeRetailerMappings = async (employeeId, token) => {
        try {
            // Fetch all active campaigns
            const campaignsRes = await axios.get(`${API_URL}/admin/campaigns`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            const activeCampaigns = (campaignsRes.data.campaigns || []).filter(
                (c) => c.isActive === true
            );

            // Fetch all budgets
            const budgetsRes = await fetch(`${API_URL}/budgets`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const budgetsData = await budgetsRes.json();
            setBudgets(budgetsData.budgets || []);

            // For each campaign, fetch employee-retailer mapping
            const allMappings = [];

            for (const campaign of activeCampaigns) {
                try {
                    const mappingRes = await axios.get(
                        `${API_URL}/admin/campaign/${campaign._id}/employee-retailer-mapping`,
                        {
                            headers: { Authorization: `Bearer ${token}` },
                        }
                    );

                    const currentEmployee = mappingRes.data.employees.find(
                        (emp) => emp._id === employeeId || emp.id === employeeId
                    );

                    if (currentEmployee && currentEmployee.retailers) {
                        currentEmployee.retailers.forEach((retailer) => {
                            allMappings.push({
                                campaignId: campaign._id,
                                campaignName: campaign.name,
                                campaignData: campaign,
                                retailerId: retailer._id || retailer.id,
                                retailerData: retailer,
                            });
                        });
                    }
                } catch (err) {
                    console.error(`Error fetching mapping for campaign ${campaign._id}:`, err);
                }
            }

            setEmployeeRetailerMappings(allMappings);

            // Extract unique retailers
            const uniqueRetailers = allMappings.reduce((acc, mapping) => {
                if (!acc.find((r) => r.value === mapping.retailerId)) {
                    acc.push({
                        value: mapping.retailerId,
                        label: `${mapping.retailerData.uniqueId || ""} - ${mapping.retailerData.shopDetails?.shopName || "N/A"}`,
                        data: mapping.retailerData,
                    });
                }
                return acc;
            }, []);

            setRetailerOptions(uniqueRetailers);

            // Extract unique campaigns
            const uniqueCampaigns = allMappings.reduce((acc, mapping) => {
                if (!acc.find((c) => c.value === mapping.campaignId)) {
                    acc.push({
                        value: mapping.campaignId,
                        label: mapping.campaignName,
                        data: mapping.campaignData,
                    });
                }
                return acc;
            }, []);

            setCampaignOptions(uniqueCampaigns);
        } catch (err) {
            console.error("Error fetching employee-retailer mappings:", err);
            toast.error("Failed to load assigned retailers", { theme: "dark" });
        }
    };

    // ===============================
    // HELPER FUNCTIONS
    // ===============================
    const parseDate = (dateStr) => {
        if (!dateStr) return null;

        if (dateStr.includes('/')) {
            const [day, month, year] = dateStr.split('/');
            return new Date(`${year}-${month}-${day}`);
        }

        return new Date(dateStr);
    };

    const formatDateToDDMMYYYY = (dateStr) => {
        if (!dateStr || dateStr === "N/A") return "N/A";

        const date = parseDate(dateStr);
        if (!date || isNaN(date.getTime())) return "N/A";

        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();

        return `${day}/${month}/${year}`;
    };

    const isDateInRange = (dateStr, start, end) => {
        if (!start && !end) return true;

        const date = parseDate(dateStr);
        if (!date || isNaN(date.getTime())) return false;

        const startDateObj = start ? new Date(start) : null;
        const endDateObj = end ? new Date(end) : null;

        date.setHours(0, 0, 0, 0);
        if (startDateObj) startDateObj.setHours(0, 0, 0, 0);
        if (endDateObj) endDateObj.setHours(0, 0, 0, 0);

        if (startDateObj && endDateObj) {
            return date >= startDateObj && date <= endDateObj;
        } else if (startDateObj) {
            return date >= startDateObj;
        } else if (endDateObj) {
            return date <= endDateObj;
        }
        return true;
    };

    // ===============================
    // BUILD TABLE DATA WITH FILTERS
    // ===============================
    const allDisplayData = useMemo(() => {
        const data = [];

        // Get assigned campaign IDs and retailer IDs
        const assignedCampaignIds = employeeRetailerMappings.map(m => m.campaignId);
        const assignedRetailerIds = employeeRetailerMappings.map(m => m.retailerId);

        budgets.forEach((budget) => {
            const retailerId = budget.retailerId?._id || budget.retailerId;
            const outletCode = budget.outletCode || "N/A";
            const shopName = budget.shopName || "N/A";
            const state = budget.state || "N/A";

            // Only show retailers assigned to this employee
            if (!assignedRetailerIds.includes(retailerId)) return;

            // Apply Retailer Filter
            if (selectedRetailers.length > 0) {
                const retailerIds = selectedRetailers.map((r) => r.value);
                if (!retailerIds.includes(retailerId)) return;
            }

            (budget.campaigns || []).forEach((campaignBudget) => {
                const campaignId = campaignBudget.campaignId?._id || campaignBudget.campaignId;
                const campaignName = campaignBudget.campaignName || "N/A";
                const client = campaignBudget.campaignId?.client || "N/A";

                // Only show campaigns assigned to this employee for this retailer
                const isAssigned = employeeRetailerMappings.some(
                    m => m.campaignId === campaignId && m.retailerId === retailerId
                );
                if (!isAssigned) return;

                // Apply Campaign Filter
                if (selectedCampaigns.length > 0) {
                    const campaignIds = selectedCampaigns.map((c) => c.value);
                    if (!campaignIds.includes(campaignId)) return;
                }

                const filteredInstallments = (campaignBudget.installments || []).filter(
                    (inst) => isDateInRange(inst.dateOfInstallment, fromDate, toDate)
                );

                const cPaid = filteredInstallments.reduce((sum, inst) => {
                    return sum + (inst.installmentAmount || 0);
                }, 0);

                const cPending = campaignBudget.tca - cPaid;

                let lastPaymentDate = "N/A";
                if (filteredInstallments.length > 0) {
                    const sortedInstallments = [...filteredInstallments].sort((a, b) => {
                        const dateA = parseDate(a.dateOfInstallment);
                        const dateB = parseDate(b.dateOfInstallment);
                        return dateB - dateA;
                    });
                    lastPaymentDate = sortedInstallments[0].dateOfInstallment;
                }

                if ((fromDate || toDate) && filteredInstallments.length === 0) {
                    return;
                }

                data.push({
                    retailerId,
                    outletCode,
                    shopName,
                    state,
                    client,
                    campaignName,
                    campaignId,
                    tca: campaignBudget.tca || 0,
                    cPaid,
                    cPending,
                    lastPaymentDate,
                    installments: filteredInstallments,
                });
            });
        });

        return data;
    }, [
        budgets,
        employeeRetailerMappings,
        selectedRetailers,
        selectedCampaigns,
        fromDate,
        toDate,
    ]);

    // ===============================
    // PAGINATION LOGIC
    // ===============================
    const totalRecords = allDisplayData.length;
    const totalPages = Math.ceil(totalRecords / limit);

    const displayData = useMemo(() => {
        const startIndex = (currentPage - 1) * limit;
        const endIndex = startIndex + limit;
        return allDisplayData.slice(startIndex, endIndex);
    }, [allDisplayData, currentPage, limit]);

    useEffect(() => {
        setCurrentPage(1);
    }, [selectedRetailers, selectedCampaigns, fromDate, toDate]);

    // ===============================
    // CALCULATE CARD TOTALS
    // ===============================
    const cardTotals = useMemo(() => {
        const totalBudget = allDisplayData.reduce((sum, record) => sum + record.tca, 0);
        const totalSpending = allDisplayData.reduce((sum, record) => sum + record.cPaid, 0);
        const totalPending = allDisplayData.reduce((sum, record) => sum + record.cPending, 0);

        return {
            totalBudget,
            totalSpending,
            totalPending,
        };
    }, [allDisplayData]);

    // ===============================
    // DOWNLOAD PASSBOOK TO EXCEL
    // ===============================
    const handleDownloadPassbook = () => {
        if (allDisplayData.length === 0) {
            toast.error("No data to download", { theme: "dark" });
            return;
        }

        const rows = [];

        // Row 1: Title
        rows.push({
            A: "EMPLOYEE PASSBOOK REPORT",
            B: "", C: "", D: "", E: "", F: "", G: "", H: "", I: "", J: ""
        });

        // Row 2: Empty
        rows.push({});

        // Row 3: EMPLOYEE DETAILS
        rows.push({ A: "EMPLOYEE DETAILS" });

        // Row 4: Employee Info
        rows.push({
            A: "Employee Name:",
            B: employeeInfo?.name || "N/A",
            C: "",
            D: "Employee Code:",
            E: employeeInfo?.employeeId || "N/A"
        });

        // Row 5 & 6: Empty rows
        rows.push({});
        rows.push({});

        // Row 7: SUMMARY label
        rows.push({ A: "SUMMARY" });

        // Row 8: Summary values
        rows.push({
            A: "Total Budget",
            B: `₹${cardTotals.totalBudget.toLocaleString()}`,
            C: "",
            D: "Total Paid",
            E: `₹${cardTotals.totalSpending.toLocaleString()}`,
            F: "",
            G: "Total Balance",
            H: `₹${cardTotals.totalPending.toLocaleString()}`,
            I: "", J: ""
        });

        // Row 9 & 10: Empty rows
        rows.push({});
        rows.push({});

        // Row 11: Header
        rows.push({
            A: "S.No",
            B: "State",
            C: "Outlet Name",
            D: "Outlet Code",
            E: "Campaign Name",
            F: "Client",
            G: "Total Campaign Amount",
            H: "Paid",
            I: "Balance",
            J: "Date",
            K: "UTR Number",
            L: "Remarks"
        });

        // ✅ Data rows with continuous S.No and running balance calculation
        let serialNumber = 1;

        allDisplayData.forEach((record) => {
            const installments = record.installments || [];
            const totalBudget = record.tca;

            if (installments.length === 0) {
                // ✅ No installments - show "-" for empty fields
                rows.push({
                    A: serialNumber++,
                    B: record.state,
                    C: record.shopName,
                    D: record.outletCode,
                    E: record.campaignName,
                    F: record.client,
                    G: totalBudget,
                    H: "-",
                    I: totalBudget,
                    J: "-",
                    K: "-",
                    L: "-"
                });
            } else {
                // ✅ Has installments - Calculate running balance
                let cumulativePaid = 0;

                // Sort installments by date (oldest first) for proper balance calculation
                const sortedInstallments = [...installments].sort((a, b) => {
                    const dateA = parseDate(a.dateOfInstallment);
                    const dateB = parseDate(b.dateOfInstallment);
                    return dateA - dateB; // Ascending order
                });

                sortedInstallments.forEach((inst) => {
                    const paidAmount = inst.installmentAmount || 0;
                    cumulativePaid += paidAmount;
                    const balance = totalBudget - cumulativePaid;

                    rows.push({
                        A: serialNumber++,
                        B: record.state,
                        C: record.shopName,
                        D: record.outletCode,
                        E: record.campaignName,
                        F: record.client,
                        G: totalBudget,
                        H: paidAmount,
                        I: balance,
                        J: formatDateToDDMMYYYY(inst.dateOfInstallment),
                        K: inst.utrNumber || "-",
                        L: inst.remarks || "-"
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
                    } else if (R === 10) {
                        ws[cellAddress].s = headerStyle;
                    } else {
                        ws[cellAddress].s = dataStyle;
                    }
                }
            }
        }

        // Merge cells for title (Row 1, A1:L1)
        if (!ws['!merges']) ws['!merges'] = [];
        ws['!merges'].push({
            s: { r: 0, c: 0 },
            e: { r: 0, c: 11 }
        });

        // Column widths
        ws["!cols"] = [
            { wpx: 60 },   // A: S.No
            { wpx: 120 },  // B: State
            { wpx: 180 },  // C: Outlet Name
            { wpx: 120 },  // D: Outlet Code
            { wpx: 180 },  // E: Campaign Name
            { wpx: 150 },  // F: Client
            { wpx: 160 },  // G: Total Campaign Amount
            { wpx: 120 },  // H: Paid
            { wpx: 120 },  // I: Balance
            { wpx: 100 },  // J: Date
            { wpx: 120 },  // K: UTR Number
            { wpx: 120 }   // L: Remarks
        ];

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Passbook");

        const fileName = `Employee_Passbook_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(wb, fileName);

        toast.success("Passbook downloaded successfully!", { theme: "dark" });
    };

    // ===============================
    // PAGINATION FUNCTIONS
    // ===============================
    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    const getPageNumbers = () => {
        const pageNumbers = [];
        const maxPagesToShow = 5;

        if (totalPages <= maxPagesToShow) {
            for (let i = 1; i <= totalPages; i++) {
                pageNumbers.push(i);
            }
        } else {
            if (currentPage <= 3) {
                for (let i = 1; i <= 4; i++) {
                    pageNumbers.push(i);
                }
                pageNumbers.push("...");
                pageNumbers.push(totalPages);
            } else if (currentPage >= totalPages - 2) {
                pageNumbers.push(1);
                pageNumbers.push("...");
                for (let i = totalPages - 3; i <= totalPages; i++) {
                    pageNumbers.push(i);
                }
            } else {
                pageNumbers.push(1);
                pageNumbers.push("...");
                pageNumbers.push(currentPage - 1);
                pageNumbers.push(currentPage);
                pageNumbers.push(currentPage + 1);
                pageNumbers.push("...");
                pageNumbers.push(totalPages);
            }
        }

        return pageNumbers;
    };

    // ===============================
    // HANDLE FILTER CHANGES
    // ===============================
    const handleRetailerChange = (selected) => {
        setSelectedRetailers(selected || []);
    };

    const handleCampaignChange = (selected) => {
        setSelectedCampaigns(selected || []);
    };

    const handleClearAllFilters = () => {
        setSelectedRetailers([]);
        setSelectedCampaigns([]);
        setFromDate("");
        setToDate("");
    };

    return (
        <>
            <ToastContainer position="top-right" autoClose={1000} />
            <div className="min-h-screen bg-[#171717] p-6">
                <div className="max-w-7xl mx-auto">
                    <div className="flex justify-between items-center mb-8">
                        <h1 className="text-3xl font-bold text-[#E4002B]">
                            Passbook
                        </h1>

                        {/* ✅ Download Button */}
                        {allDisplayData.length > 0 && (
                            <button
                                onClick={handleDownloadPassbook}
                                className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition flex items-center gap-2 cursor-pointer"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Download Passbook
                            </button>
                        )}
                    </div>

                    {loading ? (
                        <div className="bg-[#EDEDED] rounded-lg shadow-md p-6">
                            <p className="text-gray-600">Loading data...</p>
                        </div>
                    ) : (
                        <>
                            {/* Employee Info */}
                            {employeeInfo && (
                                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                    <p className="text-sm text-gray-600">Employee Details:</p>
                                    <p className="text-lg font-semibold text-gray-800">
                                        {employeeInfo.name} ({employeeInfo.employeeId})
                                    </p>
                                </div>
                            )}
                            {/* Filters */}
                            <div className="bg-[#EDEDED] rounded-lg shadow-md p-6 mb-6">
                                <h2 className="text-lg font-semibold mb-4 text-gray-700">
                                    Filter Options <span className="text-red-500">(Optional)</span>
                                </h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Retailer Filter (Multi-select) */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Retailers
                                        </label>
                                        <Select
                                            isMulti
                                            value={selectedRetailers}
                                            onChange={handleRetailerChange}
                                            options={retailerOptions}
                                            styles={customSelectStyles}
                                            placeholder="All Retailers"
                                            isSearchable
                                            isClearable
                                        />
                                    </div>

                                    {/* Campaign Filter (Multi-select) */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Campaigns
                                        </label>
                                        <Select
                                            isMulti
                                            value={selectedCampaigns}
                                            onChange={handleCampaignChange}
                                            options={campaignOptions}
                                            styles={customSelectStyles}
                                            placeholder="All Campaigns"
                                            isSearchable
                                            isClearable
                                        />
                                    </div>

                                    {/* From Date */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            From Date
                                        </label>
                                        <input
                                            type="date"
                                            value={fromDate}
                                            onChange={(e) => setFromDate(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#E4002B] focus:border-transparent bg-white"
                                        />
                                    </div>

                                    {/* To Date */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            To Date
                                        </label>
                                        <input
                                            type="date"
                                            value={toDate}
                                            onChange={(e) => setToDate(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#E4002B] focus:border-transparent bg-white"
                                        />
                                    </div>
                                </div>

                                {(selectedRetailers.length > 0 ||
                                    selectedCampaigns.length > 0 ||
                                    fromDate ||
                                    toDate) && (
                                        <button
                                            onClick={handleClearAllFilters}
                                            className="mt-4 text-sm text-red-600 underline hover:text-red-800"
                                        >
                                            Clear All Filters
                                        </button>
                                    )}
                            </div>

                            {/* Summary Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                                {/* Total Budget Card */}
                                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
                                    <p className="text-sm font-medium opacity-90">Total Budget</p>
                                    <h3 className="text-3xl font-bold mt-2">
                                        ₹{cardTotals.totalBudget.toLocaleString()}
                                    </h3>
                                </div>

                                {/* Total Paid Amount Card */}
                                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
                                    <p className="text-sm font-medium opacity-90">Total Paid</p>
                                    <h3 className="text-3xl font-bold mt-2">
                                        ₹{cardTotals.totalSpending.toLocaleString()}
                                    </h3>
                                </div>

                                {/* Total Pending Amount Card */}
                                <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg shadow-lg p-6 text-white">
                                    <p className="text-sm font-medium opacity-90">Total Balance</p>
                                    <h3 className="text-3xl font-bold mt-2">
                                        ₹{cardTotals.totalPending.toLocaleString()}
                                    </h3>
                                </div>
                            </div>

                            {/* Passbook Table */}
                            <div ref={tableRef} className="bg-[#EDEDED] rounded-lg shadow-md p-6">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
                                    <h2 className="text-lg font-semibold text-gray-700">
                                        Passbook Records ({totalRecords})
                                    </h2>
                                    {totalRecords > 0 && (
                                        <div className="text-sm text-gray-600">
                                            Showing {(currentPage - 1) * limit + 1} to{" "}
                                            {Math.min(currentPage * limit, totalRecords)} of{" "}
                                            {totalRecords} records
                                        </div>
                                    )}
                                </div>

                                {displayData.length > 0 ? (
                                    <>
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full divide-y divide-gray-200">
                                                <thead className="bg-gray-100">
                                                    <tr>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                                                            S.No
                                                        </th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                                                            State
                                                        </th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                                                            Outlet Details
                                                        </th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                                                            Campaign Name
                                                        </th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                                                            Client
                                                        </th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                                                            Total Campaign Amount
                                                        </th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                                                            Paid
                                                        </th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                                                            Balance
                                                        </th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                                                            Last Payment Date
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-gray-200">
                                                    {displayData.map((record, index) => (
                                                        <tr key={index} className="hover:bg-gray-50 transition-colors">
                                                            <td className="px-4 py-3 text-sm text-gray-700">
                                                                {(currentPage - 1) * limit + index + 1}
                                                            </td>
                                                            <td className="px-4 py-3 text-sm text-gray-600">
                                                                {record.state}
                                                            </td>
                                                            <td className="px-4 py-3 text-sm">
                                                                <div className="flex flex-col">
                                                                    <span className="font-medium text-gray-700">
                                                                        {record.shopName}
                                                                    </span>
                                                                    <span className="text-xs text-gray-500 font-mono mt-1">
                                                                        {record.outletCode}
                                                                    </span>
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-3 text-sm text-gray-600">
                                                                {record.campaignName}
                                                            </td>
                                                            <td className="px-4 py-3 text-sm text-gray-600">
                                                                {record.client}
                                                            </td>
                                                            <td className="px-4 py-3 text-sm font-semibold text-blue-600">
                                                                ₹{record.tca.toLocaleString()}
                                                            </td>
                                                            <td className="px-4 py-3 text-sm font-semibold text-green-600">
                                                                ₹{record.cPaid.toLocaleString()}
                                                            </td>
                                                            <td className="px-4 py-3 text-sm font-semibold text-yellow-600">
                                                                ₹{record.cPending.toLocaleString()}
                                                            </td>
                                                            <td className="px-4 py-3 text-sm text-gray-700">
                                                                {formatDateToDDMMYYYY(record.lastPaymentDate)}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* Pagination */}
                                        {totalPages > 1 && (
                                            <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4">
                                                <div className="text-sm text-gray-600">
                                                    Page {currentPage} of {totalPages}
                                                </div>

                                                <div className="flex items-center gap-2 flex-wrap justify-center">
                                                    <button
                                                        onClick={() => handlePageChange(1)}
                                                        disabled={currentPage === 1}
                                                        className="px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm cursor-pointer"
                                                    >
                                                        First
                                                    </button>

                                                    <button
                                                        onClick={() => handlePageChange(currentPage - 1)}
                                                        disabled={currentPage === 1}
                                                        className="px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm cursor-pointer"
                                                    >
                                                        Previous
                                                    </button>

                                                    <div className="flex gap-1">
                                                        {getPageNumbers().map((pageNum, idx) =>
                                                            pageNum === "..." ? (
                                                                <span
                                                                    key={`ellipsis-${idx}`}
                                                                    className="px-3 py-2 text-gray-500"
                                                                >
                                                                    ...
                                                                </span>
                                                            ) : (
                                                                <button
                                                                    key={pageNum}
                                                                    onClick={() => handlePageChange(pageNum)}
                                                                    className={`px-3 py-2 rounded text-sm cursor-pointer ${currentPage === pageNum
                                                                        ? "bg-[#E4002B] text-white"
                                                                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                                                                        }`}
                                                                >
                                                                    {pageNum}
                                                                </button>
                                                            )
                                                        )}
                                                    </div>

                                                    <button
                                                        onClick={() => handlePageChange(currentPage + 1)}
                                                        disabled={currentPage === totalPages}
                                                        className="px-3 py-2 bg-[#E4002B] text-white rounded hover:bg-[#C3002B] disabled:opacity-50 disabled:cursor-not-allowed text-sm cursor-pointer"
                                                    >
                                                        Next
                                                    </button>

                                                    <button
                                                        onClick={() => handlePageChange(totalPages)}
                                                        disabled={currentPage === totalPages}
                                                        className="px-3 py-2 bg-[#E4002B] text-white rounded hover:bg-[#C3002B] disabled:opacity-50 disabled:cursor-not-allowed text-sm cursor-pointer"
                                                    >
                                                        Last
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <p className="text-gray-500 py-4 text-center">
                                        No records found for the selected filters.
                                    </p>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </>
    );
};

export default EmployeePassbook;

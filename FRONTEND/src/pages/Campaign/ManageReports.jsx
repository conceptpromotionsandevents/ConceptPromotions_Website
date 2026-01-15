import React, { useState, useEffect } from "react";
import Select from "react-select";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import SubmitReportModal from "./SubmitReportModal";
import ReportDetailsModal from "./ReportDetailsModal";
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

const ManageReports = () => {
    // Campaign Selection
    const [campaigns, setCampaigns] = useState([]);
    const [selectedCampaign, setSelectedCampaign] = useState(null);
    const [loadingCampaigns, setLoadingCampaigns] = useState(true);

    // Retailer Selection for filtering
    const [selectedRetailer, setSelectedRetailer] = useState(null);
    const [availableRetailers, setAvailableRetailers] = useState([]);

    // Employee Selection for filtering
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [availableEmployees, setAvailableEmployees] = useState([]);

    // Report Type Filter
    const [selectedReportType, setSelectedReportType] = useState(null);
    const reportTypeOptions = [
        { value: "Window Display", label: "Window Display" },
        { value: "Stock", label: "Stock" },
        { value: "Others", label: "Others" },
    ];

    // Date Range Filter
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");

    // State Filter
    const [selectedState, setSelectedState] = useState(null);
    const [availableStates, setAvailableStates] = useState([]);

    // Data
    const [displayReports, setDisplayReports] = useState([]);
    const [loading, setLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalReports, setTotalReports] = useState(0);

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [retailers, setRetailers] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [modalLoading, setModalLoading] = useState(false);

    // Report Details Modal
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedReport, setSelectedReport] = useState(null);

    // ✅ Fetch Campaigns
    useEffect(() => {
        fetchCampaigns();
    }, []);

    const fetchCampaigns = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(
                `${API_URL}/admin/campaigns`,
                {
                    method: "GET",
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            const data = await res.json();

            if (!res.ok) {
                toast.error(data.message || "Error fetching campaigns", {
                    theme: "dark",
                });
                return;
            }

            const activeCampaigns = (data.campaigns || []).filter(
                (c) => c.isActive === true
            );

            const campaignOptions = activeCampaigns.map((c) => ({
                value: c._id,
                label: c.name,
                data: c,
            }));

            setCampaigns(campaignOptions);
        } catch (err) {
            console.log("Campaign Fetch Error:", err);
            toast.error("Failed to load campaigns", { theme: "dark" });
        } finally {
            setLoadingCampaigns(false);
        }
    };

    const fetchRetailersAndEmployees = async (campaignId) => {
        setModalLoading(true);
        try {
            const token = localStorage.getItem("token");
            const campaignRes = await fetch(
                `${API_URL}/admin/campaigns/${campaignId}`,
                {
                    method: "GET",
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            const campaignData = await campaignRes.json();

            if (!campaignRes.ok) {
                toast.error("Failed to load campaign details", { theme: "dark" });
                return;
            }

            const campaign = campaignData.campaign || campaignData;

            const assignedRetailerIds = (campaign.assignedRetailers || []).map(
                (ar) => (typeof ar === "string" ? ar : ar.retailerId?._id || ar.retailerId)
            );

            if (assignedRetailerIds.length === 0) {
                toast.info("No retailers assigned to this campaign", { theme: "dark" });
                setRetailers([]);
                setEmployees([]);
                setAvailableRetailers([]);
                setAvailableEmployees([]);
                setAvailableStates([]);
                setModalLoading(false);
                return;
            }

            const retailersRes = await fetch(
                `${API_URL}/admin/retailers`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            const retailersData = await retailersRes.json();
            const allRetailers = retailersData.retailers || [];

            const campaignRetailers = allRetailers.filter((r) =>
                assignedRetailerIds.includes(r._id)
            );

            const stateSet = new Set();
            campaignRetailers.forEach((retailer) => {
                const state = retailer.shopDetails?.shopAddress?.state;
                if (state) {
                    stateSet.add(state);
                }
            });

            const formattedRetailers = campaignRetailers.map((r) => {
                const outletName = r.shopDetails?.shopName || "N/A";
                const outletCode = r.uniqueId || "N/A";
                const retailerName = r.name || "N/A";
                const label = `${outletName} • ${outletCode} • ${retailerName}`;

                return {
                    value: r._id,
                    label: label,
                    data: r,
                };
            });

            const assignedEmployeeIds = (campaign.assignedEmployees || []).map(
                (ae) => (typeof ae === "string" ? ae : ae.employeeId?._id || ae.employeeId)
            );

            if (assignedEmployeeIds.length > 0) {
                const employeesRes = await fetch(
                    `${API_URL}/admin/employees`,
                    {
                        headers: { Authorization: `Bearer ${token}` },
                    }
                );
                const employeesData = await employeesRes.json();
                const allEmployees = employeesData.employees || [];

                const campaignEmployees = allEmployees.filter((e) =>
                    assignedEmployeeIds.includes(e._id)
                );

                const formattedEmployees = campaignEmployees.map((e) => {
                    const employeeName = e.name || "N/A";
                    const employeeCode = e.employeeId || "N/A";
                    const label = `${employeeName} • ${employeeCode}`;

                    return {
                        value: e._id,
                        label: label,
                        data: e,
                    };
                });

                setEmployees(formattedEmployees);
                setAvailableEmployees(formattedEmployees);
            } else {
                setEmployees([]);
                setAvailableEmployees([]);
            }

            const formattedStates = Array.from(stateSet).map((state) => ({
                value: state,
                label: state,
            }));

            setRetailers(formattedRetailers);
            setAvailableRetailers(formattedRetailers);
            setAvailableStates(formattedStates);

            if (formattedRetailers.length === 0) {
                toast.info("No retailers found for this campaign", { theme: "dark" });
            }
        } catch (err) {
            console.error("Error fetching retailers/employees:", err);
            toast.error("Failed to load retailers and employees", {
                theme: "dark",
            });
        } finally {
            setModalLoading(false);
        }
    };

    const fetchReports = async (page = 1) => {
        if (!selectedCampaign) {
            toast.error("Please select a campaign first", { theme: "dark" });
            return;
        }

        setLoading(true);
        setHasSearched(true);

        try {
            const token = localStorage.getItem("token");

            const params = new URLSearchParams();
            params.append("campaignId", selectedCampaign.value);
            params.append("page", page);
            params.append("limit", 3);

            if (selectedReportType) {
                params.append("reportType", selectedReportType.value);
            }
            if (selectedRetailer) {
                params.append("retailerId", selectedRetailer.value);
            }
            if (selectedEmployee) {
                params.append("employeeId", selectedEmployee.value);
            }
            if (fromDate) {
                params.append("startDate", fromDate);
            }
            if (toDate) {
                params.append("endDate", toDate);
            }

            const res = await fetch(
                `${API_URL}/reports/all?${params.toString()}`,
                {
                    method: "GET",
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            const data = await res.json();

            if (!res.ok) {
                toast.error(data.message || "Error fetching reports", {
                    theme: "dark",
                });
                setDisplayReports([]);
                return;
            }

            let reports = data.reports || [];

            if (selectedState) {
                reports = reports.filter(
                    (report) =>
                        report.retailer?.retailerId?.shopDetails?.shopAddress
                            ?.state === selectedState.value
                );
            }

            setDisplayReports(reports);
            setTotalReports(data.pagination?.total || 0);
            setCurrentPage(data.pagination?.page || 1);
            setTotalPages(data.pagination?.pages || 1);

            if (reports.length === 0) {
                toast.info("No reports found for the selected filters", {
                    theme: "dark",
                });
            } else {
                toast.success(`Found ${data.pagination?.total || reports.length} report(s)`, {
                    theme: "dark",
                });
            }
        } catch (err) {
            console.log("Reports Fetch Error:", err);
            toast.error("Failed to load reports", { theme: "dark" });
            setDisplayReports([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitReport = async (formData) => {
        try {
            const token = localStorage.getItem("token");

            const res = await fetch(
                `${API_URL}/reports/create`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    body: formData,
                }
            );

            const data = await res.json();

            if (res.ok) {
                toast.success("Report submitted successfully", {
                    theme: "dark",
                });
                setShowModal(false);
                if (hasSearched) {
                    fetchReports(currentPage);
                }
            } else {
                toast.error(data.message || "Failed to submit report", {
                    theme: "dark",
                });
            }
        } catch (err) {
            console.error("Submit report error:", err);
            toast.error("Failed to submit report", { theme: "dark" });
        }
    };

    const handleCampaignChange = (selected) => {
        setSelectedCampaign(selected);
        setSelectedRetailer(null);
        setSelectedEmployee(null);
        setSelectedState(null);
        setSelectedReportType(null);
        setFromDate("");
        setToDate("");
        setDisplayReports([]);
        setHasSearched(false);
        setAvailableRetailers([]);
        setAvailableEmployees([]);
        setAvailableStates([]);
        setCurrentPage(1);

        if (selected) {
            fetchRetailersAndEmployees(selected.value);
        }
    };

    const handleClearFilters = () => {
        setSelectedRetailer(null);
        setSelectedEmployee(null);
        setSelectedState(null);
        setSelectedReportType(null);
        setFromDate("");
        setToDate("");
        setDisplayReports([]);
        setHasSearched(false);
        setCurrentPage(1);
    };

    const formatValue = (value) => {
        if (Array.isArray(value)) {
            return value.join(", ");
        }
        return value || "N/A";
    };

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        const date = new Date(dateString);
        return date.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    const handleViewDetails = async (report) => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(
                `${API_URL}/reports/${report._id}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            const data = await res.json();

            console.log("Fetched report details:", data);

            if (res.ok) {
                setSelectedReport(data.report);
                setShowDetailsModal(true);
            } else {
                toast.error("Failed to load report details", { theme: "dark" });
            }
        } catch (err) {
            console.error("Error fetching report details:", err);
            toast.error("Failed to load report details", { theme: "dark" });
        }
    };

    const handleUpdateReport = async (reportId, formData) => {
        try {
            const token = localStorage.getItem("token");

            console.log("Updating report:", reportId);

            const res = await fetch(
                `${API_URL}/reports/update/${reportId}`,
                {
                    method: "PUT",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    body: formData,
                }
            );

            const data = await res.json();

            if (res.ok) {
                console.log("✅ Update response:", data);

                toast.success("Report updated successfully!", { theme: "dark" });

                setShowDetailsModal(false);
                setSelectedReport(null);

                if (hasSearched) {
                    await fetchReports(currentPage);
                }
            } else {
                console.error("❌ Update failed:", data);
                toast.error(data.message || "Failed to update report", {
                    theme: "dark",
                });
            }
        } catch (err) {
            console.error("❌ Update report error:", err);
            toast.error("Failed to update report", { theme: "dark" });
        }
    };

    const handleDeleteReport = async (reportId) => {
        if (!window.confirm("Are you sure you want to delete this report?")) {
            return;
        }

        try {
            const token = localStorage.getItem("token");

            const res = await fetch(
                `${API_URL}/reports/delete/${reportId}`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = await res.json();

            if (res.ok) {
                toast.success("Report deleted successfully", { theme: "dark" });
                setShowDetailsModal(false);
                if (hasSearched) {
                    fetchReports(currentPage);
                }
            } else {
                toast.error(data.message || "Failed to delete report", {
                    theme: "dark",
                });
            }
        } catch (err) {
            console.error("Delete report error:", err);
            toast.error("Failed to delete report", { theme: "dark" });
        }
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
            fetchReports(newPage);
        }
    };

    return (
        <>
            <ToastContainer position="top-right" autoClose={3000} />
            <div className="min-h-screen bg-[#171717] p-6">
                <div className="max-w-7xl mx-auto">
                    <h1 className="text-3xl font-bold text-[#E4002B] mb-8">
                        Manage Reports
                    </h1>

                    {/* Select Campaign */}
                    <div className="bg-[#EDEDED] rounded-lg shadow-md p-6 mb-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold text-gray-700">
                                Select Campaign *
                            </h2>
                            {selectedCampaign && (
                                <button
                                    onClick={() => {
                                        setShowModal(true);
                                        if (retailers.length === 0) {
                                            fetchRetailersAndEmployees(
                                                selectedCampaign.value
                                            );
                                        }
                                    }}
                                    className="bg-[#E4002B] text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-[#C3002B] transition flex items-center gap-2 cursor-pointer"
                                >
                                    <span>+</span> Add Report
                                </button>
                            )}
                        </div>
                        <Select
                            value={selectedCampaign}
                            onChange={handleCampaignChange}
                            options={campaigns}
                            isLoading={loadingCampaigns}
                            styles={customSelectStyles}
                            placeholder="Choose a campaign"
                            isSearchable
                            className="max-w-md"
                        />
                        {selectedCampaign && (
                            <div className="mt-4 p-4 bg-gray-50 rounded-lg text-sm">
                                <p>
                                    <strong>Client:</strong>{" "}
                                    {selectedCampaign.data.client}
                                </p>
                                <p>
                                    <strong>Type:</strong>{" "}
                                    {selectedCampaign.data.type}
                                </p>
                                <p>
                                    <strong>Region(s):</strong>{" "}
                                    {formatValue(selectedCampaign.data.regions)}
                                </p>
                                <p>
                                    <strong>State(s):</strong>{" "}
                                    {formatValue(selectedCampaign.data.states)}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Filters */}
                    {selectedCampaign && (
                        <div className="bg-[#EDEDED] rounded-lg shadow-md p-6 mb-6">
                            <h2 className="text-lg font-semibold mb-4 text-gray-700">
                                Filter Reports
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Report Type (Optional)
                                    </label>
                                    <Select
                                        value={selectedReportType}
                                        onChange={setSelectedReportType}
                                        options={reportTypeOptions}
                                        styles={customSelectStyles}
                                        placeholder="Select report type"
                                        isSearchable
                                        isClearable
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        State (Optional)
                                    </label>
                                    <Select
                                        value={selectedState}
                                        onChange={setSelectedState}
                                        options={availableStates}
                                        styles={customSelectStyles}
                                        placeholder="Select state"
                                        isSearchable
                                        isClearable
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Retailer (Optional)
                                    </label>
                                    <Select
                                        value={selectedRetailer}
                                        onChange={setSelectedRetailer}
                                        options={availableRetailers}
                                        styles={customSelectStyles}
                                        placeholder="Select retailer"
                                        isSearchable
                                        isClearable
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Employee (Optional)
                                    </label>
                                    <Select
                                        value={selectedEmployee}
                                        onChange={setSelectedEmployee}
                                        options={availableEmployees}
                                        styles={customSelectStyles}
                                        placeholder="Select employee"
                                        isSearchable
                                        isClearable
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        From Date (Optional)
                                    </label>
                                    <input
                                        type="date"
                                        value={fromDate}
                                        onChange={(e) =>
                                            setFromDate(e.target.value)
                                        }
                                        className="w-full px-4 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-red-600 focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        To Date (Optional)
                                    </label>
                                    <input
                                        type="date"
                                        value={toDate}
                                        onChange={(e) => setToDate(e.target.value)}
                                        className="w-full px-4 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-red-600 focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => fetchReports(1)}
                                    disabled={loading}
                                    className="bg-[#E4002B] text-white px-6 py-2 rounded-md text-sm font-medium hover:bg-[#C3002B] transition disabled:bg-gray-400 cursor-pointer"
                                >
                                    {loading ? "Searching..." : "Search Reports"}
                                </button>

                                {(selectedRetailer ||
                                    selectedEmployee ||
                                    selectedState ||
                                    selectedReportType ||
                                    fromDate ||
                                    toDate) && (
                                        <button
                                            onClick={handleClearFilters}
                                            className="text-sm text-red-600 underline hover:text-red-800"
                                        >
                                            Clear Filters
                                        </button>
                                    )}
                            </div>
                        </div>
                    )}

                    {/* Display Table */}
                    {!loading && hasSearched && displayReports.length > 0 && (
                        <div className="bg-[#EDEDED] rounded-lg shadow-md p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-lg font-semibold text-gray-700">
                                    Reports ({totalReports} found)
                                </h2>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                                    <thead className="bg-gray-100">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b">
                                                Report Type
                                            </th>
                                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b">
                                                Retailer
                                            </th>
                                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b">
                                                Outlet
                                            </th>
                                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b">
                                                Employee
                                            </th>
                                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b">
                                                Submitted By
                                            </th>
                                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b">
                                                Date
                                            </th>
                                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {displayReports.map((report, index) => (
                                            <tr
                                                key={report._id}
                                                className={`${index % 2 === 0
                                                    ? "bg-white"
                                                    : "bg-gray-50"
                                                    } hover:bg-gray-100 transition`}
                                            >
                                                <td className="px-4 py-3 text-sm text-gray-800 border-b">
                                                    <span className="font-medium">
                                                        {report.reportType || "N/A"}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-800 border-b">
                                                    <div>
                                                        {report.retailer?.retailerName ||
                                                            "N/A"}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {report.retailer?.outletCode ||
                                                            "N/A"}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-800 border-b">
                                                    {report.retailer?.outletName ||
                                                        "N/A"}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-800 border-b">
                                                    {report.employee?.employeeName ? (
                                                        <>
                                                            <div>
                                                                {report.employee
                                                                    ?.employeeName}
                                                            </div>
                                                            <div className="text-xs text-gray-500">
                                                                {report.employee
                                                                    ?.employeeCode ||
                                                                    ""}
                                                            </div>
                                                        </>
                                                    ) : (
                                                        "N/A"
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-800 border-b">
                                                    <span
                                                        className={`px-2 py-1 rounded text-xs font-medium ${report.submittedBy
                                                            ?.role === "Admin"
                                                            ? "bg-purple-100 text-purple-700"
                                                            : report.submittedBy
                                                                ?.role ===
                                                                "Employee"
                                                                ? "bg-blue-100 text-blue-700"
                                                                : "bg-green-100 text-green-700"
                                                            }`}
                                                    >
                                                        {report.submittedBy?.role ||
                                                            "N/A"}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-800 border-b">
                                                    {formatDate(
                                                        report.dateOfSubmission ||
                                                        report.createdAt
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-800 border-b">
                                                    <button
                                                        onClick={() =>
                                                            handleViewDetails(report)
                                                        }
                                                        className="text-[#E4002B] hover:underline font-medium cursor-pointer"
                                                    >
                                                        View Details
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* ✅ Pagination */}
                            {totalPages > 1 && (
                                <div className="flex justify-between items-center mt-6">
                                    <div className="text-sm text-gray-600">
                                        Page {currentPage} of {totalPages} • Total: {totalReports} reports
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() =>
                                                handlePageChange(currentPage - 1)
                                            }
                                            disabled={currentPage === 1}
                                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Previous
                                        </button>

                                        {/* Page Numbers */}
                                        <div className="flex gap-1">
                                            {[...Array(Math.min(5, totalPages))].map((_, i) => {
                                                let pageNum;
                                                if (totalPages <= 5) {
                                                    pageNum = i + 1;
                                                } else if (currentPage <= 3) {
                                                    pageNum = i + 1;
                                                } else if (currentPage >= totalPages - 2) {
                                                    pageNum = totalPages - 4 + i;
                                                } else {
                                                    pageNum = currentPage - 2 + i;
                                                }

                                                return (
                                                    <button
                                                        key={i}
                                                        onClick={() => handlePageChange(pageNum)}
                                                        className={`px-3 py-2 rounded ${currentPage === pageNum
                                                            ? "bg-[#E4002B] text-white"
                                                            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                                                            }`}
                                                    >
                                                        {pageNum}
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        <button
                                            onClick={() =>
                                                handlePageChange(currentPage + 1)
                                            }
                                            disabled={currentPage === totalPages}
                                            className="px-4 py-2 bg-[#E4002B] text-white rounded hover:bg-[#C3002B] disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {!loading && hasSearched && displayReports.length === 0 && (
                        <div className="bg-[#EDEDED] rounded-lg shadow-md p-12 text-center">
                            <p className="text-gray-600 text-lg">
                                No reports found for the selected filters
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Modals */}
            {showModal && (
                <SubmitReportModal
                    onClose={() => setShowModal(false)}
                    campaignId={selectedCampaign?.value}
                    retailers={retailers}
                    employees={employees}
                    onSubmit={handleSubmitReport}
                />
            )}

            {showDetailsModal && selectedReport && (
                <ReportDetailsModal
                    report={selectedReport}
                    onClose={() => {
                        setShowDetailsModal(false);
                        setSelectedReport(null);
                    }}
                    onUpdate={handleUpdateReport}
                    onDelete={handleDeleteReport}
                />
            )}

        </>
    );
};

export default ManageReports;

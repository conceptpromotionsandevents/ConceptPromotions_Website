import React, { useState, useEffect, useMemo } from "react";
import Select from "react-select";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
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

const DetailedReport = () => {
    const token = localStorage.getItem("client_token");

    // Campaign Data
    const [allCampaigns, setAllCampaigns] = useState([]);
    const [loadingCampaigns, setLoadingCampaigns] = useState(true);

    // Campaign Status Filter
    const [selectedStatus, setSelectedStatus] = useState({
        value: "active",
        label: "Active",
    });

    const statusOptions = [
        { value: "active", label: "Active" },
        { value: "inactive", label: "Inactive" },
        { value: "all", label: "All Campaigns" },
    ];

    // Filters
    const [selectedCampaign, setSelectedCampaign] = useState(null);
    const [selectedRetailer, setSelectedRetailer] = useState(null);
    const [selectedState, setSelectedState] = useState(null);
    const [selectedReportType, setSelectedReportType] = useState(null);
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");

    const reportTypeOptions = [
        { value: "Window Display", label: "Window Display" },
        { value: "Stock", label: "Stock" },
        { value: "Others", label: "Others" },
    ];

    // Data
    const [displayReports, setDisplayReports] = useState([]);
    const [loading, setLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalReports, setTotalReports] = useState(0);
    const [limit] = useState(3);

    // Report Details Modal
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedReport, setSelectedReport] = useState(null);

    // ===============================
    // FETCH CAMPAIGNS ON MOUNT
    // ===============================
    useEffect(() => {
        fetchCampaigns();
    }, []);

    const fetchCampaigns = async () => {
        try {
            const res = await fetch(`${API_URL}/client/client/campaigns`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            const data = await res.json();

            if (!res.ok) {
                toast.error(data.message || "Error fetching campaigns", {
                    theme: "dark",
                });
                return;
            }

            setAllCampaigns(data.campaigns || []);
        } catch (err) {
            toast.error("Failed to load campaigns", { theme: "dark" });
        } finally {
            setLoadingCampaigns(false);
        }
    };

    // ===============================
    // FILTER CAMPAIGNS BY STATUS
    // ===============================
    const filteredCampaigns = useMemo(() => {
        if (!selectedStatus || selectedStatus.value === "all") {
            return allCampaigns;
        }

        const isActive = selectedStatus.value === "active";
        return allCampaigns.filter((c) => c.isActive === isActive);
    }, [allCampaigns, selectedStatus]);

    // ===============================
    // CAMPAIGN OPTIONS FOR SELECT
    // ===============================
    const campaignOptions = useMemo(() => {
        return filteredCampaigns.map((c) => ({
            value: c._id,
            label: c.name,
            data: c,
        }));
    }, [filteredCampaigns]);

    // ===============================
    // EXTRACT STATES FROM CAMPAIGNS
    // ===============================
    const stateOptions = useMemo(() => {
        const stateSet = new Set();

        // If a specific campaign is selected, get states from that campaign only
        const campaignsToProcess = selectedCampaign
            ? filteredCampaigns.filter(c => c._id === selectedCampaign.value)
            : filteredCampaigns;

        campaignsToProcess.forEach((campaign) => {
            (campaign.assignedRetailers || []).forEach((retailerAssignment) => {
                const state = retailerAssignment.retailerId?.shopDetails?.shopAddress?.state;
                if (state) stateSet.add(state);
            });
        });

        return Array.from(stateSet).map((state) => ({
            value: state,
            label: state,
        }));
    }, [filteredCampaigns, selectedCampaign]);

    // ===============================
    // EXTRACT RETAILERS FROM CAMPAIGNS
    // ===============================
    const retailerOptions = useMemo(() => {
        const retailersMap = new Map();

        // If a specific campaign is selected, get retailers from that campaign only
        const campaignsToProcess = selectedCampaign
            ? filteredCampaigns.filter(c => c._id === selectedCampaign.value)
            : filteredCampaigns;

        campaignsToProcess.forEach((campaign) => {
            (campaign.assignedRetailers || []).forEach((retailerAssignment) => {
                const retailer = retailerAssignment.retailerId;
                if (retailer && retailer._id) {
                    const retailerId = retailer._id;
                    const outletName = retailer.shopDetails?.shopName || "N/A";
                    const outletCode = retailer.uniqueId || "N/A";
                    const retailerName = retailer.name || "N/A";
                    const label = `${outletName} • ${outletCode} • ${retailerName}`;

                    // Filter by selected state if applicable
                    if (selectedState) {
                        const retailerState = retailer.shopDetails?.shopAddress?.state;
                        if (retailerState !== selectedState.value) return;
                    }

                    if (!retailersMap.has(retailerId)) {
                        retailersMap.set(retailerId, {
                            value: retailerId,
                            label: label,
                            data: retailer,
                        });
                    }
                }
            });
        });

        return Array.from(retailersMap.values());
    }, [filteredCampaigns, selectedCampaign, selectedState]);

    // ===============================
    // FETCH REPORTS
    // ===============================
    const fetchReports = async (page = 1) => {
        setLoading(true);
        setHasSearched(true);

        try {
            // ✅ Get client's campaign IDs for filtering
            const clientCampaignIds = allCampaigns.map(c => c._id);

            if (clientCampaignIds.length === 0) {
                toast.warning("No campaigns found for your account", { theme: "dark" });
                setDisplayReports([]);
                setLoading(false);
                setHasSearched(true);
                return;
            }

            // Build query params
            const params = new URLSearchParams();
            params.append("page", page);
            params.append("limit", limit);

            if (selectedCampaign) {
                params.append("campaignId", selectedCampaign.value);
            }
            if (selectedReportType) {
                params.append("reportType", selectedReportType.value);
            }
            if (selectedRetailer) {
                params.append("retailerId", selectedRetailer.value);
            }
            if (fromDate) {
                params.append("startDate", fromDate);
            }
            if (toDate) {
                params.append("endDate", toDate);
            }

            const res = await fetch(
                `${API_URL}/reports/client-reports?${params.toString()}`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
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

            // ✅ CRITICAL: Filter reports by client's campaigns ONLY
            reports = reports.filter((report) => {
                const reportCampaignId = report.campaignId?._id || report.campaignId;
                return clientCampaignIds.includes(reportCampaignId);
            });

            // Client-side filter by state if selected
            if (selectedState) {
                reports = reports.filter(
                    (report) =>
                        report.retailer?.retailerId?.shopDetails?.shopAddress?.state === selectedState.value
                );
            }

            setDisplayReports(reports);
            setTotalReports(reports.length); // ✅ Use filtered count
            setCurrentPage(1); // ✅ Reset to page 1 after filtering
            setTotalPages(Math.ceil(reports.length / limit));

            if (reports.length === 0) {
                toast.info("No reports found for the selected filters", {
                    theme: "dark",
                });
            }
        } catch (err) {
            console.error("Fetch reports error:", err);
            toast.error("Failed to load reports", { theme: "dark" });
            setDisplayReports([]);
        } finally {
            setLoading(false);
        }
    };

    // ===============================
    // HANDLE FILTER CHANGES
    // ===============================
    const handleStatusChange = (selected) => {
        setSelectedStatus(selected);
        setSelectedCampaign(null);
        setSelectedRetailer(null);
        setSelectedState(null);
    };

    const handleCampaignChange = (selected) => {
        setSelectedCampaign(selected);
        setSelectedRetailer(null);
        setSelectedState(null);
    };

    const handleStateChange = (selected) => {
        setSelectedState(selected);
        setSelectedRetailer(null);
    };

    const handleClearFilters = () => {
        setSelectedCampaign(null);
        setSelectedRetailer(null);
        setSelectedState(null);
        setSelectedReportType(null);
        setFromDate("");
        setToDate("");
        setDisplayReports([]);
        setHasSearched(false);
        setCurrentPage(1);
    };

    // ===============================
    // UTILITY FUNCTIONS
    // ===============================
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
            const res = await fetch(`${API_URL}/reports/${report._id}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            const data = await res.json();

            if (res.ok) {
                setSelectedReport(data.report);
                setShowDetailsModal(true);
            } else {
                toast.error("Failed to load report details", {
                    theme: "dark",
                });
            }
        } catch (err) {
            console.error("Error fetching report details:", err);
            toast.error("Failed to load report details", { theme: "dark" });
        }
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
            window.scrollTo({ top: 0, behavior: "smooth" });
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

    return (
        <>
            <ToastContainer position="top-right" autoClose={3000} />
            <div className="min-h-screen bg-[#171717] p-6">
                <div className="max-w-7xl mx-auto">
                    <h1 className="text-3xl font-bold text-[#E4002B] mb-8">
                        View Reports
                    </h1>

                    {/* Filters Section */}
                    <div className="bg-[#EDEDED] rounded-lg shadow-md p-6 mb-6">
                        <h2 className="text-lg font-semibold mb-4 text-gray-700">
                            Filter Reports <span className="text-red-500">(Optional)</span>
                        </h2>

                        {/* First Row - Campaign Status and Campaign */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Campaign Status
                                </label>
                                <Select
                                    value={selectedStatus}
                                    onChange={handleStatusChange}
                                    options={statusOptions}
                                    styles={customSelectStyles}
                                    placeholder="Select campaign status"
                                    isSearchable
                                    isClearable
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Campaign
                                </label>
                                <Select
                                    value={selectedCampaign}
                                    onChange={handleCampaignChange}
                                    options={campaignOptions}
                                    isLoading={loadingCampaigns}
                                    styles={customSelectStyles}
                                    placeholder="Select campaign"
                                    isSearchable
                                    isClearable
                                />
                            </div>
                        </div>

                        {/* Second Row - Report Type, State, Retailer */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Report Type
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
                                    State
                                </label>
                                <Select
                                    value={selectedState}
                                    onChange={handleStateChange}
                                    options={stateOptions}
                                    styles={customSelectStyles}
                                    placeholder="Select state"
                                    isSearchable
                                    isClearable
                                    noOptionsMessage={() => "No states available"}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Retailer
                                </label>
                                <Select
                                    value={selectedRetailer}
                                    onChange={setSelectedRetailer}
                                    options={retailerOptions}
                                    styles={customSelectStyles}
                                    placeholder="Select retailer"
                                    isSearchable
                                    isClearable
                                    noOptionsMessage={() => "No retailers available"}
                                />
                            </div>
                        </div>

                        {/* Third Row - Date Filters */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    From Date
                                </label>
                                <input
                                    type="date"
                                    value={fromDate}
                                    onChange={(e) => setFromDate(e.target.value)}
                                    className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E4002B] focus:border-transparent bg-white"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    To Date
                                </label>
                                <input
                                    type="date"
                                    value={toDate}
                                    onChange={(e) => setToDate(e.target.value)}
                                    className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E4002B] focus:border-transparent bg-white"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => fetchReports(1)}
                                disabled={loading}
                                className="bg-[#E4002B] text-white px-6 py-2 rounded-md text-sm font-medium hover:bg-[#C3002B] transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                                {loading ? "Searching..." : "Search Reports"}
                            </button>

                            {(selectedCampaign ||
                                selectedRetailer ||
                                selectedState ||
                                selectedReportType ||
                                fromDate ||
                                toDate) && (
                                    <button
                                        onClick={handleClearFilters}
                                        className="text-sm text-red-600 underline hover:text-red-800"
                                    >
                                        Clear All Filters
                                    </button>
                                )}
                        </div>
                    </div>

                    {/* Display Table */}
                    {!loading && hasSearched && displayReports.length > 0 && (
                        <div className="bg-[#EDEDED] rounded-lg shadow-md p-6">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
                                <h2 className="text-lg font-semibold text-gray-700">
                                    Reports ({displayReports.length} found)
                                </h2>
                                <div className="text-sm text-gray-600">
                                    Showing {(currentPage - 1) * limit + 1} to{" "}
                                    {Math.min(currentPage * limit, displayReports.length)} of{" "}
                                    {displayReports.length} reports
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                                    <thead className="bg-gray-100">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b">
                                                S.No
                                            </th>
                                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b">
                                                Report Type
                                            </th>
                                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b">
                                                Campaign
                                            </th>
                                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b">
                                                Retailer
                                            </th>
                                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b">
                                                Outlet
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
                                        {displayReports
                                            .slice((currentPage - 1) * limit, currentPage * limit)
                                            .map((report, index) => (
                                                <tr
                                                    key={report._id}
                                                    className={`${index % 2 === 0
                                                        ? "bg-white"
                                                        : "bg-gray-50"
                                                        } hover:bg-gray-100 transition`}
                                                >
                                                    <td className="px-4 py-3 text-sm text-gray-800 border-b">
                                                        {(currentPage - 1) * limit + index + 1}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-800 border-b">
                                                        <span className="font-medium">
                                                            {report.reportType || "N/A"}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-800 border-b">
                                                        {report.campaignId?.name || "N/A"}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-800 border-b">
                                                        <div>
                                                            {report.retailer?.retailerName || "N/A"}
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            {report.retailer?.outletCode || "N/A"}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-800 border-b">
                                                        {report.retailer?.outletName || "N/A"}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-800 border-b">
                                                        {formatDate(report.dateOfSubmission || report.createdAt)}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-800 border-b">
                                                        <button
                                                            onClick={() => handleViewDetails(report)}
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

                            {/* Enhanced Pagination */}
                            {totalPages > 1 && (
                                <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4">
                                    <div className="text-sm text-gray-600">
                                        Page {currentPage} of {totalPages}
                                    </div>

                                    <div className="flex items-center gap-2 flex-wrap justify-center">
                                        <button
                                            onClick={() => handlePageChange(1)}
                                            disabled={currentPage === 1}
                                            className="px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                                        >
                                            First
                                        </button>

                                        <button
                                            onClick={() => handlePageChange(currentPage - 1)}
                                            disabled={currentPage === 1}
                                            className="px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
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
                                                        className={`px-3 py-2 rounded text-sm ${currentPage === pageNum
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
                                            className="px-3 py-2 bg-[#E4002B] text-white rounded hover:bg-[#C3002B] disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                                        >
                                            Next
                                        </button>

                                        <button
                                            onClick={() => handlePageChange(totalPages)}
                                            disabled={currentPage === totalPages}
                                            className="px-3 py-2 bg-[#E4002B] text-white rounded hover:bg-[#C3002B] disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                                        >
                                            Last
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {loading && (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-200">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E4002B] mb-4"></div>
                            <p>Loading reports...</p>
                        </div>
                    )}

                    {!loading && hasSearched && displayReports.length === 0 && (
                        <div className="text-center py-12 text-gray-500 bg-[#EDEDED] rounded-lg">
                            <p className="text-lg font-medium mb-2">
                                No reports found
                            </p>
                            <p className="text-sm">
                                Try adjusting your search criteria or clear filters
                                to see all reports.
                            </p>
                        </div>
                    )}

                    {!hasSearched && (
                        <div className="text-center py-12 text-gray-400 bg-[#EDEDED] rounded-lg">
                            <p className="text-lg font-medium mb-2">
                                Ready to search reports
                            </p>
                            <p className="text-sm">
                                Click "Search Reports" to view reports with your
                                selected filters.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Report Details Modal */}
            {showDetailsModal && selectedReport && (
                <ReportDetailsModal
                    report={selectedReport}
                    onClose={() => {
                        setShowDetailsModal(false);
                        setSelectedReport(null);
                    }}
                />
            )}
        </>
    );
};

export default DetailedReport;

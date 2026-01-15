import React, { useState, useEffect } from "react";
import Select from "react-select";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ReportDetailsModal from "./ReportDetailsModal";
import axios from "axios";
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

const EmployeeViewReports = ({ campaign }) => {
  // Date Range Filter
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // Retailer Filter
  const [selectedRetailer, setSelectedRetailer] = useState(null);
  const [assignedRetailers, setAssignedRetailers] = useState([]);
  const [loadingRetailers, setLoadingRetailers] = useState(false);
  const [reportTypeFilter, setReportTypeFilter] = useState("");

  // Data
  const [displayReports, setDisplayReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Campaign ID
  const [campaignId, setCampaignId] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalReports, setTotalReports] = useState(0);
  const [limit] = useState(7); 

  // Employee Info
  const [employeeInfo, setEmployeeInfo] = useState(null);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [loadingReport, setLoadingReport] = useState(false);

  const reportTypeOptions = [
    { value: "", label: "All Types" },
    { value: "Window Display", label: "Window Display" },
    { value: "Stock", label: "Stock" },
    { value: "Others", label: "Others" },
  ];

  // Fetch employee info and campaign ID
  useEffect(() => {
    fetchEmployeeInfo();
    if (campaign) {
      fetchCampaignId();
    }
  }, [campaign]);

  // Fetch assigned retailers when campaign changes
  useEffect(() => {
    if (campaignId && employeeInfo) {
      fetchAssignedRetailers();
    }
  }, [campaignId, employeeInfo]);

  const fetchEmployeeInfo = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("No token found. Please log in.", { theme: "dark" });
        return;
      }

      const response = await fetch(`${API_URL}/employee/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error("Failed to load employee profile");
      }

      const data = await response.json();
      setEmployeeInfo(data.employee);
    } catch (err) {
      console.error("Error fetching employee info:", err);
      toast.error("Failed to load employee information", { theme: "dark" });
    }
  };

  const fetchCampaignId = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${API_URL}/employee/employee/campaigns`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const matchedCampaign = response.data.campaigns?.find(
        (c) => c.name === campaign.name
      );

      if (matchedCampaign) {
        setCampaignId(matchedCampaign._id || matchedCampaign.id);
        console.log("Campaign ID found:", matchedCampaign._id || matchedCampaign.id);
      }
    } catch (err) {
      console.error("Error fetching campaign ID:", err);
    }
  };

  // Fetch retailers assigned to this employee for the selected campaign
  const fetchAssignedRetailers = async () => {
    setLoadingRetailers(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `${API_URL}/admin/campaign/${campaignId}/employee-retailer-mapping`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const currentEmployee = res.data.employees.find(
        (emp) => emp._id === employeeInfo._id || emp.id === employeeInfo._id
      );

      if (currentEmployee && currentEmployee.retailers) {
        // Format: Outlet Code - Outlet Name
        const mapped = currentEmployee.retailers.map((r) => ({
          value: r._id || r.id,
          label: `${r.uniqueId || r.retailerCode || ""} - ${r.shopDetails?.shopName || r.name
            }`,
          data: r,
        }));
        setAssignedRetailers(mapped);
      } else {
        setAssignedRetailers([]);
      }
    } catch (err) {
      console.error("Error fetching assigned retailers:", err);
      toast.error("Failed to load assigned retailers", { theme: "dark" });
      setAssignedRetailers([]);
    } finally {
      setLoadingRetailers(false);
    }
  };

  // Fetch Employee Reports
  const fetchReports = async (page = 1) => {
    if (!employeeInfo?._id) {
      toast.error("Employee information not loaded", { theme: "dark" });
      return;
    }

    setLoading(true);
    setHasSearched(true);

    try {
      const token = localStorage.getItem("token");

      const res = await fetch(
        `${API_URL}/reports/employee/${employeeInfo._id}`,
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

      // Client-side filtering for campaign
      if (campaignId) {
        reports = reports.filter(
          (report) =>
            report.campaignId?._id === campaignId ||
            report.campaignId === campaignId
        );
      }

      // Client-side filtering for retailer
      if (selectedRetailer) {
        reports = reports.filter(
          (report) =>
            report.retailer?.retailerId?._id === selectedRetailer.value ||
            report.retailer?.retailerId === selectedRetailer.value
        );
      }

      if (reportTypeFilter) {
        reports = reports.filter(
          (report) => report.reportType === reportTypeFilter
        );
      }

      // Client-side filtering for date range
      if (fromDate || toDate) {
        reports = reports.filter((report) => {
          const reportDate = new Date(
            report.dateOfSubmission || report.createdAt
          );
          const from = fromDate ? new Date(fromDate) : null;
          const to = toDate ? new Date(toDate) : null;

          if (from && to) {
            return reportDate >= from && reportDate <= to;
          } else if (from) {
            return reportDate >= from;
          } else if (to) {
            return reportDate <= to;
          }
          return true;
        });
      }

      // Client-side pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedReports = reports.slice(startIndex, endIndex);

      setDisplayReports(paginatedReports);
      setTotalReports(reports.length);
      setCurrentPage(page);
      setTotalPages(Math.ceil(reports.length / limit));

      if (reports.length === 0) {
        toast.info("No reports found for the selected filters", {
          theme: "dark",
        });
      } else {
        toast.success(`Found ${reports.length} report(s)`, {
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

  // Clear all filters
  const handleClearFilters = () => {
    setFromDate("");
    setToDate("");
    setSelectedRetailer(null);
    setReportTypeFilter("");
    setDisplayReports([]);
    setHasSearched(false);
    setCurrentPage(1);
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

  // Handle View Report Details
  const handleViewDetails = async (report) => {
    console.log("Viewing details for report:", report);
    setLoadingReport(true);
    setShowModal(true);

    try {
      const token = localStorage.getItem("token");

      const res = await fetch(`${API_URL}/reports/${report._id}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error("Failed to load report details", { theme: "dark" });
        setShowModal(false);
        return;
      }

      setSelectedReport(data.report);
    } catch (err) {
      console.error("Error fetching report details:", err);
      toast.error("Failed to load report details", { theme: "dark" });
      setShowModal(false);
    } finally {
      setLoadingReport(false);
    }
  };

  // Close Modal
  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedReport(null);
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      fetchReports(newPage);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Generate page numbers for pagination
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

  const getReportTypeBadge = (type) => {
    const badges = {
      "Window Display": "bg-purple-100 text-purple-700",
      "Stock": "bg-green-100 text-green-700",
      "Others": "bg-orange-100 text-orange-700",
    };
    return badges[type] || "bg-gray-100 text-gray-700";
  };

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="max-w-7xl mx-auto space-y-6">
        <h3 className="text-2xl font-bold text-[#E4002B] border-b-2 border-[#E4002B] pb-2">
          Reports Details
        </h3>
        {/* Display Campaign Name */}
        <div className="mb-4 p-4 bg-white shadow-sm rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Campaign:</p>
          <p className="text-xl font-semibold text-gray-800">
            {campaign?.name || "Loading..."}
          </p>
          {campaign?.client && (
            <p className="text-sm text-gray-500 mt-1">
              Client: {campaign.client}
            </p>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-700">
            Filter Reports <span className="text-red-500">(Optional)</span>
          </h2>

          {/* ✅ UPDATED: Retailer and Report Type in One Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Retailer Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Retailer
              </label>
              <Select
                value={selectedRetailer}
                onChange={setSelectedRetailer}
                options={assignedRetailers}
                styles={customSelectStyles}
                placeholder="Select retailer"
                isSearchable
                isClearable
                isLoading={loadingRetailers}
                isDisabled={assignedRetailers.length === 0}
                noOptionsMessage={() =>
                  loadingRetailers
                    ? "Loading..."
                    : "No retailers assigned"
                }
              />
              {assignedRetailers.length === 0 && !loadingRetailers && (
                <p className="text-sm text-gray-500 mt-2">
                  No retailers assigned to you for this campaign
                </p>
              )}
            </div>

            {/* Report Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Report Type
              </label>
              <Select
                value={reportTypeOptions.find((opt) => opt.value === reportTypeFilter)}
                onChange={(opt) => setReportTypeFilter(opt.value)}
                options={reportTypeOptions}
                styles={customSelectStyles}
                isSearchable
                isClearable
                placeholder="Select report type"
              />
            </div>
          </div>

          {/* Second Row - Date Range Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                From Date
              </label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-sm
                 focus:outline-none focus:ring-2 focus:ring-[#E4002B] focus:border-transparent
                 cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                To Date
              </label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-sm
                 focus:outline-none focus:ring-2 focus:ring-[#E4002B] focus:border-transparent
                 cursor-pointer"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => fetchReports(1)}
              disabled={loading}
              className="bg-[#E4002B] text-white px-6 py-2 rounded-md text-sm font-medium hover:bg-[#C3002B] transition disabled:bg-gray-400 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? "Searching..." : "Search Reports"}
            </button>

            {(fromDate || toDate || selectedRetailer || reportTypeFilter) && (
              <button
                onClick={handleClearFilters}
                className="px-4 py-2 text-sm text-red-600 border border-red-600 rounded-md hover:bg-red-50 transition cursor-pointer"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Display Table */}
        {!loading && hasSearched && displayReports.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
              <h2 className="text-lg font-semibold text-gray-700">
                Reports ({totalReports} found)
              </h2>
              <div className="text-sm text-gray-600">
                Showing {(currentPage - 1) * limit + 1} to{" "}
                {Math.min(currentPage * limit, totalReports)} of {totalReports}{" "}
                reports
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
                      Retailer
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b">
                      Outlet
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b">
                      Frequency
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
                      className={`${index % 2 === 0 ? "bg-white" : "bg-gray-50"
                        } hover:bg-gray-100 transition`}
                    >
                      <td className="px-4 py-3 text-sm text-gray-800 border-b">
                        {(currentPage - 1) * limit + index + 1}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-800 border-b">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${getReportTypeBadge(
                            report.reportType
                          )}`}
                        >
                          {report.reportType || "N/A"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-800 border-b">
                        <div>{report.retailer?.retailerName || "N/A"}</div>
                        <div className="text-xs text-gray-500">
                          {report.retailer?.outletCode || ""}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-800 border-b">
                        {report.retailer?.outletName || "N/A"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-800 border-b">
                        {formatDate(
                          report.dateOfSubmission || report.createdAt
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-800 border-b">
                        <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700">
                          {report.frequency || "N/A"}
                        </span>
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

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-12 text-gray-200">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E4002B] mb-4"></div>
            <p>Loading reports...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && hasSearched && displayReports.length === 0 && (
          <div className="text-center py-12 text-gray-500 bg-white rounded-lg">
            <p className="text-lg font-medium mb-2">No reports found</p>
            <p className="text-sm">
              Try adjusting your search criteria or clear filters to see all
              reports.
            </p>
          </div>
        )}

        {/* Initial State */}
        {!hasSearched && (
          <div className="text-center py-12 text-gray-400 bg-white rounded-lg">
            <svg
              className="mx-auto h-12 w-12 text-gray-300 mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <p className="text-lg font-medium mb-2">Ready to search reports</p>
            <p className="text-sm">
              Click "Search Reports" to view all reports for this campaign, or
              use filters to narrow down results.
            </p>
          </div>
        )}
      </div>


      {/* Report Details Modal */}
      {showModal && selectedReport && (
        <ReportDetailsModal report={selectedReport} onClose={handleCloseModal} />
      )}
    </>
  );
};

export default EmployeeViewReports;

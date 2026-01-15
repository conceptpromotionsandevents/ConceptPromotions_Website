import React, { useState, useMemo, useEffect } from "react";
import Select from "react-select";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaStore, FaCheckCircle, FaClipboardList, FaMoneyBillWave } from "react-icons/fa";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import { API_URL } from "../../url/base";

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

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
  multiValue: (provided) => ({
    ...provided,
    backgroundColor: "#FEE2E2",
  }),
  multiValueLabel: (provided) => ({
    ...provided,
    color: "#E4002B",
  }),
  multiValueRemove: (provided) => ({
    ...provided,
    color: "#E4002B",
    ":hover": {
      backgroundColor: "#E4002B",
      color: "white",
    },
  }),
  menu: (provided) => ({
    ...provided,
    zIndex: 20,
  }),
};

const ClientHome = () => {
  // Filters
  const [campaignStatus, setCampaignStatus] = useState({ value: "active", label: "Active" });
  const [selectedCampaigns, setSelectedCampaigns] = useState([]);
  const [selectedStates, setSelectedStates] = useState([]);
  const [selectedRetailers, setSelectedRetailers] = useState([]);
  const [selectedPayments, setSelectedPayments] = useState([]);
  const [selectedAcceptanceStatus, setSelectedAcceptanceStatus] = useState([]);

  // Data
  const [allCampaigns, setAllCampaigns] = useState([]);
  const [budgets, setBudgets] = useState([]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);

  // Loading
  const [loading, setLoading] = useState(true);

  // Campaign Status Options
  const statusOptions = [
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
    { value: "all", label: "All Campaigns" },
  ];

  // Payment Status Options
  const paymentOptions = [
    { value: "Pending", label: "Pending" },
    { value: "Partially Paid", label: "Partially Paid" },
    { value: "Completed", label: "Completed" },
  ];

  // Acceptance Status Options
  const acceptanceOptions = [
    { value: "accepted", label: "Accepted" },
    { value: "pending", label: "Pending" },
    { value: "rejected", label: "Rejected" },
  ];

  // ===============================
  // FETCH DATA ON MOUNT
  // ===============================
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("client_token");

      // Fetch campaigns
      const campaignsRes = await fetch(`${API_URL}/client/client/campaigns`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const campaignsData = await campaignsRes.json();
      setAllCampaigns(campaignsData.campaigns || []);

      // Fetch all budgets
      const budgetsRes = await fetch(`${API_URL}/budgets`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const budgetsData = await budgetsRes.json();
      setBudgets(budgetsData.budgets || []);

    } catch (err) {
      console.error("Error fetching data:", err);
      toast.error("Failed to load data", { theme: "dark", toastId: "data-error" });
    } finally {
      setLoading(false);
    }
  };

  // ===============================
  // FILTER CAMPAIGNS BY STATUS
  // ===============================
  const filteredCampaigns = useMemo(() => {
    if (campaignStatus.value === "all") return allCampaigns;
    const isActive = campaignStatus.value === "active";
    return allCampaigns.filter((c) => c.isActive === isActive);
  }, [allCampaigns, campaignStatus]);

  // Campaign Options for Multi-Select
  const campaignOptions = useMemo(() => {
    return filteredCampaigns.map((c) => ({
      value: c._id,
      label: c.name,
      data: c,
    }));
  }, [filteredCampaigns]);

  // ===============================
  // BUILD OUTLETS TABLE DATA FROM CAMPAIGNS
  // ===============================
  const outletsData = useMemo(() => {
    const outletsArray = [];

    filteredCampaigns.forEach((campaign) => {
      (campaign.assignedRetailers || []).forEach((retailerAssignment) => {
        const retailer = retailerAssignment.retailerId;

        if (!retailer || !retailer._id) return;

        const retailerId = retailer._id;
        const outletCode = retailer.uniqueId || "N/A";
        const shopName = retailer.shopDetails?.shopName || "N/A";
        const city = retailer.shopDetails?.shopAddress?.city || "N/A";
        const state = retailer.shopDetails?.shopAddress?.state || "N/A";

        // Get acceptance status from assignment
        const acceptanceStatus = retailerAssignment.status || "pending";

        // Find payment info with null safety
        const budget = budgets.find((b) => {
          if (!b.retailerId) return false;
          const budgetRetailerId = b.retailerId._id || b.retailerId;
          return budgetRetailerId === retailerId;
        });

        let campaignPaymentStatus = "Pending";
        let tca = 0;
        let cPaid = 0;
        let cPending = 0;

        if (budget) {
          const campaignBudget = budget.campaigns.find((c) => {
            if (!c.campaignId) return false;
            const budgetCampaignId = c.campaignId._id || c.campaignId;
            return budgetCampaignId === campaign._id;
          });

          if (campaignBudget) {
            tca = campaignBudget.tca || 0;
            cPaid = campaignBudget.cPaid || 0;
            cPending = campaignBudget.cPending || 0;

            if (cPaid === 0) {
              campaignPaymentStatus = "Pending";
            } else if (cPaid < tca) {
              campaignPaymentStatus = "Partially Paid";
            } else if (cPaid >= tca) {
              campaignPaymentStatus = "Completed";
            }
          }
        }

        outletsArray.push({
          retailerId,
          campaignId: campaign._id,
          outletCode,
          shopName,
          city,
          state,
          campaignName: campaign.name,
          acceptanceStatus,
          paymentStatus: campaignPaymentStatus,
          tca,
          cPaid,
          cPending,
        });
      });
    });

    // Apply Filters
    let data = outletsArray;

    if (selectedCampaigns.length > 0) {
      const selectedCampaignIds = selectedCampaigns.map((c) => c.value);
      data = data.filter((outlet) => selectedCampaignIds.includes(outlet.campaignId));
    }

    if (selectedStates.length > 0) {
      const selectedStateValues = selectedStates.map((s) => s.value);
      data = data.filter((outlet) => selectedStateValues.includes(outlet.state));
    }

    if (selectedRetailers.length > 0) {
      const selectedRetailerIds = selectedRetailers.map((r) => r.value);
      data = data.filter((outlet) => selectedRetailerIds.includes(outlet.retailerId));
    }

    if (selectedPayments.length > 0) {
      const selectedPaymentValues = selectedPayments.map((p) => p.value);
      data = data.filter((outlet) => selectedPaymentValues.includes(outlet.paymentStatus));
    }

    if (selectedAcceptanceStatus.length > 0) {
      const selectedAcceptanceValues = selectedAcceptanceStatus.map((a) => a.value);
      data = data.filter((outlet) => selectedAcceptanceValues.includes(outlet.acceptanceStatus));
    }

    return data;
  }, [filteredCampaigns, budgets, selectedCampaigns, selectedStates, selectedRetailers, selectedPayments, selectedAcceptanceStatus]);

  // ===============================
  // EXTRACT UNIQUE STATES FROM CAMPAIGNS
  // ===============================
  const stateOptions = useMemo(() => {
    const stateSet = new Set();

    filteredCampaigns.forEach((campaign) => {
      (campaign.assignedRetailers || []).forEach((retailerAssignment) => {
        const state = retailerAssignment.retailerId?.shopDetails?.shopAddress?.state;
        if (state) stateSet.add(state);
      });
    });

    return Array.from(stateSet).map((state) => ({
      value: state,
      label: state,
    }));
  }, [filteredCampaigns]);

  // ===============================
  // EXTRACT UNIQUE RETAILERS FROM CAMPAIGNS
  // ===============================
  const retailerOptions = useMemo(() => {
    const retailersMap = new Map();

    filteredCampaigns.forEach((campaign) => {
      (campaign.assignedRetailers || []).forEach((retailerAssignment) => {
        const retailer = retailerAssignment.retailerId;
        if (retailer && retailer._id) {
          const retailerId = retailer._id;
          const outletCode = retailer.uniqueId || "N/A";
          const shopName = retailer.shopDetails?.shopName || "N/A";
          const retailerName = retailer.name || "N/A";

          if (!retailersMap.has(retailerId)) {
            retailersMap.set(retailerId, {
              value: retailerId,
              label: `${outletCode} - ${shopName} - ${retailerName}`,
            });
          }
        }
      });
    });

    return Array.from(retailersMap.values());
  }, [filteredCampaigns]);

  // ===============================
  // CALCULATE STATISTICS
  // ===============================
  const statistics = useMemo(() => {
    // Card 1: Unique Outlets Enrolled (no duplicates across campaigns)
    const uniqueOutlets = new Set(outletsData.map((o) => o.retailerId));
    const uniqueOutletsCount = uniqueOutlets.size;

    // Card 2: Campaign-wise Enrollments (1 outlet + 1 campaign = 1 count)
    const campaignWiseEnrollments = outletsData.length;

    // Card 3: Campaign-wise Outlets Activated (accepted status)
    const campaignWiseActivated = outletsData.filter((o) => o.acceptanceStatus === "accepted").length;

    // Card 4: Outlets with Completed Payments
    const outletsFullyPaid = outletsData.filter((o) => o.paymentStatus === "Completed").length;

    return {
      uniqueOutletsCount,
      campaignWiseEnrollments,
      campaignWiseActivated,
      outletsFullyPaid,
    };
  }, [outletsData]);

  // ===============================
  // PAGINATION
  // ===============================
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return outletsData.slice(startIndex, endIndex);
  }, [outletsData, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(outletsData.length / itemsPerPage);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // ===============================
  // CLEAR FILTERS
  // ===============================
  const handleClearFilters = () => {
    setSelectedCampaigns([]);
    setSelectedStates([]);
    setSelectedRetailers([]);
    setSelectedPayments([]);
    setSelectedAcceptanceStatus([]);
    setCurrentPage(1);
  };

  // ===============================
  // CHART DATA
  // ===============================
  const paymentChartData = useMemo(() => {
    const completed = outletsData.filter((o) => o.paymentStatus === "Completed").length;
    const partiallyPaid = outletsData.filter((o) => o.paymentStatus === "Partially Paid").length;
    const pending = outletsData.filter((o) => o.paymentStatus === "Pending").length;

    return {
      labels: ["Completed", "Partially Paid", "Pending"],
      datasets: [
        {
          label: "Outlets",
          data: [completed, partiallyPaid, pending],
          backgroundColor: [
            "rgba(34, 197, 94, 0.8)",
            "rgba(251, 191, 36, 0.8)",
            "rgba(239, 68, 68, 0.8)",
          ],
          borderColor: [
            "rgba(34, 197, 94, 1)",
            "rgba(251, 191, 36, 1)",
            "rgba(239, 68, 68, 1)",
          ],
          borderWidth: 2,
        },
      ],
    };
  }, [outletsData]);

  const stateChartData = useMemo(() => {
    const stateCounts = {};
    outletsData.forEach((outlet) => {
      stateCounts[outlet.state] = (stateCounts[outlet.state] || 0) + 1;
    });

    return {
      labels: Object.keys(stateCounts).slice(0, 8),
      datasets: [
        {
          label: "Outlets",
          data: Object.values(stateCounts).slice(0, 8),
          backgroundColor: "rgba(59, 130, 246, 0.6)",
          borderColor: "rgba(59, 130, 246, 1)",
          borderWidth: 1,
        },
      ],
    };
  }, [outletsData]);

  const acceptanceChartData = useMemo(() => {
    const accepted = outletsData.filter((o) => o.acceptanceStatus === "accepted").length;
    const pending = outletsData.filter((o) => o.acceptanceStatus === "pending").length;
    const rejected = outletsData.filter((o) => o.acceptanceStatus === "rejected").length;

    return {
      labels: ["Accepted", "Pending", "Rejected"],
      datasets: [
        {
          label: "Outlets",
          data: [accepted, pending, rejected],
          backgroundColor: [
            "rgba(34, 197, 94, 0.8)",
            "rgba(156, 163, 175, 0.8)",
            "rgba(239, 68, 68, 0.8)",
          ],
          borderColor: [
            "rgba(34, 197, 94, 1)",
            "rgba(156, 163, 175, 1)",
            "rgba(239, 68, 68, 1)",
          ],
          borderWidth: 2,
        },
      ],
    };
  }, [outletsData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E4002B]"></div>
      </div>
    );
  }

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <div>
        <h2 className="text-2xl font-bold mb-6 text-[#E4002B]">Dashboard Overview</h2>

        {/* FILTERS */}
        <div className="bg-[#EDEDED] p-6 rounded-lg shadow-md mb-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-700">Filters</h3>

          {/* Row 1: Campaign Status (Single) */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1.5 text-gray-700">
              Campaign Status
            </label>
            <Select
              styles={customSelectStyles}
              options={statusOptions}
              value={campaignStatus}
              onChange={(selected) => {
                setCampaignStatus(selected);
                setSelectedCampaigns([]);
                setCurrentPage(1);
              }}
              isSearchable
              placeholder="Select status"
            />
          </div>

          {/* Row 2: Campaign (Multi), State (Multi), Retailer (Multi) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {/* Campaign */}
            <div>
              <label className="block text-sm font-medium mb-1.5 text-gray-700">
                Campaign (Optional)
              </label>
              <Select
                styles={customSelectStyles}
                options={campaignOptions}
                value={selectedCampaigns}
                onChange={(selected) => {
                  setSelectedCampaigns(selected || []);
                  setCurrentPage(1);
                }}
                isSearchable
                isMulti
                isClearable
                placeholder="Select campaigns"
              />
            </div>

            {/* State */}
            <div>
              <label className="block text-sm font-medium mb-1.5 text-gray-700">
                State (Optional)
              </label>
              <Select
                styles={customSelectStyles}
                options={stateOptions}
                value={selectedStates}
                onChange={(selected) => {
                  setSelectedStates(selected || []);
                  setCurrentPage(1);
                }}
                isSearchable
                isMulti
                isClearable
                placeholder="Select states"
              />
            </div>

            {/* Retailer */}
            <div>
              <label className="block text-sm font-medium mb-1.5 text-gray-700">
                Retailer (Optional)
              </label>
              <Select
                styles={customSelectStyles}
                options={retailerOptions}
                value={selectedRetailers}
                onChange={(selected) => {
                  setSelectedRetailers(selected || []);
                  setCurrentPage(1);
                }}
                isSearchable
                isMulti
                isClearable
                placeholder="Select retailers"
              />
            </div>
          </div>

          {/* Row 3: Payment Status (Multi) & Acceptance Status (Multi) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Payment Status */}
            <div>
              <label className="block text-sm font-medium mb-1.5 text-gray-700">
                Payment Status (Optional)
              </label>
              <Select
                styles={customSelectStyles}
                options={paymentOptions}
                value={selectedPayments}
                onChange={(selected) => {
                  setSelectedPayments(selected || []);
                  setCurrentPage(1);
                }}
                isSearchable
                isMulti
                isClearable
                placeholder="Select payment status"
              />
            </div>

            {/* Acceptance Status Filter */}
            <div>
              <label className="block text-sm font-medium mb-1.5 text-gray-700">
                Acceptance Status (Optional)
              </label>
              <Select
                styles={customSelectStyles}
                options={acceptanceOptions}
                value={selectedAcceptanceStatus}
                onChange={(selected) => {
                  setSelectedAcceptanceStatus(selected || []);
                  setCurrentPage(1);
                }}
                isSearchable
                isMulti
                isClearable
                placeholder="Select acceptance status"
              />
            </div>
          </div>

          {/* Clear Filters Button */}
          {(selectedCampaigns.length > 0 ||
            selectedStates.length > 0 ||
            selectedRetailers.length > 0 ||
            selectedPayments.length > 0 ||
            selectedAcceptanceStatus.length > 0) && (
              <button
                onClick={handleClearFilters}
                className="text-sm text-red-600 underline hover:text-red-800"
              >
                Clear All Filters
              </button>
            )}
        </div>

        {/* STATISTICS CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Card 1: Unique Outlets */}
          <div className="bg-[#EDEDED] p-6 rounded-xl shadow-md text-center hover:shadow-lg transition-shadow flex flex-col justify-between h-full">
            <div>
              <FaStore className="text-[#E4002B] text-3xl mx-auto mb-3" />
              <h3 className="text-base font-semibold mb-2">Total Outlets</h3>
              <p className="text-3xl font-bold mb-2">{statistics.uniqueOutletsCount}</p>
            </div>
            <p className="text-xs text-gray-500">Unique outlets enrolled</p>
          </div>

          {/* Card 2: Campaign-wise Enrollments */}
          <div className="bg-[#EDEDED] p-6 rounded-xl shadow-md text-center hover:shadow-lg transition-shadow flex flex-col justify-between h-full">
            <div>
              <FaClipboardList className="text-[#E4002B] text-3xl mx-auto mb-3" />
              <h3 className="text-base font-semibold mb-2">Campaign Enrollments</h3>
              <p className="text-3xl font-bold mb-2">{statistics.campaignWiseEnrollments}</p>
            </div>
            <p className="text-xs text-gray-500">Outlet-campaign combinations</p>
          </div>

          {/* Card 3: Campaign-wise Activated */}
          <div className="bg-[#EDEDED] p-6 rounded-xl shadow-md text-center hover:shadow-lg transition-shadow flex flex-col justify-between h-full">
            <div>
              <FaCheckCircle className="text-[#E4002B] text-3xl mx-auto mb-3" />
              <h3 className="text-base font-semibold mb-2">Active Enrollments</h3>
              <p className="text-3xl font-bold mb-2">{statistics.campaignWiseActivated}</p>
            </div>
            <p className="text-xs text-gray-500">Accepted by outlets</p>
          </div>

          {/* Card 4: Fully Paid Outlets */}
          <div className="bg-[#EDEDED] p-6 rounded-xl shadow-md text-center hover:shadow-lg transition-shadow flex flex-col justify-between h-full">
            <div>
              <FaMoneyBillWave className="text-[#E4002B] text-3xl mx-auto mb-3" />
              <h3 className="text-base font-semibold mb-2">Completed Payments</h3>
              <p className="text-3xl font-bold mb-2">{statistics.outletsFullyPaid}</p>
            </div>
            <p className="text-xs text-gray-500">Fully paid enrollments</p>
          </div>
        </div>

        {/* OUTLETS TABLE */}
        <div className="bg-[#EDEDED] rounded-lg shadow-md p-6 mb-8">
          <h3 className="text-xl font-bold text-gray-800 mb-4">
            Outlets Overview ({outletsData.length} total)
          </h3>

          {outletsData.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No outlets found for the selected filters
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-white border-b-2 border-gray-300">
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        S.No
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        Outlet Code
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        Shop Name
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        Campaign
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        State
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        Payment Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedData.map((outlet, index) => (
                      <tr
                        key={`${outlet.retailerId}-${outlet.campaignId}`}
                        className="border-b hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {(currentPage - 1) * itemsPerPage + index + 1}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                            {outlet.outletCode}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {outlet.shopName}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {outlet.campaignName}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${outlet.acceptanceStatus === "accepted"
                                ? "bg-green-100 text-green-800"
                                : outlet.acceptanceStatus === "rejected"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                          >
                            {outlet.acceptanceStatus.charAt(0).toUpperCase() + outlet.acceptanceStatus.slice(1)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">{outlet.state}</td>
                        <td className="px-4 py-3 text-sm">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${outlet.paymentStatus === "Completed"
                                ? "bg-green-100 text-green-800"
                                : outlet.paymentStatus === "Partially Paid"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                          >
                            {outlet.paymentStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-between items-center mt-6">
                  <div className="text-sm text-gray-600">
                    Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                    {Math.min(currentPage * itemsPerPage, outletsData.length)} of{" "}
                    {outletsData.length} outlets
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      Previous
                    </button>

                    <span className="px-4 py-2 text-sm text-gray-700">
                      Page {currentPage} of {totalPages}
                    </span>

                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="px-3 py-2 bg-[#E4002B] text-white rounded hover:bg-[#C3002B] disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* CHARTS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Payment Status Chart */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Payment Status Distribution</h3>
            <Pie
              data={paymentChartData}
              options={{
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                  legend: {
                    position: 'bottom',
                  },
                },
              }}
            />
          </div>

          {/* Acceptance Status Chart */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Campaign Acceptance Status</h3>
            <Pie
              data={acceptanceChartData}
              options={{
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                  legend: {
                    position: 'bottom',
                  },
                },
              }}
            />
          </div>

          {/* State-wise Distribution */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">State-wise Distribution</h3>
            <Bar
              data={stateChartData}
              options={{
                responsive: true,
                maintainAspectRatio: true,
                indexAxis: "y",
                plugins: { legend: { display: false } },
                scales: { x: { beginAtZero: true, ticks: { stepSize: 1 } } },
              }}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default ClientHome;

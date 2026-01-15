import React, { useState, useEffect } from "react";
import Select from "react-select";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import * as XLSX from 'xlsx-js-style';
import { API_URL } from "../../url/base";
import customSelectStyles from "../../components/common/selectStyles";

const RetailerPassbook = () => {
  // Retailer Info
  const [retailerInfo, setRetailerInfo] = useState(null);

  // Filters - ✅ Changed from single to multiple campaigns
  const [selectedCampaigns, setSelectedCampaigns] = useState([]);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // Campaign Options
  const [campaignOptions, setCampaignOptions] = useState([]);

  // Passbook Data
  const [passbookData, setPassbookData] = useState(null);
  const [displayedCampaigns, setDisplayedCampaigns] = useState([]);

  const [loading, setLoading] = useState(true);

  // ===============================
  // FETCH RETAILER INFO ON MOUNT
  // ===============================
  useEffect(() => {
    fetchRetailerInfo();
  }, []);

  const fetchRetailerInfo = async () => {
    try {
      const token = localStorage.getItem("retailer_token");
      if (!token) {
        toast.error("Please login again", { theme: "dark" });
        return;
      }

      const response = await fetch(`${API_URL}/retailer/retailer/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch retailer info");
      }

      const data = await response.json();
      setRetailerInfo(data);

      // Fetch assigned campaigns
      fetchAssignedCampaigns(token);

      // Fetch passbook data
      fetchPassbookData(data._id, token);
    } catch (err) {
      console.error("Error fetching retailer info:", err);
      toast.error("Failed to load retailer information", { theme: "dark" });
    } finally {
      setLoading(false);
    }
  };

  // ===============================
  // FETCH ASSIGNED CAMPAIGNS
  // ===============================
  const fetchAssignedCampaigns = async (token) => {
    try {
      const response = await fetch(`${API_URL}/retailer/campaigns`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      const campaigns = data.campaigns || [];

      setCampaignOptions(
        campaigns.map((c) => ({
          label: c.name,
          value: c._id,
          data: c,
        }))
      );
    } catch (err) {
      console.error("Error fetching campaigns:", err);
    }
  };

  // ===============================
  // FETCH PASSBOOK DATA
  // ===============================
  const fetchPassbookData = async (retailerId, token) => {
    if (!retailerId) return;

    try {
      const params = new URLSearchParams();
      params.append("retailerId", retailerId);

      const response = await fetch(
        `${API_URL}/budgets/passbook?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token || localStorage.getItem("retailer_token")}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data && data.data.length > 0) {
          const budgetRecord = data.data[0];
          setPassbookData(budgetRecord);
          setDisplayedCampaigns(budgetRecord.campaigns);
        } else {
          toast.info("No passbook data found", {
            theme: "dark",
            toastId: "no-passbook-data"
          });
          resetPassbookData();
        }
      } else {
        toast.error("Failed to fetch passbook data", {
          theme: "dark",
          toastId: "fetch-passbook-error"
        });
        resetPassbookData();
      }
    } catch (error) {
      console.error("Error fetching passbook:", error);
      toast.error("Failed to fetch passbook data", {
        theme: "dark",
        toastId: "fetch-passbook-error"
      });
      resetPassbookData();
    }
  };

  const resetPassbookData = () => {
    setPassbookData(null);
    setDisplayedCampaigns([]);
  };

  // ===============================
  // APPLY FILTERS - ✅ Updated for multiple campaigns
  // ===============================
  useEffect(() => {
    if (passbookData) {
      applyFilters();
    }
  }, [selectedCampaigns, fromDate, toDate, passbookData]);

  const applyFilters = () => {
    if (!passbookData) return;

    let filtered = [...passbookData.campaigns];

    // ✅ Filter by Multiple Campaigns
    if (selectedCampaigns && selectedCampaigns.length > 0) {
      const selectedCampaignIds = selectedCampaigns.map(c => c.value);
      filtered = filtered.filter((c) =>
        selectedCampaignIds.includes(c.campaignId._id)
      );
    }

    // Filter by Date Range (filter installments within campaigns)
    if (fromDate || toDate) {
      filtered = filtered.map((campaign) => {
        const filteredInstallments = campaign.installments.filter((inst) => {
          const instDate = new Date(inst.dateOfInstallment);
          const from = fromDate ? new Date(fromDate) : null;
          const to = toDate ? new Date(toDate) : null;

          if (from && to) {
            return instDate >= from && instDate <= to;
          } else if (from) {
            return instDate >= from;
          } else if (to) {
            return instDate <= to;
          }
          return true;
        });

        return {
          ...campaign,
          installments: filteredInstallments,
        };
      }).filter((campaign) => campaign.installments.length > 0);
    }

    setDisplayedCampaigns(filtered);
  };

  // ===============================
  // CLEAR FILTERS
  // ===============================
  const handleClearFilters = () => {
    setSelectedCampaigns([]);
    setFromDate("");
    setToDate("");
    if (passbookData) {
      setDisplayedCampaigns(passbookData.campaigns);
    }
  };

  // ===============================
  // DOWNLOAD PASSBOOK
  // ===============================
  const handleDownloadPassbook = () => {
    if (!passbookData || displayedCampaigns.length === 0) {
      toast.error("No data to download", { theme: "dark" });
      return;
    }

    // Helper function to parse dates
    const parseDate = (dateStr) => {
      if (!dateStr) return null;
      return new Date(dateStr);
    };

    // Helper function to format date to DD/MM/YYYY
    const formatDateToDDMMYYYY = (dateStr) => {
      if (!dateStr || dateStr === "N/A") return "N/A";

      const date = parseDate(dateStr);
      if (!date || isNaN(date.getTime())) return "N/A";

      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();

      return `${day}/${month}/${year}`;
    };

    const rows = [];

    // Row 1: Title
    rows.push({
      A: "RETAILER PASSBOOK REPORT",
      B: "", C: "", D: "", E: "", F: "", G: "", H: "", I: "", J: ""
    });

    // Row 2: Empty
    rows.push({});

    // Row 3: Retailer Details Header
    rows.push({
      A: "RETAILER DETAILS"
    });

    // Row 4: Retailer Info
    rows.push({
      A: "Outlet Code:",
      B: passbookData.outletCode,
      C: "",
      D: "Outlet Name:",
      E: passbookData.shopName,
      F: "",
      G: "Retailer Name:",
      H: retailerInfo?.name || passbookData.retailerName || "N/A"
    });

    // ✅ Row 5: Selected Campaigns (if filtered)
    if (selectedCampaigns && selectedCampaigns.length > 0) {
      rows.push({
        A: "Filtered Campaigns:",
        B: selectedCampaigns.map(c => c.label).join(", ")
      });
    }

    // Empty rows
    rows.push({});
    rows.push({});

    // Summary label
    rows.push({ A: "SUMMARY" });

    // ✅ Calculate summary based on displayed campaigns only
    const displayedTotalBudget = displayedCampaigns.reduce((sum, c) => sum + (c.tca || 0), 0);
    const displayedTotalPaid = displayedCampaigns.reduce((sum, c) => sum + (c.cPaid || 0), 0);
    const displayedTotalBalance = displayedTotalBudget - displayedTotalPaid;

    // Summary values
    rows.push({
      A: "Total Budget",
      B: `₹${displayedTotalBudget}`,
      C: "",
      D: "Total Paid",
      E: `₹${displayedTotalPaid}`,
      F: "",
      G: "Total Balance",
      H: `₹${displayedTotalBalance}`,
      I: "", J: ""
    });

    // Empty rows
    rows.push({});
    rows.push({});

    // Header
    rows.push({
      A: "S.No",
      B: "Campaign Name",
      C: "Client",
      D: "Type",
      E: "Total Campaign Amount",
      F: "Paid",
      G: "Balance",
      H: "Date",
      I: "UTR Number",
      J: "Remarks"
    });

    // Data rows with continuous S.No and running balance calculation
    let serialNumber = 1;

    displayedCampaigns.forEach((campaign) => {
      const installments = campaign.installments || [];
      const totalBudget = campaign.tca;

      if (installments.length === 0) {
        rows.push({
          A: serialNumber++,
          B: campaign.campaignName,
          C: campaign.campaignId?.client || "N/A",
          D: campaign.campaignId?.type || "N/A",
          E: totalBudget,
          F: "-",
          G: totalBudget,
          H: "-",
          I: "-",
          J: "-"
        });
      } else {
        let cumulativePaid = 0;

        // Sort installments by date (oldest first)
        const sortedInstallments = [...installments].sort((a, b) => {
          const dateA = parseDate(a.dateOfInstallment);
          const dateB = parseDate(b.dateOfInstallment);
          return dateA - dateB;
        });

        sortedInstallments.forEach((inst) => {
          const paidAmount = inst.installmentAmount || 0;
          cumulativePaid += paidAmount;
          const balance = totalBudget - cumulativePaid;

          rows.push({
            A: serialNumber++,
            B: campaign.campaignName,
            C: campaign.campaignId?.client || "N/A",
            D: campaign.campaignId?.type || "N/A",
            E: totalBudget,
            F: paidAmount,
            G: balance,
            H: formatDateToDDMMYYYY(inst.dateOfInstallment),
            I: inst.utrNumber || "-",
            J: inst.remarks || "-"
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
          } else if (rows[R] && rows[R].A === "S.No") {
            ws[cellAddress].s = headerStyle;
          } else {
            ws[cellAddress].s = dataStyle;
          }
        }
      }
    }

    // Merge cells for title
    if (!ws['!merges']) ws['!merges'] = [];
    ws['!merges'].push({
      s: { r: 0, c: 0 },
      e: { r: 0, c: 9 }
    });

    // Column widths
    ws["!cols"] = [
      { wpx: 100 },   // A: S.No
      { wpx: 200 },  // B: Campaign Name
      { wpx: 150 },  // C: Client
      { wpx: 120 },  // D: Type
      { wpx: 160 },  // E: Total Campaign Amount
      { wpx: 120 },  // F: Paid
      { wpx: 120 },  // G: Balance
      { wpx: 100 },  // H: Date
      { wpx: 120 },  // I: UTR Number
      { wpx: 120 }   // J: Remarks
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Passbook");

    XLSX.writeFile(
      wb,
      `My_Passbook_${new Date().toISOString().split('T')[0]}.xlsx`
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
              <p className="text-gray-600">Loading your passbook...</p>
            </div>
          ) : (
            <>
              {/* Filters */}
              <div className="bg-[#EDEDED] rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-lg font-semibold mb-4 text-gray-700">
                  Filter Options <span className="text-red-500">(Optional)</span>
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* ✅ Campaign Filter - Now supports multiple selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Campaigns
                    </label>
                    <Select
                      value={selectedCampaigns}
                      onChange={setSelectedCampaigns}
                      options={campaignOptions}
                      styles={customSelectStyles}
                      placeholder="Select campaigns..."
                      isClearable
                      isSearchable
                      isMulti
                    />
                    {selectedCampaigns.length > 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        {selectedCampaigns.length} campaign{selectedCampaigns.length > 1 ? 's' : ''} selected
                      </p>
                    )}
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
                      className="w-full h-[42px] px-4 text-sm border border-gray-300 rounded-lg bg-white outline-none transition focus:border-[#E4002B] focus:ring-2 focus:ring-[#E4002B]"
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
                      className="w-full h-[42px] px-4 text-sm border border-gray-300 rounded-lg bg-white outline-none transition focus:border-[#E4002B] focus:ring-2 focus:ring-[#E4002B]"
                    />
                  </div>
                </div>

                {(selectedCampaigns.length > 0 || fromDate || toDate) && (
                  <button
                    onClick={handleClearFilters}
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
                      Summary
                      {selectedCampaigns.length > 0 && (
                        <span className="text-sm font-normal text-gray-500 ml-2">
                          (Filtered: {displayedCampaigns.length} campaign{displayedCampaigns.length > 1 ? 's' : ''})
                        </span>
                      )}
                    </h2>
                    <button
                      onClick={handleDownloadPassbook}
                      disabled={displayedCampaigns.length === 0}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed cursor-pointer"
                    >
                      Download Passbook
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm mb-4">
                    <p><strong>Outlet Code:</strong> {passbookData.outletCode}</p>
                    <p><strong>Shop Name:</strong> {passbookData.shopName}</p>
                    <p><strong>State:</strong> {passbookData.state}</p>
                    <p><strong>Retailer Name:</strong> {retailerInfo?.name}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">
                        Total Budget
                        {selectedCampaigns.length > 0 && <span className="text-xs"> - Filtered</span>}
                      </p>
                      <p className="text-2xl font-bold text-blue-600">
                        ₹{selectedCampaigns.length > 0
                          ? displayedCampaigns.reduce((sum, c) => sum + (c.tca || 0), 0)
                          : passbookData.tar || 0
                        }
                      </p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">
                        Total Paid
                        {selectedCampaigns.length > 0 && <span className="text-xs"> - Filtered</span>}
                      </p>
                      <p className="text-2xl font-bold text-green-600">
                        ₹{selectedCampaigns.length > 0
                          ? displayedCampaigns.reduce((sum, c) => sum + (c.cPaid || 0), 0)
                          : passbookData.taPaid || 0
                        }
                      </p>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">
                        Total Balance
                        {selectedCampaigns.length > 0 && <span className="text-xs"> - Filtered</span>}
                      </p>
                      <p className="text-2xl font-bold text-yellow-600">
                        ₹{selectedCampaigns.length > 0
                          ? displayedCampaigns.reduce((sum, c) => sum + (c.tca || 0) - (c.cPaid || 0), 0)
                          : passbookData.taPending || 0
                        }
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
                    <p><strong>Client:</strong> {campaign.campaignId?.client || "N/A"}</p>
                    <p><strong>Type:</strong> {campaign.campaignId?.type || "N/A"}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-600">Campaign Budget</p>
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
                      <p className="text-xs text-gray-600">Balance</p>
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

              {!passbookData && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
                  <p className="font-semibold">No Passbook Data Found</p>
                  <p>No budget or payment records exist for your account.</p>
                </div>
              )}

              {passbookData && displayedCampaigns.length === 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                  <p className="font-semibold">No Data for Selected Filters</p>
                  <p>Try adjusting the campaign or date range filters.</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default RetailerPassbook;

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

const RetailerPassbook = () => {
  // Retailer Info
  const [retailerInfo, setRetailerInfo] = useState(null);

  // Filters
  const [selectedCampaign, setSelectedCampaign] = useState(null);
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
  // APPLY FILTERS
  // ===============================
  useEffect(() => {
    if (passbookData) {
      applyFilters();
    }
  }, [selectedCampaign, fromDate, toDate, passbookData]);

  const applyFilters = () => {
    if (!passbookData) return;

    let filtered = [...passbookData.campaigns];

    // Filter by Campaign
    if (selectedCampaign) {
      filtered = filtered.filter(
        (c) => c.campaignId._id === selectedCampaign.value
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
      }).filter((campaign) => campaign.installments.length > 0); // Add this line
    }

    setDisplayedCampaigns(filtered);
  };

  // ===============================
  // CLEAR FILTERS
  // ===============================
  const handleClearFilters = () => {
    setSelectedCampaign(null);
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

    const rows = [];

    // Row 1: Title
    rows.push({
      A: "RETAILER PASSBOOK REPORT",
      B: "", C: "", D: "", E: "", F: "", G: "", H: "", I: "", J: "", K: "", L: ""
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
            My Passbook
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
                  Filter Options (Optional)
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Campaign Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Campaign
                    </label>
                    <Select
                      value={selectedCampaign}
                      onChange={setSelectedCampaign}
                      options={campaignOptions}
                      styles={customSelectStyles}
                      placeholder="All Campaigns"
                      isClearable
                      isSearchable
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
                      className="w-full px-4 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-red-600 focus:outline-none"
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
                      className="w-full px-4 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-red-600 focus:outline-none"
                    />
                  </div>
                </div>

                {(selectedCampaign || fromDate || toDate) && (
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
                    <p><strong>Organization Name:</strong> {campaign.campaignId?.client || "N/A"}</p>
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

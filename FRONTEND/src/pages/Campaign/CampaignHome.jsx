import React, { useEffect, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import * as XLSX from 'xlsx-js-style';
import { API_URL } from "../../url/base";


const CampaignHome = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredCampaigns, setFilteredCampaigns] = useState([]);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [assignedRetailers, setAssignedRetailers] = useState([]);
  const [assignedEmployees, setAssignedEmployees] = useState([]);

  // For downloading master reports
  const [allEmployees, setAllEmployees] = useState([]);
  const [allRetailers, setAllRetailers] = useState([]);
  const [employeeRetailerMapping, setEmployeeRetailerMapping] = useState([]);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredCampaigns(campaigns);
    } else {
      const filtered = campaigns.filter((c) =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCampaigns(filtered);
    }
  }, [searchTerm, campaigns]);

  const fetchCampaigns = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(`${API_URL}/admin/campaigns`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || "Error fetching campaigns", { theme: "dark" });
        return;
      }

      const activeCampaigns = (data.campaigns || []).filter(c => c.isActive === true);
      setCampaigns(activeCampaigns);
      setFilteredCampaigns(activeCampaigns);
    } catch (error) {
      console.error(error);
      toast.error("Server error", { theme: "dark" });
    } finally {
      setLoading(false);
    }
  };

  // Open modal and fetch campaign details
  const handleViewCampaign = async (campaign) => {
    setSelectedCampaign(campaign);
    setIsModalOpen(true);
    setModalLoading(true);

    try {
      const token = localStorage.getItem("token");

      // Fetch retailers and employees for this campaign
      const response = await fetch(
        `${API_URL}/admin/campaign/${campaign._id}/retailers-with-employees`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await response.json();

      if (response.ok) {
        setAssignedRetailers(data.retailers || []);
        setAssignedEmployees(data.employees || []);
      } else {
        toast.error("Failed to fetch campaign details", { theme: "dark" });
      }
    } catch (error) {
      console.error("Error fetching campaign details:", error);
      toast.error("Failed to load campaign details", { theme: "dark" });
    } finally {
      setModalLoading(false);
    }
  };

  // Close modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCampaign(null);
    setAssignedRetailers([]);
    setAssignedEmployees([]);
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  // ===============================
  // DOWNLOAD EMPLOYEE MASTER
  // ===============================
  const handleDownloadEmployeeMaster = async () => {
    if (campaigns.length === 0) {
      toast.error("No campaigns available", { theme: "dark" });
      return;
    }

    toast.info("Preparing Employee Master Report...", { theme: "dark", autoClose: 2000 });

    try {
      const token = localStorage.getItem("token");

      // 1. Fetch all employees
      const empResponse = await fetch(`${API_URL}/admin/employees`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const empData = await empResponse.json();
      const employees = empData.employees || [];

      if (employees.length === 0) {
        toast.error("No employees found", { theme: "dark" });
        return;
      }

      // 2. Fetch campaign mappings for ALL campaigns
      const campaignMappings = [];
      for (const campaign of campaigns) {
        try {
          const mappingRes = await fetch(
            `${API_URL}/admin/campaign/${campaign._id}/employee-retailer-mapping`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          const mappingData = await mappingRes.json();

          if (mappingData.employees && mappingData.employees.length > 0) {
            campaignMappings.push({
              campaignId: campaign._id,
              campaignName: campaign.name,
              client: campaign.client,
              type: campaign.type,
              employees: mappingData.employees,
            });
          }
        } catch (err) {
          console.error(`Error fetching mapping for campaign ${campaign._id}:`, err);
        }
      }

      // 3. Build Excel rows
      const rows = [];

      // Title Row
      rows.push({
        A: "EMPLOYEE MASTER REPORT",
        B: "", C: "", D: "", E: "", F: "", G: "", H: "", I: "", J: "", K: "", L: "", M: "", N: "", O: ""
      });

      // Empty Row
      rows.push({});

      // Header Row
      rows.push({
        A: "S.No",
        B: "Employee Code",
        C: "Employee Name",
        D: "Email",
        E: "Phone",
        F: "Employee Type",
        G: "Position",
        H: "City",
        I: "State",
        J: "Campaign Name",
        K: "Client",
        L: "Type",
        M: "Outlet Code",
        N: "Outlet Name",
        O: "Outlet State"
      });

      let serialNumber = 1;

      // Build employee master data
      employees.forEach((employee) => {
        const employeeCampaigns = campaignMappings.filter((mapping) =>
          mapping.employees.some((emp) => emp._id === employee._id)
        );

        if (employeeCampaigns.length === 0) {
          // Employee with no campaign assignments
          rows.push({
            A: serialNumber++,
            B: employee.employeeId || "-",
            C: employee.name || "-",
            D: employee.email || "-",
            E: employee.phone || "-",
            F: employee.employeeType || "-",
            G: employee.position || "-",
            H: employee.correspondenceAddress?.city || "-",
            I: employee.correspondenceAddress?.state || "-",
            J: "No Campaign Assigned",
            K: "-",
            L: "-",
            M: "-",
            N: "-",
            O: "-"
          });
        } else {
          employeeCampaigns.forEach((campaign) => {
            const empInCampaign = campaign.employees.find(
              (emp) => emp._id === employee._id
            );

            if (empInCampaign && empInCampaign.retailers && empInCampaign.retailers.length > 0) {
              empInCampaign.retailers.forEach((retailer) => {
                rows.push({
                  A: serialNumber++,
                  B: employee.employeeId || "-",
                  C: employee.name || "-",
                  D: employee.email || "-",
                  E: employee.phone || "-",
                  F: employee.employeeType || "-",
                  G: employee.position || "-",
                  H: employee.correspondenceAddress?.city || "-",
                  I: employee.correspondenceAddress?.state || "-",
                  J: campaign.campaignName,
                  K: campaign.client,
                  L: campaign.type,
                  M: retailer.uniqueId || "-",
                  N: retailer.shopDetails?.shopName || "-",
                  O: retailer.shopDetails?.shopAddress?.state || "-"
                });
              });
            } else {
              // Employee assigned to campaign but no retailers
              rows.push({
                A: serialNumber++,
                B: employee.employeeId || "-",
                C: employee.name || "-",
                D: employee.email || "-",
                E: employee.phone || "-",
                F: employee.employeeType || "-",
                G: employee.position || "-",
                H: employee.correspondenceAddress?.city || "-",
                I: employee.correspondenceAddress?.state || "-",
                J: campaign.campaignName,
                K: campaign.client,
                L: campaign.type,
                M: "No Retailer Assigned",
                N: "-",
                O: "-"
              });
            }
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
            } else if (R === 2) {
              ws[cellAddress].s = headerStyle;
            } else {
              ws[cellAddress].s = dataStyle;
            }
          }
        }
      }

      // Merge title cells (now A1:O1 for 15 columns)
      if (!ws['!merges']) ws['!merges'] = [];
      ws['!merges'].push({
        s: { r: 0, c: 0 },
        e: { r: 0, c: 14 }
      });

      // Column widths
      ws["!cols"] = [
        { wpx: 60 },   // A: S.No
        { wpx: 120 },  // B: Employee Code
        { wpx: 150 },  // C: Employee Name
        { wpx: 180 },  // D: Email
        { wpx: 120 },  // E: Phone
        { wpx: 110 },  // F: Employee Type
        { wpx: 120 },  // G: Position
        { wpx: 100 },  // H: City
        { wpx: 100 },  // I: State
        { wpx: 180 },  // J: Campaign Name
        { wpx: 150 },  // K: Client
        { wpx: 130 },  // L: Type
        { wpx: 120 },  // M: Outlet Code
        { wpx: 180 },  // N: Outlet Name
        { wpx: 100 }   // O: Outlet State
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Employee Master");

      XLSX.writeFile(
        wb,
        `Employee_Master_${new Date().toISOString().split('T')[0]}.xlsx`
      );

      toast.success("Employee Master downloaded successfully!", { theme: "dark" });
    } catch (error) {
      console.error("Error downloading employee master:", error);
      toast.error("Failed to download employee master", { theme: "dark" });
    }
  };

  // ===============================
  // DOWNLOAD RETAILER MASTER
  // ===============================
  const handleDownloadRetailerMaster = async () => {
    if (campaigns.length === 0) {
      toast.error("No campaigns available", { theme: "dark" });
      return;
    }

    toast.info("Preparing Retailer Master Report...", { theme: "dark", autoClose: 2000 });

    try {
      const token = localStorage.getItem("token");

      // 1. Fetch all retailers
      const retResponse = await fetch(`${API_URL}/admin/retailers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const retData = await retResponse.json();
      const retailers = retData.retailers || [];

      if (retailers.length === 0) {
        toast.error("No retailers found", { theme: "dark" });
        return;
      }

      // 2. Fetch campaign mappings for ALL campaigns
      const campaignMappings = [];
      for (const campaign of campaigns) {
        try {
          const mappingRes = await fetch(
            `${API_URL}/admin/campaign/${campaign._id}/employee-retailer-mapping`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          const mappingData = await mappingRes.json();

          if (mappingData.employees && mappingData.employees.length > 0) {
            campaignMappings.push({
              campaignId: campaign._id,
              campaignName: campaign.name,
              client: campaign.client,
              type: campaign.type,
              employees: mappingData.employees,
            });
          }
        } catch (err) {
          console.error(`Error fetching mapping for campaign ${campaign._id}:`, err);
        }
      }

      // 3. Build Excel rows
      const rows = [];

      // Title Row
      rows.push({
        A: "RETAILER MASTER REPORT",
        B: "", C: "", D: "", E: "", F: "", G: "", H: "", I: "", J: "", K: "", L: "", M: ""
      });

      // Empty Row
      rows.push({});

      // Header Row
      rows.push({
        A: "S.No",
        B: "Outlet Code",
        C: "Outlet Name",
        D: "Contact Number",
        E: "Email",
        F: "Business Type",
        G: "State",
        H: "City",
        I: "Campaign Name",
        J: "Client",
        K: "Type",
        L: "Employee Code",
        M: "Employee Name"
      });

      let serialNumber = 1;

      // Build retailer master data
      retailers.forEach((retailer) => {
        const retailerCampaigns = campaigns.filter((campaign) =>
          campaign.assignedRetailers?.some(
            (ar) => {
              const retailerId = ar.retailerId?._id || ar.retailerId;
              return retailerId?.toString() === retailer._id?.toString();
            }
          )
        );

        if (retailerCampaigns.length === 0) {
          // Retailer with no campaign assignments
          rows.push({
            A: serialNumber++,
            B: retailer.uniqueId || "-",
            C: retailer.shopDetails?.shopName || "-",
            D: retailer.contactNo || "-",
            E: retailer.email || "-",
            F: retailer.shopDetails?.businessType || "-",
            G: retailer.shopDetails?.shopAddress?.state || "-",
            H: retailer.shopDetails?.shopAddress?.city || "-",
            I: "No Campaign Assigned",
            J: "-",
            K: "-",
            L: "-",
            M: "-"
          });
        } else {
          retailerCampaigns.forEach((campaign) => {
            // Find employee assigned to this retailer in this campaign
            const mapping = campaignMappings.find(
              (m) => m.campaignId === campaign._id
            );

            let assignedEmployee = null;
            if (mapping) {
              for (const emp of mapping.employees) {
                const foundRetailer = emp.retailers?.find(
                  (r) => r._id?.toString() === retailer._id?.toString() ||
                    r.uniqueId === retailer.uniqueId
                );
                if (foundRetailer) {
                  assignedEmployee = emp;
                  break;
                }
              }
            }

            rows.push({
              A: serialNumber++,
              B: retailer.uniqueId || "-",
              C: retailer.shopDetails?.shopName || "-",
              D: retailer.contactNo || "-",
              E: retailer.email || "-",
              F: retailer.shopDetails?.businessType || "-",
              G: retailer.shopDetails?.shopAddress?.state || "-",
              H: retailer.shopDetails?.shopAddress?.city || "-",
              I: campaign.name,
              J: campaign.client,
              K: campaign.type,
              L: assignedEmployee ? (assignedEmployee.employeeId || "-") : "Not Assigned",
              M: assignedEmployee ? (assignedEmployee.name || "-") : "-"
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
            } else if (R === 2) {
              ws[cellAddress].s = headerStyle;
            } else {
              ws[cellAddress].s = dataStyle;
            }
          }
        }
      }

      // Merge title cells
      if (!ws['!merges']) ws['!merges'] = [];
      ws['!merges'].push({
        s: { r: 0, c: 0 },
        e: { r: 0, c: 12 }
      });

      // Column widths
      ws["!cols"] = [
        { wpx: 60 },   // S.No
        { wpx: 120 },  // Outlet Code
        { wpx: 180 },  // Outlet Name
        { wpx: 120 },  // Contact
        { wpx: 180 },  // Email
        { wpx: 120 },  // Business Type
        { wpx: 100 },  // State
        { wpx: 100 },  // City
        { wpx: 180 },  // Campaign Name
        { wpx: 150 },  // Client
        { wpx: 130 },  // Type
        { wpx: 120 },  // Employee Code
        { wpx: 150 }   // Employee Name
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Retailer Master");

      XLSX.writeFile(
        wb,
        `Retailer_Master_${new Date().toISOString().split('T')[0]}.xlsx`
      );

      toast.success("Retailer Master downloaded successfully!", { theme: "dark" });
    } catch (error) {
      console.error("Error downloading retailer master:", error);
      toast.error("Failed to download retailer master", { theme: "dark" });
    }
  };

  const formatValue = (value) => {
    if (Array.isArray(value)) {
      if (value.length > 5) {
        return value.slice(0, 5).join(", ") + "...";
      }
      return value.join(", ");
    }
    return value || "-";
  };

  return (
    <>
      <ToastContainer />

      <div className="w-full p-4">
        {/* Header with Download Buttons */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-[#E4002B]">
            Campaigns
          </h1>

          <div className="flex gap-3">
            <button
              onClick={handleDownloadEmployeeMaster}
              disabled={loading || campaigns.length === 0}
              className={`px-4 py-2 rounded-lg font-semibold transition cursor-pointer ${loading || campaigns.length === 0
                ? "bg-gray-400 cursor-not-allowed text-white"
                : "bg-green-600 hover:bg-green-700 text-white"
                }`}
            >
              Download Employee Master
            </button>

            <button
              onClick={handleDownloadRetailerMaster}
              disabled={loading || campaigns.length === 0}
              className={`px-4 py-2 rounded-lg font-semibold transition cursor-pointer ${loading || campaigns.length === 0
                ? "bg-gray-400 cursor-not-allowed text-white"
                : "bg-blue-600 hover:bg-blue-700 text-white"
                }`}
            >
              Download Retailer Master
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="w-full mb-6">
          <input
            type="text"
            placeholder="Search campaign by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 bg-white py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E4002B] focus:border-transparent"
          />
        </div>

        {/* Loading */}
        {loading && <p className="text-center text-gray-500 text-lg">Loading...</p>}

        {/* No Data */}
        {!loading && campaigns.length === 0 && (
          <p className="text-center text-gray-500 text-lg">No campaigns found.</p>
        )}


        {/* Card Layout */}
        {!loading && campaigns.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredCampaigns.map((c) => (
              <div
                key={c._id}
                className="bg-[#EDEDED] shadow-md rounded-xl border border-gray-200 p-6 hover:shadow-lg transition h-full flex flex-col justify-between"
              >
                <h2 className="text-xl font-bold text-gray-800">{c.name}</h2>

                <p className="mt-2 text-gray-600">
                  <strong>Client:</strong> {c.client}
                </p>

                <p className="text-gray-600">
                  <strong>Type:</strong> {c.type}
                </p>

                <p className="text-gray-600">
                  <strong>Region(s):</strong> {formatValue(c.regions)}
                </p>

                <p className="text-gray-600">
                  <strong>State(s):</strong> {formatValue(c.states)}
                </p>

                {c.createdBy?.name && (
                  <p className="text-gray-600">
                    <strong>Created By:</strong> {c.createdBy.name}
                  </p>
                )}

                <div className="w-full h-[1px] bg-gray-200 my-3"></div>

                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-gray-600 text-sm">
                      <strong>Employees:</strong>{" "}
                      {c.assignedEmployees?.length || 0}
                    </p>
                    <p className="text-gray-600 text-sm">
                      <strong>Retailers:</strong>{" "}
                      {c.assignedRetailers?.length || 0}
                    </p>
                  </div>

                  <button
                    onClick={() => handleViewCampaign(c)}
                    className="bg-[#E4002B] text-white px-4 py-1 rounded-md text-sm hover:bg-[#C3002B] cursor-pointer transition"
                  >
                    View
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="bg-[#E4002B] text-white p-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold">
                {selectedCampaign?.name}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-white hover:text-gray-200 text-3xl font-bold cursor-pointer transition"
              >
                &times;
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1">
              {modalLoading ? (
                <p className="text-center text-gray-500 py-8">Loading campaign details...</p>
              ) : (
                <div className="space-y-6">
                  {/* Campaign Info */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold mb-2 text-gray-800">Campaign Details</h3>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <p><strong>Client:</strong> {selectedCampaign?.client}</p>
                      <p><strong>Type:</strong> {selectedCampaign?.type}</p>
                      <p><strong>Regions:</strong> {formatValue(selectedCampaign?.regions)}</p>
                      <p><strong>States:</strong> {formatValue(selectedCampaign?.states)}</p>
                    </div>
                  </div>

                  {/* Assigned Employees Table */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-gray-800">
                      Assigned Employees ({assignedEmployees.length})
                    </h3>
                    {assignedEmployees.length === 0 ? (
                      <p className="text-gray-500 text-sm py-3">No employees assigned to this campaign.</p>
                    ) : (
                      <div className="overflow-x-auto border border-gray-200 rounded-lg">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-100">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">S.No</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">Employee Code</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">Name</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">Email</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">Phone</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">Position</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {assignedEmployees.map((emp, index) => (
                              <tr key={emp._id} className="hover:bg-gray-50">
                                <td className="px-4 py-2 text-sm">{index + 1}</td>
                                <td className="px-4 py-2 text-sm font-medium text-gray-700">{emp.employeeId || "-"}</td>
                                <td className="px-4 py-2 text-sm">{emp.name}</td>
                                <td className="px-4 py-2 text-sm text-gray-600">{emp.email}</td>
                                <td className="px-4 py-2 text-sm text-gray-600">{emp.phone}</td>
                                <td className="px-4 py-2 text-sm text-gray-600">{emp.position || "-"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Assigned Retailers Table */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-gray-800">
                      Assigned Retailers ({assignedRetailers.length})
                    </h3>
                    {assignedRetailers.length === 0 ? (
                      <p className="text-gray-500 text-sm py-3">No retailers assigned to this campaign.</p>
                    ) : (
                      <div className="overflow-x-auto border border-gray-200 rounded-lg">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-100">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">S.No</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">Outlet Code</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">Shop Name</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">Business Type</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">Contact</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">State</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">City</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {assignedRetailers.map((ret, index) => (
                              <tr key={ret._id} className="hover:bg-gray-50">
                                <td className="px-4 py-2 text-sm">{index + 1}</td>
                                <td className="px-4 py-2 text-sm font-medium text-gray-700">{ret.uniqueId || "-"}</td>
                                <td className="px-4 py-2 text-sm">{ret.shopDetails?.shopName || "-"}</td>
                                <td className="px-4 py-2 text-sm text-gray-600">{ret.shopDetails?.businessType || "-"}</td>
                                <td className="px-4 py-2 text-sm text-gray-600">{ret.contactNo || "-"}</td>
                                <td className="px-4 py-2 text-sm text-gray-600">{ret.shopDetails?.shopAddress?.state || "-"}</td>
                                <td className="px-4 py-2 text-sm text-gray-600">{ret.shopDetails?.shopAddress?.city || "-"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 p-4 flex justify-end border-t">
              <button
                onClick={handleCloseModal}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CampaignHome;

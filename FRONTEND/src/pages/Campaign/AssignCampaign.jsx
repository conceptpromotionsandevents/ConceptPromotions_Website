import React, { useState, useEffect, useRef } from "react";
import Select from "react-select";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { API_URL } from "../../url/base";
import { FaUpload, FaDownload, FaTimes, FaFileExcel } from "react-icons/fa";
import ExcelJS from 'exceljs';

const BUSINESS_TYPES = [
  "Grocery Retailer",
  "Wholesale",
  "Key Accounts",
  "Salon / Beauty Parlour",
  "Self Service Outlet",
  "Chemist Outlet",
  "Other",
];

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
  menu: (provided) => ({ ...provided, zIndex: 60 }),
};

const AssignCampaign = () => {
  // Campaign Selection
  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);

  // Assignment Flow
  const [assignTarget, setAssignTarget] = useState(null);

  // Bulk Upload States
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkPartyType, setBulkPartyType] = useState(null); // NEW: Party type for bulk
  const [bulkFile, setBulkFile] = useState(null);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkResult, setBulkResult] = useState(null);

  // Filters
  const [state, setState] = useState(null);
  const [businessType, setBusinessType] = useState(null);
  const [futureField, setFutureField] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Data
  const [allRetailers, setAllRetailers] = useState([]);
  const [tableData, setTableData] = useState([]);
  const [selectedRetailers, setSelectedRetailers] = useState([]);
  const [loadingRetailers, setLoadingRetailers] = useState(false);
  const [assigning, setAssigning] = useState(false);

  // Employee States
  const [allEmployees, setAllEmployees] = useState([]);
  const [employeeTableData, setEmployeeTableData] = useState([]);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [employeeState, setEmployeeState] = useState(null);
  const [employeeFutureField1, setEmployeeFutureField1] = useState(null);
  const [employeeFutureField2, setEmployeeFutureField2] = useState(null);
  const [employeeSearchQuery, setEmployeeSearchQuery] = useState("");

  // Fetch Campaigns
  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/admin/campaigns`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Error fetching campaigns", { theme: "dark" });
        return;
      }

      const activeCampaigns = data.campaigns.filter((c) => c.isActive === true);
      const campaignOptions = activeCampaigns.map((c) => ({
        value: c._id,
        label: c.name,
        data: c,
      }));

      setCampaigns(campaignOptions);
    } catch (err) {
      console.log("Campaign Fetch Error", err);
      toast.error("Failed to load campaigns", { theme: "dark" });
    } finally {
      setLoadingCampaigns(false);
    }
  };

  // Fetch ALL Retailers
  const fetchAllRetailers = async () => {
    setLoadingRetailers(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/admin/retailers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error("Failed to fetch retailers", { theme: "dark" });
        return;
      }

      const retailers = data.retailers;
      setAllRetailers(retailers);
      applyFilters(retailers);
      toast.success(`Loaded ${retailers.length} retailers`, { theme: "dark" });
    } catch (err) {
      console.log("Retailer Fetch Error", err);
      toast.error("Error loading retailers", { theme: "dark" });
    } finally {
      setLoadingRetailers(false);
    }
  };

  // Fetch ALL Employees
  const fetchAllEmployees = async () => {
    setLoadingEmployees(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/admin/employees`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error("Failed to fetch employees", { theme: "dark" });
        return;
      }

      const employees = data.employees;
      setAllEmployees(employees);
      applyEmployeeFilters(employees);
      toast.success(`Loaded ${employees.length} employees`, { theme: "dark" });
    } catch (err) {
      toast.error("Error loading employees", { theme: "dark" });
    } finally {
      setLoadingEmployees(false);
    }
  };

  // Apply filters to retailers
  const applyFilters = (retailersList = allRetailers) => {
    let filtered = [...retailersList];

    if (selectedCampaign?.data?.states) {
      const allowedStates = selectedCampaign.data.states;
      if (!allowedStates.includes("All") && !allowedStates.includes("All States")) {
        filtered = filtered.filter((r) =>
          allowedStates.includes(r?.shopDetails?.shopAddress?.state)
        );
      }
    }

    if (state) {
      filtered = filtered.filter(
        (r) => r.shopDetails?.shopAddress?.state === state.value
      );
    }

    if (businessType) {
      filtered = filtered.filter(
        (r) => r.shopDetails?.businessType === businessType.value
      );
    }

    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.uniqueId?.toLowerCase().includes(query) ||
          r.shopDetails?.shopName?.toLowerCase().includes(query) ||
          r.name?.toLowerCase().includes(query)
      );
    }

    // Add assignment status
    filtered = filtered.map((r) => {
      const assignedRetailer = selectedCampaign?.data?.assignedRetailers?.find(
        (ar) => ar.retailerId === r._id || ar.retailerId?._id === r._id
      );
      return {
        ...r,
        assignmentStatus: assignedRetailer ? assignedRetailer.status : "not_assigned",
      };
    });

    setTableData(filtered);
    if (filtered.length === 0) {
      toast.info("No retailers match your search/filter.", { theme: "dark" });
    }
  };

  // Apply filters to employees
  const applyEmployeeFilters = (employeesList = allEmployees) => {
    let filtered = [...employeesList];

    if (employeeState) {
      filtered = filtered.filter(
        (e) => e.correspondenceAddress?.state === employeeState.value
      );
    }

    if (employeeSearchQuery.trim() !== "") {
      const query = employeeSearchQuery.toLowerCase();
      filtered = filtered.filter(
        (e) =>
          e.employeeId?.toLowerCase().includes(query) ||
          e.name?.toLowerCase().includes(query)
      );
    }

    // Add assignment status
    filtered = filtered.map((e) => {
      const assignedEmployee = selectedCampaign?.data?.assignedEmployees?.find(
        (ae) => ae.employeeId === e._id || ae.employeeId?._id === e._id
      );
      return {
        ...e,
        assignmentStatus: assignedEmployee ? assignedEmployee.status : "not_assigned",
      };
    });

    setEmployeeTableData(filtered);
    if (filtered.length === 0) {
      toast.info("No employees match search/filter.", { theme: "dark" });
    }
  };

  // Effects for fetching and filtering
  useEffect(() => {
    if (assignTarget === "retailer" && allRetailers.length === 0) {
      fetchAllRetailers();
    } else if (assignTarget === "retailer" && allRetailers.length > 0) {
      applyFilters();
    }
  }, [assignTarget]);

  useEffect(() => {
    if (allRetailers.length > 0 && assignTarget === "retailer") {
      applyFilters();
    }
  }, [state, businessType, futureField, searchQuery]);

  useEffect(() => {
    setSelectedRetailers((prev) =>
      prev.filter((id) => tableData.some((r) => r._id === id))
    );
  }, [tableData]);

  useEffect(() => {
    if (assignTarget === "employee" && allEmployees.length === 0) {
      fetchAllEmployees();
    } else if (assignTarget === "employee" && allEmployees.length > 0) {
      applyEmployeeFilters();
    }
  }, [assignTarget]);

  useEffect(() => {
    if (assignTarget === "employee" && allEmployees.length > 0) {
      applyEmployeeFilters();
    }
  }, [employeeState, employeeFutureField1, employeeFutureField2, employeeSearchQuery]);

  useEffect(() => {
    setSelectedEmployees((prev) =>
      prev.filter((id) => employeeTableData.some((e) => e._id === id))
    );
  }, [employeeTableData]);

  // Prevent background scroll when modal is open
  useEffect(() => {
    if (showBulkModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showBulkModal]);


  // Checkbox handlers for retailers
  const handleCheckboxChange = (retailerId, assignmentStatus) => {
    if (assignmentStatus && assignmentStatus !== "not_assigned") {
      toast.warning(`This retailer is already ${assignmentStatus} for this campaign!`, {
        theme: "dark",
        autoClose: 3000,
      });
      return;
    }

    setSelectedRetailers((prev) => {
      if (prev.includes(retailerId)) {
        return prev.filter((id) => id !== retailerId);
      } else {
        return [...prev, retailerId];
      }
    });
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const selectableIds = tableData
        .filter((r) => r.assignmentStatus === "not_assigned")
        .map((r) => r._id);

      if (selectableIds.length === 0) {
        toast.info("All displayed retailers are already assigned to this campaign", {
          theme: "dark",
        });
        return;
      }

      const alreadyAssignedCount = tableData.length - selectableIds.length;
      if (alreadyAssignedCount > 0) {
        toast.info(`${alreadyAssignedCount} retailers skipped (already assigned)`, {
          theme: "dark",
        });
      }

      setSelectedRetailers(selectableIds);
    } else {
      setSelectedRetailers([]);
    }
  };

  const selectableRetailers = tableData.filter((r) => r.assignmentStatus === "not_assigned");
  const isAllSelected =
    selectableRetailers.length > 0 &&
    selectedRetailers.length === selectableRetailers.length &&
    selectableRetailers.every((r) => selectedRetailers.includes(r._id));
  const isSomeSelected = selectedRetailers.length > 0 && !isAllSelected;

  // Checkbox handlers for employees
  const handleEmployeeCheckboxChange = (employeeId, assignmentStatus) => {
    if (assignmentStatus && assignmentStatus !== "not_assigned") {
      toast.warning(`This employee is already ${assignmentStatus} for this campaign!`, {
        theme: "dark",
        autoClose: 3000,
      });
      return;
    }

    setSelectedEmployees((prev) => {
      if (prev.includes(employeeId)) {
        return prev.filter((id) => id !== employeeId);
      } else {
        return [...prev, employeeId];
      }
    });
  };

  const handleEmployeeSelectAll = (e) => {
    if (e.target.checked) {
      const selectableIds = employeeTableData
        .filter((emp) => emp.assignmentStatus === "not_assigned")
        .map((emp) => emp._id);

      if (selectableIds.length === 0) {
        toast.info("All displayed employees are already assigned to this campaign", {
          theme: "dark",
        });
        return;
      }

      const alreadyAssignedCount = employeeTableData.length - selectableIds.length;
      if (alreadyAssignedCount > 0) {
        toast.info(`${alreadyAssignedCount} employees skipped (already assigned)`, {
          theme: "dark",
        });
      }

      setSelectedEmployees(selectableIds);
    } else {
      setSelectedEmployees([]);
    }
  };

  const selectableEmployees = employeeTableData.filter(
    (e) => e.assignmentStatus === "not_assigned"
  );
  const isAllEmployeesSelected =
    selectableEmployees.length > 0 &&
    selectedEmployees.length === selectableEmployees.length &&
    selectableEmployees.every((e) => selectedEmployees.includes(e._id));
  const isSomeEmployeesSelected = selectedEmployees.length > 0 && !isAllEmployeesSelected;

  // Handle individual assignment
  const handleAssign = async () => {
    if (!selectedCampaign) {
      toast.error("Please select a campaign first", { theme: "dark" });
      return;
    }

    const targetCount =
      assignTarget === "retailer" ? selectedRetailers.length : selectedEmployees.length;
    const targetType = assignTarget === "retailer" ? "retailers" : "employees";

    if (targetCount === 0) {
      toast.error(`Please select at least one ${assignTarget}`, { theme: "dark" });
      return;
    }

    const confirmMessage = `Are you sure you want to assign "${selectedCampaign.label}" to ${targetCount} ${targetType}?`;
    if (!window.confirm(confirmMessage)) return;

    setAssigning(true);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/admin/campaigns/assign`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          campaignId: selectedCampaign.value,
          retailerIds: assignTarget === "retailer" ? selectedRetailers : [],
          employeeIds: assignTarget === "employee" ? selectedEmployees : [],
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || "Failed to assign campaign", {
          theme: "dark",
          autoClose: 5000,
        });
      } else {
        toast.success(
          data.message || `Campaign assigned to ${targetCount} ${targetType}!`,
          { theme: "dark", autoClose: 4000 }
        );

        // Remove assigned items from lists
        if (assignTarget === "retailer") {
          setAllRetailers((prev) => prev.filter((r) => !selectedRetailers.includes(r._id)));
          setTableData((prev) => prev.filter((r) => !selectedRetailers.includes(r._id)));
          setSelectedRetailers([]);
        } else {
          setAllEmployees((prev) => prev.filter((e) => !selectedEmployees.includes(e._id)));
          setEmployeeTableData((prev) =>
            prev.filter((e) => !selectedEmployees.includes(e._id))
          );
          setSelectedEmployees([]);
        }
      }
    } catch (error) {
      console.error("Assign error", error);
      toast.error("Network error. Unable to reach server", {
        theme: "dark",
        autoClose: 5000,
      });
    } finally {
      setAssigning(false);
    }
  };

  const handleCampaignChange = (selected) => {
    setSelectedCampaign(selected);
    setAssignTarget(null);
    setState(null);
    setBusinessType(null);
    setFutureField(null);
    setTableData([]);
    setSelectedRetailers([]);
    setAllRetailers([]);
    setEmployeeTableData([]);
    setSelectedEmployees([]);
    setAllEmployees([]);
    setEmployeeState(null);
    setEmployeeSearchQuery("");
  };

  // ============================================
  // BULK UPLOAD FUNCTIONS (UPDATED)
  // ============================================

  const downloadBulkTemplate = () => {
    if (!bulkPartyType) {
      toast.error("Please select party type first", { theme: "dark" });
      return;
    }

    let fileName;
    let publicPath;

    if (bulkPartyType === "employee") {
      fileName = "Employee_Campaign_Assignment_Template.xlsx";
      publicPath = "https://res.cloudinary.com/dltqp0vgg/raw/upload/v1768482373/Employee_Campaign_Assignment_Template_d6g498.xlsx";
    } else {
      fileName = "Retailer_Campaign_Assignment_Template.xlsx";
      publicPath = "https://res.cloudinary.com/dltqp0vgg/raw/upload/v1768482373/Retailer_Campaign_Assignment_Template_gpjtkw.xlsx";
    }

    const link = document.createElement("a");
    link.href = publicPath;
    link.download = fileName;
    link.click();

    toast.success("Template downloaded", { theme: "dark" });
  };


  const handleBulkFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const fileExtension = file.name.split(".").pop().toLowerCase();
      if (fileExtension !== "xlsx" && fileExtension !== "xls") {
        toast.error("Please upload only Excel files (.xlsx or .xls)", { theme: "dark" });
        return;
      }
      setBulkFile(file);
      setBulkResult(null);
    }
  };

  const handleBulkUpload = async () => {
    if (!bulkPartyType) {
      toast.error("Please select party type first", { theme: "dark" });
      return;
    }

    if (!bulkFile) {
      toast.error("Please select an Excel file to upload", { theme: "dark" });
      return;
    }

    setBulkUploading(true);
    setBulkResult(null);

    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("file", bulkFile);

      const response = await fetch(`${API_URL}/admin/campaigns/bulk-assign`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok || response.status === 207) {
        setBulkResult(data);

        if (data.summary?.failed === 0) {
          toast.success(
            `All ${data.summary.successful} assignments completed successfully!`,
            { theme: "dark", autoClose: 3000 }
          );
        } else {
          toast.warning(
            `${data.summary.successful} successful, ${data.summary.failed} failed. Check details below.`,
            { theme: "dark", autoClose: 5000 }
          );
        }
      } else {
        setBulkResult(data);
        toast.error(data.message || "Bulk upload failed", { theme: "dark" });
      }
    } catch (error) {
      console.error("Bulk upload error:", error);
      toast.error("Network error. Please try again.", { theme: "dark" });
    } finally {
      setBulkUploading(false);
    }
  };

  const downloadFailedRows = async () => {
    if (!bulkResult || !bulkResult.failedRows || bulkResult.failedRows.length === 0) {
      toast.error("No failed rows to download", { theme: "dark" });
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Failed Rows");

    if (bulkPartyType === "employee") {
      worksheet.columns = [
        { header: "Row Number", key: "rowNumber", width: 12 },
        { header: "Reason", key: "reason", width: 50 },
        { header: "Campaign Name", key: "campaignName", width: 30 },
        { header: "Employee ID", key: "employeeId", width: 20 },
      ];

      bulkResult.failedRows.forEach((row) => {
        worksheet.addRow({
          rowNumber: row.rowNumber || "-",
          reason: row.reason,
          campaignName: row.data?.campaignName || "-",
          employeeId: row.data?.employeeId || "-",
        });
      });
    } else {
      worksheet.columns = [
        { header: "Row Number", key: "rowNumber", width: 12 },
        { header: "Reason", key: "reason", width: 50 },
        { header: "Campaign Name", key: "campaignName", width: 30 },
        { header: "Outlet Code", key: "outletCode", width: 20 },
      ];

      bulkResult.failedRows.forEach((row) => {
        worksheet.addRow({
          rowNumber: row.rowNumber || "-",
          reason: row.reason,
          campaignName: row.data?.campaignName || "-",
          outletCode: row.data?.outletCode || "-",
        });
      });
    }

    // Style the header row (keep existing styling code)
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
      link.download = `Failed_${bulkPartyType}_Assignment_${new Date().toISOString().split("T")[0]}.xlsx`;
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
    setBulkPartyType(null);
    setBulkFile(null);
    setBulkResult(null);
    document.getElementById("bulkFileUpload")?.value ? document.getElementById("bulkFileUpload").value = "" : null;
  };

  return (
    <>
      <ToastContainer />

      <div className="min-h-screen bg-[#171717] p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header with Bulk Upload Button */}
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-[#E4002B]">Assign Campaign</h1>

            <button
              onClick={() => setShowBulkModal(true)}
              className="flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition bg-[#E4002B] text-white hover:bg-[#c4001f] cursor-pointer"
            >
              <FaUpload />
              Bulk Upload
            </button>
          </div>

          {/* Campaign Selection */}
          <div className="bg-[#EDEDED] rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-700">Select Campaign</h2>
            <Select
              value={selectedCampaign}
              onChange={handleCampaignChange}
              options={campaigns}
              isLoading={loadingCampaigns}
              styles={customSelectStyles}
              placeholder="Choose a campaign..."
              isSearchable
              className="max-w-md"
            />

            {selectedCampaign && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg text-sm">
                <p>
                  <strong>Client:</strong> {selectedCampaign.data.client}
                </p>
                <p>
                  <strong>Type:</strong> {selectedCampaign.data.type}
                </p>
                <p>
                  <strong>Regions:</strong>{" "}
                  {Array.isArray(selectedCampaign.data.regions)
                    ? selectedCampaign.data.regions.join(", ")
                    : selectedCampaign.data.region || "N/A"}
                </p>
                <p>
                  <strong>States:</strong>{" "}
                  {Array.isArray(selectedCampaign.data.states)
                    ? selectedCampaign.data.states.join(", ")
                    : selectedCampaign.data.state || "N/A"}
                </p>
              </div>
            )}
          </div>

          {/* Assignment Target Selection */}
          {selectedCampaign && (
            <div className="bg-[#EDEDED] rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold mb-4 text-gray-700">Assign To</h2>
              <Select
                value={
                  assignTarget
                    ? {
                      label: assignTarget === "retailer" ? "Retailer" : "Employee",
                      value: assignTarget,
                    }
                    : null
                }
                onChange={(e) => {
                  setAssignTarget(e.value);
                  setState(null);
                  setBusinessType(null);
                  setFutureField(null);
                  setTableData([]);
                  setSelectedRetailers([]);
                  setEmployeeState(null);
                  setEmployeeFutureField1(null);
                  setEmployeeFutureField2(null);
                  setEmployeeSearchQuery("");
                  setEmployeeTableData([]);
                  setSelectedEmployees([]);
                }}
                options={[
                  { label: "Retailer", value: "retailer" },
                  { label: "Employee", value: "employee" },
                ]}
                styles={customSelectStyles}
                className="mb-6 max-w-md"
                placeholder="Select target"
              />

              {/* RETAILER SECTION */}
              {assignTarget === "retailer" && (
                <>
                  <h2 className="text-lg font-semibold mb-4 text-gray-700">
                    Filter Retailers {loadingRetailers ? "(Loading...)" : ""}
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        State
                      </label>
                      <Select
                        value={state}
                        onChange={setState}
                        options={[
                          ...new Set(
                            allRetailers.map((r) => r?.shopDetails?.shopAddress?.state)
                          ),
                        ]
                          .filter(Boolean)
                          .map((state) => ({ label: state, value: state }))}
                        styles={customSelectStyles}
                        placeholder="Select state"
                        isSearchable
                        isClearable
                        isDisabled={loadingRetailers}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Business Type
                      </label>
                      <Select
                        value={businessType}
                        onChange={setBusinessType}
                        options={BUSINESS_TYPES.map((b) => ({ label: b, value: b }))}
                        styles={customSelectStyles}
                        placeholder="Select business type"
                        isSearchable
                        isClearable
                        isDisabled={loadingRetailers}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Future Filter
                      </label>
                      <Select
                        value={futureField}
                        onChange={setFutureField}
                        options={[]}
                        styles={customSelectStyles}
                        placeholder="Coming soon..."
                        isDisabled
                      />
                    </div>
                  </div>

                  {/* Search Bar */}
                  <div className="flex items-center justify-between mb-6 gap-4">
                    <input
                      type="text"
                      placeholder="Search by Unique Code, Outlet Name, Retailer Name..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 bg-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E4002B] focus:border-transparent"
                    />
                    {(searchQuery || state || businessType) && (
                      <button
                        onClick={() => {
                          setSearchQuery("");
                          setState(null);
                          setBusinessType(null);
                        }}
                        className="text-sm text-red-600 underline hover:text-red-800"
                      >
                        Clear Filters
                      </button>
                    )}
                  </div>
                </>
              )}

              {/* EMPLOYEE SECTION */}
              {assignTarget === "employee" && (
                <>
                  <h2 className="text-lg font-semibold mb-4 text-gray-700">
                    Filter Employees {loadingEmployees ? "(Loading...)" : ""}
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        State
                      </label>
                      <Select
                        value={employeeState}
                        onChange={setEmployeeState}
                        options={[
                          ...new Set(
                            allEmployees.map((e) => e?.correspondenceAddress?.state)
                          ),
                        ]
                          .filter(Boolean)
                          .map((s) => ({ label: s, value: s }))}
                        styles={customSelectStyles}
                        placeholder="Select state"
                        isSearchable
                        isClearable
                        isDisabled={loadingEmployees}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Future Filter 1
                      </label>
                      <Select
                        value={employeeFutureField1}
                        onChange={setEmployeeFutureField1}
                        options={[]}
                        styles={customSelectStyles}
                        placeholder="Coming soon..."
                        isDisabled
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Future Filter 2
                      </label>
                      <Select
                        value={employeeFutureField2}
                        onChange={setEmployeeFutureField2}
                        options={[]}
                        styles={customSelectStyles}
                        placeholder="Coming soon..."
                        isDisabled
                      />
                    </div>
                  </div>

                  {/* Search Bar */}
                  <div className="flex items-center justify-between mb-6 gap-4">
                    <input
                      type="text"
                      placeholder="Search by Employee ID, Name..."
                      value={employeeSearchQuery}
                      onChange={(e) => setEmployeeSearchQuery(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 bg-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E4002B] focus:border-transparent"
                    />
                    {(employeeSearchQuery || employeeState) && (
                      <button
                        onClick={() => {
                          setEmployeeSearchQuery("");
                          setEmployeeState(null);
                          setEmployeeFutureField1(null);
                          setEmployeeFutureField2(null);
                        }}
                        className="text-sm text-red-600 underline hover:text-red-800"
                      >
                        Clear Filters
                      </button>
                    )}
                  </div>
                </>
              )}

              {/* RETAILER TABLE */}
              {loadingRetailers ||
                (tableData.length > 0 && assignTarget === "retailer" && (
                  <div className="bg-white rounded-lg shadow-md p-6 mt-6">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-lg font-semibold text-gray-700">
                        {loadingRetailers
                          ? "Loading Retailers..."
                          : `Select Retailers (${tableData.length} found, ${selectedRetailers.length} selected)`}
                      </h2>
                    </div>

                    {loadingRetailers ? (
                      <div className="text-center py-8 text-gray-500">
                        Fetching retailers...
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    onChange={handleSelectAll}
                                    checked={isAllSelected}
                                    ref={(input) => {
                                      if (input) input.indeterminate = isSomeSelected;
                                    }}
                                    className="w-4 h-4 cursor-pointer"
                                  />
                                  All
                                </label>
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                S.No
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Unique Code
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Outlet Name
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Retailer Name
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Business Type
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                State
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Status
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {tableData.map((r, index) => {
                              const isAlreadyAssigned =
                                r.assignmentStatus !== "not_assigned";
                              return (
                                <tr
                                  key={r._id}
                                  className={`hover:bg-gray-50 ${selectedRetailers.includes(r._id)
                                    ? "bg-red-50"
                                    : isAlreadyAssigned
                                      ? "bg-gray-100 opacity-60"
                                      : ""
                                    }`}
                                >
                                  <td className="px-4 py-3">
                                    <input
                                      type="checkbox"
                                      checked={selectedRetailers.includes(r._id)}
                                      onChange={() =>
                                        handleCheckboxChange(r._id, r.assignmentStatus)
                                      }
                                      disabled={isAlreadyAssigned}
                                      className={`w-4 h-4 ${isAlreadyAssigned
                                        ? "cursor-not-allowed"
                                        : "cursor-pointer"
                                        }`}
                                    />
                                  </td>
                                  <td className="px-4 py-3 text-sm">{index + 1}</td>
                                  <td className="px-4 py-3 text-sm font-medium text-gray-700">
                                    {r.uniqueId || "-"}
                                  </td>
                                  <td className="px-4 py-3 text-sm font-medium text-gray-700">
                                    {r.shopDetails?.shopName || "-"}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-700">
                                    {r.name || "-"}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-600">
                                    {r.shopDetails?.businessType || "-"}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-600">
                                    {r.shopDetails?.shopAddress?.state || "-"}
                                  </td>
                                  <td className="px-4 py-3 text-sm">
                                    {r.assignmentStatus === "not_assigned" ? (
                                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
                                        Available
                                      </span>
                                    ) : (
                                      <span
                                        className={`px-2 py-1 text-xs font-medium rounded-full ${r.assignmentStatus === "pending"
                                          ? "bg-yellow-100 text-yellow-700"
                                          : r.assignmentStatus === "accepted"
                                            ? "bg-blue-100 text-blue-700"
                                            : "bg-red-100 text-red-700"
                                          }`}
                                      >
                                        {r.assignmentStatus.charAt(0).toUpperCase() +
                                          r.assignmentStatus.slice(1)}
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}

                    <button
                      onClick={handleAssign}
                      disabled={assigning || selectedRetailers.length === 0}
                      className={`mt-6 w-full py-3 rounded-lg font-semibold text-white transition cursor-pointer ${assigning || selectedRetailers.length === 0
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-red-600 hover:bg-red-700"
                        }`}
                    >
                      {assigning
                        ? "Assigning..."
                        : `Assign Campaign to ${selectedRetailers.length} Retailers`}
                    </button>
                  </div>
                ))}

              {/* EMPLOYEE TABLE */}
              {loadingEmployees ||
                (employeeTableData.length > 0 && assignTarget === "employee" && (
                  <div className="bg-white rounded-lg shadow-md p-6 mt-6">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-lg font-semibold text-gray-700">
                        {loadingEmployees
                          ? "Loading Employees..."
                          : `Select Employees (${employeeTableData.length} found, ${selectedEmployees.length} selected)`}
                      </h2>
                    </div>

                    {loadingEmployees ? (
                      <div className="text-center py-8 text-gray-500">
                        Fetching employees...
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    onChange={handleEmployeeSelectAll}
                                    checked={isAllEmployeesSelected}
                                    ref={(input) => {
                                      if (input)
                                        input.indeterminate = isSomeEmployeesSelected;
                                    }}
                                    className="w-4 h-4 cursor-pointer"
                                  />
                                  All
                                </label>
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                S.No
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Employee ID
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Name
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Phone
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                State
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Status
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {employeeTableData.map((e, index) => {
                              const isAlreadyAssigned =
                                e.assignmentStatus !== "not_assigned";
                              return (
                                <tr
                                  key={e._id}
                                  className={`hover:bg-gray-50 ${selectedEmployees.includes(e._id)
                                    ? "bg-red-50"
                                    : isAlreadyAssigned
                                      ? "bg-gray-100 opacity-60"
                                      : ""
                                    }`}
                                >
                                  <td className="px-4 py-3">
                                    <input
                                      type="checkbox"
                                      checked={selectedEmployees.includes(e._id)}
                                      onChange={() =>
                                        handleEmployeeCheckboxChange(
                                          e._id,
                                          e.assignmentStatus
                                        )
                                      }
                                      disabled={isAlreadyAssigned}
                                      className={`w-4 h-4 ${isAlreadyAssigned
                                        ? "cursor-not-allowed"
                                        : "cursor-pointer"
                                        }`}
                                    />
                                  </td>
                                  <td className="px-4 py-3 text-sm">{index + 1}</td>
                                  <td className="px-4 py-3 text-sm font-medium text-gray-700">
                                    {e.employeeId || "-"}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-700">
                                    {e.name || "-"}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-600">
                                    {e.phone || "-"}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-600">
                                    {e.correspondenceAddress?.state || "-"}
                                  </td>
                                  <td className="px-4 py-3 text-sm">
                                    {e.assignmentStatus === "not_assigned" ? (
                                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
                                        Available
                                      </span>
                                    ) : (
                                      <span
                                        className={`px-2 py-1 text-xs font-medium rounded-full ${e.assignmentStatus === "pending"
                                          ? "bg-yellow-100 text-yellow-700"
                                          : e.assignmentStatus === "accepted"
                                            ? "bg-blue-100 text-blue-700"
                                            : "bg-red-100 text-red-700"
                                          }`}
                                      >
                                        {e.assignmentStatus.charAt(0).toUpperCase() +
                                          e.assignmentStatus.slice(1)}
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}

                    <button
                      onClick={handleAssign}
                      disabled={assigning || selectedEmployees.length === 0}
                      className={`mt-6 w-full py-3 rounded-lg font-semibold text-white transition cursor-pointer ${assigning || selectedEmployees.length === 0
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-red-600 hover:bg-red-700"
                        }`}
                    >
                      {assigning
                        ? "Assigning..."
                        : `Assign Campaign to ${selectedEmployees.length} Employees`}
                    </button>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Bulk Upload Modal with Transparent Background */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black/10 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full min-h-[50vh] max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white z-50 border-b border-gray-200 p-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-red-600">Bulk Campaign Assignment</h2>
              <button
                onClick={closeBulkModal}
                className="text-gray-500 hover:text-gray-700 cursor-pointer"
              >
                <FaTimes size={24} />
              </button>
            </div>

            <div className="p-6">
              {/* Step 1: Select Party Type */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3 text-gray-700">
                  Select Party Type
                </h3>
                <Select
                  value={
                    bulkPartyType
                      ? {
                        label: bulkPartyType === "employee" ? "Employee" : "Retailer",
                        value: bulkPartyType,
                      }
                      : null
                  }
                  onChange={(e) => {
                    setBulkPartyType(e.value);
                    setBulkFile(null);
                    setBulkResult(null);
                  }}
                  options={[
                    { label: "Employee", value: "employee" },
                    { label: "Retailer", value: "retailer" },
                  ]}
                  styles={customSelectStyles}
                  className="max-w-md"
                  placeholder="Select party type..."
                  isSearchable
                />
              </div>

              {bulkPartyType && (
                <>
                  {/* Step 2: Download Template */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-3 text-gray-700">
                      Download Template
                    </h3>
                    <div className="mb-3 text-sm text-gray-600">
                      <p className="font-medium mb-2">
                        Template columns:
                      </p>
                      {bulkPartyType === "employee" ? (
                        <p>
                          <strong>Sno</strong>, <strong>campaignName</strong>, <strong>employeeId</strong>, <strong>name</strong>, <strong>phone</strong>, <strong>state</strong>
                          <br />
                          <span className="text-xs text-red-600 mt-1 block">*Backend validation: campaignName & employeeId only</span>
                        </p>
                      ) : (
                        <p>
                          <strong>Sno</strong>, <strong>campaignName</strong>, <strong>UniqueId</strong>, <strong>retailerName</strong>, <strong>outletName</strong>, <strong>businessType</strong>, <strong>state</strong>
                          <br />
                          <span className="text-xs text-red-600 mt-1 block">*Backend validation: campaignName & UniqueId only</span>
                        </p>
                      )}
                    </div>
                    <button
                      onClick={downloadBulkTemplate}
                      className="flex items-center gap-2 bg-[#E4002B] text-white px-6 py-3 rounded-lg hover:bg-[#c4001f] transition cursor-pointer"
                    >
                      <FaDownload />
                      Download {bulkPartyType === "employee" ? "Employee" : "Retailer"} Template
                    </button>
                  </div>

                  {/* Step 3: Upload File */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-3 text-gray-700">
                      Upload Filled Template
                    </h3>
                    <label
                      htmlFor="bulkFileUpload"
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
                        <p className="text-gray-700 font-medium text-lg">{bulkFile.name}</p>
                      )}
                      <input
                        id="bulkFileUpload"
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
                          document.getElementById("bulkFileUpload").value = "";
                        }}
                        className="flex items-center gap-2 text-red-500 text-sm hover:underline mt-3 cursor-pointer"
                      >
                        <FaTimes /> Remove File
                      </button>
                    )}
                  </div>

                  {/* Upload Button */}
                  <button
                    onClick={handleBulkUpload}
                    disabled={bulkUploading || !bulkFile}
                    className={`w-full py-3 rounded-lg font-semibold transition cursor-pointer ${bulkUploading || !bulkFile
                      ? "bg-gray-400 cursor-not-allowed text-white"
                      : "bg-[#E4002B] text-white hover:bg-[#c4001f]"
                      }`}
                  >
                    {bulkUploading ? "Uploading..." : "Upload & Assign"}
                  </button>

                  {/* Upload Results */}
                  {bulkResult && (
                    <div className="mt-6 bg-gray-50 rounded-lg p-6 border border-gray-200">
                      <h3 className="text-xl font-bold mb-4 text-gray-800">Upload Results</h3>

                      {/* Summary */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">

                        {/* ✅ ADD THIS HERE - Assignment Type Display */}
                        {bulkResult.summary?.assignmentType && (
                          <div className="col-span-2 md:col-span-4 bg-gray-100 p-3 rounded-lg text-center mb-2">
                            <p className="text-sm text-gray-600 mb-1">Assignment Type</p>
                            <p className="text-lg font-semibold text-gray-800">
                              {bulkResult.summary.assignmentType}
                            </p>
                          </div>
                        )}

                        {/* Total Rows */}
                        <div className="bg-blue-50 p-4 rounded-lg text-center">
                          <p className="text-sm text-gray-600">Total Rows</p>
                          <p className="text-2xl font-bold text-blue-600">
                            {bulkResult.summary?.totalRows || 0}
                          </p>
                        </div>

                        {/* Successful */}
                        <div className="bg-green-50 p-4 rounded-lg text-center">
                          <p className="text-sm text-gray-600">Successful</p>
                          <p className="text-2xl font-bold text-green-600">
                            {bulkResult.summary?.successful || 0}
                          </p>
                        </div>

                        {/* Failed */}
                        <div className="bg-red-50 p-4 rounded-lg text-center">
                          <p className="text-sm text-gray-600">Failed</p>
                          <p className="text-2xl font-bold text-red-600">
                            {bulkResult.summary?.failed || 0}
                          </p>
                        </div>

                        {/* Success Rate - ✅ ALSO UPDATE THIS */}
                        <div className="bg-purple-50 p-4 rounded-lg text-center">
                          <p className="text-sm text-gray-600">Success Rate</p>
                          <p className="text-2xl font-bold text-purple-600">
                            {bulkResult.summary?.successRate || "0%"}
                          </p>
                        </div>
                      </div>

                      {/* Failed Rows */}
                      {bulkResult.failedRows && bulkResult.failedRows.length > 0 && (
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold text-red-700">
                              Failed Rows ({bulkResult.failedRows.length})
                            </h4>
                            <button
                              onClick={downloadFailedRows}
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
                                  {bulkPartyType === "employee" ? (
                                    <>
                                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">
                                        Campaign
                                      </th>
                                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">
                                        Employee ID
                                      </th>
                                    </>
                                  ) : (
                                    <>
                                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">
                                        Campaign
                                      </th>
                                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">
                                        Outlet Code
                                      </th>
                                    </>
                                  )}
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {bulkResult.failedRows.map((row, index) => (
                                  <tr key={index} className="hover:bg-gray-50">
                                    <td className="px-4 py-2 text-sm font-medium">
                                      {row.rowNumber}
                                    </td>
                                    <td
                                      className="px-4 py-2 text-sm text-red-600 max-w-xs"
                                      title={row.reason}
                                    >
                                      {row.reason}
                                    </td>
                                    <td className="px-4 py-2 text-sm">
                                      {row.data?.campaignName || "-"}
                                    </td>
                                    {bulkPartyType === "employee" ? (
                                      <>
                                        <td className="px-4 py-2 text-sm">
                                          {row.data?.employeeId || "-"}
                                        </td>
                                      </>
                                    ) : (
                                      <>
                                        <td className="px-4 py-2 text-sm">
                                          {row.data?.outletCode || "-"}
                                        </td>
                                      </>
                                    )}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AssignCampaign;

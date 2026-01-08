import { useState, useEffect } from "react";
import Select from "react-select";
import { FiPlus, FiX } from "react-icons/fi";
import axios from "axios";
import { API_URL } from "../../url/base";

const reportTypes = [
  { value: "Window Display", label: "Window Display" },
  { value: "Stock", label: "Stock" },
  { value: "Others", label: "Others" },
];

const frequencyOptions = [
  { value: "Daily", label: "Daily" },
  { value: "Weekly", label: "Weekly" },
  { value: "Fortnightly", label: "Fortnightly" },
  { value: "Monthly", label: "Monthly" },
  { value: "Adhoc", label: "Adhoc" },
];

const visitTypeOptions = [
  { value: "scheduled", label: "Scheduled" },
  { value: "unscheduled", label: "Unscheduled" },
];

const attendedOptions = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];

const notVisitedReasons = [
  { value: "outlet closed", label: "Outlet Closed" },
  { value: "retailer not available", label: "Retailer Not Available" },
  { value: "others", label: "Others" },
];

const stockTypeOptions = [
  { value: "Opening Stock", label: "Opening Stock" },
  { value: "Closing Stock", label: "Closing Stock" },
  { value: "Purchase Stock", label: "Purchase Stock" },
  { value: "Sold Stock", label: "Sold Stock" },
];

const productTypeOptions = [
  { value: "Focus", label: "Focus" },
  { value: "All", label: "All" },
];

const customSelectStyles = {
  control: (provided, state) => ({
    ...provided,
    borderColor: state.isFocused ? "#E4002B" : "#d1d5db",
    boxShadow: state.isFocused ? "0 0 0 1px #E4002B" : "none",
    "&:hover": { borderColor: "#E4002B" },
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isFocused ? "#FEE2E2" : "white",
    color: "#333",
    "&:active": { backgroundColor: "#FECACA" },
  }),
  menu: (provided) => ({ ...provided, zIndex: 10 }),
};

const getTodayDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const isImageFile = (file) => {
  return file && file.type && file.type.startsWith("image/");
};

// File size limit: 10MB per file
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const SubmitReport = ({ campaign }) => {
  // Visit flow states
  const [selectedRetailer, setSelectedRetailer] = useState(null);
  const [visitType, setVisitType] = useState(null);
  const [attended, setAttended] = useState(null);
  const [notVisitedReason, setNotVisitedReason] = useState(null);
  const [otherReasonText, setOtherReasonText] = useState("");

  // Report fields
  const [reportType, setReportType] = useState(null);
  const [frequency, setFrequency] = useState(null);
  const [dateOfSubmission, setDateOfSubmission] = useState(getTodayDate());
  const [remarks, setRemarks] = useState("");

  // Stock fields
  const [stockType, setStockType] = useState(null);
  const [brand, setBrand] = useState("");
  const [product, setProduct] = useState("");
  const [sku, setSku] = useState("");
  const [productType, setProductType] = useState(null);
  const [quantity, setQuantity] = useState("");

  // Files
  const [shopDisplayImages, setShopDisplayImages] = useState([]);
  const [billCopies, setBillCopies] = useState([]);
  const [otherFiles, setOtherFiles] = useState([]);

  // Schedule & Retailers
  const [visitScheduleOptions, setVisitScheduleOptions] = useState([]);
  const [visitScheduleId, setVisitScheduleId] = useState(null);
  const [assignedRetailers, setAssignedRetailers] = useState([]);

  // Employee & Campaign info
  const [employeeInfo, setEmployeeInfo] = useState(null);
  const [campaignId, setCampaignId] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch Employee Info and Campaign ID on mount
  useEffect(() => {
    fetchEmployeeInfo();
    if (campaign) {
      fetchCampaignId();
    }
  }, [campaign]);

  // Cleanup blob URLs on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      shopDisplayImages.forEach((file) => {
        if (file instanceof File) {
          URL.revokeObjectURL(URL.createObjectURL(file));
        }
      });
      billCopies.forEach((file) => {
        if (file instanceof File) {
          URL.revokeObjectURL(URL.createObjectURL(file));
        }
      });
      otherFiles.forEach((file) => {
        if (file instanceof File) {
          URL.revokeObjectURL(URL.createObjectURL(file));
        }
      });
    };
  }, [shopDisplayImages, billCopies, otherFiles]);

  const fetchEmployeeInfo = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("No token found. Please log in.");
        return;
      }

      const response = await fetch(`${API_URL}/employee/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to load employee profile");
      }

      const data = await response.json();
      console.log("Employee data loaded:", {
        name: data.employee.name,
        employeeId: data.employee.employeeId,
        phone: data.employee.phone,
      });
      setEmployeeInfo(data.employee);
    } catch (err) {
      console.error("Error fetching employee info:", err);
      setError("Failed to load employee information");
    }
  };

  const fetchCampaignId = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_URL}/employee/employee/campaigns`, {
        headers: { Authorization: `Bearer ${token}` },
      });

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

  // FETCH ASSIGNED RETAILERS
  useEffect(() => {
    if (!campaignId || !employeeInfo) return;

    const fetchAssignedRetailers = async () => {
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
          const mapped = currentEmployee.retailers.map((r) => ({
            value: r._id || r.id,
            label: `${r.uniqueId || r.retailerCode || ""} - ${
              r.shopDetails?.shopName || r.name
            }`,
            data: r,
          }));
          setAssignedRetailers(mapped);
        } else {
          setAssignedRetailers([]);
        }
      } catch (err) {
        console.error("Error fetching assigned retailers:", err);
        setError("Failed to load assigned retailers");
      }
    };

    fetchAssignedRetailers();
  }, [campaignId, employeeInfo]);

  // FETCH SCHEDULED VISITS
  useEffect(() => {
    if (!selectedRetailer || !campaignId) return;

    const fetchSchedules = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${API_URL}/employee/schedules/all`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const filteredSchedules = res.data.schedules.filter(
          (sch) =>
            (sch.campaignId?._id === campaignId || sch.campaignId === campaignId) &&
            (sch.retailerId?._id === selectedRetailer.value ||
              sch.retailerId === selectedRetailer.value)
        );

        const options = filteredSchedules.map((sch) => ({
          value: sch._id,
          label: `${new Date(sch.visitDate).toLocaleDateString()} - ${
            sch.retailerId?.shopDetails?.shopName || sch.retailerId?.name || "N/A"
          }`,
          full: sch,
        }));

        setVisitScheduleOptions(options);
      } catch (err) {
        console.error("Error fetching schedules:", err);
      }
    };

    fetchSchedules();
  }, [selectedRetailer, campaignId]);

  // Validate file size
  const validateFileSize = (file) => {
    if (file.size > MAX_FILE_SIZE) {
      setError(`File "${file.name}" is too large. Maximum size is 10MB.`);
      return false;
    }
    return true;
  };

  // FILE HANDLERS WITH VALIDATION
  const handleShopImagesChange = (e) => {
    const newFiles = Array.from(e.target.files || []);
    const validFiles = newFiles.filter(validateFileSize);
    if (validFiles.length > 0) {
      setShopDisplayImages((prev) => [...prev, ...validFiles]);
      setError(""); // Clear error if files are valid
    }
  };

  const handleBillCopiesChange = (e) => {
    const newFiles = Array.from(e.target.files || []);
    const validFiles = newFiles.filter(validateFileSize);
    if (validFiles.length > 0) {
      setBillCopies((prev) => [...prev, ...validFiles]);
      setError(""); // Clear error if files are valid
    }
  };

  const handleOtherFilesChange = (e) => {
    const newFiles = Array.from(e.target.files || []);
    const validFiles = newFiles.filter(validateFileSize);
    if (validFiles.length > 0) {
      setOtherFiles((prev) => [...prev, ...validFiles]);
      setError(""); // Clear error if files are valid
    }
  };

  const removeShopImage = (index) => {
    setShopDisplayImages((prev) => prev.filter((_, i) => i !== index));
  };

  const removeBillCopy = (index) => {
    setBillCopies((prev) => prev.filter((_, i) => i !== index));
  };

  const removeOtherFile = (index) => {
    setOtherFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // SUBMIT
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!selectedRetailer) {
      setError("Please select a retailer");
      return;
    }

    if (!visitType) {
      setError("Please select visit type");
      return;
    }

    if (!employeeInfo) {
      setError("Employee information not loaded");
      return;
    }

    if (!attended) {
      setError("Please select if you attended the visit");
      return;
    }

    if (attended.value === "no") {
      if (!notVisitedReason) {
        setError("Please select reason for non-attendance");
        return;
      }
      if (notVisitedReason.value === "others" && !otherReasonText.trim()) {
        setError("Please specify other reason");
        return;
      }
    }

    if (attended.value === "yes") {
      if (visitType.value === "scheduled" && !visitScheduleId) {
        setError("Please select a visit schedule");
        return;
      }
      if (!reportType) {
        setError("Please select report type");
        return;
      }
      if (!frequency) {
        setError("Please select frequency");
        return;
      }

      if (reportType.value === "Stock") {
        if (
          !stockType ||
          !brand.trim() ||
          !product.trim() ||
          !sku.trim() ||
          !productType ||
          !quantity
        ) {
          setError("Please fill all stock fields");
          return;
        }
      }
    }

    try {
      setLoading(true);
      const formData = new FormData();

      let retailerIdToSubmit = selectedRetailer.value;
      let campaignIdToSubmit = campaignId;

      if (visitScheduleId && visitScheduleId.full) {
        campaignIdToSubmit =
          visitScheduleId.full?.campaignId?._id ||
          visitScheduleId.full?.campaignId ||
          campaignId;
        formData.append("visitScheduleId", visitScheduleId.value);
      }

      formData.append("campaignId", campaignIdToSubmit);
      formData.append("typeOfVisit", visitType.value);
      formData.append("attendedVisit", attended.value);

      // Submitter info - Using bracket notation for Cloudinary compatibility
      formData.append("submittedBy[role]", "Employee");
      formData.append("submittedBy[userId]", employeeInfo._id || employeeInfo.id);

      // Employee info - Using bracket notation
      formData.append("employee[employeeId]", employeeInfo._id || employeeInfo.id);
      formData.append("employee[employeeName]", employeeInfo.name);
      formData.append("employee[employeeCode]", employeeInfo.employeeId);

      // Retailer info - Using bracket notation
      const retailerData = selectedRetailer.data;
      formData.append("retailer[retailerId]", retailerData._id || retailerData.id);
      formData.append(
        "retailer[outletName]",
        retailerData.shopDetails?.shopName || retailerData.name
      );
      formData.append(
        "retailer[retailerName]",
        retailerData.name || retailerData.shopDetails?.shopName
      );
      formData.append(
        "retailer[outletCode]",
        retailerData.uniqueId || retailerData.retailerCode
      );

      if (attended.value === "no") {
        formData.append("reasonForNonAttendance[reason]", notVisitedReason.value);
        if (notVisitedReason.value === "others") {
          formData.append("reasonForNonAttendance[otherReason]", otherReasonText);
        }
      }

      if (attended.value === "yes") {
        formData.append("reportType", reportType.value);
        formData.append("frequency", frequency.value);
        formData.append("dateOfSubmission", dateOfSubmission);

        if (remarks) {
          formData.append("remarks", remarks);
        }

        if (reportType.value === "Stock") {
          formData.append("stockType", stockType.value);
          formData.append("brand", brand);
          formData.append("product", product);
          formData.append("sku", sku);
          formData.append("productType", productType.value);
          formData.append("quantity", quantity);

          // Append bill copies - Backend will upload to Cloudinary
          billCopies.forEach((file) => {
            formData.append("billCopies", file);
          });
        }

        if (reportType.value === "Window Display") {
          // Append shop display images - Backend will upload to Cloudinary
          shopDisplayImages.forEach((file) => {
            formData.append("shopDisplayImages", file);
          });
        }

        if (reportType.value === "Others") {
          // Append other files - Backend will upload to Cloudinary
          otherFiles.forEach((file) => {
            formData.append("files", file);
          });
        }
      }

      const token = localStorage.getItem("token");
      const response = await axios.post(`${API_URL}/reports/create`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        alert("Report submitted successfully!");
        resetForm();
      }
    } catch (err) {
      console.error("Submission error:", err);
      setError(err.response?.data?.message || "Failed to submit report");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedRetailer(null);
    setVisitType(null);
    setAttended(null);
    setNotVisitedReason(null);
    setOtherReasonText("");
    setReportType(null);
    setFrequency(null);
    setDateOfSubmission(getTodayDate());
    setRemarks("");
    setStockType(null);
    setBrand("");
    setProduct("");
    setSku("");
    setProductType(null);
    setQuantity("");
    setShopDisplayImages([]);
    setBillCopies([]);
    setOtherFiles([]);
    setVisitScheduleId(null);
  };

  return (
    <div>
      <h3 className="text-xl font-semibold mb-4 text-[#E4002B]">Submit Report</h3>

      {/* Display Campaign Name */}
      <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
        <p className="text-sm text-gray-600">Campaign:</p>
        <p className="text-lg font-semibold text-gray-800">
          {campaign?.name || "Loading..."}
        </p>
      </div>

      {/* Display Employee Info */}
      {employeeInfo && (
        <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-gray-600">Employee:</p>
          <p className="text-md font-medium text-gray-800">{employeeInfo.name}</p>
          <p className="text-sm text-gray-600">Code: {employeeInfo.employeeId}</p>
          <p className="text-sm text-gray-600">{employeeInfo.phone}</p>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* STEP 1: Select Retailer */}
        <div>
          <label className="block font-medium mb-1">Select Retailer *</label>
          <Select
            options={assignedRetailers}
            value={selectedRetailer}
            onChange={(v) => {
              setSelectedRetailer(v);
              setVisitType(null);
              setAttended(null);
              setNotVisitedReason(null);
              setVisitScheduleId(null);
              setReportType(null);
              setFrequency(null);
            }}
            styles={customSelectStyles}
            placeholder="Select assigned retailer"
            isDisabled={assignedRetailers.length === 0}
          />
          {assignedRetailers.length === 0 && (
            <p className="text-sm text-gray-500 mt-2">
              No retailers assigned to you for this campaign
            </p>
          )}
        </div>

        {/* STEP 2: Type of Visit */}
        {selectedRetailer && (
          <div>
            <label className="block font-medium mb-1">Type of Visit *</label>
            <Select
              options={visitTypeOptions}
              value={visitType}
              onChange={(v) => {
                setVisitType(v);
                setAttended(null);
                setNotVisitedReason(null);
                setVisitScheduleId(null);
              }}
              styles={customSelectStyles}
              placeholder="Select type of visit"
            />
          </div>
        )}

        {/* STEP 3: Attended Visit? */}
        {selectedRetailer && visitType && (
          <div>
            <label className="block font-medium mb-1">Attended Visit? *</label>
            <Select
              options={attendedOptions}
              value={attended}
              onChange={(v) => {
                setAttended(v);
                setNotVisitedReason(null);
                setOtherReasonText("");
                setVisitScheduleId(null);
              }}
              styles={customSelectStyles}
              placeholder="Select"
            />
          </div>
        )}

        {/* BRANCH A: If Attended = NO */}
        {selectedRetailer && visitType && attended?.value === "no" && (
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <label className="block font-medium mb-2">
              Reason for Non-Attendance *
            </label>
            <Select
              options={notVisitedReasons}
              value={notVisitedReason}
              onChange={setNotVisitedReason}
              styles={customSelectStyles}
              placeholder="Select reason"
            />
            {notVisitedReason?.value === "others" && (
              <input
                type="text"
                className="border rounded p-2 w-full mt-3 focus:outline-none focus:ring-2 focus:ring-[#E4002B]"
                placeholder="Specify other reason"
                value={otherReasonText}
                onChange={(e) => setOtherReasonText(e.target.value)}
              />
            )}
          </div>
        )}

        {/* BRANCH B: If Attended = YES */}
        {selectedRetailer && visitType && attended?.value === "yes" && (
          <>
            {/* Visit Schedule (Scheduled visits only) */}
            {visitType.value === "scheduled" && (
              <div>
                <label className="block font-medium mb-1">Select Visit Schedule *</label>
                <Select
                  options={visitScheduleOptions}
                  value={visitScheduleId}
                  onChange={setVisitScheduleId}
                  styles={customSelectStyles}
                  placeholder="Select schedule"
                />
                {visitScheduleOptions.length === 0 && (
                  <p className="text-sm text-gray-500 mt-2">
                    No schedules found for this retailer
                  </p>
                )}
              </div>
            )}

            {/* REST OF THE FORM */}
            {(visitType.value === "unscheduled" ||
              (visitType.value === "scheduled" && visitScheduleId)) && (
              <>
                {/* Report Type */}
                <div>
                  <label className="block font-medium mb-1">Type of Report *</label>
                  <Select
                    styles={customSelectStyles}
                    options={reportTypes}
                    value={reportType}
                    onChange={setReportType}
                    placeholder="Select Report Type"
                    isSearchable
                  />
                </div>

                {/* Frequency */}
                <div>
                  <label className="block font-medium mb-1">Frequency *</label>
                  <Select
                    styles={customSelectStyles}
                    options={frequencyOptions}
                    value={frequency}
                    onChange={setFrequency}
                    placeholder="Select Frequency"
                    isSearchable
                  />
                </div>

                {/* Date of Submission */}
                <div>
                  <label className="block font-medium mb-1">Date of Submission *</label>
                  <input
                    type="date"
                    className="border rounded p-2 w-full focus:outline-none focus:ring-2 focus:ring-[#E4002B] focus:border-transparent"
                    value={dateOfSubmission}
                    onChange={(e) => setDateOfSubmission(e.target.value)}
                    max={getTodayDate()}
                    required
                  />
                </div>

                {/* Remarks */}
                <div>
                  <label className="block font-medium mb-1">Remarks (Optional)</label>
                  <textarea
                    className="border rounded p-2 w-full focus:outline-none focus:ring-2 focus:ring-[#E4002B] focus:border-transparent"
                    rows="3"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Add any additional notes..."
                  />
                </div>

                {/* STOCK REPORT FIELDS */}
                {reportType?.value === "Stock" && (
                  <div className="space-y-4 bg-gray-50 p-4 rounded-md border">
                    <h4 className="font-semibold text-[#E4002B]">Stock Details</h4>

                    <div>
                      <label className="block font-medium mb-1">Type of Stock *</label>
                      <Select
                        styles={customSelectStyles}
                        options={stockTypeOptions}
                        value={stockType}
                        onChange={setStockType}
                        placeholder="Select Stock Type"
                        isSearchable
                      />
                    </div>

                    <div>
                      <label className="block font-medium mb-1">Brand *</label>
                      <input
                        type="text"
                        className="border rounded p-2 w-full focus:outline-none focus:ring-2 focus:ring-[#E4002B] focus:border-transparent"
                        placeholder="Enter brand name"
                        value={brand}
                        onChange={(e) => setBrand(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block font-medium mb-1">Product *</label>
                      <input
                        type="text"
                        className="border rounded p-2 w-full focus:outline-none focus:ring-2 focus:ring-[#E4002B] focus:border-transparent"
                        placeholder="Enter product name"
                        value={product}
                        onChange={(e) => setProduct(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block font-medium mb-1">SKU *</label>
                      <input
                        type="text"
                        className="border rounded p-2 w-full focus:outline-none focus:ring-2 focus:ring-[#E4002B] focus:border-transparent"
                        placeholder="Enter SKU"
                        value={sku}
                        onChange={(e) => setSku(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block font-medium mb-1">Product Type *</label>
                      <Select
                        styles={customSelectStyles}
                        options={productTypeOptions}
                        value={productType}
                        onChange={setProductType}
                        placeholder="Select Product Type"
                        isSearchable
                      />
                    </div>

                    <div>
                      <label className="block font-medium mb-1">Quantity *</label>
                      <input
                        type="number"
                        className="border rounded p-2 w-full focus:outline-none focus:ring-2 focus:ring-[#E4002B] focus:border-transparent"
                        placeholder="Enter quantity"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        min="0"
                      />
                    </div>

                    {/* Bill Copies */}
                    <div>
                      <label className="block font-medium mb-1">
                        Bill Copies (Images/PDF) - Max 10MB per file
                      </label>
                      <label className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-gray-500 cursor-pointer hover:border-[#E4002B] transition-colors">
                        <FiPlus className="text-3xl text-gray-400" />
                        <span>Click or drop files here</span>
                        <input
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
                          multiple
                          className="hidden"
                          onChange={handleBillCopiesChange}
                        />
                      </label>

                      {billCopies.length > 0 && (
                        <div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                          {billCopies.map((file, index) => (
                            <div
                              key={index}
                              className="relative border-2 border-dashed rounded-lg overflow-hidden bg-gray-50 group"
                            >
                              {isImageFile(file) ? (
                                <>
                                  <img
                                    src={URL.createObjectURL(file)}
                                    className="w-full h-32 object-cover"
                                    alt={`bill-${index}`}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => removeBillCopy(index)}
                                    className="absolute top-1 right-1 bg-[#E4002B] text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <FiX size={16} />
                                  </button>
                                  <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 text-center truncate">
                                    {file.name.length > 15
                                      ? file.name.substring(0, 12) + "..."
                                      : file.name}
                                  </div>
                                </>
                              ) : (
                                <div className="flex flex-col items-center justify-center h-32 p-2 relative">
                                  <div className="text-4xl text-gray-400 mb-2">📄</div>
                                  <p className="text-xs text-gray-600 text-center truncate w-full px-2">
                                    {file.name}
                                  </p>
                                  <button
                                    type="button"
                                    onClick={() => removeBillCopy(index)}
                                    className="absolute top-1 right-1 bg-[#E4002B] text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <FiX size={16} />
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* WINDOW DISPLAY */}
                {reportType?.value === "Window Display" && (
                  <div>
                    <label className="block font-medium mb-1">
                      Upload Shop Display Images - Max 10MB per file
                    </label>
                    <label className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-gray-500 cursor-pointer hover:border-[#E4002B] transition-colors">
                      <FiPlus className="text-3xl text-gray-400" />
                      <span>Click or drop images here</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        multiple
                        className="hidden"
                        onChange={handleShopImagesChange}
                      />
                    </label>

                    {shopDisplayImages.length > 0 && (
                      <div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {shopDisplayImages.map((file, index) => (
                          <div
                            key={index}
                            className="relative border-2 border-dashed rounded-lg overflow-hidden bg-gray-50 group"
                          >
                            <img
                              src={URL.createObjectURL(file)}
                              className="w-full h-32 object-cover"
                              alt={`preview-${index}`}
                            />
                            <button
                              type="button"
                              onClick={() => removeShopImage(index)}
                              className="absolute top-1 right-1 bg-[#E4002B] text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <FiX size={16} />
                            </button>
                            <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 text-center truncate">
                              {file.name.length > 15
                                ? file.name.substring(0, 12) + "..."
                                : file.name}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* OTHERS */}
                {reportType?.value === "Others" && (
                  <div>
                    <label className="block font-medium mb-1">
                      Upload Files - Max 10MB per file
                    </label>
                    <label className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-gray-500 cursor-pointer hover:border-[#E4002B] transition-colors">
                      <FiPlus className="text-3xl text-gray-400" />
                      <span>Click or drop files here</span>
                      <input
                        type="file"
                        accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx"
                        multiple
                        className="hidden"
                        onChange={handleOtherFilesChange}
                      />
                    </label>

                    {otherFiles.length > 0 && (
                      <div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {otherFiles.map((file, index) => (
                          <div
                            key={index}
                            className="relative border-2 border-dashed rounded-lg overflow-hidden bg-gray-50 group"
                          >
                            {isImageFile(file) ? (
                              <>
                                <img
                                  src={URL.createObjectURL(file)}
                                  className="w-full h-32 object-cover"
                                  alt={`other-${index}`}
                                />
                                <button
                                  type="button"
                                  onClick={() => removeOtherFile(index)}
                                  className="absolute top-1 right-1 bg-[#E4002B] text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <FiX size={16} />
                                </button>
                                <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 text-center truncate">
                                  {file.name.length > 15
                                    ? file.name.substring(0, 12) + "..."
                                    : file.name}
                                </div>
                              </>
                            ) : (
                              <div className="flex flex-col items-center justify-center h-32 p-2 relative">
                                <div className="text-4xl text-gray-400 mb-2">📄</div>
                                <p className="text-xs text-gray-600 text-center truncate w-full px-2">
                                  {file.name}
                                </p>
                                <button
                                  type="button"
                                  onClick={() => removeOtherFile(index)}
                                  className="absolute top-1 right-1 bg-[#E4002B] text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <FiX size={16} />
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-6 px-6 py-3 bg-[#E4002B] text-white rounded disabled:bg-gray-400 disabled:cursor-not-allowed hover:bg-[#c60025] transition-colors font-medium"
        >
          {loading ? "Submitting..." : "Submit Report"}
        </button>
      </form>
    </div>
  );
};

export default SubmitReport;

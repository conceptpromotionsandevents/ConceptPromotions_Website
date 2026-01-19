// Admin/TDSCertificates.jsx
import React, { useState, useEffect } from "react";
import Select from "react-select";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { API_URL } from "../../url/base";
import { FaUpload, FaDownload, FaEye, FaTrash, FaEdit, FaTimes } from "react-icons/fa";
import customSelectStyles from "../../components/common/selectStyles";

const TDSCertificates = () => {
    const token = localStorage.getItem("token");

    // All Data
    const [allRetailers, setAllRetailers] = useState([]);
    const [allStates, setAllStates] = useState([]);
    const [certificates, setCertificates] = useState([]);

    // Filters
    const [selectedState, setSelectedState] = useState(null);
    const [selectedRetailer, setSelectedRetailer] = useState(null);
    const [selectedFY, setSelectedFY] = useState(null);
    const [selectedQuarter, setSelectedQuarter] = useState(null);

    // Dropdown Options
    const [stateOptions, setStateOptions] = useState([]);
    const [retailerOptions, setRetailerOptions] = useState([]);

    const [loading, setLoading] = useState(true);

    // Upload Modal State
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [uploadFile, setUploadFile] = useState(null);
    const [uploadFormData, setUploadFormData] = useState({
        retailerId: "",
        financialYear: "",
        quarter: "",
        totalTDSAmount: "",
        certificateNumber: "",
        remarks: "",
    });

    // View/Edit Modal State
    const [showViewModal, setShowViewModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedCertificate, setSelectedCertificate] = useState(null);
    const [editFile, setEditFile] = useState(null);

    // Financial Year Options
    const fyOptions = [
        { value: "2024-25", label: "FY 2024-25" },
        { value: "2025-26", label: "FY 2025-26" },
        { value: "2026-27", label: "FY 2026-27" },
        { value: "2027-28", label: "FY 2027-28" },
    ];

    // Quarter Options
    const quarterOptions = [
        { value: "Q1", label: "Q1 (Apr-Jun)" },
        { value: "Q2", label: "Q2 (Jul-Sep)" },
        { value: "Q3", label: "Q3 (Oct-Dec)" },
        { value: "Q4", label: "Q4 (Jan-Mar)" },
    ];

    // FETCH ALL DATA ON MOUNT
    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            // Fetch Retailers
            const retailersRes = await fetch(`${API_URL}/admin/retailers`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const retailersData = await retailersRes.json();
            const retailers = retailersData.retailers || [];

            setAllRetailers(retailers);

            // Extract unique states
            const uniqueStates = [
                ...new Set(
                    retailers
                        .map((r) => r.shopDetails?.shopAddress?.state)
                        .filter(Boolean)
                ),
            ];
            setAllStates(uniqueStates);

            // Initialize dropdown options
            setStateOptions(uniqueStates.map((s) => ({ label: s, value: s })));
            setRetailerOptions(
                retailers.map((r) => ({
                    label: `${r.uniqueId} - ${r.shopDetails?.shopName || "NA"}`,
                    value: r._id,
                    data: r,
                }))
            );

            // Fetch All Certificates
            await fetchCertificates();
        } catch (err) {
            console.error("Error fetching data:", err);
            toast.error("Failed to load data", { theme: "dark" });
        } finally {
            setLoading(false);
        }
    };

    const fetchCertificates = async () => {
        try {
            const response = await fetch(`${API_URL}/tds-certificates/all`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await response.json();
            if (data.success) {
                setCertificates(data.certificates);
            }
        } catch (err) {
            console.error("Error fetching certificates:", err);
        }
    };

    // FILTER LOGIC
    useEffect(() => {
        applyFilters();
    }, [selectedState, selectedRetailer]);

    const applyFilters = () => {
        let filteredRetailers = [...allRetailers];

        if (selectedState) {
            filteredRetailers = filteredRetailers.filter(
                (r) => r.shopDetails?.shopAddress?.state === selectedState.value
            );
        }

        setRetailerOptions(
            filteredRetailers.map((r) => ({
                label: `${r.uniqueId} - ${r.shopDetails?.shopName || "NA"}`,
                value: r._id,
                data: r,
            }))
        );
    };

    const handleStateChange = (selected) => {
        setSelectedState(selected);
        if (!selected) {
            setSelectedRetailer(null);
        }
    };

    const handleRetailerChange = (selected) => {
        setSelectedRetailer(selected);
        if (selected?.data) {
            const retailerState = selected.data.shopDetails?.shopAddress?.state;
            if (retailerState) {
                const stateOption = stateOptions.find((s) => s.value === retailerState);
                if (stateOption) {
                    setSelectedState(stateOption);
                }
            }
        } else {
            setSelectedState(null);
        }
    };

    const handleClearAllFilters = () => {
        setSelectedState(null);
        setSelectedRetailer(null);
        setSelectedFY(null);
        setSelectedQuarter(null);
    };

    // UPLOAD CERTIFICATE
    const openUploadModal = () => {
        setUploadFormData({
            retailerId: "",
            financialYear: "",
            quarter: "",
            totalTDSAmount: "",
            certificateNumber: "",
            remarks: "",
        });
        setUploadFile(null);
        setShowUploadModal(true);
    };

    const handleUploadCertificate = async () => {
        if (
            !uploadFormData.retailerId ||
            !uploadFormData.financialYear ||
            !uploadFormData.quarter ||
            !uploadFormData.totalTDSAmount ||
            !uploadFile
        ) {
            toast.error("Please fill all required fields and select a file", { theme: "dark" });
            return;
        }

        try {
            const formData = new FormData();
            formData.append("retailerId", uploadFormData.retailerId);
            formData.append("financialYear", uploadFormData.financialYear);
            formData.append("quarter", uploadFormData.quarter);
            formData.append("totalTDSAmount", uploadFormData.totalTDSAmount);
            formData.append("certificateNumber", uploadFormData.certificateNumber);
            formData.append("remarks", uploadFormData.remarks);
            formData.append("certificate", uploadFile);

            const response = await fetch(`${API_URL}/tds-certificates/upload`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });

            const data = await response.json();

            if (response.ok && data.success) {
                toast.success("Certificate uploaded successfully!", { theme: "dark" });
                setShowUploadModal(false);
                await fetchCertificates();
            } else {
                toast.error(data.message || "Failed to upload certificate", { theme: "dark" });
            }
        } catch (error) {
            console.error("Error uploading certificate:", error);
            toast.error("Failed to upload certificate", { theme: "dark" });
        }
    };

    // VIEW CERTIFICATE
    const handleViewCertificate = (cert) => {
        setSelectedCertificate(cert);
        setShowViewModal(true);
    };

    // EDIT CERTIFICATE
    const openEditModal = (cert) => {
        setSelectedCertificate(cert);
        setEditFile(null);
        setShowEditModal(true);
    };

    const handleEditCertificate = async () => {
        if (!selectedCertificate.totalTDSAmount || selectedCertificate.totalTDSAmount <= 0) {
            toast.error("Please enter a valid TDS amount", { theme: "dark" });
            return;
        }

        try {
            const formData = new FormData();
            formData.append("totalTDSAmount", selectedCertificate.totalTDSAmount);
            formData.append("certificateNumber", selectedCertificate.certificateNumber || "");
            formData.append("remarks", selectedCertificate.remarks || "");
            
            if (editFile) {
                formData.append("certificate", editFile);
            }

            const response = await fetch(
                `${API_URL}/tds-certificates/${selectedCertificate._id}`,
                {
                    method: "PUT",
                    headers: { Authorization: `Bearer ${token}` },
                    body: formData,
                }
            );

            const data = await response.json();

            if (response.ok && data.success) {
                toast.success("Certificate updated successfully!", { theme: "dark" });
                setShowEditModal(false);
                await fetchCertificates();
            } else {
                toast.error(data.message || "Failed to update certificate", { theme: "dark" });
            }
        } catch (error) {
            console.error("Error updating certificate:", error);
            toast.error("Failed to update certificate", { theme: "dark" });
        }
    };

    // DELETE CERTIFICATE
    const handleDeleteCertificate = async (cert) => {
        if (!window.confirm("Are you sure you want to delete this certificate?")) return;

        try {
            const response = await fetch(
                `${API_URL}/tds-certificates/${cert._id}`,
                {
                    method: "DELETE",
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            const data = await response.json();

            if (response.ok && data.success) {
                toast.success("Certificate deleted successfully!", { theme: "dark" });
                await fetchCertificates();
            } else {
                toast.error(data.message || "Failed to delete certificate", { theme: "dark" });
            }
        } catch (error) {
            console.error("Error deleting certificate:", error);
            toast.error("Failed to delete certificate", { theme: "dark" });
        }
    };

    // FILTER DISPLAYED CERTIFICATES
    const filteredCertificates = certificates.filter((cert) => {
        let matches = true;

        if (selectedState) {
            const certRetailer = allRetailers.find((r) => r._id === cert.retailerId?._id);
            if (certRetailer?.shopDetails?.shopAddress?.state !== selectedState.value) {
                matches = false;
            }
        }

        if (selectedRetailer && cert.retailerId?._id !== selectedRetailer.value) {
            matches = false;
        }

        if (selectedFY && cert.financialYear !== selectedFY.value) {
            matches = false;
        }

        if (selectedQuarter && cert.quarter !== selectedQuarter.value) {
            matches = false;
        }

        return matches;
    });

    // Prevent background scroll when modal is open
    useEffect(() => {
        if (showUploadModal || showViewModal || showEditModal) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [showUploadModal, showViewModal, showEditModal]);

    return (
        <>
            <ToastContainer position="top-right" autoClose={3000} />
            <div className="min-h-screen bg-[#171717] p-6">
                <div className="max-w-7xl mx-auto">
                    {/* HEADER */}
                    <div className="flex justify-between items-center mb-8">
                        <h1 className="text-3xl font-bold text-[#E4002B]">TDS Certificates</h1>
                        <button
                            onClick={openUploadModal}
                            className="flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition bg-[#E4002B] text-white hover:bg-[#c4001f]"
                        >
                            <FaUpload />
                            Upload Certificate
                        </button>
                    </div>

                    {loading ? (
                        <div className="bg-[#EDEDED] rounded-lg shadow-md p-6">
                            <p className="text-gray-600">Loading data...</p>
                        </div>
                    ) : (
                        <>
                            {/* FILTERS */}
                            <div className="bg-[#EDEDED] rounded-lg shadow-md p-6 mb-6">
                                <h2 className="text-lg font-semibold mb-4 text-gray-700">
                                    Filter Certificates
                                </h2>

                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    {/* State Filter */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            State
                                        </label>
                                        <Select
                                            value={selectedState}
                                            onChange={handleStateChange}
                                            options={stateOptions}
                                            styles={customSelectStyles}
                                            placeholder="Select State"
                                            isClearable
                                            isSearchable
                                        />
                                    </div>

                                    {/* Retailer Filter */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Retailer
                                        </label>
                                        <Select
                                            value={selectedRetailer}
                                            onChange={handleRetailerChange}
                                            options={retailerOptions}
                                            styles={customSelectStyles}
                                            placeholder="Select Retailer"
                                            isClearable
                                            isSearchable
                                        />
                                    </div>

                                    {/* Financial Year Filter */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Financial Year
                                        </label>
                                        <Select
                                            value={selectedFY}
                                            onChange={setSelectedFY}
                                            options={fyOptions}
                                            styles={customSelectStyles}
                                            placeholder="Select FY"
                                            isClearable
                                            isSearchable
                                        />
                                    </div>

                                    {/* Quarter Filter */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Quarter
                                        </label>
                                        <Select
                                            value={selectedQuarter}
                                            onChange={setSelectedQuarter}
                                            options={quarterOptions}
                                            styles={customSelectStyles}
                                            placeholder="Select Quarter"
                                            isClearable
                                            isSearchable
                                        />
                                    </div>
                                </div>

                                {(selectedState || selectedRetailer || selectedFY || selectedQuarter) && (
                                    <button
                                        onClick={handleClearAllFilters}
                                        className="mt-4 text-sm text-red-600 underline hover:text-red-800"
                                    >
                                        Clear All Filters
                                    </button>
                                )}
                            </div>

                            {/* CERTIFICATES TABLE */}
                            <div className="bg-[#EDEDED] rounded-lg shadow-md p-6">
                                <h2 className="text-lg font-semibold mb-4 text-gray-700">
                                    Certificates ({filteredCertificates.length})
                                </h2>

                                {filteredCertificates.length === 0 ? (
                                    <p className="text-gray-500 py-4 text-center">
                                        No certificates found.
                                    </p>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-100">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                                                        Outlet Code
                                                    </th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                                                        Retailer Name
                                                    </th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                                                        FY
                                                    </th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                                                        Quarter
                                                    </th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                                                        TDS Amount
                                                    </th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                                                        Certificate No.
                                                    </th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                                                        Actions
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {filteredCertificates.map((cert) => (
                                                    <tr key={cert._id} className="hover:bg-gray-50">
                                                        <td className="px-4 py-3 text-sm text-gray-700">
                                                            {cert.outletCode}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-gray-700">
                                                            {cert.retailerName}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-gray-700">
                                                            {cert.financialYear}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-gray-700">
                                                            {cert.quarter}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm font-semibold text-blue-600">
                                                            ₹{cert.totalTDSAmount.toLocaleString()}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-gray-700">
                                                            {cert.certificateNumber || "-"}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm">
                                                            <div className="flex gap-2">
                                                                <button
                                                                    onClick={() => handleViewCertificate(cert)}
                                                                    className="text-blue-600 hover:text-blue-800"
                                                                    title="View"
                                                                >
                                                                    <FaEye />
                                                                </button>
                                                                <button
                                                                    onClick={() => openEditModal(cert)}
                                                                    className="text-green-600 hover:text-green-800"
                                                                    title="Edit"
                                                                >
                                                                    <FaEdit />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteCertificate(cert)}
                                                                    className="text-red-600 hover:text-red-800"
                                                                    title="Delete"
                                                                >
                                                                    <FaTrash />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* UPLOAD MODAL */}
            {showUploadModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-red-600">Upload TDS Certificate</h2>
                            <button
                                onClick={() => setShowUploadModal(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <FaTimes size={24} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Retailer */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Retailer <span className="text-red-500">*</span>
                                </label>
                                <Select
                                    value={retailerOptions.find(
                                        (r) => r.value === uploadFormData.retailerId
                                    )}
                                    onChange={(selected) =>
                                        setUploadFormData({
                                            ...uploadFormData,
                                            retailerId: selected?.value || "",
                                        })
                                    }
                                    options={retailerOptions}
                                    styles={customSelectStyles}
                                    placeholder="Select Retailer"
                                    isSearchable
                                />
                            </div>

                            {/* Financial Year */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Financial Year <span className="text-red-500">*</span>
                                </label>
                                <Select
                                    value={fyOptions.find((fy) => fy.value === uploadFormData.financialYear)}
                                    onChange={(selected) =>
                                        setUploadFormData({
                                            ...uploadFormData,
                                            financialYear: selected?.value || "",
                                        })
                                    }
                                    options={fyOptions}
                                    styles={customSelectStyles}
                                    placeholder="Select Financial Year"
                                />
                            </div>

                            {/* Quarter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Quarter <span className="text-red-500">*</span>
                                </label>
                                <Select
                                    value={quarterOptions.find((q) => q.value === uploadFormData.quarter)}
                                    onChange={(selected) =>
                                        setUploadFormData({
                                            ...uploadFormData,
                                            quarter: selected?.value || "",
                                        })
                                    }
                                    options={quarterOptions}
                                    styles={customSelectStyles}
                                    placeholder="Select Quarter"
                                />
                            </div>

                            {/* TDS Amount */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Total TDS Amount <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    value={uploadFormData.totalTDSAmount}
                                    onChange={(e) =>
                                        setUploadFormData({
                                            ...uploadFormData,
                                            totalTDSAmount: e.target.value,
                                        })
                                    }
                                    placeholder="Enter TDS amount"
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-600 focus:outline-none"
                                    min="0"
                                    step="0.01"
                                    required
                                />
                            </div>

                            {/* Certificate Number */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Certificate Number
                                </label>
                                <input
                                    type="text"
                                    value={uploadFormData.certificateNumber}
                                    onChange={(e) =>
                                        setUploadFormData({
                                            ...uploadFormData,
                                            certificateNumber: e.target.value,
                                        })
                                    }
                                    placeholder="Enter certificate number (optional)"
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-600 focus:outline-none"
                                />
                            </div>

                            {/* Remarks */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Remarks
                                </label>
                                <textarea
                                    value={uploadFormData.remarks}
                                    onChange={(e) =>
                                        setUploadFormData({
                                            ...uploadFormData,
                                            remarks: e.target.value,
                                        })
                                    }
                                    placeholder="Optional remarks"
                                    rows="3"
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-600 focus:outline-none"
                                />
                            </div>

                            {/* File Upload */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Certificate File <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="file"
                                    onChange={(e) => setUploadFile(e.target.files[0])}
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-600 focus:outline-none"
                                    required
                                />
                                {uploadFile && (
                                    <p className="text-sm text-gray-600 mt-1">
                                        Selected: {uploadFile.name}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={handleUploadCertificate}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                            >
                                Upload Certificate
                            </button>
                            <button
                                onClick={() => setShowUploadModal(false)}
                                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* VIEW MODAL */}
            {showViewModal && selectedCertificate && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-red-600">View Certificate</h2>
                            <button
                                onClick={() => setShowViewModal(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <FaTimes size={24} />
                            </button>
                        </div>

                        <div className="space-y-4 mb-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-600">Outlet Code</p>
                                    <p className="font-semibold">{selectedCertificate.outletCode}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Retailer Name</p>
                                    <p className="font-semibold">{selectedCertificate.retailerName}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Financial Year</p>
                                    <p className="font-semibold">{selectedCertificate.financialYear}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Quarter</p>
                                    <p className="font-semibold">{selectedCertificate.quarter}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Total TDS Amount</p>
                                    <p className="font-semibold text-blue-600">
                                        ₹{selectedCertificate.totalTDSAmount.toLocaleString()}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Certificate Number</p>
                                    <p className="font-semibold">
                                        {selectedCertificate.certificateNumber || "-"}
                                    </p>
                                </div>
                            </div>

                            {selectedCertificate.remarks && (
                                <div>
                                    <p className="text-sm text-gray-600">Remarks</p>
                                    <p className="font-semibold">{selectedCertificate.remarks}</p>
                                </div>
                            )}

                            <div>
                                <p className="text-sm text-gray-600">Uploaded At</p>
                                <p className="font-semibold">
                                    {new Date(selectedCertificate.uploadedAt).toLocaleString()}
                                </p>
                            </div>
                        </div>

                        {/* Certificate Preview/Download */}
                        <div className="border-t pt-4">
                            <p className="text-sm text-gray-600 mb-2">Certificate File</p>
                            <a
                                href={selectedCertificate.certificate.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-blue-600 hover:underline"
                            >
                                <FaDownload />
                                View/Download Certificate
                            </a>
                        </div>

                        <button
                            onClick={() => setShowViewModal(false)}
                            className="w-full mt-6 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}

            {/* EDIT MODAL */}
            {showEditModal && selectedCertificate && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-red-600">Edit Certificate</h2>
                            <button
                                onClick={() => setShowEditModal(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <FaTimes size={24} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <p className="text-sm text-gray-600">Retailer</p>
                                <p className="font-semibold">{selectedCertificate.retailerName}</p>
                                <p className="text-xs text-gray-500">
                                    {selectedCertificate.financialYear} - {selectedCertificate.quarter}
                                </p>
                            </div>

                            {/* TDS Amount */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Total TDS Amount <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    value={selectedCertificate.totalTDSAmount}
                                    onChange={(e) =>
                                        setSelectedCertificate({
                                            ...selectedCertificate,
                                            totalTDSAmount: parseFloat(e.target.value),
                                        })
                                    }
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-600 focus:outline-none"
                                    min="0"
                                    step="0.01"
                                    required
                                />
                            </div>

                            {/* Certificate Number */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Certificate Number
                                </label>
                                <input
                                    type="text"
                                    value={selectedCertificate.certificateNumber || ""}
                                    onChange={(e) =>
                                        setSelectedCertificate({
                                            ...selectedCertificate,
                                            certificateNumber: e.target.value,
                                        })
                                    }
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-600 focus:outline-none"
                                />
                            </div>

                            {/* Remarks */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Remarks
                                </label>
                                <textarea
                                    value={selectedCertificate.remarks || ""}
                                    onChange={(e) =>
                                        setSelectedCertificate({
                                            ...selectedCertificate,
                                            remarks: e.target.value,
                                        })
                                    }
                                    rows="3"
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-600 focus:outline-none"
                                />
                            </div>

                            {/* Replace File */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Replace Certificate File (Optional)
                                </label>
                                <input
                                    type="file"
                                    onChange={(e) => setEditFile(e.target.files[0])}
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-600 focus:outline-none"
                                />
                                {editFile && (
                                    <p className="text-sm text-gray-600 mt-1">
                                        New file: {editFile.name}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={handleEditCertificate}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                            >
                                Update Certificate
                            </button>
                            <button
                                onClick={() => setShowEditModal(false)}
                                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default TDSCertificates;

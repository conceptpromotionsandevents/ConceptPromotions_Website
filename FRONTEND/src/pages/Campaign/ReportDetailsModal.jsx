import React, { useState, useEffect, useRef } from "react";
import Select from "react-select";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "react-toastify";

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
};

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

const ReportDetailsModal = ({ report, onClose, onUpdate, onDelete }) => {
    useEffect(() => {
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = "auto";
        };
    }, []);

    const [isEditing, setIsEditing] = useState(false);

    // Form state
    const [reportType, setReportType] = useState(
        reportTypes.find((rt) => rt.value === report.reportType) || null
    );
    const [frequency, setFrequency] = useState(
        frequencyOptions.find((f) => f.value === report.frequency) || null
    );
    const [stockType, setStockType] = useState(
        stockTypeOptions.find((st) => st.value === report.stockType) || null
    );
    const [productType, setProductType] = useState(
        productTypeOptions.find((pt) => pt.value === report.productType) || null
    );
    const [brand, setBrand] = useState(report.brand || "");
    const [product, setProduct] = useState(report.product || "");
    const [sku, setSku] = useState(report.sku || "");
    const [quantity, setQuantity] = useState(report.quantity || "");
    const [remarks, setRemarks] = useState(report.remarks || "");

    const [images, setImages] = useState([]);
    const [billCopies, setBillCopies] = useState([]);
    const [files, setFiles] = useState([]);

    // Preview URL states
    const [imagePreviews, setImagePreviews] = useState([]);
    const [billCopyPreviews, setBillCopyPreviews] = useState([]);
    const [filePreviews, setFilePreviews] = useState([]);

    const [isSaving, setIsSaving] = useState(false);
    const [removedImageIndices, setRemovedImageIndices] = useState([]);
    const [removedBillIndices, setRemovedBillIndices] = useState([]);
    const [removedFileIndices, setRemovedFileIndices] = useState([]);

    // ✅ FIX: Use ref to track blob URLs for proper cleanup
    const previewUrlsRef = useRef({
        images: [],
        bills: [],
        files: []
    });

    // ✅ FIX: Cleanup preview URLs on unmount only
    useEffect(() => {
        return () => {
            // Cleanup all blob URLs when component unmounts
            previewUrlsRef.current.images.forEach((url) => {
                try {
                    URL.revokeObjectURL(url);
                } catch (e) {}
            });
            previewUrlsRef.current.bills.forEach((url) => {
                try {
                    URL.revokeObjectURL(url);
                } catch (e) {}
            });
            previewUrlsRef.current.files.forEach((url) => {
                try {
                    URL.revokeObjectURL(url);
                } catch (e) {}
            });
        };
    }, []);

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return "N/A";
            return date.toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
            });
        } catch (error) {
            return "N/A";
        }
    };

    // ✅ Helper function to get Cloudinary image URL
    const getImageSource = (imageData) => {
        if (!imageData) return null;
        if (typeof imageData === 'string') return imageData;
        if (imageData.secure_url) return imageData.secure_url;
        if (imageData.url) return imageData.url;
        return null;
    };

    // PDF Download with Cloudinary support
    const handleDownloadPDF = async () => {
        try {
            const doc = new jsPDF();
            let yPosition = 20;

            // Title
            doc.setFontSize(18);
            doc.setTextColor(228, 0, 43);
            doc.text("REPORT DETAILS", 105, yPosition, { align: "center" });
            yPosition += 15;

            // Basic Information
            doc.setFontSize(14);
            doc.setTextColor(0, 0, 0);
            doc.text("Basic Information", 15, yPosition);
            yPosition += 8;

            autoTable(doc, {
                startY: yPosition,
                head: [["Field", "Value"]],
                body: [
                    ["Report Type", report.reportType || "N/A"],
                    ["Frequency", report.frequency || "N/A"],
                ],
                theme: "grid",
                headStyles: { fillColor: [228, 0, 43] },
                margin: { left: 15, right: 15 },
            });

            yPosition = doc.lastAutoTable.finalY + 10;

            // Campaign Information
            doc.setFontSize(14);
            doc.text("Campaign Information", 15, yPosition);
            yPosition += 8;

            autoTable(doc, {
                startY: yPosition,
                head: [["Field", "Value"]],
                body: [
                    ["Campaign Name", report.campaignId?.name || "N/A"],
                    ["Campaign Type", report.campaignId?.type || "N/A"],
                    ["Client", report.campaignId?.client || "N/A"],
                ],
                theme: "grid",
                headStyles: { fillColor: [228, 0, 43] },
                margin: { left: 15, right: 15 },
            });

            yPosition = doc.lastAutoTable.finalY + 10;

            // Retailer Information
            doc.setFontSize(14);
            doc.text("Retailer Information", 15, yPosition);
            yPosition += 8;

            autoTable(doc, {
                startY: yPosition,
                head: [["Field", "Value"]],
                body: [
                    ["Retailer Name", report.retailer?.retailerName || "N/A"],
                    ["Outlet Code", report.retailer?.outletCode || "N/A"],
                    ["Outlet Name", report.retailer?.outletName || "N/A"],
                    ["Contact", report.retailer?.retailerId?.contactNo || "N/A"],
                ],
                theme: "grid",
                headStyles: { fillColor: [228, 0, 43] },
                margin: { left: 15, right: 15 },
            });

            yPosition = doc.lastAutoTable.finalY + 10;

            // Employee Information
            if (report.employee?.employeeName) {
                doc.setFontSize(14);
                doc.text("Employee Information", 15, yPosition);
                yPosition += 8;

                autoTable(doc, {
                    startY: yPosition,
                    head: [["Field", "Value"]],
                    body: [
                        ["Employee Name", report.employee?.employeeName || "N/A"],
                        ["Employee Code", report.employee?.employeeCode || "N/A"],
                        ["Phone", report.employee?.employeeId?.phone || "N/A"],
                    ],
                    theme: "grid",
                    headStyles: { fillColor: [228, 0, 43] },
                    margin: { left: 15, right: 15 },
                });

                yPosition = doc.lastAutoTable.finalY + 10;
            }

            // VISIT DETAILS
            if (report.submittedBy?.role === "Employee") {
                doc.setFontSize(14);
                doc.text("Visit Details", 15, yPosition);
                yPosition += 8;

                const visitData = [];
                if (report.typeOfVisit) visitData.push(["Type of Visit", report.typeOfVisit || "N/A"]);
                if (report.attendedVisit) {
                    const attendanceStatus = report.attendedVisit === "yes" ? "Attended" : "Not Attended";
                    visitData.push(["Attendance Status", attendanceStatus]);
                }
                if (report.attendedVisit === "no" && report.reasonForNonAttendance) {
                    if (report.reasonForNonAttendance.reason) {
                        visitData.push(["Reason for Non-Attendance", report.reasonForNonAttendance.reason]);
                    }
                    if (report.reasonForNonAttendance.reason === "others" && report.reasonForNonAttendance.otherReason) {
                        visitData.push(["Additional Details", report.reasonForNonAttendance.otherReason]);
                    }
                }

                if (visitData.length > 0) {
                    autoTable(doc, {
                        startY: yPosition,
                        head: [["Field", "Value"]],
                        body: visitData,
                        theme: "grid",
                        headStyles: { fillColor: [228, 0, 43] },
                        margin: { left: 15, right: 15 },
                    });

                    yPosition = doc.lastAutoTable.finalY + 10;
                }
            }

            // Product/Stock Information
            if (report.reportType === "Stock" &&
                (report.brand || report.product || report.sku || report.stockType)) {

                doc.setFontSize(14);
                doc.text("Product/Stock Information", 15, yPosition);
                yPosition += 8;

                const stockData = [];
                if (report.stockType) stockData.push(["Stock Type", report.stockType]);
                if (report.brand) stockData.push(["Brand", report.brand]);
                if (report.product) stockData.push(["Product", report.product]);
                if (report.sku) stockData.push(["SKU", report.sku]);
                if (report.productType) stockData.push(["Product Type", report.productType]);
                if (report.quantity) stockData.push(["Quantity", report.quantity]);

                autoTable(doc, {
                    startY: yPosition,
                    head: [["Field", "Value"]],
                    body: stockData,
                    theme: "grid",
                    headStyles: { fillColor: [228, 0, 43] },
                    margin: { left: 15, right: 15 },
                });

                yPosition = doc.lastAutoTable.finalY + 10;
            }

            // Date Information
            doc.setFontSize(14);
            doc.text("Date Information", 15, yPosition);
            yPosition += 8;

            autoTable(doc, {
                startY: yPosition,
                head: [["Field", "Value"]],
                body: [
                    ["Submitted On", formatDate(report.dateOfSubmission || report.createdAt)],
                    ["Submitted By", report.submittedBy?.role || "N/A"],
                ],
                theme: "grid",
                headStyles: { fillColor: [228, 0, 43] },
                margin: { left: 15, right: 15 },
            });

            yPosition = doc.lastAutoTable.finalY + 10;

            // Remarks
            if (report.remarks) {
                doc.setFontSize(14);
                doc.text("Remarks", 15, yPosition);
                yPosition += 8;

                doc.setFontSize(11);
                const remarksLines = doc.splitTextToSize(report.remarks, 180);
                doc.text(remarksLines, 15, yPosition);
                yPosition += remarksLines.length * 7 + 10;
            }

            // Shop Display Images
            if (report.reportType === "Window Display" &&
                report.shopDisplayImages &&
                report.shopDisplayImages.length > 0) {

                doc.addPage();
                yPosition = 20;

                doc.setFontSize(14);
                doc.setTextColor(0, 0, 0);
                doc.text("Shop Display Images", 15, yPosition);
                yPosition += 10;

                for (let i = 0; i < report.shopDisplayImages.length; i++) {
                    const imageUrl = getImageSource(report.shopDisplayImages[i]);

                    if (imageUrl) {
                        if (i > 0 && i % 2 === 0) {
                            doc.addPage();
                            yPosition = 20;
                        }

                        try {
                            if (imageUrl.startsWith('http')) {
                                const response = await fetch(imageUrl);
                                const blob = await response.blob();
                                const base64 = await new Promise((resolve) => {
                                    const reader = new FileReader();
                                    reader.onloadend = () => resolve(reader.result);
                                    reader.readAsDataURL(blob);
                                });
                                doc.addImage(base64, 'JPEG', 15, yPosition, 180, 120);
                            } else {
                                doc.addImage(imageUrl, 'JPEG', 15, yPosition, 180, 120);
                            }

                            doc.setFontSize(10);
                            doc.text(`Image ${i + 1}`, 15, yPosition + 125);
                            yPosition += 135;
                        } catch (err) {
                            console.error(`Error adding image ${i + 1}:`, err);
                        }
                    }
                }
            }

            // Bill Copies
            if (report.reportType === "Stock" &&
                report.billCopies &&
                report.billCopies.length > 0) {

                doc.addPage();
                yPosition = 20;

                doc.setFontSize(14);
                doc.setTextColor(0, 0, 0);
                doc.text("Bill Copies", 15, yPosition);
                yPosition += 10;

                for (let i = 0; i < report.billCopies.length; i++) {
                    const imageUrl = getImageSource(report.billCopies[i]);

                    if (imageUrl) {
                        if (i > 0 && i % 2 === 0) {
                            doc.addPage();
                            yPosition = 20;
                        }

                        try {
                            if (imageUrl.startsWith('http')) {
                                const response = await fetch(imageUrl);
                                const blob = await response.blob();
                                const base64 = await new Promise((resolve) => {
                                    const reader = new FileReader();
                                    reader.onloadend = () => resolve(reader.result);
                                    reader.readAsDataURL(blob);
                                });
                                doc.addImage(base64, 'JPEG', 15, yPosition, 180, 120);
                            } else {
                                doc.addImage(imageUrl, 'JPEG', 15, yPosition, 180, 120);
                            }

                            doc.setFontSize(10);
                            const fileName = report.billCopies[i].fileName || report.billCopies[i].originalName || `Bill ${i + 1}`;
                            doc.text(fileName, 15, yPosition + 125);
                            yPosition += 135;
                        } catch (err) {
                            console.error(`Error adding bill ${i + 1}:`, err);
                        }
                    }
                }
            }

            // Other Files
            if (report.reportType === "Others" &&
                report.files &&
                report.files.length > 0) {

                doc.addPage();
                yPosition = 20;

                doc.setFontSize(14);
                doc.setTextColor(0, 0, 0);
                doc.text("Other Files", 15, yPosition);
                yPosition += 10;

                for (let i = 0; i < report.files.length; i++) {
                    const imageUrl = getImageSource(report.files[i]);

                    if (imageUrl) {
                        if (i > 0 && i % 2 === 0) {
                            doc.addPage();
                            yPosition = 20;
                        }

                        try {
                            if (imageUrl.startsWith('http')) {
                                const response = await fetch(imageUrl);
                                const blob = await response.blob();
                                const base64 = await new Promise((resolve) => {
                                    const reader = new FileReader();
                                    reader.onloadend = () => resolve(reader.result);
                                    reader.readAsDataURL(blob);
                                });
                                doc.addImage(base64, 'JPEG', 15, yPosition, 180, 120);
                            } else {
                                doc.addImage(imageUrl, 'JPEG', 15, yPosition, 180, 120);
                            }

                            doc.setFontSize(10);
                            doc.text(`File ${i + 1}`, 15, yPosition + 125);
                            yPosition += 135;
                        } catch (err) {
                            console.error(`Error adding file ${i + 1}:`, err);
                        }
                    }
                }
            }

            // Save PDF
            const fileName = `Report_${report.reportType || "Unknown"}_${report.retailer?.outletCode || "Unknown"}_${new Date().toISOString().split("T")[0]}.pdf`;
            doc.save(fileName);

            toast.success("Report downloaded successfully!", { theme: "dark" });
        } catch (error) {
            console.error("Error generating PDF:", error);
            toast.error("Failed to download report", { theme: "dark" });
        }
    };

    const handleImageChange = (e) => {
        const newFiles = Array.from(e.target.files || []);
        if (newFiles.length > 0) {
            setImages((prevFiles) => [...prevFiles, ...newFiles]);

            // Create and track preview URLs
            const newPreviews = newFiles.map((file) => {
                const url = URL.createObjectURL(file);
                previewUrlsRef.current.images.push(url);
                return url;
            });
            setImagePreviews((prev) => [...prev, ...newPreviews]);
        }
        e.target.value = "";
    };

    const removeImage = (index) => {
        // Revoke URL before removing
        const urlToRevoke = imagePreviews[index];
        try {
            URL.revokeObjectURL(urlToRevoke);
            previewUrlsRef.current.images = previewUrlsRef.current.images.filter(u => u !== urlToRevoke);
        } catch (e) {}
        
        setImages((prevFiles) => prevFiles.filter((_, i) => i !== index));
        setImagePreviews((prev) => prev.filter((_, i) => i !== index));
    };

    // ✅ FIX: Don't revoke URLs for current images (Cloudinary URLs)
    const removeCurrentImage = (index) => {
        setRemovedImageIndices((prev) => [...prev, index]);
    };

    const handleBillCopy = (e) => {
        const newFiles = Array.from(e.target.files || []);
        if (newFiles.length > 0) {
            setBillCopies((prevFiles) => [...prevFiles, ...newFiles]);

            // Create and track preview URLs
            const newPreviews = newFiles.map((file) => {
                const url = URL.createObjectURL(file);
                previewUrlsRef.current.bills.push(url);
                return url;
            });
            setBillCopyPreviews((prev) => [...prev, ...newPreviews]);
        }
        e.target.value = "";
    };

    const removeBill = (index) => {
        // Revoke URL before removing
        const urlToRevoke = billCopyPreviews[index];
        try {
            URL.revokeObjectURL(urlToRevoke);
            previewUrlsRef.current.bills = previewUrlsRef.current.bills.filter(u => u !== urlToRevoke);
        } catch (e) {}
        
        setBillCopies((prevFiles) => prevFiles.filter((_, i) => i !== index));
        setBillCopyPreviews((prev) => prev.filter((_, i) => i !== index));
    };

    // ✅ FIX: Don't revoke URLs for current bills (Cloudinary URLs)
    const removeCurrentBill = (index) => {
        setRemovedBillIndices((prev) => [...prev, index]);
    };

    const handleFilesChange = (e) => {
        const newFiles = Array.from(e.target.files || []);
        if (newFiles.length > 0) {
            setFiles((prevFiles) => [...prevFiles, ...newFiles]);

            // Create and track preview URLs
            const newPreviews = newFiles.map((file) => {
                const url = URL.createObjectURL(file);
                previewUrlsRef.current.files.push(url);
                return url;
            });
            setFilePreviews((prev) => [...prev, ...newPreviews]);
        }
        e.target.value = "";
    };

    const removeFile = (index) => {
        // Revoke URL before removing
        const urlToRevoke = filePreviews[index];
        try {
            URL.revokeObjectURL(urlToRevoke);
            previewUrlsRef.current.files = previewUrlsRef.current.files.filter(u => u !== urlToRevoke);
        } catch (e) {}
        
        setFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
        setFilePreviews((prev) => prev.filter((_, i) => i !== index));
    };

    // ✅ FIX: Don't revoke URLs for current files (Cloudinary URLs)
    const removeCurrentFile = (index) => {
        setRemovedFileIndices((prev) => [...prev, index]);
    };

    const handleSave = async (e) => {
        e.preventDefault();

        if (!reportType) {
            alert("Please select a report type");
            return;
        }

        setIsSaving(true);

        const formData = new FormData();
        formData.append("reportType", reportType.value);
        if (frequency) formData.append("frequency", frequency.value);
        if (remarks) formData.append("remarks", remarks);

        if (removedImageIndices.length > 0) {
            formData.append("removedImageIndices", JSON.stringify(removedImageIndices));
        }
        if (removedBillIndices.length > 0) {
            formData.append("removedBillIndices", JSON.stringify(removedBillIndices));
        }
        if (removedFileIndices.length > 0) {
            formData.append("removedFileIndices", JSON.stringify(removedFileIndices));
        }

        if (reportType?.value === "Stock") {
            if (stockType) formData.append("stockType", stockType.value);
            if (brand) formData.append("brand", brand);
            if (product) formData.append("product", product);
            if (sku) formData.append("sku", sku);
            if (productType) formData.append("productType", productType.value);
            if (quantity) formData.append("quantity", quantity);

            if (billCopies.length > 0) {
                billCopies.forEach((file) => {
                    formData.append("billCopies", file);
                });
            }
        }

        if (reportType?.value === "Window Display" && images.length > 0) {
            images.forEach((image) => {
                formData.append("shopDisplayImages", image);
            });
        }

        if (reportType?.value === "Others" && files.length > 0) {
            files.forEach((file) => {
                formData.append("files", file);
            });
        }

        try {
            await onUpdate(report._id, formData);
            setIsEditing(false);
            onClose();
        } catch (error) {
            console.error("Failed to update report", error);
            alert("Failed to update report. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        try {
            await onDelete(report._id);
        } catch (error) {
            console.error("Failed to delete report", error);
            alert("Failed to delete report. Please try again.");
        }
    };

    // ✅ FIX: Reset edit mode properly
    useEffect(() => {
        if (isEditing) {
            // Reset form state
            setReportType(reportTypes.find((rt) => rt.value === report.reportType) || null);
            setFrequency(frequencyOptions.find((f) => f.value === report.frequency) || null);
            setStockType(stockTypeOptions.find((st) => st.value === report.stockType) || null);
            setProductType(productTypeOptions.find((pt) => pt.value === report.productType) || null);
            setBrand(report.brand || "");
            setProduct(report.product || "");
            setSku(report.sku || "");
            setQuantity(report.quantity || "");
            setRemarks(report.remarks || "");
            
            // Clear new uploads
            setImages([]);
            setBillCopies([]);
            setFiles([]);
            
            // Clear removal indices
            setRemovedImageIndices([]);
            setRemovedBillIndices([]);
            setRemovedFileIndices([]);

            // ✅ FIX: Clean up any existing blob URLs before resetting
            previewUrlsRef.current.images.forEach(url => {
                try { URL.revokeObjectURL(url); } catch (e) {}
            });
            previewUrlsRef.current.bills.forEach(url => {
                try { URL.revokeObjectURL(url); } catch (e) {}
            });
            previewUrlsRef.current.files.forEach(url => {
                try { URL.revokeObjectURL(url); } catch (e) {}
            });
            
            // Reset tracking
            previewUrlsRef.current = {
                images: [],
                bills: [],
                files: []
            };

            // Reset preview states
            setImagePreviews([]);
            setBillCopyPreviews([]);
            setFilePreviews([]);
        }
    }, [isEditing]);

    return (
        <div
            className="fixed inset-0 bg-black/10 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-lg shadow-xl max-w-5xl w-full my-8"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="max-h-[85vh] overflow-y-auto">
                    {/* Header */}
                    <div className="sticky top-0 bg-white z-10 border-b p-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-2xl font-bold text-[#E4002B]">
                                {isEditing ? "Edit Report" : "Report Details"}
                            </h2>
                            <div className="flex items-center gap-3">
                                {!isEditing ? (
                                    <>
                                        <button
                                            onClick={handleDownloadPDF}
                                            className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition flex items-center gap-2 cursor-pointer"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                            Download PDF
                                        </button>
                                        <button
                                            onClick={() => setIsEditing(true)}
                                            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition cursor-pointer"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={handleDelete}
                                            className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 transition cursor-pointer"
                                        >
                                            Delete
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button
                                            onClick={handleSave}
                                            disabled={isSaving}
                                            className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition disabled:bg-gray-400 cursor-pointer"
                                        >
                                            {isSaving ? "Saving..." : "Save Changes"}
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (window.confirm("Discard all changes?")) {
                                                    setIsEditing(false);
                                                }
                                            }}
                                            className="bg-gray-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-600 transition cursor-pointer"
                                        >
                                            Cancel
                                        </button>
                                    </>
                                )}
                                <button
                                    onClick={onClose}
                                    className="text-gray-500 hover:text-gray-700 ml-2 cursor-pointer"
                                >
                                    <span className="text-2xl">&times;</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                        {isEditing ? (
                            /* EDIT MODE */
                            <form className="space-y-6">
                                {/* Campaign Info - Read Only */}
                                <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-blue-500">
                                    <h3 className="text-lg font-semibold mb-3 text-gray-700">
                                        Campaign Information
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                        <div>
                                            <span className="font-medium text-gray-600">Campaign: </span>
                                            <p className="text-gray-800">{report.campaignId?.name || "N/A"}</p>
                                        </div>
                                        <div>
                                            <span className="font-medium text-gray-600">Type: </span>
                                            <p className="text-gray-800">{report.campaignId?.type || "N/A"}</p>
                                        </div>
                                        <div>
                                            <span className="font-medium text-gray-600">Client: </span>
                                            <p className="text-gray-800">{report.campaignId?.client || "N/A"}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Retailer - Non-editable */}
                                <div className="bg-gray-100 p-4 rounded-lg border">
                                    <label className="block font-medium mb-2 text-gray-700">
                                        Retailer (Cannot be changed)
                                    </label>
                                    <div className="bg-white p-3 rounded border">
                                        <p className="font-semibold text-gray-800">
                                            {report.retailer?.retailerName || "N/A"}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            {report.retailer?.outletName} - {report.retailer?.outletCode}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            {report.retailer?.retailerId?.shopDetails?.shopAddress?.city || "N/A"}, {report.retailer?.retailerId?.shopDetails?.shopAddress?.state || "N/A"}
                                        </p>
                                    </div>
                                </div>

                                {/* Employee - Non-editable */}
                                {report.employee?.employeeName && (
                                    <div className="bg-gray-100 p-4 rounded-lg border">
                                        <label className="block font-medium mb-2 text-gray-700">
                                            Employee (Cannot be changed)
                                        </label>
                                        <div className="bg-white p-3 rounded border">
                                            <p className="font-semibold text-gray-800">
                                                {report.employee?.employeeName || "N/A"}
                                            </p>
                                            <p className="text-sm text-gray-600">
                                                {report.employee?.employeeCode || "N/A"}
                                            </p>
                                            {report.employee?.employeeId?.phone && (
                                                <p className="text-sm text-gray-500">
                                                    {report.employee.employeeId.phone}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Report Type */}
                                <div>
                                    <label className="block font-medium mb-2">Type of Report</label>
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
                                    <label className="block font-medium mb-2">Frequency</label>
                                    <Select
                                        styles={customSelectStyles}
                                        options={frequencyOptions}
                                        value={frequency}
                                        onChange={setFrequency}
                                        placeholder="Select Frequency"
                                        isSearchable
                                        isClearable
                                    />
                                </div>

                                {/* STOCK REPORT FIELDS */}
                                {reportType?.value === "Stock" && (
                                    <div className="space-y-4 bg-blue-50 p-4 rounded-md border border-blue-200">
                                        <h3 className="text-lg font-semibold text-gray-700">
                                            Stock Information
                                        </h3>

                                        <div>
                                            <label className="block font-medium mb-2">Stock Type</label>
                                            <Select
                                                styles={customSelectStyles}
                                                options={stockTypeOptions}
                                                value={stockType}
                                                onChange={setStockType}
                                                placeholder="Select Stock Type"
                                                isSearchable
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block font-medium mb-2">Brand</label>
                                                <input
                                                    type="text"
                                                    value={brand}
                                                    onChange={(e) => setBrand(e.target.value)}
                                                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-[#E4002B] focus:outline-none"
                                                    placeholder="Brand"
                                                />
                                            </div>
                                            <div>
                                                <label className="block font-medium mb-2">Product</label>
                                                <input
                                                    type="text"
                                                    value={product}
                                                    onChange={(e) => setProduct(e.target.value)}
                                                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-[#E4002B] focus:outline-none"
                                                    placeholder="Product"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block font-medium mb-2">SKU</label>
                                                <input
                                                    type="text"
                                                    value={sku}
                                                    onChange={(e) => setSku(e.target.value)}
                                                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-[#E4002B] focus:outline-none"
                                                    placeholder="SKU"
                                                />
                                            </div>
                                            <div>
                                                <label className="block font-medium mb-2">Product Type</label>
                                                <Select
                                                    styles={customSelectStyles}
                                                    options={productTypeOptions}
                                                    value={productType}
                                                    onChange={setProductType}
                                                    placeholder="Select Product Type"
                                                    isSearchable
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block font-medium mb-2">Quantity</label>
                                            <input
                                                type="number"
                                                value={quantity}
                                                onChange={(e) => setQuantity(e.target.value)}
                                                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-[#E4002B] focus:outline-none"
                                                placeholder="Quantity"
                                            />
                                        </div>

                                        {/* Current Bill Copies */}
                                        {report.billCopies && report.billCopies.length > 0 && (
                                            <div className="mb-4">
                                                <p className="text-sm font-medium text-gray-600 mb-2">
                                                    Current Bill Copies ({report.billCopies.filter((_, idx) => !removedBillIndices.includes(idx)).length})
                                                </p>
                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                                    {report.billCopies.map((bill, idx) => {
                                                        // Skip if marked for removal
                                                        if (removedBillIndices.includes(idx)) return null;

                                                        // Get Cloudinary URL (not blob URL)
                                                        const imageSource = getImageSource(bill);

                                                        // Skip if no valid URL
                                                        if (!imageSource) return null;

                                                        return (
                                                            <div key={idx} className="relative group">
                                                                <img
                                                                    src={imageSource}  // ✅ This is a Cloudinary URL
                                                                    alt={`Bill ${idx + 1}`}
                                                                    className="w-full h-32 object-cover rounded border"
                                                                />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeCurrentBill(idx)}  // ✅ Just marks for removal
                                                                    className="absolute top-1 right-1 bg-[#E4002B] text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                                >
                                                                    &times;
                                                                </button>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        {/* New Bill Copy Upload */}
                                        <div>
                                            <label className="block font-medium mb-2">
                                                {billCopies.length > 0 ? "Add More Bill Copies" : "Upload Bill Copies"}
                                            </label>
                                            <label className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-gray-500 cursor-pointer hover:border-[#E4002B]">
                                                <span className="text-3xl text-gray-400">+</span>
                                                <span>Click to upload bill copies (multiple allowed)</span>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    multiple
                                                    className="hidden"
                                                    onChange={handleBillCopy}
                                                />
                                            </label>

                                            {billCopies.length > 0 && (
                                                <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-2">
                                                    {billCopies.map((file, index) => (
                                                        <div key={index} className="relative group">
                                                            <img
                                                                src={billCopyPreviews[index]}
                                                                className="w-full h-32 object-cover rounded border"
                                                                alt={`New Bill ${index + 1}`}
                                                            />
                                                            <button
                                                                type="button"
                                                                className="absolute top-1 right-1 bg-[#E4002B] text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                                onClick={() => removeBill(index)}
                                                            >
                                                                &times;
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Remarks */}
                                <div>
                                    <label className="block font-medium mb-2">Remarks</label>
                                    <textarea
                                        value={remarks}
                                        onChange={(e) => setRemarks(e.target.value)}
                                        className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-[#E4002B] focus:outline-none"
                                        placeholder="Add remarks..."
                                        rows="3"
                                    />
                                </div>

                                {/* WINDOW DISPLAY - Images */}
                                {reportType?.value === "Window Display" && (
                                    <div>
                                        {report.shopDisplayImages && report.shopDisplayImages.length > 0 && (
                                            <div className="mb-4">
                                                <p className="text-sm font-medium text-gray-600 mb-2">
                                                    Current Images ({report.shopDisplayImages.filter((_, idx) => !removedImageIndices.includes(idx)).length})
                                                </p>
                                                <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                                                    {report.shopDisplayImages.map((img, idx) => {
                                                        if (removedImageIndices.includes(idx)) return null;

                                                        const imageSource = getImageSource(img);
                                                        if (!imageSource) return null;

                                                        return (
                                                            <div key={idx} className="relative group">
                                                                <img
                                                                    src={imageSource}
                                                                    alt={`Current ${idx + 1}`}
                                                                    className="w-full h-20 object-cover rounded border"
                                                                />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeCurrentImage(idx)}
                                                                    className="absolute top-1 right-1 bg-[#E4002B] text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                                >
                                                                    &times;
                                                                </button>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        <label className="block font-medium mb-2">
                                            {report.shopDisplayImages && report.shopDisplayImages.length > 0 ? "Add More Images" : "Upload Images"}
                                        </label>
                                        <label className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-gray-500 cursor-pointer hover:border-[#E4002B]">
                                            <span className="text-3xl text-gray-400">+</span>
                                            <span>Click to upload new images</span>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                multiple
                                                className="hidden"
                                                onChange={handleImageChange}
                                            />
                                        </label>

                                        {images.length > 0 && (
                                            <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                                                {images.map((file, index) => (
                                                    <div
                                                        key={index}
                                                        className="relative border-2 border-dashed rounded-lg overflow-hidden bg-gray-50 group"
                                                    >
                                                        <img
                                                            src={imagePreviews[index]}
                                                            className="w-full h-32 object-cover"
                                                            alt={`preview-${index}`}
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => removeImage(index)}
                                                            className="absolute top-1 right-1 bg-[#E4002B] text-white rounded-full p-1"
                                                        >
                                                            &times;
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* OTHERS - Files */}
                                {reportType?.value === "Others" && (
                                    <div>
                                        {report.files && report.files.length > 0 && (
                                            <div className="mb-4">
                                                <p className="text-sm font-medium text-gray-600 mb-2">
                                                    Current Files ({report.files.filter((_, idx) => !removedFileIndices.includes(idx)).length})
                                                </p>
                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                                    {report.files.map((file, idx) => {
                                                        if (removedFileIndices.includes(idx)) return null;

                                                        const imageSource = getImageSource(file);
                                                        if (!imageSource) return null;

                                                        return (
                                                            <div key={idx} className="relative group">
                                                                <img
                                                                    src={imageSource}
                                                                    alt={`File ${idx + 1}`}
                                                                    className="w-full h-32 object-cover rounded border"
                                                                />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeCurrentFile(idx)}
                                                                    className="absolute top-1 right-1 bg-[#E4002B] text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                                >
                                                                    &times;
                                                                </button>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        <label className="block font-medium mb-2">
                                            {report.files && report.files.length > 0 ? "Add More Files" : "Upload Files"}
                                        </label>
                                        <label className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-gray-500 cursor-pointer hover:border-[#E4002B]">
                                            <span className="text-3xl text-gray-400">+</span>
                                            <span>Click to upload files</span>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                multiple
                                                className="hidden"
                                                onChange={handleFilesChange}
                                            />
                                        </label>

                                        {files.length > 0 && (
                                            <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-2">
                                                {files.map((file, index) => (
                                                    <div key={index} className="relative group">
                                                        <img
                                                            src={filePreviews[index]}
                                                            className="w-full h-32 object-cover rounded border"
                                                            alt={`New File ${index + 1}`}
                                                        />
                                                        <button
                                                            type="button"
                                                            className="absolute top-1 right-1 bg-[#E4002B] text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                            onClick={() => removeFile(index)}
                                                        >
                                                            &times;
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </form>
                        ) : (
                            /* VIEW MODE */
                            <div className="space-y-6">
                                {/* Basic Info */}
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <h3 className="text-lg font-semibold mb-4 text-gray-700">
                                        Basic Information
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-600 mb-1">
                                                Report Type
                                            </label>
                                            <p className="text-gray-800 bg-white px-3 py-2 rounded">
                                                {report.reportType || "N/A"}
                                            </p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-600 mb-1">
                                                Submitted By
                                            </label>
                                            <p className="text-gray-800 bg-white px-3 py-2 rounded">
                                                {report.submittedBy?.role || "N/A"}
                                            </p>
                                        </div>
                                        {report.frequency && (
                                            <div>
                                                <label className="block text-sm font-medium text-gray-600 mb-1">
                                                    Frequency
                                                </label>
                                                <p className="text-gray-800 bg-white px-3 py-2 rounded">
                                                    {report.frequency}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Campaign Info */}
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <h3 className="text-lg font-semibold mb-4 text-gray-700">
                                        Campaign Information
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-600 mb-1">
                                                Campaign Name
                                            </label>
                                            <p className="text-gray-800 bg-white px-3 py-2 rounded">
                                                {report.campaignId?.name || "N/A"}
                                            </p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-600 mb-1">
                                                Campaign Type
                                            </label>
                                            <p className="text-gray-800 bg-white px-3 py-2 rounded">
                                                {report.campaignId?.type || "N/A"}
                                            </p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-600 mb-1">
                                                Client
                                            </label>
                                            <p className="text-gray-800 bg-white px-3 py-2 rounded">
                                                {report.campaignId?.client || "N/A"}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Retailer Info */}
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <h3 className="text-lg font-semibold mb-4 text-gray-700">
                                        Retailer Information
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-600 mb-1">
                                                Retailer Name
                                            </label>
                                            <p className="text-gray-800 bg-white px-3 py-2 rounded">
                                                {report.retailer?.retailerName || "N/A"}
                                            </p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-600 mb-1">
                                                Outlet Code
                                            </label>
                                            <p className="text-gray-800 bg-white px-3 py-2 rounded">
                                                {report.retailer?.outletCode || "N/A"}
                                            </p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-600 mb-1">
                                                Outlet Name
                                            </label>
                                            <p className="text-gray-800 bg-white px-3 py-2 rounded">
                                                {report.retailer?.outletName || "N/A"}
                                            </p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-600 mb-1">
                                                Contact
                                            </label>
                                            <p className="text-gray-800 bg-white px-3 py-2 rounded">
                                                {report.retailer?.retailerId?.contactNo || "N/A"}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Employee Info */}
                                {report.employee?.employeeName && (
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <h3 className="text-lg font-semibold mb-4 text-gray-700">
                                            Employee Information
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-600 mb-1">
                                                    Employee Name
                                                </label>
                                                <p className="text-gray-800 bg-white px-3 py-2 rounded">
                                                    {report.employee.employeeName}
                                                </p>
                                            </div>
                                            {report.employee.employeeCode && (
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-600 mb-1">
                                                        Employee Code
                                                    </label>
                                                    <p className="text-gray-800 bg-white px-3 py-2 rounded">
                                                        {report.employee.employeeCode}
                                                    </p>
                                                </div>
                                            )}
                                            {report.employee.employeeId?.phone && (
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-600 mb-1">
                                                        Phone
                                                    </label>
                                                    <p className="text-gray-800 bg-white px-3 py-2 rounded">
                                                        {report.employee.employeeId.phone}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Employee Visit Details in View Mode */}
                                {report.submittedBy?.role === "Employee" && (
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <h3 className="text-lg font-semibold mb-4 text-gray-700">
                                            Visit Details
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-600 mb-1">
                                                    Type of Visit
                                                </label>
                                                <p className="text-gray-800 bg-white px-3 py-2 rounded capitalize">
                                                    {report.typeOfVisit || "N/A"}
                                                </p>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-600 mb-1">
                                                    Attendance Status
                                                </label>
                                                <p className="px-3 py-2 rounded bg-white text-gray-800">
                                                    {report.attendedVisit === "yes" ? "Attended" : "Not Attended"}
                                                </p>
                                            </div>
                                            {report.attendedVisit === "no" && report.reasonForNonAttendance && (
                                                <>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-600 mb-1">
                                                            Reason
                                                        </label>
                                                        <p className="text-gray-800 bg-white px-3 py-2 rounded capitalize">
                                                            {report.reasonForNonAttendance.reason || "N/A"}
                                                        </p>
                                                    </div>
                                                    {report.reasonForNonAttendance.reason === "others" &&
                                                        report.reasonForNonAttendance.otherReason && (
                                                            <div className="md:col-span-2">
                                                                <label className="block text-sm font-medium text-gray-600 mb-1">
                                                                    Additional Details
                                                                </label>
                                                                <p className="text-gray-800 bg-white px-3 py-2 rounded">
                                                                    {report.reasonForNonAttendance.otherReason}
                                                                </p>
                                                            </div>
                                                        )}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Product/Stock Info */}
                                {report.reportType === "Stock" &&
                                    (report.brand || report.product || report.sku || report.stockType) && (
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <h3 className="text-lg font-semibold mb-4 text-gray-700">
                                                Product/Stock Information
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {report.stockType && (
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-600 mb-1">
                                                            Stock Type
                                                        </label>
                                                        <p className="text-gray-800 bg-white px-3 py-2 rounded">
                                                            {report.stockType}
                                                        </p>
                                                    </div>
                                                )}
                                                {report.brand && (
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-600 mb-1">
                                                            Brand
                                                        </label>
                                                        <p className="text-gray-800 bg-white px-3 py-2 rounded">
                                                            {report.brand}
                                                        </p>
                                                    </div>
                                                )}
                                                {report.product && (
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-600 mb-1">
                                                            Product
                                                        </label>
                                                        <p className="text-gray-800 bg-white px-3 py-2 rounded">
                                                            {report.product}
                                                        </p>
                                                    </div>
                                                )}
                                                {report.sku && (
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-600 mb-1">
                                                            SKU
                                                        </label>
                                                        <p className="text-gray-800 bg-white px-3 py-2 rounded">
                                                            {report.sku}
                                                        </p>
                                                    </div>
                                                )}
                                                {report.productType && (
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-600 mb-1">
                                                            Product Type
                                                        </label>
                                                        <p className="text-gray-800 bg-white px-3 py-2 rounded">
                                                            {report.productType}
                                                        </p>
                                                    </div>
                                                )}
                                                {report.quantity && (
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-600 mb-1">
                                                            Quantity
                                                        </label>
                                                        <p className="text-gray-800 bg-white px-3 py-2 rounded">
                                                            {report.quantity}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                {/* Date Info */}
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <h3 className="text-lg font-semibold mb-4 text-gray-700">
                                        Date Information
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-600 mb-1">
                                                Submitted On
                                            </label>
                                            <p className="text-gray-800 bg-white px-3 py-2 rounded">
                                                {formatDate(report.dateOfSubmission || report.createdAt)}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Remarks */}
                                {report.remarks && (
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <h3 className="text-lg font-semibold mb-4 text-gray-700">
                                            Remarks
                                        </h3>
                                        <p className="text-gray-800 bg-white px-3 py-2 rounded">
                                            {report.remarks}
                                        </p>
                                    </div>
                                )}

                                {/* ✅ UPDATED: Shop Display Images - Cloudinary Compatible */}
                                {report.reportType === "Window Display" &&
                                    report.shopDisplayImages &&
                                    report.shopDisplayImages.length > 0 && (
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <h3 className="text-lg font-semibold mb-4 text-gray-700">
                                                Shop Display Images ({report.shopDisplayImages.length})
                                            </h3>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                                {report.shopDisplayImages.map((img, idx) => {
                                                    const imageSource = getImageSource(img);
                                                    if (!imageSource) return null;

                                                    return (
                                                        <div
                                                            key={idx}
                                                            className="relative bg-black rounded-lg overflow-hidden"
                                                            style={{ height: "200px" }}
                                                        >
                                                            <img
                                                                src={imageSource}
                                                                alt={`Display ${idx + 1}`}
                                                                className="w-full h-full object-contain"
                                                            />
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                {/* ✅ UPDATED: Bill Copies - Cloudinary Compatible */}
                                {report.reportType === "Stock" &&
                                    report.billCopies &&
                                    report.billCopies.length > 0 && (
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <h3 className="text-lg font-semibold mb-4 text-gray-700">
                                                Bill {report.billCopies.length > 1 ? "Copies" : "Copy"} ({report.billCopies.length})
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {report.billCopies.map((bill, idx) => {
                                                    const imageSource = getImageSource(bill);
                                                    if (!imageSource) return null;

                                                    return (
                                                        <div
                                                            key={idx}
                                                            className="relative bg-black rounded-lg overflow-hidden"
                                                            style={{ height: "300px" }}
                                                        >
                                                            <img
                                                                src={imageSource}
                                                                alt={`Bill Copy ${idx + 1}`}
                                                                className="w-full h-full object-contain"
                                                            />
                                                            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                                                                {bill.fileName || `Bill ${idx + 1}`}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                {/* ✅ UPDATED: Other Files - Cloudinary Compatible */}
                                {report.reportType === "Others" &&
                                    report.files &&
                                    report.files.length > 0 && (
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <h3 className="text-lg font-semibold mb-4 text-gray-700">
                                                Files ({report.files.length})
                                            </h3>
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                                {report.files.map((file, idx) => {
                                                    const imageSource = getImageSource(file);
                                                    if (!imageSource) return null;

                                                    return (
                                                        <div
                                                            key={idx}
                                                            className="relative bg-black rounded-lg overflow-hidden"
                                                            style={{ height: "200px" }}
                                                        >
                                                            <img
                                                                src={imageSource}
                                                                alt={`File ${idx + 1}`}
                                                                className="w-full h-full object-contain"
                                                            />
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReportDetailsModal;

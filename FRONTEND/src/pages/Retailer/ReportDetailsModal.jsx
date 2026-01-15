import React from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "react-toastify";

const ReportDetailsModal = ({ report, onClose }) => {
  if (!report) return null;

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

  // ✅ FIXED: Extract URL from Cloudinary object structure
  const getImageUrl = (imageData) => {
    if (!imageData) return null;

    // If it's already a string URL
    if (typeof imageData === "string") {
      return imageData;
    }

    // If it's an object with url property (your backend format)
    if (typeof imageData === "object" && imageData.url) {
      return imageData.url;
    }

    // If it's an object with secure_url property (alternative Cloudinary format)
    if (typeof imageData === "object" && imageData.secure_url) {
      return imageData.secure_url;
    }

    return null;
  };

  // ✅ Convert Cloudinary URL to base64 for PDF
  const getBase64FromUrl = async (url) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error("Error converting URL to base64:", error);
      return null;
    }
  };

  // ✅ PDF Download Function
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

      const basicInfoData = [
        ["Report Type", report.reportType || "N/A"],
        ["Frequency", report.frequency || "N/A"],
        [
          "Date of Submission",
          formatDate(report.dateOfSubmission || report.createdAt),
        ],
        ["Submitted By", report.submittedBy?.role || "N/A"],
      ];

      autoTable(doc, {
        startY: yPosition,
        head: [["Field", "Value"]],
        body: basicInfoData,
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
      if (report.retailer) {
        doc.setFontSize(14);
        doc.text("Retailer Information", 15, yPosition);
        yPosition += 8;

        const retailerData = [
          ["Outlet Name", report.retailer?.outletName || "N/A"],
          ["Retailer Name", report.retailer?.retailerName || "N/A"],
          ["Outlet Code", report.retailer?.outletCode || "N/A"],
        ];

        autoTable(doc, {
          startY: yPosition,
          head: [["Field", "Value"]],
          body: retailerData,
          theme: "grid",
          headStyles: { fillColor: [228, 0, 43] },
          margin: { left: 15, right: 15 },
        });

        yPosition = doc.lastAutoTable.finalY + 10;
      }

      // Employee Information
      if (report.employee) {
        doc.setFontSize(14);
        doc.text("Employee Information", 15, yPosition);
        yPosition += 8;

        const employeeData = [
          [
            "Employee Name",
            report.employee.employeeId?.name ||
              report.employee.employeeName ||
              "N/A",
          ],
          [
            "Employee Code",
            report.employee.employeeId?.employeeId ||
              report.employee.employeeCode ||
              "N/A",
          ],
        ];

        if (report.employee.employeeId?.phone) {
          employeeData.push(["Contact", report.employee.employeeId.phone]);
        }

        autoTable(doc, {
          startY: yPosition,
          head: [["Field", "Value"]],
          body: employeeData,
          theme: "grid",
          headStyles: { fillColor: [228, 0, 43] },
          margin: { left: 15, right: 15 },
        });

        yPosition = doc.lastAutoTable.finalY + 10;
      }

      // Visit Details
      if (report.submittedBy?.role === "Employee") {
        doc.setFontSize(14);
        doc.text("Visit Details", 15, yPosition);
        yPosition += 8;

        const visitData = [
          ["Type of Visit", report.typeOfVisit || "N/A"],
          [
            "Attendance Status",
            report.attendedVisit === "yes" ? "Attended" : "Not Attended",
          ],
        ];

        if (report.attendedVisit === "no" && report.reasonForNonAttendance) {
          visitData.push([
            "Reason",
            report.reasonForNonAttendance.reason || "N/A",
          ]);
          if (
            report.reasonForNonAttendance.reason === "others" &&
            report.reasonForNonAttendance.otherReason
          ) {
            visitData.push([
              "Additional Details",
              report.reasonForNonAttendance.otherReason,
            ]);
          }
        }

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

      // Product/Stock Information
      if (
        report.reportType === "Stock" &&
        (report.brand || report.product || report.sku || report.stockType)
      ) {
        doc.setFontSize(14);
        doc.text("Product/Stock Information", 15, yPosition);
        yPosition += 8;

        const stockData = [];
        if (report.stockType) stockData.push(["Stock Type", report.stockType]);
        if (report.brand) stockData.push(["Brand", report.brand]);
        if (report.product) stockData.push(["Product", report.product]);
        if (report.sku) stockData.push(["SKU", report.sku]);
        if (report.productType)
          stockData.push(["Product Type", report.productType]);
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

      // ✅ Shop Display Images
      if (
        report.reportType === "Window Display" &&
        report.shopDisplayImages &&
        report.shopDisplayImages.length > 0
      ) {
        doc.addPage();
        yPosition = 20;

        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0);
        doc.text("Shop Display Images", 15, yPosition);
        yPosition += 10;

        for (let i = 0; i < report.shopDisplayImages.length; i++) {
          const imageUrl = getImageUrl(report.shopDisplayImages[i]);

          if (imageUrl) {
            if (i > 0 && i % 2 === 0) {
              doc.addPage();
              yPosition = 20;
            }

            try {
              const base64Image = await getBase64FromUrl(imageUrl);
              if (base64Image) {
                doc.addImage(base64Image, "JPEG", 15, yPosition, 180, 120);
                doc.setFontSize(10);
                doc.text(`Image ${i + 1}`, 15, yPosition + 125);
                yPosition += 135;
              }
            } catch (err) {
              console.error(`Error adding image ${i + 1}:`, err);
            }
          }
        }
      }

      // ✅ Bill Copies
      if (
        report.reportType === "Stock" &&
        report.billCopies &&
        report.billCopies.length > 0
      ) {
        doc.addPage();
        yPosition = 20;

        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0);
        doc.text("Bill Copies", 15, yPosition);
        yPosition += 10;

        for (let i = 0; i < report.billCopies.length; i++) {
          const billUrl = getImageUrl(report.billCopies[i]);

          if (billUrl) {
            if (i > 0 && i % 2 === 0) {
              doc.addPage();
              yPosition = 20;
            }

            try {
              const base64Image = await getBase64FromUrl(billUrl);
              if (base64Image) {
                doc.addImage(base64Image, "JPEG", 15, yPosition, 180, 120);
                doc.setFontSize(10);
                const fileName =
                  report.billCopies[i].fileName || `Bill ${i + 1}`;
                doc.text(fileName, 15, yPosition + 125);
                yPosition += 135;
              }
            } catch (err) {
              console.error(`Error adding bill ${i + 1}:`, err);
            }
          }
        }
      }

      // ✅ Other Files
      if (
        report.reportType === "Others" &&
        report.files &&
        report.files.length > 0
      ) {
        doc.addPage();
        yPosition = 20;

        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0);
        doc.text("Other Files", 15, yPosition);
        yPosition += 10;

        for (let i = 0; i < report.files.length; i++) {
          const fileUrl = getImageUrl(report.files[i]);

          if (fileUrl) {
            if (i > 0 && i % 2 === 0) {
              doc.addPage();
              yPosition = 20;
            }

            try {
              const base64Image = await getBase64FromUrl(fileUrl);
              if (base64Image) {
                doc.addImage(base64Image, "JPEG", 15, yPosition, 180, 120);
                doc.setFontSize(10);
                doc.text(`File ${i + 1}`, 15, yPosition + 125);
                yPosition += 135;
              }
            } catch (err) {
              console.error(`Error adding file ${i + 1}:`, err);
            }
          }
        }
      }

      // Save PDF
      const fileName = `Report_${report.reportType || "Unknown"}_${
        report.retailer?.outletCode || "Unknown"
      }_${new Date().toISOString().split("T")[0]}.pdf`;
      doc.save(fileName);

      toast.success("Report downloaded successfully!", { theme: "dark" });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to download report. Try again.", { theme: "dark" });
    }
  };

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
                Report Details
              </h2>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleDownloadPDF}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition flex items-center gap-2 cursor-pointer"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  Download PDF
                </button>

                <button
                  onClick={onClose}
                  className="text-gray-500 hover:text-gray-700 cursor-pointer"
                >
                  <span className="text-2xl">&times;</span>
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
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
                    <p className="text-gray-800 bg-white px-3 py-2 rounded border">
                      {report.reportType || "N/A"}
                    </p>
                  </div>
                  {report.frequency && (
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">
                        Frequency
                      </label>
                      <p className="text-gray-800 bg-white px-3 py-2 rounded border">
                        {report.frequency}
                      </p>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Date of Submission
                    </label>
                    <p className="text-gray-800 bg-white px-3 py-2 rounded border">
                      {formatDate(report.dateOfSubmission || report.createdAt)}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Submitted By
                    </label>
                    <p className="text-gray-800 bg-white px-3 py-2 rounded border">
                      {report.submittedBy?.role || "N/A"}
                    </p>
                  </div>
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
                    <p className="text-gray-800 bg-white px-3 py-2 rounded border">
                      {report.campaignId?.name || "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Campaign Type
                    </label>
                    <p className="text-gray-800 bg-white px-3 py-2 rounded border">
                      {report.campaignId?.type || "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Client
                    </label>
                    <p className="text-gray-800 bg-white px-3 py-2 rounded border">
                      {report.campaignId?.client || "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              {/* ✅ Retailer Info */}
              {report.retailer && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4 text-gray-700">
                    Retailer Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">
                        Outlet Name
                      </label>
                      <p className="text-gray-800 bg-white px-3 py-2 rounded border">
                        {report.retailer?.outletName || "N/A"}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">
                        Retailer Name
                      </label>
                      <p className="text-gray-800 bg-white px-3 py-2 rounded border">
                        {report.retailer?.retailerName || "N/A"}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">
                        Outlet Code
                      </label>
                      <p className="text-gray-800 bg-white px-3 py-2 rounded border">
                        {report.retailer?.outletCode || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Employee Info */}
              {report.employee && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4 text-gray-700">
                    Employee Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">
                        Employee Name
                      </label>
                      <p className="text-gray-800 bg-white px-3 py-2 rounded border">
                        {report.employee.employeeId?.name ||
                          report.employee.employeeName ||
                          "N/A"}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">
                        Employee Code
                      </label>
                      <p className="text-gray-800 bg-white px-3 py-2 rounded border">
                        {report.employee.employeeId?.employeeId ||
                          report.employee.employeeCode ||
                          "N/A"}
                      </p>
                    </div>
                    {report.employee.employeeId?.phone && (
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">
                          Contact
                        </label>
                        <p className="text-gray-800 bg-white px-3 py-2 rounded border">
                          {report.employee.employeeId.phone}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Visit Details */}
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
                      <p className="text-gray-800 bg-white px-3 py-2 rounded border capitalize">
                        {report.typeOfVisit || "N/A"}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">
                        Attendance Status
                      </label>
                      <p className="text-gray-800 bg-white px-3 py-2 rounded border">
                        {report.attendedVisit === "yes"
                          ? "Attended"
                          : "Not Attended"}
                      </p>
                    </div>
                    {report.attendedVisit === "no" &&
                      report.reasonForNonAttendance && (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">
                              Reason
                            </label>
                            <p className="text-gray-800 bg-white px-3 py-2 rounded border capitalize">
                              {report.reasonForNonAttendance.reason || "N/A"}
                            </p>
                          </div>
                          {report.reasonForNonAttendance.reason ===
                            "others" &&
                            report.reasonForNonAttendance.otherReason && (
                              <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-600 mb-1">
                                  Additional Details
                                </label>
                                <p className="text-gray-800 bg-white px-3 py-2 rounded border">
                                  {report.reasonForNonAttendance.otherReason}
                                </p>
                              </div>
                            )}
                        </>
                      )}
                  </div>
                </div>
              )}

              {/* Stock Information */}
              {report.reportType === "Stock" &&
                (report.brand ||
                  report.product ||
                  report.sku ||
                  report.stockType) && (
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
                          <p className="text-gray-800 bg-white px-3 py-2 rounded border">
                            {report.stockType}
                          </p>
                        </div>
                      )}
                      {report.brand && (
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1">
                            Brand
                          </label>
                          <p className="text-gray-800 bg-white px-3 py-2 rounded border">
                            {report.brand}
                          </p>
                        </div>
                      )}
                      {report.product && (
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1">
                            Product
                          </label>
                          <p className="text-gray-800 bg-white px-3 py-2 rounded border">
                            {report.product}
                          </p>
                        </div>
                      )}
                      {report.sku && (
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1">
                            SKU
                          </label>
                          <p className="text-gray-800 bg-white px-3 py-2 rounded border">
                            {report.sku}
                          </p>
                        </div>
                      )}
                      {report.productType && (
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1">
                            Product Type
                          </label>
                          <p className="text-gray-800 bg-white px-3 py-2 rounded border">
                            {report.productType}
                          </p>
                        </div>
                      )}
                      {report.quantity && (
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1">
                            Quantity
                          </label>
                          <p className="text-gray-800 bg-white px-3 py-2 rounded border">
                            {report.quantity}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

              {/* Remarks */}
              {report.remarks && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4 text-gray-700">
                    Remarks
                  </h3>
                  <p className="text-gray-800 bg-white px-3 py-2 rounded border">
                    {report.remarks}
                  </p>
                </div>
              )}

              {/* ✅ Shop Display Images */}
              {report.reportType === "Window Display" &&
                report.shopDisplayImages &&
                report.shopDisplayImages.length > 0 && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4 text-gray-700">
                      Shop Display Images ({report.shopDisplayImages.length})
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {report.shopDisplayImages.map((imageData, idx) => {
                        const imageUrl = getImageUrl(imageData);
                        if (!imageUrl) return null;

                        return (
                          <div
                            key={idx}
                            className="relative bg-black rounded-lg overflow-hidden group"
                            style={{ height: "200px" }}
                          >
                            <img
                              src={imageUrl}
                              alt={`Display ${idx + 1}`}
                              className="w-full h-full object-contain cursor-pointer hover:scale-105 transition-transform"
                              onClick={() => window.open(imageUrl, "_blank")}
                            />
                            <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 text-center opacity-0 group-hover:opacity-100 transition-opacity">
                              {imageData.fileName || `Image ${idx + 1}`}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

              {/* ✅ Bill Copies */}
              {report.reportType === "Stock" &&
                report.billCopies &&
                report.billCopies.length > 0 && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4 text-gray-700">
                      Bill {report.billCopies.length > 1 ? "Copies" : "Copy"} (
                      {report.billCopies.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {report.billCopies.map((billData, idx) => {
                        const billUrl = getImageUrl(billData);
                        if (!billUrl) return null;

                        return (
                          <div
                            key={idx}
                            className="relative bg-black rounded-lg overflow-hidden group"
                            style={{ height: "300px" }}
                          >
                            <img
                              src={billUrl}
                              alt={`Bill Copy ${idx + 1}`}
                              className="w-full h-full object-contain cursor-pointer hover:scale-105 transition-transform"
                              onClick={() => window.open(billUrl, "_blank")}
                            />
                            <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 text-center opacity-0 group-hover:opacity-100 transition-opacity">
                              {billData.fileName || `Bill ${idx + 1}`}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

              {/* ✅ Other Files */}
              {report.reportType === "Others" &&
                report.files &&
                report.files.length > 0 && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4 text-gray-700">
                      Files ({report.files.length})
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {report.files.map((fileData, idx) => {
                        const fileUrl = getImageUrl(fileData);
                        if (!fileUrl) return null;

                        return (
                          <div
                            key={idx}
                            className="relative bg-black rounded-lg overflow-hidden group"
                            style={{ height: "200px" }}
                          >
                            <img
                              src={fileUrl}
                              alt={`File ${idx + 1}`}
                              className="w-full h-full object-contain cursor-pointer hover:scale-105 transition-transform"
                              onClick={() => window.open(fileUrl, "_blank")}
                            />
                            <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 text-center opacity-0 group-hover:opacity-100 transition-opacity">
                              {fileData.fileName || `File ${idx + 1}`}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportDetailsModal;

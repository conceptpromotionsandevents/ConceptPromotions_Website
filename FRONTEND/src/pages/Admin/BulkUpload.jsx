import { useEffect, useRef, useState } from "react";
import {
    FaCheckCircle,
    FaDownload,
    FaFileExcel,
    FaTimes,
    FaTimesCircle,
    FaUpload,
} from "react-icons/fa";
import { IoClose } from "react-icons/io5";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import * as XLSX from "xlsx-js-style";
import { API_URL } from "../../url/base";

// Searchable Dropdown Component
const SearchableSelect = ({ label, options, value, onChange }) => {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const ref = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener("click", handleClickOutside);
        return () => document.removeEventListener("click", handleClickOutside);
    }, []);

    const filtered = options.filter((o) =>
        o.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="relative mb-6" ref={ref}>
            <label className="block text-sm font-medium mb-2 text-gray-700">
                {label}
            </label>
            <div
                className="w-full border border-gray-300 rounded-lg cursor-pointer"
                onClick={() => setOpen(true)}
            >
                <div className="flex items-center px-4 py-2">
                    <input
                        className="flex-1 outline-none bg-transparent"
                        placeholder={value || "Select type"}
                        value={open ? search : value || ""}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            onChange("");
                            setOpen(true);
                        }}
                        onFocus={() => setOpen(true)}
                    />
                    {value && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onChange("");
                                setSearch("");
                            }}
                            className="ml-2 text-gray-500 hover:text-gray-700"
                        >
                            <IoClose />
                        </button>
                    )}
                </div>
            </div>

            {open && (
                <ul className="absolute z-50 w-full bg-white border border-gray-300 rounded-lg max-h-48 overflow-y-auto mt-1 shadow-lg">
                    {filtered.length > 0 ? (
                        filtered.map((opt, idx) => (
                            <li
                                key={idx}
                                onClick={() => {
                                    onChange(opt);
                                    setSearch("");
                                    setOpen(false);
                                }}
                                className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                            >
                                {opt}
                            </li>
                        ))
                    ) : (
                        <li className="px-4 py-2 text-gray-500">
                            No match found
                        </li>
                    )}
                </ul>
            )}
        </div>
    );
};

// BulkUpload Component
const BulkUpload = () => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [partyType, setPartyType] = useState("");
    const [uploading, setUploading] = useState(false);
    const [uploadResult, setUploadResult] = useState(null);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const fileExtension = file.name.split(".").pop().toLowerCase();
            if (fileExtension !== "xlsx" && fileExtension !== "xls") {
                toast.error("Please upload only Excel files (.xlsx or .xls)", {
                    theme: "dark",
                });
                return;
            }
            setSelectedFile(file);
            setUploadResult(null);
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) {
            toast.error("Please select an Excel file to upload", {
                theme: "dark",
            });
            return;
        }

        if (!partyType) {
            toast.error("Please select party type", { theme: "dark" });
            return;
        }

        setUploading(true);
        setUploadResult(null);

        try {
            const token = localStorage.getItem("token");

            if (!token) {
                toast.error("Please login first", { theme: "dark" });
                setUploading(false);
                return;
            }

            const formData = new FormData();
            formData.append("file", selectedFile);

            // Updated endpoint paths to match backend routes
            const endpoint =
                partyType === "Employee"
                    ? `${API_URL}/admin/employees/bulk`
                    : `${API_URL}/admin/retailers/bulk`;

            const response = await fetch(endpoint, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            });

            const data = await response.json();

            // Handle all response codes properly
            if (response.ok || response.status === 207) {
                setUploadResult(data);

                if (data.summary?.failed === 0) {
                    toast.success(
                        `All ${
                            data.summary.successful
                        } ${partyType.toLowerCase()}s uploaded successfully!`,
                        {
                            theme: "dark",
                            autoClose: 3000,
                        }
                    );
                } else {
                    toast.warning(
                        `${data.summary.successful} uploaded, ${data.summary.failed} failed. Check details below.`,
                        { theme: "dark", autoClose: 5000 }
                    );
                }
            } else if (response.status === 400) {
                setUploadResult(data);

                if (data.failedRows && data.failedRows.length > 0) {
                    toast.error(
                        `Upload failed: ${data.failedRows.length} rows have errors`,
                        {
                            theme: "dark",
                            autoClose: 5000,
                        }
                    );
                } else {
                    toast.error(
                        data.message ||
                            "Upload failed - All rows failed validation",
                        {
                            theme: "dark",
                        }
                    );
                }
            } else {
                toast.error(data.message || "Upload failed", { theme: "dark" });
                setUploadResult(data);
            }
        } catch (error) {
            console.error("Upload error:", error);
            toast.error("Network error. Please try again.", { theme: "dark" });
        } finally {
            setUploading(false);
        }
    };

    const handleRemoveFile = () => {
        setSelectedFile(null);
        setUploadResult(null);
        const fileInput = document.getElementById("fileUpload");
        if (fileInput) {
            fileInput.value = "";
        }
    };

    const downloadFailedRows = () => {
        if (
            !uploadResult ||
            !uploadResult.failedRows ||
            uploadResult.failedRows.length === 0
        ) {
            toast.error("No failed rows to download", { theme: "dark" });
            return;
        }

        const failedData = uploadResult.failedRows.map((row) => ({
            "Row Number": row.rowNumber || "-",
            Reason: row.reason,
            ...row.data,
        }));

        const ws = XLSX.utils.json_to_sheet(failedData);

        // Set column widths for better readability
        const columnWidths = [
            { wch: 12 }, // Row Number
            { wch: 50 }, // Reason
        ];

        // Add widths for data columns based on party type
        if (partyType === "Employee") {
            columnWidths.push(
                { wch: 25 }, // name
                { wch: 30 }, // email
                { wch: 15 }, // contactNo
                { wch: 15 }, // employeeType
                { wch: 20 } // position
            );
        } else {
            columnWidths.push(
                { wch: 25 }, // shopName
                { wch: 35 }, // shopAddress
                { wch: 20 }, // shopCity
                { wch: 20 }, // shopState
                { wch: 12 }, // shopPincode
                { wch: 18 }, // businessType
                { wch: 25 }, // name
                { wch: 15 }, // PANCard
                { wch: 15 }, // contactNo
                { wch: 20 }, // bankName
                { wch: 20 }, // accountNumber
                { wch: 15 }, // IFSC
                { wch: 25 } // branchName
            );
        }

        ws["!cols"] = columnWidths;

        // Style the header row (row 1) with red background and white text
        const range = XLSX.utils.decode_range(ws["!ref"]);
        for (let C = range.s.c; C <= range.e.c; ++C) {
            const address = XLSX.utils.encode_col(C) + "1";
            if (!ws[address]) continue;

            ws[address].s = {
                fill: {
                    fgColor: { rgb: "FF0000" }, // Red background
                },
                font: {
                    color: { rgb: "FFFFFF" }, // White text
                    bold: true,
                    sz: 12,
                },
                alignment: {
                    horizontal: "center",
                    vertical: "center",
                },
            };
        }

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Failed Rows");
        XLSX.writeFile(
            wb,
            `Failed_${partyType}_Upload_${
                new Date().toISOString().split("T")[0]
            }.xlsx`
        );

        toast.success("Failed rows downloaded", { theme: "dark" });
    };

    // Download sample Excel file from cloudinary folder
    const downloadSampleFile = () => {
        let fileName;
        let publicPath;

        if (partyType === "Employee") {
            fileName = "Sample_Employees_Template.xlsx";
            publicPath =
                "https://res.cloudinary.com/dltqp0vgg/raw/upload/v1768482373/Sample_Employees_Template_2_fm9q0k.xlsx";
        } else {
            fileName = "Sample_Retailers_Template.xlsx";
            publicPath =
                "https://res.cloudinary.com/dltqp0vgg/raw/upload/v1768482374/Sample_Retailers_Template_1_g3hlhn.xlsx";
        }

        // Create a temporary anchor element to trigger download
        const link = document.createElement("a");
        link.href = publicPath;
        link.download = fileName;
        link.click();

        toast.success("Sample template downloaded", { theme: "dark" });
    };

    return (
        <>
            <ToastContainer />

            <div className="min-h-screen flex flex-col justify-start items-center bg-[#171717] px-4 py-8">
                <div className="bg-gray-100 shadow-md rounded-xl p-8 w-full max-w-4xl">
                    <h1 className="text-3xl font-semibold mb-4 text-red-600 text-center">
                        Bulk Upload Data
                    </h1>
                    <p className="text-gray-600 mb-6 text-center">
                        Please select the type of party and upload data in the
                        correct format.
                    </p>

                    {/* Searchable Dropdown for Party Type */}
                    <SearchableSelect
                        label="Type of Party"
                        options={["Retailer", "Employee"]}
                        value={partyType}
                        onChange={(val) => {
                            setPartyType(val);
                            setSelectedFile(null);
                            setUploadResult(null);
                            const fileInput =
                                document.getElementById("fileUpload");
                            if (fileInput) {
                                fileInput.value = "";
                            }
                        }}
                    />

                    {partyType && (
                        <>
                            <h2 className="text-xl font-semibold text-red-600 mb-4 text-center">
                                {partyType} Bulk Upload
                            </h2>

                            {/* Download Sample File */}
                            <div className="flex justify-center mb-6">
                                <button
                                    onClick={downloadSampleFile}
                                    className="inline-flex items-center gap-2 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition"
                                >
                                    <FaDownload />
                                    Download Sample Excel
                                </button>
                            </div>

                            {/* File Upload */}
                            <div className="flex flex-col items-center">
                                <label
                                    htmlFor="fileUpload"
                                    className="flex flex-col items-center justify-center w-full border-2 border-dashed border-gray-300 rounded-lg p-8 cursor-pointer hover:border-red-600 transition"
                                >
                                    <FaFileExcel className="text-5xl text-green-600 mb-3" />
                                    {!selectedFile ? (
                                        <>
                                            <p className="text-gray-600 mb-2 text-lg">
                                                Click to choose Excel file
                                            </p>
                                            <FaUpload className="text-gray-500 text-2xl" />
                                        </>
                                    ) : (
                                        <p className="text-gray-700 font-medium text-lg">
                                            {selectedFile.name}
                                        </p>
                                    )}
                                    <input
                                        id="fileUpload"
                                        type="file"
                                        accept=".xlsx, .xls"
                                        onChange={handleFileChange}
                                        className="hidden"
                                    />
                                </label>

                                {selectedFile && (
                                    <button
                                        type="button"
                                        onClick={handleRemoveFile}
                                        className="flex items-center gap-2 text-red-500 text-sm hover:underline mt-3"
                                    >
                                        <FaTimes /> Remove File
                                    </button>
                                )}

                                <button
                                    onClick={handleUpload}
                                    disabled={uploading || !selectedFile}
                                    className={`mt-6 px-8 py-3 rounded-lg font-semibold transition ${
                                        uploading || !selectedFile
                                            ? "bg-gray-400 cursor-not-allowed text-white"
                                            : "bg-red-600 text-white hover:bg-red-700"
                                    }`}
                                >
                                    {uploading ? "Uploading..." : "Upload File"}
                                </button>
                            </div>

                            {/* Upload Results */}
                            {uploadResult && (
                                <div className="mt-8 bg-white rounded-lg p-6 border border-gray-200">
                                    <h3 className="text-xl font-bold mb-4 text-gray-800">
                                        Upload Results
                                    </h3>

                                    {/* Summary */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                        <div className="bg-blue-50 p-4 rounded-lg text-center">
                                            <p className="text-sm text-gray-600">
                                                Total Rows
                                            </p>
                                            <p className="text-2xl font-bold text-blue-600">
                                                {uploadResult.summary
                                                    ?.totalRows || 0}
                                            </p>
                                        </div>
                                        <div className="bg-green-50 p-4 rounded-lg text-center">
                                            <p className="text-sm text-gray-600">
                                                Successful
                                            </p>
                                            <p className="text-2xl font-bold text-green-600">
                                                {uploadResult.summary
                                                    ?.successful || 0}
                                            </p>
                                        </div>
                                        <div className="bg-red-50 p-4 rounded-lg text-center">
                                            <p className="text-sm text-gray-600">
                                                Failed
                                            </p>
                                            <p className="text-2xl font-bold text-red-600">
                                                {uploadResult.summary?.failed ||
                                                    0}
                                            </p>
                                        </div>
                                        <div className="bg-purple-50 p-4 rounded-lg text-center">
                                            <p className="text-sm text-gray-600">
                                                Success Rate
                                            </p>
                                            <p className="text-2xl font-bold text-purple-600">
                                                {uploadResult.summary
                                                    ?.successRate || "0%"}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Successful Entries */}
                                    {uploadResult.summary?.successful > 0 && (
                                        <div className="mb-6">
                                            <div className="flex items-center gap-2 mb-3">
                                                <FaCheckCircle className="text-green-600" />
                                                <h4 className="font-semibold text-green-700">
                                                    Successfully Added (
                                                    {
                                                        uploadResult.summary
                                                            .successful
                                                    }
                                                    )
                                                </h4>
                                            </div>
                                            <div className="max-h-60 overflow-y-auto border border-green-200 rounded-lg">
                                                <table className="min-w-full divide-y divide-gray-200">
                                                    <thead className="bg-green-50">
                                                        <tr>
                                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">
                                                                S.No
                                                            </th>
                                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">
                                                                Name
                                                            </th>
                                                            {partyType ===
                                                                "Retailer" && (
                                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">
                                                                    Shop Name
                                                                </th>
                                                            )}
                                                            {partyType ===
                                                                "Employee" && (
                                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">
                                                                    Email
                                                                </th>
                                                            )}

                                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">
                                                                Contact
                                                            </th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="bg-white divide-y divide-gray-200">
                                                        {(partyType ===
                                                        "Employee"
                                                            ? uploadResult.insertedEmployees
                                                            : uploadResult.insertedRetailers
                                                        )?.map(
                                                            (item, index) => (
                                                                <tr
                                                                    key={index}
                                                                    className="hover:bg-gray-50"
                                                                >
                                                                    <td className="px-4 py-2 text-sm">
                                                                        {index +
                                                                            1}
                                                                    </td>
                                                                    <td className="px-4 py-2 text-sm">
                                                                        {
                                                                            item.name
                                                                        }
                                                                    </td>
                                                                    {partyType ===
                                                                        "Retailer" && (
                                                                        <td className="px-4 py-2 text-sm">
                                                                            {
                                                                                item.shopName
                                                                            }
                                                                        </td>
                                                                    )}
                                                                    {partyType ===
                                                                        "Employee" && (
                                                                        <td className="px-4 py-2 text-sm">
                                                                            {
                                                                                item.email
                                                                            }
                                                                        </td>
                                                                    )}

                                                                    <td className="px-4 py-2 text-sm">
                                                                        {item.phone ||
                                                                            item.contactNo}
                                                                    </td>
                                                                </tr>
                                                            )
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}

                                    {/* Failed Entries */}
                                    {uploadResult.failedRows &&
                                        uploadResult.failedRows.length > 0 && (
                                            <div>
                                                <div className="flex items-center justify-between mb-3">
                                                    <div className="flex items-center gap-2">
                                                        <FaTimesCircle className="text-red-600" />
                                                        <h4 className="font-semibold text-red-700">
                                                            Failed Rows (
                                                            {
                                                                uploadResult
                                                                    .failedRows
                                                                    .length
                                                            }
                                                            )
                                                        </h4>
                                                    </div>
                                                    <button
                                                        onClick={
                                                            downloadFailedRows
                                                        }
                                                        className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition text-sm"
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
                                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">
                                                                    Name
                                                                </th>
                                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">
                                                                    {partyType ===
                                                                    "Retailer"
                                                                        ? "Contact"
                                                                        : "Email"}
                                                                </th>
                                                                {partyType ===
                                                                    "Retailer" && (
                                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">
                                                                        Shop
                                                                        Name
                                                                    </th>
                                                                )}
                                                            </tr>
                                                        </thead>
                                                        <tbody className="bg-white divide-y divide-gray-200">
                                                            {uploadResult.failedRows.map(
                                                                (
                                                                    row,
                                                                    index
                                                                ) => (
                                                                    <tr
                                                                        key={
                                                                            index
                                                                        }
                                                                        className="hover:bg-gray-50"
                                                                    >
                                                                        <td className="px-4 py-2 text-sm font-medium">
                                                                            {
                                                                                row.rowNumber
                                                                            }
                                                                        </td>
                                                                        <td
                                                                            className="px-4 py-2 text-sm text-red-600 max-w-xs"
                                                                            title={
                                                                                row.reason
                                                                            }
                                                                        >
                                                                            {
                                                                                row.reason
                                                                            }
                                                                        </td>
                                                                        <td className="px-4 py-2 text-sm">
                                                                            {row
                                                                                .data
                                                                                ?.name ||
                                                                                "-"}
                                                                        </td>
                                                                        <td className="px-4 py-2 text-sm">
                                                                            {partyType ===
                                                                            "Retailer"
                                                                                ? row
                                                                                      .data
                                                                                      ?.contactNo ||
                                                                                  "-"
                                                                                : row
                                                                                      .data
                                                                                      ?.email ||
                                                                                  "-"}
                                                                        </td>
                                                                        {partyType ===
                                                                            "Retailer" && (
                                                                            <td className="px-4 py-2 text-sm">
                                                                                {row
                                                                                    .data
                                                                                    ?.shopName ||
                                                                                    "-"}
                                                                            </td>
                                                                        )}
                                                                    </tr>
                                                                )
                                                            )}
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
        </>
    );
};

export default BulkUpload;

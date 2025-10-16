import React, { useState } from "react";
import { FaFileExcel, FaUpload, FaDownload, FaTimes } from "react-icons/fa";

const BulkUpload = () => {
  const [selectedFile, setSelectedFile] = useState(null);

  // Handle file selection
  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  // Handle file upload
  const handleUpload = (e) => {
    e.preventDefault();
    if (!selectedFile) {
      alert("Please select an Excel file to upload.");
      return;
    }
    alert(`File "${selectedFile.name}" uploaded successfully!`);
  };

  // Remove selected file
  const handleRemoveFile = () => {
    setSelectedFile(null);
    document.getElementById("fileUpload").value = "";
  };

  return (
    <>
      {/* Top Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-white shadow-md transition-all duration-300 ease-in-out px-6 md:px-10">
        <div className="flex justify-between items-center py-4 max-w-screen-xl mx-auto relative">
          {/* Logo */}
          <img src="cpLogo.png" alt="Logo" className="h-14 cursor-pointer" />

          {/* Page Title */}
          <h2 className="absolute left-1/2 transform -translate-x-1/2 text-xl md:text-2xl font-bold text-[#E4002B]">
            Bulk Upload Page
          </h2>
        </div>
      </nav>

      {/* Main Content */}
      <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50 pt-28 px-4">
        <div className="bg-white shadow-md rounded-xl p-8 w-full max-w-lg text-center">
          <h1 className="text-2xl font-semibold text-gray-800 mb-4">
            Upload Bulk Data
          </h1>
          <p className="text-gray-600 mb-6">
            Please download the predefined Excel format before uploading your data.
          </p>

          {/* Download Button */}
          <a
            href="/bulk_upload_format.xlsx"
            download
            className="inline-flex items-center gap-2 bg-[#E4002B] text-white px-4 py-2 rounded-lg hover:bg-[#C3002B] transition mb-6"
          >
            <FaDownload />
            Download Demo Excel
          </a>

          {/* Upload Section */}
          <form onSubmit={handleUpload} className="flex flex-col items-center">
            <label
              htmlFor="fileUpload"
              className="flex flex-col items-center justify-center w-full border-2 border-dashed border-gray-300 rounded-lg p-6 cursor-pointer hover:border-[#E4002B] transition"
            >
              <FaFileExcel className="text-3xl text-green-600 mb-2" />
              {!selectedFile ? (
                <>
                  <p className="text-gray-600 mb-2">Click to choose Excel file</p>
                  <FaUpload className="text-gray-500" />
                </>
              ) : (
                <p className="text-gray-700">{selectedFile.name}</p>
              )}
              <input
                id="fileUpload"
                type="file"
                accept=".xlsx, .xls"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>

            {/* Remove Button - outside the label */}
            {selectedFile && (
              <button
                type="button"
                onClick={handleRemoveFile}
                className="flex items-center gap-1 text-red-500 text-sm hover:underline mt-2"
              >
                <FaTimes /> Remove
              </button>
            )}

            {/* Upload Button */}
            <button
              type="submit"
              className="mt-6 bg-[#E4002B] text-white px-6 py-2 rounded-lg hover:bg-[#C3002B] transition"
            >
              Upload File
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default BulkUpload;

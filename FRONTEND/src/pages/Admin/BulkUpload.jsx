import React, { useState, useRef, useEffect } from "react";
import { FaFileExcel, FaUpload, FaDownload, FaTimes } from "react-icons/fa";
import { IoClose } from "react-icons/io5";

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
      <label className="block text-sm font-medium mb-2 text-gray-700">{label}</label>
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
              onChange(""); // reset selection
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
        <ul className="absolute z-50 w-full bg-white border border-gray-300 rounded-lg max-h-48 overflow-y-auto mt-1">
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
            <li className="px-4 py-2 text-gray-500">No match found</li>
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

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleUpload = (e) => {
    e.preventDefault();
    if (!selectedFile) {
      alert("Please select an Excel file to upload.");
      return;
    }
    alert(`File "${selectedFile.name}" uploaded successfully!`);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    document.getElementById("fileUpload").value = "";
  };

  return (
    <>
      <div className="min-h-screen flex flex-col justify-start items-center bg-gray-50 px-4">
        <div className="bg-white shadow-md rounded-xl p-8 w-full max-w-lg text-center">
          <h1 className="text-2xl font-semibold mb-4 text-[#E4002B]">
            Upload Bulk Data
          </h1>
          <p className="text-gray-600 mb-6">
            Please select the type of party and upload data in the correct format.
          </p>

          {/* Searchable Dropdown for Party Type */}
          <SearchableSelect
            label="Type of Party"
            options={["Retailer", "Employee"]}
            value={partyType}
            onChange={(val) => {
              setPartyType(val);
              setSelectedFile(null);
            }}
          />

          {partyType && (
            <>
              <h2 className="text-lg font-semibold text-[#E4002B] mb-4">
                {partyType} Bulk Upload
              </h2>

              <a
                href="/bulk_upload_format.xlsx"
                download
                className="inline-flex items-center gap-2 bg-[#E4002B] text-white px-4 py-2 rounded-lg hover:bg-[#C3002B] transition mb-6"
              >
                <FaDownload />
                Download Demo Excel
              </a>

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

                {selectedFile && (
                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    className="flex items-center gap-1 text-red-500 text-sm hover:underline mt-2"
                  >
                    <FaTimes /> Remove
                  </button>
                )}

                <button
                  type="submit"
                  className="mt-6 bg-[#E4002B] text-white px-6 py-2 rounded-lg hover:bg-[#C3002B] transition"
                >
                  Upload File
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default BulkUpload;

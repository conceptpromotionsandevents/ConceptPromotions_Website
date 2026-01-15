import React, { useState, useRef, useEffect } from "react";
import { API_URL } from "../../url/base";
import {
  FaUser,
  FaUsers,
  FaPhoneAlt,
  FaEnvelope,
  FaCalendarAlt,
  FaIdCard,
  FaBuilding,
  FaStore,
  FaPlus,
  FaTimes,
  FaFileInvoice,
  FaMapMarkerAlt,
  FaCity,
  FaMapMarkedAlt,
  FaMapPin,
  FaUniversity,
  FaCreditCard,
  FaCode,
} from "react-icons/fa";
import { IoClose, IoChevronDown } from "react-icons/io5";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const SearchableSelect = ({ label, placeholder, options, value, onChange, leftIcon, disabled }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    const onDocClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  const filtered = options.filter((o) =>
    o.toLowerCase().includes(search.trim().toLowerCase())
  );

  return (
    <div className="relative" ref={ref}>
      <label className="block text-sm font-medium mb-1">{label}</label>

      <div
        className={`relative w-full border border-gray-300 rounded-lg ${disabled ? "bg-gray-100 cursor-not-allowed" : "cursor-pointer"
          }`}
        onClick={() => !disabled && setOpen(true)}
      >
        {leftIcon && (
          <span className="absolute left-3 top-[11px] text-gray-400">
            {leftIcon}
          </span>
        )}

        <div className="flex items-center px-3 py-2">
          <input
            className={`flex-1 outline-none bg-transparent ${leftIcon ? "pl-6" : ""
              } ${disabled ? "cursor-not-allowed" : ""}`}
            placeholder={value || placeholder}
            value={open ? search : value || ""}
            onChange={(e) => {
              if (!disabled) {
                setSearch(e.target.value);
                onChange && onChange("");
                setOpen(true);
              }
            }}
            onFocus={() => !disabled && setOpen(true)}
            disabled={disabled}
          />

          {value && !disabled && (
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

          <IoChevronDown className="ml-2 text-gray-400" />
        </div>
      </div>

      {open && !disabled && (
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

const FileInput = ({ label, accept = "*", file, setFile, existingImageUrl }) => {
  const fileRef = useRef();
  const [preview, setPreview] = useState(existingImageUrl || null);

  useEffect(() => {
    return () => {
      if (file && file.preview) URL.revokeObjectURL(file.preview);
    };
  }, [file]);

  useEffect(() => {
    if (existingImageUrl) {
      setPreview(existingImageUrl);
    }
  }, [existingImageUrl]);

  function handleFileChange(e) {
    const f = e.target.files[0];
    if (!f) {
      setFile(null);
      setPreview(existingImageUrl);
      return;
    }
    const newPreview = f.type.startsWith("image/") ? URL.createObjectURL(f) : null;
    setFile({ raw: f, preview: newPreview, name: f.name });
    setPreview(newPreview);
  }

  const hasFile = file || existingImageUrl;

  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <div
        className="relative flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[#E4002B] transition"
        onClick={() => fileRef.current?.click()}
      >
        {!hasFile ? (
          <>
            <FaPlus className="text-2xl text-gray-400 mb-2" />
            <p className="text-sm text-gray-500">Click or drop file here</p>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2">
            {preview ? (
              <img
                src={preview}
                alt="preview"
                className="w-20 h-16 object-cover rounded-md border"
              />
            ) : (
              <p className="text-sm text-gray-700">{file?.name || "Existing file"}</p>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setFile(null);
                setPreview(null);
                if (fileRef.current) fileRef.current.value = "";
              }}
              className="flex items-center gap-1 text-red-500 text-xs hover:underline"
            >
              <FaTimes /> Remove
            </button>
          </div>
        )}

        <input
          ref={fileRef}
          type="file"
          accept={accept}
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    </div>
  );
};

const formatDateForInput = (dateString) => {
  if (!dateString) return "";
  return new Date(dateString).toISOString().split("T")[0];
};

const RetailerProfile = () => {
  // Personal details
  const [name, setName] = useState("");
  const [contactNo, setContactNo] = useState("");
  const [altContactNo, setAltContactNo] = useState("");
  const [email, setEmail] = useState("");
  const [dob, setDob] = useState("");
  const genderOptions = ["Male", "Female", "Other", "Prefer not to say"];
  const idTypeOptions = ["Aadhaar", "PAN", "Voter ID", "Driving License", "Other"];
  const [gender, setGender] = useState("");
  const [govtIdType, setGovtIdType] = useState("");
  const [govtIdNumber, setGovtIdNumber] = useState("");

  // Shop details
  const [shopName, setShopName] = useState("");
  const businessTypeOptions = [
    "Grocery Retailer",
    "Wholesale",
    "Key Accounts",
    "Salon / Beauty Parlour",
    "Self Service Outlet",
    "Chemist Outlet",
    "Other",
  ];
  const ownershipTypeOptions = [
    "Sole Proprietorship",
    "Partnership",
    "Private Ltd",
    "LLP",
  ];
  const [businessType, setBusinessType] = useState("");
  const [ownershipType, setOwnershipType] = useState("");
  const [gstNo, setGstNo] = useState("");
  const [panCard, setPanCard] = useState("");
  const [address1, setAddress1] = useState("");
  const [address2, setAddress2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");

  const [gstError, setGstError] = useState("");

  // Bank details
  const bankOptions = [
    "HDFC Bank",
    "State Bank of India",
    "ICICI Bank",
    "Axis Bank",
    "Kotak Mahindra Bank",
    "Punjab National Bank",
    "Other",
  ];

  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifsc, setIfsc] = useState("");
  const [branchName, setBranchName] = useState("");

  // Track original bank details to detect changes
  const [originalBankDetails, setOriginalBankDetails] = useState({
    bankName: "",
    accountNumber: "",
    ifsc: "",
    branchName: "",
  });

  // Files
  const [govtIdPhoto, setGovtIdPhoto] = useState(null);
  const [personPhoto, setPersonPhoto] = useState(null);
  const [registrationFormFile, setRegistrationFormFile] = useState(null);
  const [outletPhoto, setOutletPhoto] = useState(null);

  // Existing images from backend (Cloudinary URLs)
  const [existingGovtIdPhoto, setExistingGovtIdPhoto] = useState(null);
  const [existingPersonPhoto, setExistingPersonPhoto] = useState(null);
  const [existingRegistrationForm, setExistingRegistrationForm] = useState(null);
  const [existingOutletPhoto, setExistingOutletPhoto] = useState(null);

  // UX
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [ifscError, setIfscError] = useState("");
  const [pennyCheck, setPennyCheck] = useState(false);
  const [pennyCheckLocked, setPennyCheckLocked] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [tnc, setTnc] = useState(false);
  const [tncLocked, setTncLocked] = useState(false);
  const [error, setError] = useState("");
  const isUpdatingFromBackend = useRef(false);

  // LOAD PROFILE FROM BACKEND
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("retailer_token");
        if (!token) {
          setLoading(false);
          setError("No token found. Please log in.");
          return;
        }

        const res = await fetch(`${API_URL}/retailer/retailer/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          const msg = await res.text();
          throw new Error(msg || "Failed to load profile");
        }

        const data = await res.json();

        // Map backend -> frontend state
        setName(data.name || "");
        setContactNo(data.contactNo || "");
        setAltContactNo(data.altContactNo || "");
        setEmail(data.email || "");
        setDob(formatDateForInput(data.dob) || "");
        setGender(data.gender || "");
        setGovtIdType(data.govtIdType || "");
        setGovtIdNumber(data.govtIdNumber || "");

        setShopName(data.shopDetails?.shopName || "");
        setBusinessType(data.shopDetails?.businessType || "");
        setOwnershipType(data.shopDetails?.ownershipType || "");
        setGstNo(data.shopDetails?.GSTNo || "");
        setPanCard(data.shopDetails?.PANCard || "");

        setAddress1(data.shopDetails?.shopAddress?.address || "");
        setAddress2(data.shopDetails?.shopAddress?.address2 || "");
        setCity(data.shopDetails?.shopAddress?.city || "");
        setState(data.shopDetails?.shopAddress?.state || "");
        setPincode(data.shopDetails?.shopAddress?.pincode || "");

        const bankDetails = {
          bankName: data.bankDetails?.bankName || "",
          accountNumber: data.bankDetails?.accountNumber || "",
          ifsc: data.bankDetails?.IFSC || "",
          branchName: data.bankDetails?.branchName || "",
        };

        setBankName(bankDetails.bankName);
        setAccountNumber(bankDetails.accountNumber);
        setIfsc(bankDetails.ifsc);
        setBranchName(bankDetails.branchName);
        setOriginalBankDetails(bankDetails);

        // T&C and Penny Check
        const tncValue = data.tnc || false;
        const pennyValue = data.pennyCheck || false;

        setTnc(tncValue);
        setPennyCheck(pennyValue);

        // Lock if already accepted
        if (tncValue) setTncLocked(true);
        if (pennyValue) setPennyCheckLocked(true);

        // Extract URLs from backend's object structure { url: string, publicId: string }
        setExistingGovtIdPhoto(data.govtIdPhoto?.url || null);
        setExistingPersonPhoto(data.personPhoto?.url || null);
        setExistingRegistrationForm(data.registrationFormFile?.url || null);
        setExistingOutletPhoto(data.outletPhoto?.url || null);

        setLoading(false);
      } catch (err) {
        setError(err.message || "Error loading profile");
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // Detect bank detail changes
  useEffect(() => {
    if (isUpdatingFromBackend.current) {
      return;
    }
    const bankChanged =
      bankName !== originalBankDetails.bankName ||
      accountNumber !== originalBankDetails.accountNumber ||
      ifsc !== originalBankDetails.ifsc ||
      branchName !== originalBankDetails.branchName;

    if (bankChanged && pennyCheckLocked) {
      setPennyCheck(false);
      setPennyCheckLocked(false);
    }
  }, [bankName, accountNumber, ifsc, branchName, originalBankDetails, pennyCheckLocked]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const token = localStorage.getItem("retailer_token");
      if (!token) {
        setError("No token found. Please log in.");
        setSubmitting(false);
        return;
      }

      // Create FormData to send files to backend
      const formData = new FormData();

      // Basic fields
      formData.append("name", name);
      formData.append("email", email);
      formData.append("contactNo", contactNo);
      formData.append("altContactNo", altContactNo);
      formData.append("dob", dob || "");
      formData.append("gender", gender || "");
      formData.append("govtIdType", govtIdType || "");
      formData.append("govtIdNumber", govtIdNumber || "");

      // Shop details
      formData.append("shopName", shopName);
      formData.append("businessType", businessType || "");
      formData.append("ownershipType", ownershipType || "");
      formData.append("GSTNo", gstNo || "");
      formData.append("PANCard", panCard);
      formData.append("address", address1);
      formData.append("address2", address2 || "");
      formData.append("city", city);
      formData.append("state", state);
      formData.append("pincode", pincode);

      // Bank details
      formData.append("bankName", bankName);
      formData.append("accountNumber", accountNumber);
      formData.append("IFSC", ifsc);
      formData.append("branchName", branchName);
      formData.append("tnc", tnc);
      formData.append("pennyCheck", pennyCheck);

      // Files - only append if new files selected
      if (govtIdPhoto?.raw) formData.append("govtIdPhoto", govtIdPhoto.raw);
      if (personPhoto?.raw) formData.append("personPhoto", personPhoto.raw);
      if (registrationFormFile?.raw) formData.append("registrationFormFile", registrationFormFile.raw);
      if (outletPhoto?.raw) formData.append("outletPhoto", outletPhoto.raw);

      const res = await fetch(`${API_URL}/retailer/me`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Failed to update profile");
      }

      const updated = await res.json();
      const r = updated.retailer || updated;

      // SET FLAG TO PREVENT BANK CHANGE DETECTION
      isUpdatingFromBackend.current = true;

      // Update state with response
      setEmail(r.email || "");
      setDob(formatDateForInput(r.dob) || "");
      setGender(r.gender || "");
      setGovtIdType(r.govtIdType || "");
      setGovtIdNumber(r.govtIdNumber || "");
      setBusinessType(r.shopDetails?.businessType || "");
      setOwnershipType(r.shopDetails?.ownershipType || "");
      setGstNo(r.shopDetails?.GSTNo || "");
      setPanCard(r.shopDetails?.PANCard || "");
      setAddress1(r.shopDetails?.shopAddress?.address || "");
      setAddress2(r.shopDetails?.shopAddress?.address2 || "");
      setCity(r.shopDetails?.shopAddress?.city || "");
      setState(r.shopDetails?.shopAddress?.state || "");
      setPincode(r.shopDetails?.shopAddress?.pincode || "");

      // Update bank details
      const newBankDetails = {
        bankName: r.bankDetails?.bankName || "",
        accountNumber: r.bankDetails?.accountNumber || "",
        ifsc: r.bankDetails?.IFSC || "",
        branchName: r.bankDetails?.branchName || "",
      };

      setBankName(newBankDetails.bankName);
      setAccountNumber(newBankDetails.accountNumber);
      setIfsc(newBankDetails.ifsc);
      setBranchName(newBankDetails.branchName);
      setOriginalBankDetails(newBankDetails);

      // Update T&C and Penny Check from backend response
      const tncValue = r.tnc || false;
      const pennyValue = r.pennyCheck || false;
      setTnc(tncValue);
      setPennyCheck(pennyValue);

      // Lock if they're true
      if (tncValue) setTncLocked(true);
      if (pennyValue) setPennyCheckLocked(true);

      // Update Cloudinary URLs from backend's object structure
      setExistingGovtIdPhoto(r.govtIdPhoto?.url || null);
      setExistingPersonPhoto(r.personPhoto?.url || null);
      setExistingRegistrationForm(r.registrationFormFile?.url || null);
      setExistingOutletPhoto(r.outletPhoto?.url || null);

      // Clear file inputs
      setGovtIdPhoto(null);
      setPersonPhoto(null);
      setRegistrationFormFile(null);
      setOutletPhoto(null);

      // RESET FLAG AFTER A SHORT DELAY
      setTimeout(() => {
        isUpdatingFromBackend.current = false;
      }, 100);

      toast.success("Profile updated successfully!", {
        theme: "dark",
        position: "top-right",
        autoClose: 3000
      });

    } catch (err) {
      isUpdatingFromBackend.current = false;
      setError(err.message || "Error updating profile");
      toast.error(err.message || "Failed to update profile", {
        theme: "dark",
        position: "top-right",
        autoClose: 3000
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center w-full h-64">
        <p className="text-gray-600">Loading profile...</p>
      </div>
    );
  }

  return (
    <>
      <ToastContainer />
      <div className="flex justify-center items-center w-full bg-[#171717]">
        <div className="w-full max-w-3xl shadow-md rounded-xl p-8 bg-[#EDEDED]">
          <h1 className="text-2xl font-bold text-[#E4002B] text-center pb-8">
            Complete Your Profile
          </h1>

          {error && (
            <p className="mb-4 text-sm text-red-600 text-center">{error}</p>
          )}

          <form onSubmit={handleSubmit} className="space-y-6 ">
            {/* Personal Details */}
            <section className="space-y-4">
              <h3 className="text-lg font-medium text-[#E4002B]">
                Personal Details
              </h3>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <FaUser className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    value={name}
                    disabled
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Contact No <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <FaPhoneAlt className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="tel"
                    value={contactNo}
                    onChange={(e) =>
                      setContactNo(e.target.value.replace(/\D/g, ""))
                    }
                    placeholder="+91 1234567890"
                    maxLength={10}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#E4002B]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Alternate Contact No
                </label>
                <div className="relative">
                  <FaPhoneAlt className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="tel"
                    value={altContactNo}
                    onChange={(e) =>
                      setAltContactNo(e.target.value.replace(/\D/g, ""))
                    }
                    placeholder="+91 1234567890"
                    maxLength={10}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#E4002B]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <div className="relative">
                  <FaEnvelope className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@google.com"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#E4002B]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Date of Birth
                </label>
                <div className="relative">
                  <FaCalendarAlt className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#E4002B]"
                  />
                </div>
              </div>

              <SearchableSelect
                label="Gender"
                placeholder="Select gender"
                options={genderOptions}
                value={gender}
                onChange={setGender}
                leftIcon={<FaUser />}
              />

              <SearchableSelect
                label="Govt ID Type"
                placeholder="Select ID type"
                options={idTypeOptions}
                value={govtIdType}
                onChange={setGovtIdType}
                leftIcon={<FaIdCard />}
              />

              <div>
                <label className="block text-sm font-medium mb-1">
                  Govt ID Number
                </label>
                <div className="relative">
                  <FaIdCard className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    value={govtIdNumber}
                    onChange={(e) => setGovtIdNumber(e.target.value)}
                    placeholder="1234-5678-9102"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#E4002B]"
                  />
                </div>
              </div>
            </section>

            {/* Shop Details */}
            <section className="space-y-4">
              <h3 className="text-lg font-medium text-[#E4002B]">
                Shop Details
              </h3>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Shop Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <FaBuilding className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    value={shopName}
                    disabled
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                    required
                  />
                </div>
              </div>

              <SearchableSelect
                label={
                  <>
                    Business Type <span className="text-red-500">*</span>
                  </>
                }
                placeholder="Select business type"
                options={businessTypeOptions}
                value={businessType}
                onChange={setBusinessType}
                leftIcon={<FaStore />}
              />

              <SearchableSelect
                label="Ownership Type"
                placeholder="Select ownership type"
                options={ownershipTypeOptions}
                value={ownershipType}
                onChange={setOwnershipType}
                leftIcon={<FaUsers />}
              />

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    GST No
                  </label>
                  <div className="relative">
                    <FaFileInvoice className="absolute left-3 top-3 text-gray-400" />
                    <input
                      type="text"
                      value={gstNo}
                      onChange={(e) => {
                        const val = e.target.value.toUpperCase();
                        setGstNo(val);
                        const gstRegex =
                          /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
                        if (val === "") setGstError("");
                        else if (!gstRegex.test(val))
                          setGstError(
                            "Invalid GST Number format (e.g., 29ABCDE1234F1Z5)"
                          );
                        else setGstError("");
                      }}
                      placeholder="29ABCDE1234F1Z5"
                      className={`w-full pl-10 px-4 py-2 border rounded-lg outline-none focus:ring-2 ${gstError
                        ? "border-red-500 focus:ring-red-500"
                        : "border-gray-300 focus:ring-[#E4002B]"
                        }`}
                    />
                  </div>
                  {gstError && (
                    <p className="text-red-500 text-xs mt-1">{gstError}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    PAN Card <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <FaIdCard className="absolute left-3 top-3 text-gray-400" />
                    <input
                      type="text"
                      value={panCard}
                      disabled
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                      required
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Address Line 1 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <FaMapMarkerAlt className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    value={address1}
                    disabled
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Address Line 2
                </label>
                <div className="relative">
                  <FaMapMarkerAlt className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    value={address2}
                    onChange={(e) => setAddress2(e.target.value)}
                    placeholder="Near XYZ landmark"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#E4002B]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    City <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <FaCity className="absolute left-3 top-3 text-gray-400" />
                    <input
                      type="text"
                      value={city}
                      disabled
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    State <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <FaMapMarkedAlt className="absolute left-3 top-3 text-gray-400" />
                    <input
                      type="text"
                      value={state}
                      disabled
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Pincode <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <FaMapPin className="absolute left-3 top-3 text-gray-400" />
                    <input
                      type="text"
                      value={pincode}
                      disabled
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                      required
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Bank Details */}
            <section className="space-y-4">
              <h3 className="text-lg font-medium text-[#E4002B]">
                Bank Details
              </h3>

              <SearchableSelect
                label={
                  <>
                    Bank Name <span className="text-red-500">*</span>
                  </>
                }
                placeholder="Select bank"
                options={bankOptions}
                value={bankName}
                onChange={setBankName}
                leftIcon={<FaUniversity />}
              />

              <div>
                <label className="block text-sm font-medium mb-1">
                  Account Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <FaCreditCard className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) =>
                      setAccountNumber(e.target.value.replace(/\D/g, ""))
                    }
                    placeholder="123456789012"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#E4002B]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  IFSC <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <FaCode className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    value={ifsc}
                    onChange={(e) => {
                      const val = e.target.value.toUpperCase();
                      setIfsc(val);
                      const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
                      if (val === "") setIfscError("");
                      else if (!ifscRegex.test(val))
                        setIfscError(
                          "Invalid IFSC Code format (e.g., HDFC0001234)"
                        );
                      else setIfscError("");
                    }}
                    placeholder="HDFC0001234"
                    maxLength={11}
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg outline-none focus:ring-2 ${ifscError
                      ? "border-red-500 focus:ring-red-500"
                      : "border-gray-300 focus:ring-[#E4002B]"
                      }`}
                    required
                  />
                </div>
                {ifscError && (
                  <p className="text-red-500 text-xs mt-1">{ifscError}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Branch Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <FaStore className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    value={branchName}
                    onChange={(e) => setBranchName(e.target.value)}
                    placeholder="Branch name"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#E4002B]"
                    required
                  />
                </div>
              </div>

              <div className="mt-2 flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={pennyCheck}
                  onChange={(e) => setPennyCheck(e.target.checked)}
                  disabled={pennyCheckLocked}
                  className="mt-1 h-4 w-4 border-gray-300 rounded"
                  style={{ accentColor: "#E4002B" }}
                />
                <label className="text-sm text-gray-700 leading-5">
                  I confirm that I have received the ₹1 verification amount in my
                  bank account.
                  {pennyCheckLocked && (
                    <span className="text-green-600 ml-2">✓ Verified</span>
                  )}
                </label>
              </div>
            </section>

            {/* File Uploads */}
            <section className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-[#E4002B]">
                  File Uploads
                </h3>
                <p className="text-[11px] text-gray-500 mt-1">
                  <span className="text-red-500">*</span> Accepted formats: PNG,
                  JPG, JPEG, PDF, DOC — less than 1 MB
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FileInput
                  label={
                    <>
                      Govt ID Photo <span className="text-red-500">*</span>
                    </>
                  }
                  accept=".png,.jpg,.jpeg,.pdf,.doc"
                  file={govtIdPhoto}
                  setFile={setGovtIdPhoto}
                  existingImageUrl={existingGovtIdPhoto}
                />

                <FileInput
                  label={
                    <>
                      Person Photo <span className="text-red-500">*</span>
                    </>
                  }
                  accept=".png,.jpg,.jpeg,.pdf,.doc"
                  file={personPhoto}
                  setFile={setPersonPhoto}
                  existingImageUrl={existingPersonPhoto}
                />

                <FileInput
                  label={<>Registration Form</>}
                  accept=".png,.jpg,.jpeg,.pdf,.doc"
                  file={registrationFormFile}
                  setFile={setRegistrationFormFile}
                  existingImageUrl={existingRegistrationForm}
                />

                <FileInput
                  label={
                    <>
                      Outlet Photo <span className="text-red-500">*</span>
                    </>
                  }
                  accept=".png,.jpg,.jpeg,.pdf,.doc"
                  file={outletPhoto}
                  setFile={setOutletPhoto}
                  existingImageUrl={existingOutletPhoto}
                />
              </div>
            </section>

            {/* Terms & Conditions */}
            <div className="flex items-center gap-2 mt-2">
              <input
                type="checkbox"
                checked={tnc}
                onChange={(e) => setTnc(e.target.checked)}
                disabled={tncLocked}
                required
                className="h-4 w-4"
                style={{ accentColor: "#E4002B" }}
              />
              <label className="text-sm text-gray-700">
                I agree to the{" "}
                <button
                  type="button"
                  onClick={() => setShowTerms(true)}
                  className="text-[#E4002B] font-medium hover:underline"
                >
                  Terms & Conditions
                </button>
                {tncLocked && (
                  <span className="text-green-600 ml-2">✓ Accepted</span>
                )}
              </label>
            </div>

            <button
              type="submit"
              disabled={submitting || gstError || ifscError}
              className="w-full py-3 bg-[#E4002B] text-white rounded-lg font-medium hover:bg-[#c4001f] disabled:bg-gray-400 disabled:cursor-not-allowed transition cursor-pointer"
            >
              {submitting ? "Updating..." : "Update Profile"}
            </button>

            {/* ✅ ADD THIS SECTION HERE */}
            {/* KYC Status Section */}
            <div className="mt-8 p-6 bg-gray-50 border-2 border-gray-200 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">KYC Verification Status</h3>

              {/* KYC Status Badge */}
              <div className="mb-4">
                {(
                  panCard &&
                  govtIdType &&
                  govtIdNumber &&
                  (govtIdPhoto || existingGovtIdPhoto) &&
                  bankName &&
                  accountNumber &&
                  ifsc &&
                  branchName &&
                  pennyCheck
                ) ? (
                  <div className="flex items-center gap-2 bg-green-50 border border-green-500 rounded-lg px-4 py-3">
                    <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-green-700 font-medium">Your KYC is Verified</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 bg-red-50 border border-red-500 rounded-lg px-4 py-3">
                    <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <span className="text-red-700 font-medium">KYC Not Verified - Complete Required Fields</span>
                  </div>
                )}
              </div>

              {/* Required Fields List */}
              <div className="space-y-2">
                <p className="text-sm font-semibold text-gray-700 mb-2">Required Fields for KYC:</p>
                <ul className="space-y-1 text-sm">
                  <li className={`flex items-center gap-2 ${panCard ? 'text-green-600' : 'text-red-600'}`}>
                    {panCard ? '✓' : '✗'} PAN Card Number
                  </li>
                  <li className={`flex items-center gap-2 ${govtIdType ? 'text-green-600' : 'text-red-600'}`}>
                    {govtIdType ? '✓' : '✗'} Government ID Type
                  </li>
                  <li className={`flex items-center gap-2 ${govtIdNumber ? 'text-green-600' : 'text-red-600'}`}>
                    {govtIdNumber ? '✓' : '✗'} Government ID Number
                  </li>
                  <li className={`flex items-center gap-2 ${(govtIdPhoto || existingGovtIdPhoto) ? 'text-green-600' : 'text-red-600'}`}>
                    {(govtIdPhoto || existingGovtIdPhoto) ? '✓' : '✗'} Government ID Photo
                  </li>
                  <li className={`flex items-center gap-2 ${bankName ? 'text-green-600' : 'text-red-600'}`}>
                    {bankName ? '✓' : '✗'} Bank Name
                  </li>
                  <li className={`flex items-center gap-2 ${accountNumber ? 'text-green-600' : 'text-red-600'}`}>
                    {accountNumber ? '✓' : '✗'} Account Number
                  </li>
                  <li className={`flex items-center gap-2 ${ifsc ? 'text-green-600' : 'text-red-600'}`}>
                    {ifsc ? '✓' : '✗'} IFSC Code
                  </li>
                  <li className={`flex items-center gap-2 ${branchName ? 'text-green-600' : 'text-red-600'}`}>
                    {branchName ? '✓' : '✗'} Branch Name
                  </li>
                  <li className={`flex items-center gap-2 ${pennyCheck ? 'text-green-600' : 'text-red-600'}`}>
                    {pennyCheck ? '✓' : '✗'} Penny Transfer Verification
                  </li>
                </ul>
              </div>
            </div>
          </form>


          {/* Terms & Conditions Modal */}
          {showTerms && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50 transition-opacity duration-300">
              <div className="bg-gray-900 text-gray-200 rounded-lg shadow-2xl w-[90%] md:w-[600px] relative p-6 border border-red-700 max-h-[80vh] overflow-y-auto scrollbar-thin scrollbar-thumb-red-600 scrollbar-track-gray-800 scrollbar-thumb-rounded-full">
                {/* Close Button */}
                <button
                  onClick={() => setShowTerms(false)}
                  className="absolute top-3 right-3 text-gray-400 hover:text-red-500"
                >
                  <FaTimes />
                </button>

                <h3 className="text-lg font-semibold mb-4 text-red-500 text-center">
                  Terms & Conditions
                </h3>

                <div className="text-xs text-gray-300 space-y-2 leading-relaxed text-justify">
                  <p>
                    <strong>Concept Promotions and events (CPE)</strong> respects your
                    privacy and is committed to protecting your personal data. This notice
                    and request for consent ("Notice") will inform you about how the CPE
                    proposes to collect, handle, store, use, disclose and transfer
                    ("Process") your personal data.
                  </p>

                  <p>
                    <strong>1. Categories of Personal Data:</strong> We may Process the
                    following types of your personal data:
                  </p>
                  <ol className="list-[lower-alpha] ml-4 space-y-1">
                    <li>
                      Identity and/or contact information and other details
                      for you or your outlet such as name, physical address,
                      mobile number, email address, signatures, date of birth,
                      copy of identity and residence identifiers such as Aadhaar
                      or other officially valid documents, Permanent Account Number,
                      passport, biometric information, marital status, citizenship,
                      residential status etc.
                    </li>
                    <li>
                      Financial or related information such as income details,
                      account statements, passbooks, employment or occupational information,
                      information collected when you undertake transactions including when
                      you send or receive payments, etc.
                    </li>
                    <li>
                      Information that you provide about others such as nominee details,
                      family details, associate details, employer details, authorized
                      signatories and other authorized representatives in case of
                      non-individual applicants, etc.
                    </li>
                    <li>
                      Information that others provide about you such as data obtained from
                      other parties who are involved in transactions undertaken by you, from
                      any persons / organisations involved in any payment system or infrastructure
                      or architecture of which we are a part and whether your interface/
                      interaction is directly with us or indirectly through such third parties, etc.
                    </li>
                    <li>
                      Information from and about your online activities such as your location,
                      IP address, device and operating system, unique identifiers such as
                      International Mobile Equipment Identity (IMEI) number, technical usage
                      data, contact lists, fingerprint (if you choose to enable it), passwords
                      or PINs in encrypted form, etc.
                    </li>
                    <li>
                      Information such as records of our correspondence with you, your
                      interaction with CPE including chats, emails, telephone conversations,
                      grievances, etc.
                    </li>
                  </ol>

                  <p>
                    <strong>2. Purposes of Processing:</strong> We Process your personal
                    data for:
                  </p>
                  <ol className="list-[lower-alpha] ml-4 space-y-1">
                    <li>
                      To meet our legal, regulatory or compliance obligations such as customer
                      due diligence, know your customer/ anti-money laundering checks, undertaking
                      data protection impact assessments, data audits, etc.
                    </li>
                    <li>
                      To assess and monitor your continued eligibility and suitability for the
                      Requested Product such as your KYC status, risk assessment, including by
                      way of background checks, inspections, verifications, etc.
                    </li>
                    <li>
                      To provide you with and enable your use of the Requested Product.
                    </li>
                    <li>
                      To initiate legal or regulatory proceedings for enforcement of our
                      rights or defending your claims.
                    </li>
                    <li>
                      To provide you with customer service and to communicate with you through
                      emails, chats, telephone calls and other means.
                    </li>
                    <li>
                      To take actions necessary for prevention and detection of crime and
                      fraud, portfolio sensitivity analysis, etc.
                    </li>
                  </ol>
                  <p className="text-gray-400 text-[11px]">
                    Note: We may undertake the abovementioned activities either ourselves or
                    through our affiliates or third parties such as vendors, service providers,
                    other regulated entities such as credit information companies and KYC
                    registration and authentication service agencies, etc., in accordance with
                    our internal policies and applicable law.
                  </p>

                  <p>
                    <strong>3. Data Sharing:</strong> We may share your personal data with
                    our affiliates or third parties such as credit information companies,
                    bureaus, switches, networks, agencies, vendors, card association, settlement,
                    transfer and processing intermediaries, payment aggregators, payment gateways,
                    payments systems, service providers, consultants, vendors, agents, fintech
                    entities, co-brand entities / partners, distributors, selling/ marketing agents,
                    any partners, collaborators, co-lenders, co-originators, merchants, aggregators,
                    lead generators, sourcing entities, clients, customers or other persons with
                    whom we have any direct or indirect arrangement or tie-up or contract for any
                    products or services, any TPAPs, or other players/ intermediaries in any
                    ecosystem of which the CPE is a part, with entities managing loyalty programmes,
                    managing, generating and/or implementing any offers, discounts, cashbacks,
                    chargebacks, features, etc., and such entities may share your personal data
                    with their service providers, consultants, vendors, etc., for the purposes
                    mentioned in this Notice. In certain cases, these entities, which receive your
                    personal data from us may also be legally required to give you a notice
                    regarding their Processing of your personal data and request for your consent
                    before they Process the same. We encourage you to read their privacy notices
                    and contact them if you have any questions regarding how they Process your
                    personal data.
                  </p>

                  <p>
                    <strong>4. Withdrawal of Consent:</strong> You have the right to withdraw
                    your consent at any time by following the process provided under the
                    'Consent Withdrawal' section of the Privacy Policy. <br></br>
                    Please note that our Processing of your personal data before you withdraw
                    your consent will not be impacted. You should also be aware that if you withdraw
                    your consent for us to Process your personal data for some of the purposes we
                    have mentioned in this Notice, we may not be able to continue offering you the
                    Requested Product. This could mean that the terms and conditions applicable to
                    discontinuation or closure of your Requested Product will become applicable.<br></br>
                    We encourage you to review the terms and conditions applicable to the Requested
                    Product to understand the consequences of withdrawal of your consent in respect
                    of use of your personal data.
                  </p>

                  <p>
                    <strong>5. Grievances:</strong> If you believe that you have any concerns
                    regarding how we Process your personal data, you have the right to let us
                    know your grievances. Please contact us at the details provided under
                    'Contact Information' below to register your concerns.
                  </p>
                  <p className="text-gray-400 text-[11px]">
                    <strong>Contact Information:</strong> <span className="text-red-500 hover:underline">manager@conceptpromotions.in</span>
                  </p>

                  <p>
                    <strong>6. Consent Declaration:</strong> By providing your consent by ticking
                    the checkbox, you acknowledge and agree to the following:
                  </p>
                  <ol className="list-[lower-alpha] ml-4 space-y-1">
                    <li>
                      That you have read and understood the contents of this Notice and consent to
                      the Processing of your personal data as described here.
                    </li>
                    <li>
                      That you give your consent voluntarily, without any coercion or influence
                      from the CPE or any other person.
                    </li>
                    <li>
                      That you will provide and ensure that the CPE maintains accurate, updated,
                      complete and consistent personal data.
                    </li>
                    <li>
                      The CPE may Process your personal data for certain other purposes without
                      your consent, where the law allows us to do so such as enforcement of a
                      legal claim against you or for the CPE to make regulatory disclosures.
                    </li>
                  </ol>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default RetailerProfile;
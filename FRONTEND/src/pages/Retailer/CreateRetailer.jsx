import React, { useState, useRef, useEffect } from "react";
import {
    FaUser,
    FaPhoneAlt,
    FaEnvelope,
    FaCalendarAlt,
    FaIdCard,
    FaBuilding,
    FaPlus,
    FaTimes,
} from "react-icons/fa";
import { IoClose } from "react-icons/io5";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const SearchableSelect = ({ label, placeholder, options, value, onChange }) => {
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
                className="w-full border border-gray-300 rounded-lg"
                onClick={() => setOpen(true)}
            >
                <div className="flex items-center px-3 py-2">
                    <input
                        className="flex-1 outline-none bg-transparent"
                        placeholder={value || placeholder}
                        value={open ? search : value || ""}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            onChange && onChange("");
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

const FileInput = ({ label, accept = "*", file, setFile }) => {
    const fileRef = useRef();

    useEffect(() => {
        return () => {
            if (file && file.preview) URL.revokeObjectURL(file.preview);
        };
    }, [file]);

    function handleFileChange(e) {
        const f = e.target.files[0];
        if (!f) {
            setFile(null);
            return;
        }
        const preview = f.type.startsWith("image/") ? URL.createObjectURL(f) : null;
        setFile({ raw: f, preview, name: f.name });
    }

    return (
        <div>
            <label className="block text-sm font-medium mb-1">{label}</label>
            <div
                className="relative flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[#E4002B] transition"
                onClick={() => fileRef.current?.click()}
            >
                {!file ? (
                    <>
                        <FaPlus className="text-2xl text-gray-400 mb-2" />
                        <p className="text-sm text-gray-500">Click or drop file here</p>
                    </>
                ) : (
                    <div className="flex flex-col items-center gap-2">
                        {file.preview ? (
                            <img
                                src={file.preview}
                                alt="preview"
                                className="w-20 h-16 object-cover rounded-md border"
                            />
                        ) : (
                            <p className="text-sm text-gray-700">{file.name}</p>
                        )}
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                setFile(null);
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

const CreateRetailer = () => {
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
        "LLP"
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
    const states = [
        "Andhra Pradesh",
        "Arunachal Pradesh",
        "Assam",
        "Bihar",
        "Chhattisgarh",
        "Goa",
        "Gujarat",
        "Haryana",
        "Himachal Pradesh",
        "Jharkhand",
        "Karnataka",
        "Kerala",
        "Madhya Pradesh",
        "Maharashtra",
        "Manipur",
        "Meghalaya",
        "Mizoram",
        "Nagaland",
        "Odisha",
        "Punjab",
        "Rajasthan",
        "Sikkim",
        "Tamil Nadu",
        "Telangana",
        "Tripura",
        "Uttar Pradesh",
        "Uttarakhand",
        "West Bengal",
        "Delhi",
        "Jammu and Kashmir",
        "Ladakh",
        "Puducherry",
        "Chandigarh",
        "Andaman and Nicobar Islands",
        "Dadra and Nagar Haveli and Daman and Diu",
        "Lakshadweep",
    ];

    const pincodeStateMap = [
        { state: "Andhra Pradesh", start: 500001, end: 534999 },
        { state: "Arunachal Pradesh", start: 790001, end: 792999 },
        { state: "Assam", start: 781001, end: 788999 },
        { state: "Bihar", start: 800001, end: 855999 },
        { state: "Chhattisgarh", start: 490001, end: 497999 },
        { state: "Delhi", start: 110001, end: 110096 },
        { state: "Goa", start: 403001, end: 403999 },
        { state: "Gujarat", start: 360001, end: 396999 },
        { state: "Haryana", start: 121001, end: 127999 },
        { state: "Himachal Pradesh", start: 171001, end: 177999 },
        { state: "Jammu & Kashmir", start: 180001, end: 194999 },
        { state: "Jharkhand", start: 814001, end: 834999 },
        { state: "Karnataka", start: 560001, end: 591999 },
        { state: "Kerala", start: 670001, end: 695999 },
        { state: "Madhya Pradesh", start: 450001, end: 488999 },
        { state: "Maharashtra", start: 400001, end: 445999 },
        { state: "Manipur", start: 795001, end: 795999 },
        { state: "Meghalaya", start: 793001, end: 794999 },
        { state: "Mizoram", start: 796001, end: 796999 },
        { state: "Nagaland", start: 797001, end: 798999 },
        { state: "Odisha", start: 751001, end: 770999 },
        { state: "Punjab", start: 140001, end: 160999 },
        { state: "Rajasthan", start: 301001, end: 345999 },
        { state: "Sikkim", start: 737001, end: 737999 },
        { state: "Tamil Nadu", start: 600001, end: 643999 },
        { state: "Telangana", start: 500001, end: 509999 },
        { state: "Tripura", start: 799001, end: 799999 },
        { state: "Uttar Pradesh", start: 201001, end: 285999 },
        { state: "Uttarakhand", start: 246001, end: 263999 },
        { state: "West Bengal", start: 700001, end: 743999 },
    ];

    const [panError, setPanError] = useState("");
    const [gstError, setGstError] = useState("");
    const [pincodeError, setPincodeError] = useState("");
    const [ifscError, setIfscError] = useState("");

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

    // Files
    const [govtIdPhoto, setGovtIdPhoto] = useState(null);
    const [personPhoto, setPersonPhoto] = useState(null);
    const [registrationFormFile, setRegistrationFormFile] = useState(null);
    const [outletPhoto, setOutletPhoto] = useState(null);

    // Submission
    const [submitting, setSubmitting] = useState(false);

    // REMOVE this: Auto-fill state based on pincode
    useEffect(() => {
        if (pincode.length === 6) {
            const pinNum = parseInt(pincode);
            const found = pincodeStateMap.find(
                (item) => pinNum >= item.start && pinNum <= item.end
            );
        }
    }, [pincode]);

    // REMOVE this: Validation alert for pincode-state mismatch
    useEffect(() => {
        if (state && pincode.length === 6) {
            const pinNum = parseInt(pincode);
            const found = pincodeStateMap.find(
                (item) => item.state === state && pinNum >= item.start && pinNum <= item.end
            );

            if (!found) {
                alert(
                    `The entered pincode ${pincode} does not belong to ${state}. Please correct it.`
                );
                setPincode("");
            }
        }
    }, [state]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const token = localStorage.getItem("token");

            const formData = new FormData();

            // ✅ Required personal info
            formData.append("name", name);
            formData.append("contactNo", contactNo);
            formData.append("email", email);
            formData.append("dob", dob);
            formData.append("gender", gender);
            formData.append("govtIdType", govtIdType);
            formData.append("govtIdNumber", govtIdNumber);

            // ✅ Optional
            formData.append("altContactNo", altContactNo || "");

            // ✅ Personal address
            formData.append("address", address1);
            formData.append("city", city);
            formData.append("state", state);
            formData.append("geoTags.lat", "0");
            formData.append("geoTags.lng", "0");

            // ✅ Shop Details
            formData.append("shopDetails.shopName", shopName);
            formData.append("shopDetails.businessType", businessType);
            formData.append("shopDetails.ownershipType", ownershipType);
            formData.append("shopDetails.GSTNo", gstNo);
            formData.append("shopDetails.PANCard", panCard);
            formData.append("shopDetails.dateOfEstablishment", "");
            formData.append("shopDetails.shopAddress.address", address1);
            formData.append("shopDetails.shopAddress.city", city);
            formData.append("shopDetails.shopAddress.state", state);
            formData.append("shopDetails.shopAddress.geoTags.lat", "0");
            formData.append("shopDetails.shopAddress.geoTags.lng", "0");

            // ✅ Bank Details
            formData.append("bankDetails.bankName", bankName);
            formData.append("bankDetails.accountNumber", accountNumber);
            formData.append("bankDetails.IFSC", ifsc);
            formData.append("bankDetails.branchName", branchName);

            // ✅ Files
            if (govtIdPhoto) formData.append("govtIdPhoto", govtIdPhoto.raw);
            if (personPhoto) formData.append("personPhoto", personPhoto.raw);
            if (registrationFormFile)
                formData.append("registrationForm", registrationFormFile.raw);
            if (outletPhoto) formData.append("outletPhoto", outletPhoto.raw);

            // ✅ Defaults
            formData.append("createdBy", "AdminAdded");
            formData.append("partOfIndia", "N");

            const response = await fetch(
                "https://supreme-419p.onrender.com/api/admin/retailers",
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    body: formData,
                }
            );

            let data = {};
            try {
                data = await response.json();
            } catch {
                console.log("⚠ No JSON body returned");
            }

            if (!response.ok) {
                console.error("❌ API Error:", data); // ✅ PRINT ERROR IN CONSOLE
                toast.error(data.message || "Error registering retailer", {
                    theme: "dark",
                });
            } else {
                toast.success("✅ Retailer created successfully!", {
                    theme: "dark",
                });

                resetForm();
            }
        } catch (error) {
            console.error("❌ Network/Server error:", error); // ✅ PRINT ERROR IN CONSOLE
            toast.error("Server error", { theme: "dark" });
        }

        setSubmitting(false);
    };

    const resetForm = () => {
        setName("");
        setContactNo("");
        setAltContactNo("");
        setEmail("");
        setDob("");
        setGender("");
        setGovtIdType("");
        setGovtIdNumber("");
        setShopName("");
        setBusinessType("");
        setOwnershipType("");
        setGstNo("");
        setPanCard("");
        setAddress1("");
        setAddress2("");
        setCity("");
        setState("");
        setPincode("");
        setBankName("");
        setAccountNumber("");
        setIfsc("");
        setBranchName("");

        setGovtIdPhoto(null);
        setPersonPhoto(null);
        setRegistrationFormFile(null);
        setOutletPhoto(null);
    };

    return (
        <>
            <ToastContainer />
            {/* Retailer Registration Form */}
            <div className="flex justify-center items-center w-full">
                <div className="w-full max-w-3xl bg-white shadow-md rounded-xl p-8">
                    <h1 className="text-2xl font-bold text-[#E4002B] text-center pb-8">Retailer Registration</h1>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Personal Details */}
                        <section className="space-y-4">
                            <h3 className="text-lg font-medium text-[#E4002B]">Personal Details</h3>

                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    Name <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <FaUser className="absolute left-3 top-3 text-gray-400" />
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Full name"
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#E4002B]"
                                        required
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
                                        onChange={(e) => setContactNo(e.target.value.replace(/\D/g, ""))}
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
                                        onChange={(e) => setAltContactNo(e.target.value.replace(/\D/g, ""))}
                                        placeholder="+91 1234567890"
                                        maxLength={10}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#E4002B]"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    Email <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <FaEnvelope className="absolute left-3 top-3 text-gray-400" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="example@google.com"
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#E4002B]"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    Date of Birth <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <FaCalendarAlt className="absolute left-3 top-3 text-gray-400" />
                                    <input
                                        type="date"
                                        value={dob}
                                        onChange={(e) => setDob(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#E4002B]"
                                        required
                                    />
                                </div>
                            </div>

                            <SearchableSelect
                                label={
                                    <>
                                        Gender <span className="text-red-500">*</span>
                                    </>
                                }
                                placeholder="Select gender"
                                options={genderOptions}
                                value={gender}
                                onChange={setGender}
                                required
                            />

                            <SearchableSelect
                                label={
                                    <>
                                        Govt ID Type <span className="text-red-500">*</span>
                                    </>
                                }
                                placeholder="Select ID type"
                                options={idTypeOptions}
                                value={govtIdType}
                                onChange={setGovtIdType}
                                required
                            />

                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    Govt ID Number <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <FaIdCard className="absolute left-3 top-3 text-gray-400" />
                                    <input
                                        type="text"
                                        value={govtIdNumber}
                                        onChange={(e) => setGovtIdNumber(e.target.value)}
                                        placeholder="1234-5678-9102"
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#E4002B]"
                                        required
                                    />
                                </div>
                            </div>
                        </section>

                        {/* Shop Details */}
                        <section className="space-y-4">
                            <h3 className="text-lg font-medium text-[#E4002B]">Shop Details</h3>

                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    Shop Name <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <FaBuilding className="absolute left-3 top-3 text-gray-400" />
                                    <input
                                        type="text"
                                        value={shopName}
                                        onChange={(e) => setShopName(e.target.value)}
                                        placeholder="Shop name"
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#E4002B]"
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
                            />

                            <SearchableSelect
                                label={
                                    <>
                                        Ownership Type <span className="text-red-500">*</span>
                                    </>
                                }
                                placeholder="Select ownership type"
                                options={ownershipTypeOptions}
                                value={ownershipType}
                                onChange={setOwnershipType}
                            />

                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        GST No <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={gstNo}
                                        onChange={(e) => {
                                            const val = e.target.value.toUpperCase();
                                            setGstNo(val);
                                            const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
                                            if (val === "") setGstError("");
                                            else if (!gstRegex.test(val))
                                                setGstError("Invalid GST Number format (e.g., 29ABCDE1234F1Z5)");
                                            else setGstError("");
                                        }}
                                        placeholder="29ABCDE1234F1Z5"
                                        className={`w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 ${gstError
                                            ? "border-red-500 focus:ring-red-500"
                                            : "border-gray-300 focus:ring-[#E4002B]"
                                            }`}
                                        required
                                    />
                                    {gstError && <p className="text-red-500 text-xs mt-1">{gstError}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        PAN Card <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={panCard}
                                        onChange={(e) => {
                                            const val = e.target.value.toUpperCase();
                                            setPanCard(val);
                                            const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
                                            if (val === "") setPanError("");
                                            else if (!panRegex.test(val))
                                                setPanError("Invalid PAN Number format (e.g., ABCDE1234F)");
                                            else setPanError("");
                                        }}
                                        placeholder="ABCDE1234F"
                                        className={`w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 ${panError
                                            ? "border-red-500 focus:ring-red-500"
                                            : "border-gray-300 focus:ring-[#E4002B]"
                                            }`}
                                        required
                                    />
                                    {panError && <p className="text-red-500 text-xs mt-1">{panError}</p>}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    Address Line 1 <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={address1}
                                    onChange={(e) => setAddress1(e.target.value)}
                                    placeholder="45, Main Market Road"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#E4002B]"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Address Line 2</label>
                                <input
                                    type="text"
                                    value={address2}
                                    onChange={(e) => setAddress2(e.target.value)}
                                    placeholder="Near XYZ landmark"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#E4002B]"
                                />
                            </div>

                            {/* City, State, and Pincode */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        City <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={city}
                                        onChange={(e) => setCity(e.target.value)}
                                        placeholder="New Delhi"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#E4002B]"
                                        required
                                    />
                                </div>

                                <SearchableSelect
                                    label={
                                        <>
                                            State <span className="text-red-500">*</span>
                                        </>
                                    }
                                    placeholder="Select state"
                                    options={states}
                                    value={state}
                                    onChange={setState}
                                />

                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Pincode <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={pincode}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/\D/g, "");
                                            setPincode(val);

                                            if (state) {
                                                const stateInfo = pincodeStateMap.find(
                                                    (s) => s.state.toLowerCase() === state.toLowerCase()
                                                );
                                                if (stateInfo) {
                                                    const pinNum = parseInt(val, 10);
                                                    if (pinNum < stateInfo.start || pinNum > stateInfo.end)
                                                        setPincodeError(`Pincode not valid for ${state}`);
                                                    else setPincodeError("");
                                                }
                                            } else {
                                                setPincodeError("");
                                            }
                                        }}
                                        placeholder="110001"
                                        maxLength={6}
                                        className={`w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 ${pincodeError
                                            ? "border-red-500 focus:ring-red-500"
                                            : "border-gray-300 focus:ring-[#E4002B]"
                                            }`}
                                        required
                                    />
                                    {pincodeError && (
                                        <p className="text-red-500 text-xs mt-1">{pincodeError}</p>
                                    )}
                                </div>
                            </div>
                        </section>

                        {/* Bank Details */}
                        <section className="space-y-4">
                            <h3 className="text-lg font-medium text-[#E4002B]">Bank Details</h3>

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
                            />

                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    Account Number <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={accountNumber}
                                    onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ""))}
                                    placeholder="123456789012"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#E4002B]"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    IFSC <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={ifsc}
                                    onChange={(e) => {
                                        const val = e.target.value.toUpperCase();
                                        setIfsc(val);

                                        const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;

                                        if (val === "") setIfscError("");
                                        else if (!ifscRegex.test(val))
                                            setIfscError("Invalid IFSC Code format (e.g., HDFC0001234)");
                                        else setIfscError("");
                                    }}
                                    placeholder="HDFC0001234"
                                    maxLength={11}
                                    className={`w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 ${ifscError ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-[#E4002B]"
                                        }`}
                                />

                                {ifscError && <p className="text-red-500 text-xs mt-1">{ifscError}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    Branch Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={branchName}
                                    onChange={(e) => setBranchName(e.target.value)}
                                    placeholder="Branch name"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#E4002B]"
                                    required
                                />
                            </div>
                        </section>

                        {/* File Uploads */}
                        <section className="space-y-4">
                            <div>
                                <h3 className="text-lg font-medium text-[#E4002B]">File Uploads</h3>
                                <p className="text-[11px] text-gray-500 mt-1">
                                    <span className="text-red-500">*</span> Accepted formats: PNG, JPG, JPEG, PDF, DOC — less than 1 MB
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
                                />

                                <FileInput
                                    label={
                                        <>
                                            Registration Form
                                        </>
                                    }
                                    accept=".png,.jpg,.jpeg,.pdf,.doc"
                                    file={registrationFormFile}
                                    setFile={setRegistrationFormFile}
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
                                />
                            </div>
                        </section>

                        <div>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full bg-[#E4002B] text-white py-3 rounded-lg font-medium hover:bg-[#C3002B] transition disabled:opacity-60"
                            >
                                {submitting ? "Creating..." : "Create Retailer"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
};

export default CreateRetailer;

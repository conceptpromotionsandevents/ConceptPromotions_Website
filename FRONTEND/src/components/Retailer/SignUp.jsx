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

const SignUp = () => {
    // Personal details
    const [name, setName] = useState("");
    const [contactNo, setContactNo] = useState("");
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
        "Proprietor",
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

    useEffect(() => {
        if (pincode.length === 6) {
            const pinNum = parseInt(pincode);
            const found = pincodeStateMap.find(
                (item) => pinNum >= item.start && pinNum <= item.end
            );
            if (found) {
                setState(found.state);
            }
        }
    }, [pincode]);

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

    const handleSubmit = async (e) => {
        e.preventDefault();

        const body = {
            name,
            contactNo,
            email,
            dob,
            gender,
            govtIdType,
            govtIdNumber,
            shopDetails: {
                shopName,
                businessType,
                ownershipType,
                GSTNo: gstNo,
                PANCard: panCard,
                shopAddress: {
                    addressLine1: address1,
                    addressLine2: address2,
                    city,
                    state,
                    pincode,
                },
            },
            bankDetails: {
                bankName,
                accountNumber,
                IFSC: ifsc,
                branchName,
            },
            files: {
                govtIdPhoto: govtIdPhoto?.name || null,
                personPhoto: personPhoto?.name || null,
                registrationForm: registrationFormFile?.name || null,
                outletPhoto: outletPhoto?.name || null,
            },
        };

        setSubmitting(true);
        try {
            console.log("Submitting JSON body:", JSON.stringify(body, null, 2));
            await new Promise((res) => setTimeout(res, 600));
            alert("Form submitted! Check console for JSON body (replace with real API request).");
        } catch (err) {
            console.error(err);
            alert("Submission failed.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            {/* Navbar */}
            <nav className="fixed top-0 w-full z-50 bg-white shadow-md px-6 md:px-10">
                <div className="flex justify-between items-center py-4 max-w-screen-xl mx-auto">
                    <img src="cpLogo.png" alt="Logo" className="h-14 cursor-pointer" />
                    <h2 className="absolute left-1/2 transform -translate-x-1/2 text-xl md:text-2xl font-bold text-[#E4002B]">
                        Retailer Registration Page
                    </h2>
                </div>
            </nav>

            {/* Retailer Registration Form */}
            <div className="min-h-screen bg-white px-4 pt-28 pb-10">
                <div className="max-w-3xl mx-auto bg-white shadow rounded-lg p-6">
                    <h2 className="text-2xl font-semibold mb-4 text-center">Retailer Registration</h2>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Personal Details */}
                        <section className="space-y-4">
                            <h3 className="text-lg font-medium">Personal Details</h3>
                            <div>
                                <label className="block text-sm font-medium mb-1">Name</label>
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
                                <label className="block text-sm font-medium mb-1">Contact No</label>
                                <div className="relative">
                                    <FaPhoneAlt className="absolute left-3 top-3 text-gray-400" />
                                    <input
                                        type="tel"
                                        value={contactNo}
                                        onChange={(e) => setContactNo(e.target.value.replace(/\D/g, ""))}
                                        placeholder="9876543210"
                                        maxLength={10}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#E4002B]"
                                        required
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
                                        placeholder="name@example.com"
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#E4002B]"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Date of Birth</label>
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
                            />

                            <SearchableSelect
                                label="Govt ID Type"
                                placeholder="Select ID type"
                                options={idTypeOptions}
                                value={govtIdType}
                                onChange={setGovtIdType}
                            />

                            <div>
                                <label className="block text-sm font-medium mb-1">Govt ID Number</label>
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
                            <h3 className="text-lg font-medium">Shop Details</h3>

                            <div>
                                <label className="block text-sm font-medium mb-1">Shop Name</label>
                                <div className="relative">
                                    <FaBuilding className="absolute left-3 top-3 text-gray-400" />
                                    <input
                                        type="text"
                                        value={shopName}
                                        onChange={(e) => setShopName(e.target.value)}
                                        placeholder="Shop name"
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#E4002B]"
                                    />
                                </div>
                            </div>

                            <SearchableSelect
                                label="Business Type"
                                placeholder="Select business type"
                                options={businessTypeOptions}
                                value={businessType}
                                onChange={setBusinessType}
                            />

                            <SearchableSelect
                                label="Ownership Type"
                                placeholder="Select ownership type"
                                options={ownershipTypeOptions}
                                value={ownershipType}
                                onChange={setOwnershipType}
                            />

                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">GST No</label>
                                    <input
                                        type="text"
                                        value={gstNo}
                                        onChange={(e) => setGstNo(e.target.value)}
                                        placeholder="29ABCDE1234F1Z5"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#E4002B]"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">PAN Card</label>
                                    <input
                                        type="text"
                                        value={panCard}
                                        onChange={(e) => setPanCard(e.target.value)}
                                        placeholder="ABCDE1234F"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#E4002B]"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Address Line 1</label>
                                <input
                                    type="text"
                                    value={address1}
                                    onChange={(e) => setAddress1(e.target.value)}
                                    placeholder="45, Main Market Road"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#E4002B]"
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
                                    <label className="block text-sm font-medium mb-1">City</label>
                                    <input
                                        type="text"
                                        value={city}
                                        onChange={(e) => setCity(e.target.value)}
                                        placeholder="New Delhi"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#E4002B]"
                                    />
                                </div>

                                <SearchableSelect
                                    label="State"
                                    placeholder="Select state"
                                    options={states}
                                    value={state}
                                    onChange={setState}
                                />

                                <div>
                                    <label className="block text-sm font-medium mb-1">Pincode</label>
                                    <input
                                        type="text"
                                        value={pincode}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/\D/g, ""); // allow only digits
                                            setPincode(val);
                                        }}
                                        placeholder="110001"
                                        maxLength={6}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#E4002B]"
                                    />
                                </div>
                            </div>
                        </section>

                        {/* Bank Details */}
                        <section className="space-y-4">
                            <h3 className="text-lg font-medium">Bank Details</h3>

                            <SearchableSelect
                                label="Bank Name"
                                placeholder="Select bank"
                                options={bankOptions}
                                value={bankName}
                                onChange={setBankName}
                            />

                            <div>
                                <label className="block text-sm font-medium mb-1">Account Number</label>
                                <input
                                    type="text"
                                    value={accountNumber}
                                    onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ""))}
                                    placeholder="123456789012"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#E4002B]"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">IFSC</label>
                                <input
                                    type="text"
                                    value={ifsc}
                                    onChange={(e) => setIfsc(e.target.value.toUpperCase())}
                                    placeholder="HDFC0001234"
                                    maxLength={11}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#E4002B]"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Branch Name</label>
                                <input
                                    type="text"
                                    value={branchName}
                                    onChange={(e) => setBranchName(e.target.value)}
                                    placeholder="Jaipur Main Branch"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#E4002B]"
                                />
                            </div>
                        </section>

                        {/* File Uploads */}
                        <section className="space-y-4">
                            <h3 className="text-lg font-medium">File Uploads</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FileInput
                                    label="Govt ID Photo"
                                    accept="image/*"
                                    file={govtIdPhoto}
                                    setFile={setGovtIdPhoto}
                                />
                                <FileInput
                                    label="Person Photo"
                                    accept="image/*"
                                    file={personPhoto}
                                    setFile={setPersonPhoto}
                                />
                                <FileInput
                                    label="Registration Form (PDF/Img)"
                                    accept=".pdf,image/*"
                                    file={registrationFormFile}
                                    setFile={setRegistrationFormFile}
                                />
                                <FileInput
                                    label="Outlet Photo"
                                    accept="image/*"
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
                                {submitting ? "Submitting..." : "Submit Registration"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
};

export default SignUp;

import React, { useState, useRef, useEffect } from "react";
import { API_URL } from "../../url/base";
import {
    FaUser,
    FaPhoneAlt,
    FaBuilding,
    FaIdCard,
    FaMapMarkerAlt,
    FaCity,
    FaUniversity,
    FaCreditCard,
    FaCode,
    FaCodeBranch,
    FaStore,
    FaMapMarkedAlt,
    FaMapPin
} from "react-icons/fa";
import { IoClose } from "react-icons/io5";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const SearchableSelect = ({ icon: Icon, label, placeholder, options, value, onChange, required = false }) => {
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
            <label className="block text-sm font-medium mb-1 text-gray-700">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <div
                className="w-full border border-gray-300 rounded-lg bg-white cursor-pointer"
                onClick={() => setOpen(true)}
            >
                <div className="flex items-center px-3 py-2 min-h-[40px]">
                    {Icon && <Icon className="text-gray-400 mr-2 flex-shrink-0" />}
                    <input
                        className="flex-1 outline-none bg-transparent text-sm min-w-0"
                        placeholder={value || placeholder}
                        value={open ? search : value || ""}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            if (!open) setOpen(true);
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
                            className="ml-2 text-gray-500 hover:text-gray-700 flex-shrink-0"
                        >
                            <IoClose />
                        </button>
                    )}
                </div>
            </div>

            {open && (
                <ul className="absolute z-1 w-full bg-white border border-gray-300 rounded-lg max-h-48 overflow-y-auto mt-1 shadow-lg">
                    {filtered.length > 0 ? (
                        filtered.map((opt, idx) => (
                            <li
                                key={idx}
                                onClick={() => {
                                    onChange(opt);
                                    setSearch("");
                                    setOpen(false);
                                }}
                                className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                            >
                                {opt}
                            </li>
                        ))
                    ) : (
                        <li className="px-4 py-2 text-gray-500 text-sm">No match found</li>
                    )}
                </ul>
            )}
        </div>
    );
};

const IconInput = ({ icon: Icon, label, placeholder, type = "text", value, onChange, error, ...rest }) => (
    <div>
        <label className="block text-sm font-medium mb-1 text-gray-700">{label}</label>
        <div className="relative">
            {Icon && <Icon className="absolute left-3 top-3 text-gray-400" />}
            <input
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className={`w-full ${Icon ? 'pl-10' : 'pl-4'} pr-4 py-2 border rounded-lg outline-none focus:ring-2 text-sm ${error
                    ? "border-red-500 focus:ring-red-500"
                    : "border-gray-300 focus:ring-[#E4002B]"
                    }`}
                {...rest}
            />
        </div>
        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
);

const CreateRetailer = () => {
    const [name, setName] = useState("");
    const [contactNo, setContactNo] = useState("");
    const [shopName, setShopName] = useState("");
    const [businessType, setBusinessType] = useState("");
    const [panCard, setPanCard] = useState("");
    const [address1, setAddress1] = useState("");
    const [city, setCity] = useState("");
    const [state, setState] = useState("");
    const [pincode, setPincode] = useState("");
    const [bankName, setBankName] = useState("");
    const [accountNumber, setAccountNumber] = useState("");
    const [ifsc, setIfsc] = useState("");
    const [branchName, setBranchName] = useState("");

    const [panError, setPanError] = useState("");
    const [pincodeError, setPincodeError] = useState("");
    const [ifscError, setIfscError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const businessTypeOptions = [
        "Grocery Retailer",
        "Wholesale",
        "Key Accounts",
        "Salon / Beauty Parlour",
        "Self Service Outlet",
        "Chemist Outlet",
        "Other",
    ];

    const bankOptions = [
        "HDFC Bank",
        "State Bank of India",
        "ICICI Bank",
        "Axis Bank",
        "Kotak Mahindra Bank",
        "Punjab National Bank",
        "Other",
    ];

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
        { state: "Jammu and Kashmir", start: 180001, end: 194999 },
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

    const handleNotifyRetailer = async () => {
        if (!name || !contactNo || !shopName || !businessType || !panCard || !address1 || !city || !state || !pincode || !bankName || !accountNumber || !ifsc || !branchName) {
            toast.error("Please fill all required fields.", { theme: "dark" });
            return;
        }

        if (panError || pincodeError || ifscError) {
            toast.error("Please fix validation errors before submitting.", { theme: "dark" });
            return;
        }

        const token = localStorage.getItem("token");
        if (!token) {
            toast.error("Unauthorized! Please login again.", { theme: "dark" });
            return;
        }

        // Create payload matching backend schema
        const payload = {
            name,
            email: `${contactNo}@retailer.temp`,
            contactNo,
            gender: "",
            govtIdType: "",
            govtIdNumber: "",
            shopName,
            businessType,
            ownershipType: "",
            GSTNo: "",
            PANCard: panCard,
            shopAddress: address1,
            shopAddress2: "",
            shopCity: city,
            shopState: state,
            shopPincode: pincode,
            bankName,
            accountNumber,
            IFSC: ifsc,
            branchName,
            createdBy: "AdminAdded",
            partOfIndia: "N",
        };

        setSubmitting(true);

        try {
            const response = await fetch(
                `${API_URL}/admin/retailers`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(payload),
                }
            );

            const result = await response.json();

            if (response.ok) {
                toast.success("Notification sent & retailer initiated successfully!", { theme: "dark" });

                setTimeout(() => {
                    resetForm();
                }, 1500);
            } else {
                toast.error(result.message || "Failed to notify retailer", { theme: "dark" });
            }
        } catch (err) {
            console.error("Submission error:", err);
            toast.error("Something went wrong. Try again!", { theme: "dark" });
        } finally {
            setSubmitting(false);
        }
    };

    const resetForm = () => {
        setName("");
        setContactNo("");
        setShopName("");
        setBusinessType("");
        setPanCard("");
        setAddress1("");
        setCity("");
        setState("");
        setPincode("");
        setBankName("");
        setAccountNumber("");
        setIfsc("");
        setBranchName("");
        setPanError("");
        setPincodeError("");
        setIfscError("");
    };

    return (
        <>
            <ToastContainer />

            <div className="flex justify-center items-center w-full min-h-screen bg-[#171717] py-8">
                <div className="w-full max-w-2xl bg-[#EDEDED] shadow-md rounded-xl p-8">
                    <h1 className="text-2xl font-bold text-[#E4002B] text-center mb-6">
                        Retailer Registration
                    </h1>

                    <div className="space-y-6">
                        {/* Personal Details */}
                        <section className="space-y-4">
                            <h3 className="text-lg font-medium text-[#E4002B]">Personal Details</h3>

                            <IconInput
                                icon={FaUser}
                                label={<>Name <span className="text-red-500">*</span></>}
                                placeholder="Enter your full name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />

                            <IconInput
                                icon={FaPhoneAlt}
                                label={<>Contact No <span className="text-red-500">*</span></>}
                                placeholder="Enter your phone number"
                                value={contactNo}
                                onChange={(e) => setContactNo(e.target.value.replace(/\D/g, ""))}
                                maxLength={10}
                                required
                            />
                        </section>

                        {/* Shop Details */}
                        <section className="space-y-4">
                            <h3 className="text-lg font-medium text-[#E4002B]">Shop Details</h3>
                            <IconInput
                                icon={FaBuilding}
                                label={<>Shop Name <span className="text-red-500">*</span></>}
                                placeholder="Enter your shop name"
                                value={shopName}
                                onChange={(e) => setShopName(e.target.value)}
                                required
                            />

                            <SearchableSelect
                                icon={FaStore}
                                label="Business Type"
                                placeholder="Select or search business type"
                                options={businessTypeOptions}
                                value={businessType}
                                onChange={setBusinessType}
                                required
                            />

                            <IconInput
                                icon={FaIdCard}
                                label={<>PAN Card <span className="text-red-500">*</span></>}
                                placeholder="Enter your PAN card number (e.g., ABCDE1234F)"
                                value={panCard}
                                onChange={(e) => {
                                    const val = e.target.value.toUpperCase();
                                    setPanCard(val);
                                    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
                                    if (val === "") setPanError("");
                                    else if (!panRegex.test(val))
                                        setPanError("Invalid PAN format (e.g., ABCDE1234F)");
                                    else setPanError("");
                                }}
                                error={panError}
                                maxLength={10}
                                required
                            />

                            <IconInput
                                icon={FaMapMarkerAlt}
                                label={<>Address <span className="text-red-500">*</span></>}
                                placeholder="Enter your address"
                                value={address1}
                                onChange={(e) => setAddress1(e.target.value)}
                                required
                            />

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <IconInput
                                    icon={FaCity}
                                    label={<>City <span className="text-red-500">*</span></>}
                                    placeholder="New Delhi"
                                    value={city}
                                    onChange={(e) => setCity(e.target.value)}
                                    required
                                />

                                <SearchableSelect
                                    icon={FaMapMarkedAlt}
                                    label="State"
                                    placeholder="Select state"
                                    options={states}
                                    value={state}
                                    onChange={(value) => {
                                        setState(value);
                                        // Re-validate pincode when state changes
                                        if (pincode.length === 6 && value) {
                                            const stateInfo = pincodeStateMap.find(
                                                (s) => s.state.toLowerCase() === value.toLowerCase()
                                            );
                                            if (stateInfo) {
                                                const pinNum = parseInt(pincode, 10);
                                                if (pinNum < stateInfo.start || pinNum > stateInfo.end)
                                                    setPincodeError(`Pincode not valid for ${value}`);
                                                else setPincodeError("");
                                            }
                                        }
                                    }}
                                    required
                                />

                                <IconInput
                                    icon={FaMapPin}
                                    label={<>Pincode <span className="text-red-500">*</span></>}
                                    placeholder="110001"
                                    value={pincode}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/\D/g, "");
                                        setPincode(val);

                                        if (val.length === 6 && state) {
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
                                    error={pincodeError}
                                    maxLength={6}
                                    required
                                />
                            </div>
                        </section>

                        {/* Bank Details */}
                        <section className="space-y-4">
                            <h3 className="text-lg font-medium text-[#E4002B]">Bank Details</h3>

                            <SearchableSelect
                                icon={FaUniversity}
                                label="Bank Name"
                                placeholder="Select bank"
                                options={bankOptions}
                                value={bankName}
                                onChange={setBankName}
                                required
                            />

                            <IconInput
                                icon={FaCreditCard}
                                label={<>Account Number <span className="text-red-500">*</span></>}
                                placeholder="123456789012"
                                value={accountNumber}
                                onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ""))}
                                required
                            />

                            <IconInput
                                icon={FaCode}
                                label={<>IFSC <span className="text-red-500">*</span></>}
                                placeholder="HDFC0001234"
                                value={ifsc}
                                onChange={(e) => {
                                    const val = e.target.value.toUpperCase();
                                    setIfsc(val);
                                    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
                                    if (val === "") setIfscError("");
                                    else if (!ifscRegex.test(val))
                                        setIfscError("Invalid IFSC format (e.g., HDFC0001234)");
                                    else setIfscError("");
                                }}
                                error={ifscError}
                                maxLength={11}
                                required
                            />

                            <IconInput
                                icon={FaCodeBranch}
                                label={<>Branch Name <span className="text-red-500">*</span></>}
                                placeholder="Branch name"
                                value={branchName}
                                onChange={(e) => setBranchName(e.target.value)}
                                required
                            />
                        </section>

                        <button
                            type="button"
                            onClick={handleNotifyRetailer}
                            disabled={submitting}
                            className="w-full bg-[#E4002B] hover:bg-red-700 text-white font-medium py-3 rounded-lg transition-all duration-200 shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {submitting ? "Notifying..." : "Notify Retailer"}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default CreateRetailer;
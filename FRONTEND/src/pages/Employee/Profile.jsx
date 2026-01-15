import { useState, useRef, useEffect } from "react";
import { API_URL } from "../../url/base";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  FaUser,
  FaPhoneAlt,
  FaBuilding,
  FaCalendarAlt,
  FaPlus,
  FaFileAlt,
  FaTrash,
  FaSortNumericDownAlt,
  FaUniversity,
  FaIdCard,
  FaTimes,
} from "react-icons/fa";
import { IoClose } from "react-icons/io5";
import Select from "react-select";
import customSelectStyles from "../../components/common/selectStyles";

const states = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand",
  "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
  "Uttar Pradesh", "Uttarakhand", "West Bengal", "Delhi",
  "Jammu and Kashmir", "Ladakh", "Puducherry", "Chandigarh",
  "Andaman and Nicobar Islands", "Dadra and Nagar Haveli and Daman and Diu",
  "Lakshadweep"
];

/* ========================================
   SEARCHABLE SELECT COMPONENT
======================================== */
const SearchableSelect = ({ label, placeholder, options, value, onChange, disabled = false }) => {
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
      <label className="block text-sm font-medium mb-1 text-gray-700">{label}</label>
      <div
        className={`w-full border border-gray-300 rounded-lg ${disabled ? "bg-gray-100" : "bg-white"
          }`}
        onClick={() => !disabled && setOpen(true)}
      >
        <div className="flex items-center px-3 py-2">
          <input
            className="flex-1 outline-none bg-transparent text-sm disabled:cursor-not-allowed"
            placeholder={value || placeholder}
            value={open ? search : value}
            onChange={(e) => {
              setSearch(e.target.value);
              if (!open) setOpen(true);
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

/* ========================================
   FILE INPUT COMPONENT (MATCHING SAMPLE UI)
======================================== */
const FileInput = ({ label, accept = "*", file, setFile, required = false, existingImageUrl = null }) => {
  const fileRef = useRef();
  const [preview, setPreview] = useState(existingImageUrl || null);

  // ✅ NEW: Track blob URLs for cleanup
  const blobUrlRef = useRef(null);

  // ✅ NEW: Cleanup blob URL on unmount
  useEffect(() => {
    return () => {
      if (blobUrlRef.current) {
        try {
          URL.revokeObjectURL(blobUrlRef.current);
        } catch (e) { }
      }
    };
  }, []);

  // Original useEffect - KEEP THIS
  useEffect(() => {
    if (existingImageUrl) {
      setPreview(existingImageUrl);
    }
  }, [existingImageUrl]);

  function handleFileChange(e) {
    const f = e.target.files?.[0];
    if (!f) {
      setFile(null);
      setPreview(existingImageUrl);
      return;
    }

    // ✅ NEW: Revoke previous blob URL if exists
    if (blobUrlRef.current) {
      try {
        URL.revokeObjectURL(blobUrlRef.current);
      } catch (e) { }
    }

    // ✅ MODIFIED: Track the blob URL
    const newPreview = f.type.startsWith("image") ? URL.createObjectURL(f) : null;
    if (newPreview) {
      blobUrlRef.current = newPreview;
    }

    setFile({ raw: f, preview: newPreview, name: f.name });
    setPreview(newPreview);
  }

  const hasFile = file || existingImageUrl;

  return (
    <div>
      <label className="block text-sm font-medium mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
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

                // ✅ NEW: Revoke blob URL if removing new file
                if (blobUrlRef.current) {
                  try {
                    URL.revokeObjectURL(blobUrlRef.current);
                  } catch (e) { }
                  blobUrlRef.current = null;
                }

                setFile(null);
                setPreview(null);
                if (fileRef.current) fileRef.current.value = "";
              }}
              className="flex items-center gap-1 text-red-500 text-xs hover:underline cursor-pointer"
            >
              <FaTimes /> Remove
            </button>
          </div>
        )}
      </div>
      <input
        ref={fileRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
};



/* ========================================
   ICON INPUT COMPONENT
======================================== */
const IconInput = ({ icon: Icon, label, placeholder, type = "text", value, onChange, disabled = false, ...rest }) => (
  <div>
    <label className="block text-sm font-medium mb-1 text-gray-700">{label}</label>
    <div className="relative">
      {Icon && <Icon className="absolute left-3 top-3 text-gray-400" />}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-sm outline-none focus:ring-1 focus:ring-[#E4002B] focus:border-[#E4002B] text-sm bg-white hover:border-[#E4002B] transition-colors min-h-[42px] ${disabled ? "bg-gray-100 cursor-not-allowed" : ""
          }`}
        {...rest}
      />
    </div>
  </div>
);

/* ========================================
   MAIN PROFILE COMPONENT
======================================== */
const Profile = () => {
  // Loading and submission
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // ✅ NEW: Image fetching states
  const [documentStatus, setDocumentStatus] = useState({});
  const [imageUrls, setImageUrls] = useState({});

  // Prefilled from backend (READ-ONLY)
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [workerType, setWorkerType] = useState("Permanent");

  // Permanent form states
  const [pdob, setPDob] = useState("");
  const [phighestQualification, setPHighestQualification] = useState("");
  const [pgender, setPGender] = useState("");
  const [pmaritalStatus, setPMaritalStatus] = useState("");
  const [coaddress1, setCoAddress1] = useState("");
  const [coaddress2, setCoAddress2] = useState("");
  const [costate, setCoState] = useState("");
  const [cocity, setCoCity] = useState("");
  const [copincode, setCoPincode] = useState("");
  const [paddress1, setPAddress1] = useState("");
  const [paddress2, setPAddress2] = useState("");
  const [pstate, setPState] = useState("");
  const [pcity, setPCity] = useState("");
  const [ppincode, setPPincode] = useState("");
  const [palternatePhone, setPAlternatePhone] = useState("");
  const [paadhaar, setPAadhaar] = useState("");
  const [ppan, setPPan] = useState("");
  const [puan, setPUan] = useState("");
  const [pesi, setPEsi] = useState("");
  const [ppf, setPPf] = useState("");
  const [pesiDispensary, setPEsiDispensary] = useState("");
  const [pbankAccount, setPBankAccount] = useState("");
  const [pifsc, setPIfsc] = useState("");
  const [pbranchName, setPBranchName] = useState("");
  const [pbankName, setPBankName] = useState("");
  const [pfathersName, setPFathersName] = useState("");
  const [pfatherDob, setPFatherDob] = useState("");
  const [pmotherName, setPMotherName] = useState("");
  const [pmotherDob, setPMotherDob] = useState("");
  const [pspouseName, setPSpouseName] = useState("");
  const [pspouseDob, setPSpouseDob] = useState("");
  const [pchild1Name, setPChild1Name] = useState("");
  const [pchild1Dob, setPChild1Dob] = useState("");
  const [pchild2Name, setPChild2Name] = useState("");
  const [pchild2Dob, setPChild2Dob] = useState("");

  // Permanent files
  const [paadhaarFile1, setPAadhaarFile1] = useState(null);
  const [paadhaarFile2, setPAadhaarFile2] = useState(null);
  const [ppanFile, setPPanFile] = useState(null);
  const [ppersonPhoto, setPPersonPhoto] = useState(null);
  const [pbankProofFile, setPBankProofFile] = useState(null);
  const [pfamilyPhoto, setPFamilyPhoto] = useState(null);
  const [ppfForm, setPPfForm] = useState(null);
  const [pesiForm, setPEsiForm] = useState(null);
  const [pemploymentForm, setPEmploymentForm] = useState(null);
  const [pcv, setPCv] = useState(null);

  // Work experience array
  const [experiences, setExperiences] = useState([
    { organization: "", designation: "", from: "", to: "", currentlyWorking: false },
  ]);

  // Contractual form states
  const [cdob, setCDob] = useState("");
  const [caadhaar, setCAadhaar] = useState("");
  const [cpan, setCPan] = useState("");
  const [ccontractLength, setCContractLength] = useState("");
  const [cbankAccount, setCBankAccount] = useState("");
  const [cifsc, setCIfsc] = useState("");
  const [cbranchName, setCBranchName] = useState("");
  const [cbankName, setCBankName] = useState("");

  // Contractual files
  const [caadhaarFile1, setCAadhaarFile1] = useState(null);
  const [caadhaarFile2, setCAadhaarFile2] = useState(null);
  const [cpanFile, setCPanFile] = useState(null);
  const [cpersonPhoto, setCPersonPhoto] = useState(null);
  const [cbankProofFile, setCBankProofFile] = useState(null);

  const [sameAsCorrespondence, setSameAsCorrespondence] = useState(false);

  // Add state variables for pincode errors
  const [coPincodeError, setCoPincodeError] = useState("");
  const [pPincodeError, setPPincodeError] = useState("");

  const [tnc, setTnc] = useState(false);
  const [tncLocked, setTncLocked] = useState(false);

  const [showTerms, setShowTerms] = useState(false);

  // Add pincode-state mapping
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
    { state: "West Bengal", start: 700001, end: 743999 }
  ];

  // Add validation helper function
  const validatePincode = (pincode, state, setError) => {
    if (pincode.length === 6 && state) {
      const stateInfo = pincodeStateMap.find(
        (s) => s.state.toLowerCase() === state.toLowerCase()
      );
      if (stateInfo) {
        const pinNum = parseInt(pincode, 10);
        if (pinNum < stateInfo.start || pinNum > stateInfo.end) {
          setError(`Pincode not valid for ${state}`);
        } else {
          setError("");
        }
      }
    } else {
      setError("");
    }
  };

  /* ========================================
     FETCH EMPLOYEE PROFILE ON MOUNT
  ======================================== */
  useEffect(() => {
    fetchEmployeeProfile();
  }, []);

  // ✅ NEW: Fetch documents after profile loads
  useEffect(() => {
    if (!loading) {
      fetchEmployeeDocuments();
    }
  }, [loading]);

  const fetchEmployeeProfile = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      if (!token) {
        toast.error("Please login again.", { theme: "dark" });
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_URL}/employee/profile`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const responseData = await response.json();

      if (response.ok && responseData) {
        const data = responseData.employee || responseData;

        // Set READ-ONLY fields
        setName(data.name || "");
        setEmail(data.email || "");
        setPhone(data.phone || data.contactNo || "");
        setWorkerType(data.employeeType || "Permanent");

        // CONTRACTUAL EMPLOYEE MAPPING
        if (data.employeeType === "Contractual") {
          if (data.dob) setCDob(data.dob.split("T")[0]);
          if (data.aadhaarNumber) setCAadhaar(data.aadhaarNumber);
          if (data.panNumber) setCPan(data.panNumber);
          if (data.contractLength) setCContractLength(data.contractLength);

          // Backend has correspondenceAddress, NOT address
          if (data.correspondenceAddress) {
            setCoAddress1(data.correspondenceAddress.addressLine1 || "");
            setCoAddress2(data.correspondenceAddress.addressLine2 || "");
            setCoState(data.correspondenceAddress.state || "");
            setCoCity(data.correspondenceAddress.city || "");
            setCoPincode(data.correspondenceAddress.pincode || "");
          }

          // Bank details
          if (data.bankDetails) {
            setCBankName(data.bankDetails.bankName || "");
            setCBankAccount(data.bankDetails.accountNumber || "");
            setCIfsc(data.bankDetails.IFSC || data.bankDetails.ifsc || "");
            setCBranchName(data.bankDetails.branchName || "");
          }
        }

        // PERMANENT EMPLOYEE MAPPING
        if (data.employeeType === "Permanent") {
          if (data.dob) setPDob(data.dob.split("T")[0]);
          if (data.gender) setPGender(data.gender);
          if (data.alternatePhone) setPAlternatePhone(data.alternatePhone);
          if (data.highestQualification) setPHighestQualification(data.highestQualification);
          if (data.maritalStatus) setPMaritalStatus(data.maritalStatus);

          // Addresses
          if (data.correspondenceAddress) {
            setCoAddress1(data.correspondenceAddress.addressLine1 || "");
            setCoAddress2(data.correspondenceAddress.addressLine2 || "");
            setCoState(data.correspondenceAddress.state || "");
            setCoCity(data.correspondenceAddress.city || "");
            setCoPincode(data.correspondenceAddress.pincode || "");
          }

          if (data.permanentAddress) {
            setPAddress1(data.permanentAddress.addressLine1 || "");
            setPAddress2(data.permanentAddress.addressLine2 || "");
            setPState(data.permanentAddress.state || "");
            setPCity(data.permanentAddress.city || "");
            setPPincode(data.permanentAddress.pincode || "");
          }

          // Family
          if (data.fathersName) setPFathersName(data.fathersName);
          if (data.fatherDob) setPFatherDob(data.fatherDob.split("T")[0]);
          if (data.motherName) setPMotherName(data.motherName);
          if (data.motherDob) setPMotherDob(data.motherDob.split("T")[0]);
          if (data.spouseName) setPSpouseName(data.spouseName);
          if (data.spouseDob) setPSpouseDob(data.spouseDob.split("T")[0]);
          if (data.child1Name) setPChild1Name(data.child1Name);
          if (data.child1Dob) setPChild1Dob(data.child1Dob.split("T")[0]);
          if (data.child2Name) setPChild2Name(data.child2Name);
          if (data.child2Dob) setPChild2Dob(data.child2Dob.split("T")[0]);

          // Experiences
          if (Array.isArray(data.experiences) && data.experiences.length > 0) {
            setExperiences(
              data.experiences.map((exp) => ({
                organization: exp.organization || "",
                designation: exp.designation || "",
                from: exp.from ? exp.from.split("T")[0] : "",
                to: exp.to ? exp.to.split("T")[0] : "",
                currentlyWorking: exp.currentlyWorking ?? false,
              }))
            );
          }

          // IDs
          if (data.aadhaarNumber) setPAadhaar(data.aadhaarNumber);
          if (data.panNumber) setPPan(data.panNumber);
          if (data.uanNumber) setPUan(data.uanNumber);
          if (data.pfNumber) setPPf(data.pfNumber);
          if (data.esiNumber) setPEsi(data.esiNumber);
          if (data.esiDispensary) setPEsiDispensary(data.esiDispensary);

          // Bank
          if (data.bankDetails) {
            setPBankName(data.bankDetails.bankName || "");
            setPBankAccount(data.bankDetails.accountNumber || "");
            setPIfsc(data.bankDetails.IFSC || data.bankDetails.ifsc || "");
            setPBranchName(data.bankDetails.branchName || "");
          }
        }

        if (data.tnc) {
          setTnc(true);
          setTncLocked(true);
        }
      } else {
        throw new Error(responseData.message || "Failed to fetch profile");
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("Failed to load profile. Please try again.", { theme: "dark" });
    } finally {
      setLoading(false);
    }
  };

  /* ========================================
     ✅ NEW: FETCH EMPLOYEE DOCUMENTS
  ======================================== */
  const fetchEmployeeDocuments = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        console.error("No token found");
        return;
      }

      // Step 1: Check which documents exist
      const statusResponse = await fetch(
        `${API_URL}/employee/employee/documents/status`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!statusResponse.ok) {
        throw new Error("Failed to fetch document status");
      }

      const status = await statusResponse.json();
      setDocumentStatus(status);

      // Step 2: Fetch images that exist
      const imageTypes = [
        "personPhoto",
        "aadhaarFront",
        "aadhaarBack",
        "panCard",
        "familyPhoto",
        "bankProof",
        "esiForm",
        "pfForm",
        "employmentForm",
        "cv",
      ];

      const urls = {};

      for (const type of imageTypes) {
        const hasKey = `has${type.charAt(0).toUpperCase() + type.slice(1)}`;

        if (status[hasKey]) {
          try {
            // MODIFIED: Fetch Cloudinary URL from backend
            const imageResponse = await fetch(`${API_URL}/employee/employee/document/${type}`, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });

            if (imageResponse.ok) {
              const data = await imageResponse.json();

              // NEW: Store Cloudinary URL directly (not blob URL)
              if (data.url || data.secure_url) {
                urls[type] = data.secure_url || data.url;
              }
            }
          } catch (err) {
            console.error(`Error fetching ${type}:`, err);
          }
        }
      }

      setImageUrls(urls);
    } catch (error) {
      console.error("Error fetching employee documents:", error);
      toast.error("Failed to load some documents", { theme: "dark" });
    }
  };

  /* ========================================
     HANDLE CHECKBOX CHANGE
  ======================================== */
  const handleCheckboxChange = (e) => {
    const checked = e.target.checked;
    setSameAsCorrespondence(checked);
    if (checked) {
      setPAddress1(coaddress1);
      setPAddress2(coaddress2);
      setPState(costate);
      setPCity(cocity);
      setPPincode(copincode);
    }
    // Don't clear when unchecking - let user manually edit
  };

  // Add useEffect to auto-uncheck when addresses don't match
  useEffect(() => {
    if (sameAsCorrespondence) {
      // Check if any permanent address field differs from correspondence
      const addressesMatch =
        paddress1 === coaddress1 &&
        paddress2 === coaddress2 &&
        pstate === costate &&
        pcity === cocity &&
        ppincode === copincode;

      if (!addressesMatch) {
        setSameAsCorrespondence(false);
      }
    }
  }, [paddress1, paddress2, pstate, pcity, ppincode, coaddress1, coaddress2, costate, cocity, copincode, sameAsCorrespondence]);

  /* ========================================
     EXPERIENCE HANDLERS
  ======================================== */
  const addExperience = () => {
    setExperiences([
      ...experiences,
      { organization: "", designation: "", from: "", to: "", currentlyWorking: false },
    ]);
  };

  const removeExperience = (index) => {
    setExperiences((s) => {
      if (s.length === 1) return s;
      const copy = [...s];
      copy.splice(index, 1);
      return copy;
    });
  };

  const updateExperience = (index, field, value) => {
    const copy = [...experiences];
    copy[index] = { ...copy[index], [field]: value };
    setExperiences(copy);
  };

  /* ========================================
     HANDLE SUBMIT
  ======================================== */
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (workerType === "Permanent") {
      if (!pgender || !pdob || !paadhaar) {
        alert("Please fill all required fields");
        return;
      }
      if (!pfathersName || !pmotherName) {
        alert("Please enter both parents' names");
        return;
      }
      if (!pfatherDob || !pmotherDob) {
        alert("Please enter both parents' date of birth");
        return;
      }
      if (paadhaar.length !== 12) {
        alert("Aadhaar must be 12 digits");
        return;
      }
      if (!ppan || ppan.length !== 10) {
        alert("PAN must be 10 characters");
        return;
      }
      if (!pifsc || pifsc.length !== 11) {
        alert("IFSC must be 11 characters");
        return;
      }

      // FIX: Check for both new files AND existing images
      if (
        (!paadhaarFile1 && !imageUrls.aadhaarFront) ||
        (!paadhaarFile2 && !imageUrls.aadhaarBack) ||
        (!ppanFile && !imageUrls.panCard) ||
        (!ppersonPhoto && !imageUrls.personPhoto) ||
        (!pbankProofFile && !imageUrls.bankProof)
      ) {
        alert("Please upload all required files");
        return;
      }
    } else {
      // Contractual validation
      if (!cdob || !caadhaar) {
        alert("Please fill all required fields");
        return;
      }
      if (!coaddress1 || !costate || !cocity || !copincode) {
        alert("Please fill all address fields");
        console.log("Missing address fields:", {
          coaddress1,
          costate,
          cocity,
          copincode,
        });
        return;
      }
      if (caadhaar.length !== 12) {
        alert("Aadhaar must be 12 digits");
        return;
      }
      if (!cifsc || cifsc.length !== 11) {
        alert("IFSC must be 11 characters");
        return;
      }

      // FIX: Check for both new files AND existing images
      if (
        (!caadhaarFile1 && !imageUrls.aadhaarFront) ||
        (!caadhaarFile2 && !imageUrls.aadhaarBack) ||
        (!cpersonPhoto && !imageUrls.personPhoto) ||
        (!cbankProofFile && !imageUrls.bankProof)
      ) {
        alert("Please upload all required files");
        return;
      }
    }

    // MOVE THESE OUTSIDE - APPLY TO BOTH TYPES
    if (coPincodeError || pPincodeError) {
      alert("Please fix pincode errors before submitting.");
      return;
    }

    if (!tnc) {
      alert("Please accept Terms & Conditions");
      return;
    }

    setSubmitting(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Please login again");
        return;
      }

      const formData = new FormData();

      // Basic fields
      if (workerType === "Permanent") {
        formData.append("gender", pgender);
        formData.append("dob", pdob);
        if (palternatePhone) formData.append("alternatePhone", palternatePhone);
        formData.append("aadhaarNumber", paadhaar);
        formData.append("highestQualification", phighestQualification);
        formData.append("maritalStatus", pmaritalStatus);
        formData.append("panNumber", ppan);

        // Address (using dot notation for backend to handle)
        formData.append("correspondenceAddress.addressLine1", coaddress1);
        if (coaddress2) formData.append("correspondenceAddress.addressLine2", coaddress2);
        formData.append("correspondenceAddress.state", costate);
        formData.append("correspondenceAddress.city", cocity);
        formData.append("correspondenceAddress.pincode", copincode);

        formData.append("permanentAddress.addressLine1", paddress1);
        if (paddress2) formData.append("permanentAddress.addressLine2", paddress2);
        formData.append("permanentAddress.state", pstate);
        formData.append("permanentAddress.city", pcity);
        formData.append("permanentAddress.pincode", ppincode);

        // Family
        formData.append("fathersName", pfathersName);
        formData.append("fatherDob", pfatherDob);
        formData.append("motherName", pmotherName);
        formData.append("motherDob", pmotherDob);
        if (pspouseName) formData.append("spouseName", pspouseName);
        if (pspouseDob) formData.append("spouseDob", pspouseDob);
        if (pchild1Name) formData.append("child1Name", pchild1Name);
        if (pchild1Dob) formData.append("child1Dob", pchild1Dob);
        if (pchild2Name) formData.append("child2Name", pchild2Name);
        if (pchild2Dob) formData.append("child2Dob", pchild2Dob);

        // IDs
        formData.append("uanNumber", puan);
        formData.append("pfNumber", ppf);
        formData.append("esiNumber", pesi);
        if (pesiDispensary) formData.append("esiDispensary", pesiDispensary);

        // Bank
        formData.append("bankDetails.bankName", pbankName);
        formData.append("bankDetails.accountNumber", pbankAccount);
        formData.append("bankDetails.ifsc", pifsc);
        formData.append("bankDetails.branchName", pbranchName);

        // Experience
        formData.append("experiences", JSON.stringify(experiences));

        // Files
        if (ppersonPhoto?.raw) formData.append("personPhoto", ppersonPhoto.raw);
        if (paadhaarFile1?.raw) formData.append("aadhaarFront", paadhaarFile1.raw);
        if (paadhaarFile2?.raw) formData.append("aadhaarBack", paadhaarFile2.raw);
        if (ppanFile?.raw) formData.append("panCard", ppanFile.raw);
        if (pbankProofFile?.raw) formData.append("bankProof", pbankProofFile.raw);
        if (pfamilyPhoto?.raw) formData.append("familyPhoto", pfamilyPhoto.raw);
        if (ppfForm?.raw) formData.append("pfForm", ppfForm.raw);
        if (pesiForm?.raw) formData.append("esiForm", pesiForm.raw);
        if (pemploymentForm?.raw) formData.append("employmentForm", pemploymentForm.raw);
        if (pcv?.raw) formData.append("cv", pcv.raw);
      } else {
        // Contractual
        formData.append("dob", cdob);
        formData.append("aadhaarNumber", caadhaar);
        if (cpan) formData.append("panNumber", cpan);
        formData.append("contractLength", ccontractLength);

        // ✅ FIX: Use correspondenceAddress (backend expects this)
        formData.append("correspondenceAddress.addressLine1", coaddress1);
        if (coaddress2) formData.append("correspondenceAddress.addressLine2", coaddress2);
        formData.append("correspondenceAddress.state", costate);
        formData.append("correspondenceAddress.city", cocity);
        formData.append("correspondenceAddress.pincode", copincode);

        // Bank
        formData.append("bankDetails.bankName", cbankName);
        formData.append("bankDetails.accountNumber", cbankAccount);
        formData.append("bankDetails.ifsc", cifsc);
        formData.append("bankDetails.branchName", cbranchName);

        // Files
        if (cpersonPhoto?.raw) formData.append("personPhoto", cpersonPhoto.raw);
        if (caadhaarFile1?.raw) formData.append("aadhaarFront", caadhaarFile1.raw);
        if (caadhaarFile2?.raw) formData.append("aadhaarBack", caadhaarFile2.raw);
        if (cpanFile?.raw) formData.append("panCard", cpanFile.raw);
        if (cbankProofFile?.raw) formData.append("bankProof", cbankProofFile.raw);
      }

      formData.append("tnc", tnc);

      const response = await fetch(`${API_URL}/employee/employee/profile`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const responseData = await response.json();

      if (response.ok) {
        toast.success("Profile updated successfully!", {
          theme: "dark",
          autoClose: 3000
        });
        fetchEmployeeDocuments();
      } else {
        throw new Error(responseData.message || "Failed to update profile");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error(error.message || "Failed to update profile. Please try again.", {
        theme: "dark"
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E4002B] mx-auto mb-4"></div>
          <p className="text-gray-700 font-medium">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#171717] px-4 pt-8 pb-10">
      <ToastContainer />
      <div className="max-w-4xl mx-auto bg-[#EDEDED] shadow rounded-lg p-6">
        <h2 className="text-2xl font-semibold mb-2 text-center text-[#E4002B]">Update Your Profile</h2>
        <p className="text-center text-gray-600 mb-6">{workerType} Employee</p>

        {/* Read-only basic info */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border-l-4 border-[#E4002B]">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Basic Information (from Admin)</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
            <div>
              <span className="text-gray-600">Name: </span>
              <span className="font-semibold">{name}</span>
            </div>
            <div>
              <span className="text-gray-600">Email: </span>
              <span className="font-semibold">{email}</span>
            </div>
            <div>
              <span className="text-gray-600">Phone: </span>
              <span className="font-semibold">{phone}</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {workerType === "Permanent" ? (
            <>
              {/* Personal Details */}
              <section className="space-y-4">
                <h3 className="text-lg font-medium text-[#E4002B]">Personal Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">
                      Gender <span className="text-red-500">*</span>
                    </label>
                    <Select
                      value={pgender ? { value: pgender, label: pgender } : null}
                      onChange={(option) => setPGender(option?.value || "")}
                      options={["Male", "Female", "Other"].map(opt => ({ value: opt, label: opt }))}
                      styles={customSelectStyles}
                      placeholder="Select gender"
                      isClearable
                      isSearchable
                    />
                  </div>
                  <IconInput
                    icon={FaCalendarAlt}
                    label={
                      <>
                        Date of Birth <span className="text-red-500">*</span>
                      </>
                    }
                    type="date"
                    value={pdob}
                    onChange={(e) => setPDob(e.target.value)}
                    required
                  />
                  <IconInput
                    icon={FaSortNumericDownAlt}
                    label={
                      <>
                        Highest Qualification <span className="text-red-500">*</span>
                      </>
                    }
                    placeholder="e.g., MBA, B.Tech"
                    value={phighestQualification}
                    onChange={(e) => setPHighestQualification(e.target.value)}
                    required
                  />
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">
                      Marital Status <span className="text-red-500">*</span>
                    </label>
                    <Select
                      value={pmaritalStatus ? { value: pmaritalStatus, label: pmaritalStatus } : null}
                      onChange={(option) => setPMaritalStatus(option?.value || "")}
                      options={["Unmarried", "Married"].map(opt => ({ value: opt, label: opt }))}
                      styles={customSelectStyles}
                      placeholder="Select"
                      isClearable
                      isSearchable
                    />
                  </div>
                  <IconInput
                    icon={FaPhoneAlt}
                    label="Alternate Phone Number"
                    placeholder="91 1234567890"
                    value={palternatePhone}
                    onChange={(e) => setPAlternatePhone(e.target.value.replace(/\D/g, ""))}
                    maxLength={10}
                  />
                </div>
              </section>

              {/* Address Details */}
              {/* Correspondence Address - PERMANENT EMPLOYEE */}
              <section className="space-y-4">
                <h3 className="text-lg font-medium text-[#E4002B]">Correspondence Address</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <IconInput
                    icon={FaFileAlt}
                    label={<>Address Line 1 <span className="text-red-500">*</span></>}
                    placeholder="House no, street, area"
                    value={coaddress1}
                    onChange={(e) => setCoAddress1(e.target.value)}
                    required
                  />
                  <IconInput
                    icon={FaFileAlt}
                    label="Address Line 2"
                    placeholder="Landmark, locality"
                    value={coaddress2}
                    onChange={(e) => setCoAddress2(e.target.value)}
                  />

                  {/* ✅ FIX: Change this from IconInput to SearchableSelect */}
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">
                      State <span className="text-red-500">*</span>
                    </label>
                    <Select
                      value={costate ? { value: costate, label: costate } : null}
                      onChange={(option) => {
                        const value = option?.value || "";
                        setCoState(value);
                        // Re-validate pincode when state changes
                        if (copincode.length === 6 && value) {
                          validatePincode(copincode, value, setCoPincodeError);
                        }
                      }}
                      options={states.map(state => ({ value: state, label: state }))}
                      styles={customSelectStyles}
                      placeholder="Select state"
                      isClearable
                      isSearchable
                    />
                  </div>

                  <IconInput
                    icon={FaBuilding}
                    label={<>City <span className="text-red-500">*</span></>}
                    placeholder="New Delhi"
                    value={cocity}
                    onChange={(e) => setCoCity(e.target.value)}
                    required
                  />

                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">
                      Pincode <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <FaSortNumericDownAlt className="absolute left-3 top-3.5 text-gray-400" />
                      <input
                        type="text"
                        value={copincode}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "");
                          setCoPincode(val);
                          validatePincode(val, costate, setCoPincodeError);
                        }}
                        placeholder="110001"
                        maxLength={6}
                        className={`w-full pl-10 pr-4 py-2.5 border rounded-sm outline-none focus:ring-1 text-sm bg-white hover:border-[#E4002B] transition-colors min-h-[42px] ${coPincodeError
                          ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                          : "border-gray-300 focus:ring-[#E4002B] focus:border-[#E4002B]"
                          }`}
                        required
                      />
                    </div>
                    {coPincodeError && (
                      <p className="text-red-500 text-xs mt-1">{coPincodeError}</p>
                    )}
                  </div>
                </div>

                {/* ✅ Checkbox */}
                <div className="flex items-center space-x-2 mt-4">
                  <input
                    type="checkbox"
                    id="sameAddress"
                    checked={sameAsCorrespondence}
                    onChange={handleCheckboxChange}
                    className="w-4 h-4 accent-[#E4002B] cursor-pointer"
                  />
                  <label htmlFor="sameAddress" className="text-sm text-gray-700 cursor-pointer">
                    Same as Correspondence Address
                  </label>
                </div>

                <h3 className="text-lg font-medium text-[#E4002B] pt-4">Permanent Address</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <IconInput
                    icon={FaFileAlt}
                    label={
                      <>
                        Address Line 1 <span className="text-red-500">*</span>
                      </>
                    }
                    placeholder="House no, street, area"
                    value={paddress1}
                    onChange={(e) => setPAddress1(e.target.value)}
                    required
                  />
                  <IconInput
                    icon={FaFileAlt}
                    label="Address Line 2"
                    placeholder="Landmark, locality"
                    value={paddress2}
                    onChange={(e) => setPAddress2(e.target.value)}
                  />
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">
                      State <span className="text-red-500">*</span>
                    </label>
                    <Select
                      value={pstate ? { value: pstate, label: pstate } : null}
                      onChange={(option) => {
                        const value = option?.value || "";
                        setPState(value);
                        if (ppincode.length === 6 && value) {
                          validatePincode(ppincode, value, setPPincodeError);
                        }
                      }}
                      options={states.map(state => ({ value: state, label: state }))}
                      styles={customSelectStyles}
                      placeholder="Select state"
                      isClearable
                      isSearchable
                    />
                  </div>
                  <IconInput
                    icon={FaBuilding}
                    label={
                      <>
                        City <span className="text-red-500">*</span>
                      </>
                    }
                    placeholder="New Delhi"
                    value={pcity}
                    onChange={(e) => setPCity(e.target.value)}
                    required
                  />
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">
                      Pincode <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <FaSortNumericDownAlt className="absolute left-3 top-3.5 text-gray-400" />
                      <input
                        type="text"
                        value={ppincode}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "");
                          setPPincode(val);
                          validatePincode(val, pstate, setPPincodeError);
                        }}
                        placeholder="110001"
                        maxLength={6}
                        className={`w-full pl-10 pr-4 py-2.5 border rounded-sm outline-none focus:ring-1 text-sm bg-white hover:border-[#E4002B] transition-colors min-h-[42px] ${pPincodeError
                            ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                            : "border-gray-300 focus:ring-[#E4002B] focus:border-[#E4002B]"
                          }`}
                        required
                      />
                    </div>
                    {pPincodeError && (
                      <p className="text-red-500 text-xs mt-1">{pPincodeError}</p>
                    )}
                  </div>
                </div>
              </section>

              {/* Family Background */}
              <section className="space-y-4">
                <h3 className="text-lg font-medium text-[#E4002B]">Family Background</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <IconInput
                    icon={FaUser}
                    label={
                      <>
                        Father's Name <span className="text-red-500">*</span>
                      </>
                    }
                    placeholder="Enter father's name"
                    value={pfathersName}
                    onChange={(e) => setPFathersName(e.target.value)}
                    required
                  />
                  <IconInput
                    icon={FaCalendarAlt}
                    label={
                      <>
                        Father's DOB <span className="text-red-500">*</span>
                      </>
                    }
                    type="date"
                    value={pfatherDob}
                    onChange={(e) => setPFatherDob(e.target.value)}
                    required
                  />
                  <IconInput
                    icon={FaUser}
                    label={
                      <>
                        Mother's Name <span className="text-red-500">*</span>
                      </>
                    }
                    placeholder="Enter mother's name"
                    value={pmotherName}
                    onChange={(e) => setPMotherName(e.target.value)}
                    required
                  />
                  <IconInput
                    icon={FaCalendarAlt}
                    label={
                      <>
                        Mother's DOB <span className="text-red-500">*</span>
                      </>
                    }
                    type="date"
                    value={pmotherDob}
                    onChange={(e) => setPMotherDob(e.target.value)}
                    required
                  />
                  <IconInput
                    icon={FaUser}
                    label="Spouse Name (if applicable)"
                    placeholder="Enter spouse's name"
                    value={pspouseName}
                    onChange={(e) => setPSpouseName(e.target.value)}
                  />
                  <IconInput
                    icon={FaCalendarAlt}
                    label="Spouse DOB"
                    type="date"
                    value={pspouseDob}
                    onChange={(e) => setPSpouseDob(e.target.value)}
                  />
                  <IconInput
                    icon={FaUser}
                    label="Child 1 Name"
                    placeholder="Enter child 1's name"
                    value={pchild1Name}
                    onChange={(e) => setPChild1Name(e.target.value)}
                  />
                  <IconInput
                    icon={FaCalendarAlt}
                    label="Child 1 DOB"
                    type="date"
                    value={pchild1Dob}
                    onChange={(e) => setPChild1Dob(e.target.value)}
                  />
                  <IconInput
                    icon={FaUser}
                    label="Child 2 Name"
                    placeholder="Enter child 2's name"
                    value={pchild2Name}
                    onChange={(e) => setPChild2Name(e.target.value)}
                  />
                  <IconInput
                    icon={FaCalendarAlt}
                    label="Child 2 DOB"
                    type="date"
                    value={pchild2Dob}
                    onChange={(e) => setPChild2Dob(e.target.value)}
                  />
                </div>
              </section>

              {/* Identification */}
              <section className="space-y-4">
                <h3 className="text-lg font-medium text-[#E4002B]">Identification Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <IconInput
                    icon={FaIdCard}
                    label={
                      <>
                        Aadhaar Number <span className="text-red-500">*</span>
                      </>
                    }
                    placeholder="1234 5678 9012"
                    value={paadhaar}
                    onChange={(e) => setPAadhaar(e.target.value.replace(/\D/g, ""))}
                    maxLength={12}
                    required
                  />
                  <IconInput
                    icon={FaIdCard}
                    label={
                      <>
                        PAN Number <span className="text-red-500">*</span>
                      </>
                    }
                    placeholder="ABCDE1234F"
                    value={ppan}
                    onChange={(e) => setPPan(e.target.value.toUpperCase())}
                    maxLength={10}
                    required
                  />
                  <IconInput
                    icon={FaSortNumericDownAlt}
                    label={
                      <>
                        UAN Number <span className="text-red-500">*</span>
                      </>
                    }
                    placeholder="UAN"
                    value={puan}
                    onChange={(e) => setPUan(e.target.value)}
                    required
                  />
                  <IconInput
                    icon={FaSortNumericDownAlt}
                    label={
                      <>
                        PF Number <span className="text-red-500">*</span>
                      </>
                    }
                    placeholder="PF"
                    value={ppf}
                    onChange={(e) => setPPf(e.target.value)}
                    required
                  />
                  <IconInput
                    icon={FaSortNumericDownAlt}
                    label={
                      <>
                        ESI Number <span className="text-red-500">*</span>
                      </>
                    }
                    placeholder="ESI"
                    value={pesi}
                    onChange={(e) => setPEsi(e.target.value)}
                    required
                  />
                  <IconInput
                    icon={FaBuilding}
                    label="ESI Dispensary Location"
                    placeholder="Enter location"
                    value={pesiDispensary}
                    onChange={(e) => setPEsiDispensary(e.target.value)}
                  />
                </div>
              </section>

              {/* Bank Details */}
              <section className="space-y-4">
                <h3 className="text-lg font-medium text-[#E4002B]">Bank Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <IconInput
                    icon={FaUniversity}
                    label={
                      <>
                        Bank Name <span className="text-red-500">*</span>
                      </>
                    }
                    placeholder="Bank name"
                    value={pbankName}
                    onChange={(e) => setPBankName(e.target.value)}
                    required
                  />
                  <IconInput
                    icon={FaUniversity}
                    label={
                      <>
                        Branch Name <span className="text-red-500">*</span>
                      </>
                    }
                    placeholder="Branch name"
                    value={pbranchName}
                    onChange={(e) => setPBranchName(e.target.value)}
                    required
                  />
                  <IconInput
                    icon={FaSortNumericDownAlt}
                    label={
                      <>
                        Account Number <span className="text-red-500">*</span>
                      </>
                    }
                    placeholder="123456789012"
                    value={pbankAccount}
                    onChange={(e) => setPBankAccount(e.target.value.replace(/\D/g, ""))}
                    required
                  />
                  <IconInput
                    icon={FaSortNumericDownAlt}
                    label={
                      <>
                        IFSC Code <span className="text-red-500">*</span>
                      </>
                    }
                    placeholder="HDFC0001234"
                    value={pifsc}
                    onChange={(e) => setPIfsc(e.target.value.toUpperCase())}
                    maxLength={11}
                    required
                  />
                </div>
              </section>

              {/* Prior Work Experience */}
              <section className="space-y-4">
                <h3 className="text-lg font-medium text-[#E4002B]">Prior Work Experience</h3>
                {experiences.map((exp, idx) => (
                  <div key={idx} className="border border-gray-200 rounded-lg p-4 relative">
                    <div className="absolute right-3 top-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => removeExperience(idx)}
                        className="text-sm text-red-500 hover:underline flex items-center gap-1 cursor-pointer"
                        title="Remove experience"
                      >
                        <FaTrash /> Remove
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <IconInput
                        icon={FaBuilding}
                        label={
                          <>
                            Name of Organization <span className="text-red-500">*</span>
                          </>
                        }
                        placeholder="Organization"
                        value={exp.organization}
                        onChange={(e) => updateExperience(idx, "organization", e.target.value)}
                        required
                      />
                      <IconInput
                        icon={FaUser}
                        label={
                          <>
                            Designation <span className="text-red-500">*</span>
                          </>
                        }
                        placeholder="Designation"
                        value={exp.designation}
                        onChange={(e) => updateExperience(idx, "designation", e.target.value)}
                        required
                      />
                      <IconInput
                        icon={FaCalendarAlt}
                        label={
                          <>
                            From <span className="text-red-500">*</span>
                          </>
                        }
                        type="date"
                        value={exp.from}
                        onChange={(e) => updateExperience(idx, "from", e.target.value)}
                        required
                      />
                      <IconInput
                        icon={FaCalendarAlt}
                        label={
                          <>
                            To <span className="text-red-500">*</span>
                          </>
                        }
                        type="date"
                        value={exp.to}
                        onChange={(e) => updateExperience(idx, "to", e.target.value)}
                        disabled={exp.currentlyWorking}
                        required
                      />
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      <input
                        type="checkbox"
                        id={`currentlyWorking-${idx}`}
                        checked={exp.currentlyWorking || false}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setExperiences((prev) =>
                            prev.map((exp, i) =>
                              i === idx ? { ...exp, currentlyWorking: checked, to: checked ? "" : exp.to } : exp
                            )
                          );
                        }}
                        className="w-4 h-4 accent-[#E4002B] cursor-pointer"
                      />
                      <label htmlFor={`currentlyWorking-${idx}`} className="text-sm text-gray-700 cursor-pointer">
                        Currently Working Here
                      </label>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addExperience}
                  className="inline-flex items-center gap-2 text-[#E4002B] hover:underline cursor-pointer"
                >
                  <FaPlus /> Add Another Experience
                </button>
              </section>

              {/* ✅ File Uploads - WITH EXISTING IMAGE SUPPORT */}
              <section className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-[#E4002B]">File Uploads</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    <span className="text-red-500">*</span> Accepted formats: PNG, JPG, JPEG, PDF (less than 1 MB)
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FileInput
                    label="Your Photo"
                    accept="image/*"
                    file={ppersonPhoto}
                    setFile={setPPersonPhoto}
                    required
                    existingImageUrl={imageUrls.personPhoto}
                  />
                  <FileInput
                    label="Aadhaar (front)"
                    accept="image/*,.pdf"
                    file={paadhaarFile1}
                    setFile={setPAadhaarFile1}
                    required
                    existingImageUrl={imageUrls.aadhaarFront}
                  />
                  <FileInput
                    label="Aadhaar (back)"
                    accept="image/*,.pdf"
                    file={paadhaarFile2}
                    setFile={setPAadhaarFile2}
                    required
                    existingImageUrl={imageUrls.aadhaarBack}
                  />
                  <FileInput
                    label="PAN Card"
                    accept="image/*,.pdf"
                    file={ppanFile}
                    setFile={setPPanFile}
                    required
                    existingImageUrl={imageUrls.panCard}
                  />
                  <FileInput
                    label="Bank Proof"
                    accept="image/*,.pdf"
                    file={pbankProofFile}
                    setFile={setPBankProofFile}
                    required
                    existingImageUrl={imageUrls.bankProof}
                  />
                  <FileInput
                    label="Family Photo"
                    accept="image/*"
                    file={pfamilyPhoto}
                    setFile={setPFamilyPhoto}
                    existingImageUrl={imageUrls.familyPhoto}
                  />
                  <FileInput
                    label="PF Form"
                    accept="image/*,.pdf"
                    file={ppfForm}
                    setFile={setPPfForm}
                    required
                    existingImageUrl={imageUrls.pfForm}
                  />
                  <FileInput
                    label="ESI Form"
                    accept="image/*,.pdf"
                    file={pesiForm}
                    setFile={setPEsiForm}
                    required
                    existingImageUrl={imageUrls.esiForm}
                  />
                  <FileInput
                    label="Employment Form"
                    accept="image/*,.pdf"
                    file={pemploymentForm}
                    setFile={setPEmploymentForm}
                    existingImageUrl={imageUrls.employmentForm}
                  />
                  <FileInput
                    label="Copy of CV"
                    accept="image/*,.pdf"
                    file={pcv}
                    setFile={setPCv}
                    existingImageUrl={imageUrls.cv}
                  />
                </div>
              </section>
            </>
          ) : (
            <>
              {/* Contractual Personal Details */}
              <section className="space-y-4">
                <h3 className="text-lg font-medium text-[#E4002B]">Personal Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <IconInput
                    icon={FaCalendarAlt}
                    label={
                      <>
                        Date of Birth <span className="text-red-500">*</span>
                      </>
                    }
                    type="date"
                    value={cdob}
                    onChange={(e) => setCDob(e.target.value)}
                    required
                  />
                  <IconInput
                    icon={FaSortNumericDownAlt}
                    label={
                      <>
                        Contract Length <span className="text-red-500">*</span>
                      </>
                    }
                    placeholder="e.g., 6 months"
                    value={ccontractLength}
                    onChange={(e) => setCContractLength(e.target.value)}
                    required
                  />
                </div>
              </section>

              {/* Contractual - Address Details */}
              <section className="space-y-4">
                <h3 className="text-lg font-medium text-[#E4002B]">Address Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <IconInput
                    icon={FaFileAlt}
                    label={<>Address Line 1 <span className="text-red-500">*</span></>}
                    placeholder="House no, street, area"
                    value={coaddress1}
                    onChange={(e) => setCoAddress1(e.target.value)}
                    required
                  />
                  <IconInput
                    icon={FaFileAlt}
                    label="Address Line 2"
                    placeholder="Landmark, locality"
                    value={coaddress2}
                    onChange={(e) => setCoAddress2(e.target.value)}
                  />

                  {/* ✅ FIX: Replace IconInput with SearchableSelect */}
                  <SearchableSelect
                    label={<>State <span className="text-red-500">*</span></>}
                    placeholder="Select state"
                    options={states}
                    value={costate}
                    onChange={(value) => {
                      setCoState(value);
                      // Re-validate pincode when state changes
                      if (copincode.length === 6 && value) {
                        validatePincode(copincode, value, setCoPincodeError);
                      }
                    }}
                  />

                  <IconInput
                    icon={FaBuilding}
                    label={<>City <span className="text-red-500">*</span></>}
                    placeholder="New Delhi"
                    value={cocity}
                    onChange={(e) => setCoCity(e.target.value)}
                    required
                  />

                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">
                      Pincode <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <FaSortNumericDownAlt className="absolute left-3 top-3 text-gray-400" />
                      <input
                        type="text"
                        value={copincode}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "");
                          setCoPincode(val);
                          validatePincode(val, costate, setCoPincodeError);
                        }}
                        placeholder="110001"
                        maxLength={6}
                        className={`w-full pl-10 pr-4 py-2 border rounded-lg outline-none focus:ring-2 text-sm ${coPincodeError
                          ? "border-red-500 focus:ring-red-500"
                          : "border-gray-300 focus:ring-[#E4002B]"
                          }`}
                        required
                      />
                    </div>
                    {coPincodeError && (
                      <p className="text-red-500 text-xs mt-1">{coPincodeError}</p>
                    )}
                  </div>
                </div>
              </section>

              {/* Identification */}
              <section className="space-y-4">
                <h3 className="text-lg font-medium text-[#E4002B]">Identification Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <IconInput
                    icon={FaIdCard}
                    label={
                      <>
                        Aadhaar Number <span className="text-red-500">*</span>
                      </>
                    }
                    placeholder="1234 5678 9012"
                    value={caadhaar}
                    onChange={(e) => setCAadhaar(e.target.value.replace(/\D/g, ""))}
                    maxLength={12}
                    required
                  />
                  <IconInput
                    icon={FaIdCard}
                    label="PAN Number"
                    placeholder="ABCDE1234F"
                    value={cpan}
                    onChange={(e) => setCPan(e.target.value.toUpperCase())}
                    maxLength={10}
                  />
                </div>
              </section>

              {/* Bank Details */}
              <section className="space-y-4">
                <h3 className="text-lg font-medium text-[#E4002B]">Bank Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <IconInput
                    icon={FaUniversity}
                    label={
                      <>
                        Bank Name <span className="text-red-500">*</span>
                      </>
                    }
                    placeholder="Bank name"
                    value={cbankName}
                    onChange={(e) => setCBankName(e.target.value)}
                    required
                  />
                  <IconInput
                    icon={FaSortNumericDownAlt}
                    label={
                      <>
                        Account Number <span className="text-red-500">*</span>
                      </>
                    }
                    placeholder="123456789012"
                    value={cbankAccount}
                    onChange={(e) => setCBankAccount(e.target.value.replace(/\D/g, ""))}
                    required
                  />
                  <IconInput
                    icon={FaSortNumericDownAlt}
                    label={
                      <>
                        IFSC Code <span className="text-red-500">*</span>
                      </>
                    }
                    placeholder="HDFC0001234"
                    value={cifsc}
                    onChange={(e) => setCIfsc(e.target.value.toUpperCase())}
                    maxLength={11}
                    required
                  />
                  <IconInput
                    icon={FaUniversity}
                    label={
                      <>
                        Branch Name <span className="text-red-500">*</span>
                      </>
                    }
                    placeholder="Branch name"
                    value={cbranchName}
                    onChange={(e) => setCBranchName(e.target.value)}
                    required
                  />
                </div>
              </section>

              {/* ✅ File Uploads - WITH EXISTING IMAGE SUPPORT */}
              <section className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-[#E4002B]">File Uploads</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    <span className="text-red-500">*</span> Accepted formats: PNG, JPG, JPEG, PDF (less than 1 MB)
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FileInput
                    label="Your Photo"
                    accept="image/*"
                    file={cpersonPhoto}
                    setFile={setCPersonPhoto}
                    required
                    existingImageUrl={imageUrls.personPhoto}
                  />
                  <FileInput
                    label="Aadhaar (front)"
                    accept="image/*,.pdf"
                    file={caadhaarFile1}
                    setFile={setCAadhaarFile1}
                    required
                    existingImageUrl={imageUrls.aadhaarFront}
                  />
                  <FileInput
                    label="Aadhaar (back)"
                    accept="image/*,.pdf"
                    file={caadhaarFile2}
                    setFile={setCAadhaarFile2}
                    required
                    existingImageUrl={imageUrls.aadhaarBack}
                  />
                  <FileInput
                    label="PAN Card"
                    accept="image/*,.pdf"
                    file={cpanFile}
                    setFile={setCPanFile}
                    existingImageUrl={imageUrls.panCard}
                  />
                  <FileInput
                    label="Bank Proof"
                    accept="image/*,.pdf"
                    file={cbankProofFile}
                    setFile={setCBankProofFile}
                    required
                    existingImageUrl={imageUrls.bankProof}
                  />
                </div>
              </section>
            </>
          )}

          {/* Terms & Conditions - ADD BEFORE SUBMIT BUTTON */}
          <div className="flex items-center gap-2 mt-4">
            <input
              type="checkbox"
              id="tncCheckbox"
              checked={tnc}
              onChange={(e) => {
                if (!tncLocked) {
                  const checked = e.target.checked;
                  setTnc(checked);
                  if (checked) {
                    setTncLocked(true); // Lock once checked
                  }
                }
              }}
              disabled={tncLocked}
              required
              className="h-4 w-4 cursor-pointer"
              style={{ accentColor: "#E4002B" }}
            />
            <label htmlFor="tncCheckbox" className="text-sm text-gray-700">
              I agree to the{" "}
              <button
                type="button"
                onClick={() => setShowTerms(true)}
                className="text-[#E4002B] font-medium hover:underline"
              >
                Terms & Conditions
              </button>
              <span className="text-red-500"> *</span>
              {tncLocked && (
                <span className="text-green-600 ml-2">✓ Accepted</span>
              )}
            </label>
          </div>

          <div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#E4002B] text-white py-3 rounded-lg font-medium hover:bg-[#C3002B] transition disabled:opacity-60 cursor-pointer"
            >
              {submitting ? "Updating..." : "Update Profile"}
            </button>
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
  );
};

export default Profile;

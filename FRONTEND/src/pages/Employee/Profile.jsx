"use client"

import { useState, useRef, useEffect } from "react"
import {
  FaEnvelope,
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
} from "react-icons/fa"
import { IoClose } from "react-icons/io5"

const API_URL = "https://supreme-419p.onrender.com/api/admin/employees"

const SearchableSelect = ({ label, placeholder, options, value, onChange }) => {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const ref = useRef(null)

  useEffect(() => {
    const onDocClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener("click", onDocClick)
    return () => document.removeEventListener("click", onDocClick)
  }, [])

  const filtered = options.filter((o) => o.toLowerCase().includes(search.trim().toLowerCase()))

  return (
    <div className="relative" ref={ref}>
      <label className="block text-sm font-medium mb-1 text-gray-700">{label}</label>
      <div className="w-full border border-gray-300 rounded-lg bg-white" onClick={() => setOpen(true)}>
        <div className="flex items-center px-3 py-2">
          <input
            className="flex-1 outline-none bg-transparent text-sm"
            placeholder={value || placeholder}
            value={open ? search : value || ""}
            onChange={(e) => {
              setSearch(e.target.value)
              if (!open) setOpen(true)
            }}
            onFocus={() => setOpen(true)}
          />
          {value && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onChange("")
                setSearch("")
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
                  onChange(opt)
                  setSearch("")
                  setOpen(false)
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
  )
}

const FileInput = ({ label, accept = "*", file, setFile, required = false }) => {
  const fileRef = useRef()

  useEffect(() => {
    return () => {
      if (file && file.preview) URL.revokeObjectURL(file.preview)
    }
  }, [file])

  function handleFileChange(e) {
    const f = e.target.files[0]
    if (!f) {
      setFile(null)
      return
    }
    const preview = f.type.startsWith("image/") ? URL.createObjectURL(f) : null
    setFile({ raw: f, preview, name: f.name })
  }

  return (
    <div>
      <label className="block text-sm font-medium mb-1 text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div
        className={`relative flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[#E4002B] transition bg-white`}
        onClick={() => fileRef.current?.click()}
      >
        {!file ? (
          <>
            <FaPlus className="text-2xl text-gray-400 mb-1" />
            <p className="text-sm text-gray-500">Click or drop file here</p>
            <input
              ref={fileRef}
              type="file"
              accept={accept}
              onChange={handleFileChange}
              className="hidden"
              required={required}
            />
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 px-2">
            {file.preview ? (
              <img
                src={file.preview || "/placeholder.svg"}
                alt="preview"
                className="w-24 h-16 object-cover rounded-md border"
              />
            ) : (
              <div className="flex items-center gap-2">
                <FaFileAlt className="text-gray-600" />
                <p className="text-sm text-gray-700">{file.name}</p>
              </div>
            )}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setFile(null)
                  if (fileRef.current) fileRef.current.value = ""
                }}
                className="flex items-center gap-1 text-red-500 text-xs hover:underline"
              >
                <FaTrash /> Remove
              </button>
            </div>
            <input ref={fileRef} type="file" accept={accept} onChange={handleFileChange} className="hidden" />
          </div>
        )}
      </div>
    </div>
  )
}

const IconInput = ({ icon: Icon, label, placeholder, type = "text", value, onChange, ...rest }) => (
  <div>
    <label className="block text-sm font-medium mb-1 text-gray-700">{label}</label>
    <div className="relative">
      {Icon && <Icon className="absolute left-3 top-3 text-gray-400" />}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#E4002B] text-sm`}
        {...rest}
      />
    </div>
  </div>
)

const Profile = () => {
  const [workerType, setWorkerType] = useState("")

  // Permanent form states
  const [p_name, setPName] = useState("")
  const [p_email, setPEmail] = useState("")
  const [p_dob, setPDob] = useState("")
  const [p_phone, setPPhone] = useState("")
  const [p_highestQualification, setPHighestQualification] = useState("")
  const [p_gender, setPGender] = useState("")
  const [p_maritalStatus, setPMaritalStatus] = useState("")
  const [co_address1, setCoAddress1] = useState("")
  const [co_address2, setCoAddress2] = useState("")
  const [co_state, setCoState] = useState("")
  const [co_city, setCoCity] = useState("")
  const [co_pincode, setCoPincode] = useState("")
  const [p_address1, setPAddress1] = useState("")
  const [p_address2, setPAddress2] = useState("")
  const [p_state, setPState] = useState("")
  const [p_city, setPCity] = useState("")
  const [p_pincode, setPPincode] = useState("")
  const [p_contactNumber, setPContactNumber] = useState("")
  const [p_alternatePhone, setPAlternatePhone] = useState("")
  const [p_aadhaar, setPAadhaar] = useState("")
  const [p_pan, setPPan] = useState("")
  const [p_uan, setPUan] = useState("")
  const [p_esi, setPEsi] = useState("")
  const [p_pf, setPPf] = useState("")
  const [p_esiDispensary, setPEsiDispensary] = useState("")
  const [p_bankAccount, setPBankAccount] = useState("")
  const [p_ifsc, setPIfsc] = useState("")
  const [p_branchName, setPBranchName] = useState("")
  const [p_bankName, setPBankName] = useState("")
  const [p_fathersName, setPFathersName] = useState("")
  const [p_fatherDob, setPFatherDob] = useState("")
  const [p_motherName, setPMotherName] = useState("")
  const [p_motherDob, setPMotherDob] = useState("")
  const [p_spouseName, setPSpouseName] = useState("")
  const [p_spouseDob, setPSpouseDob] = useState("")
  const [p_child1Name, setPChild1Name] = useState("")
  const [p_child1Dob, setPChild1Dob] = useState("")
  const [p_child2Name, setPChild2Name] = useState("")
  const [p_child2Dob, setPChild2Dob] = useState("")

  // Permanent files
  const [p_aadhaarFile1, setPAadhaarFile1] = useState(null)
  const [p_aadhaarFile2, setPAadhaarFile2] = useState(null)
  const [p_panFile, setPPanFile] = useState(null)
  const [p_personPhoto, setPPersonPhoto] = useState(null)
  const [p_bankProofFile, setPBankProofFile] = useState(null)
  const [p_familyPhoto, setPFamilyPhoto] = useState(null)
  const [p_pfForm, setPPfForm] = useState(null)
  const [p_esiForm, setPEsiForm] = useState(null)
  const [p_employmentForm, setPEmploymentForm] = useState(null)
  const [p_cv, setPCv] = useState(null)

  // Work experience array
  const [experiences, setExperiences] = useState([
    { organization: "", designation: "", from: "", to: "", period: "", responsibility: "" },
  ])

  // Contractual form states
  const [c_name, setCName] = useState("")
  const [c_dob, setCDob] = useState("")
  const [c_address1, setCAddress1] = useState("")
  const [c_address2, setCAddress2] = useState("")
  const [c_state, setCState] = useState("")
  const [c_city, setCCity] = useState("")
  const [c_pincode, setCPincode] = useState("")
  const [c_phone, setCPhone] = useState("")
  const [c_aadhaar, setCAadhaar] = useState("")
  const [c_pan, setCPan] = useState("")
  const [c_contractLength, setCContractLength] = useState("")
  const [c_bankAccount, setCBankAccount] = useState("")
  const [c_ifsc, setCIfsc] = useState("")
  const [c_branchName, setCBranchName] = useState("")
  const [c_bankName, setCBankName] = useState("")

  // Contractual files
  const [c_aadhaarFile1, setCAadhaarFile1] = useState(null)
  const [c_aadhaarFile2, setCAadhaarFile2] = useState(null)
  const [c_panFile, setCPanFile] = useState(null)
  const [c_personPhoto, setCPersonPhoto] = useState(null)
  const [c_bankProofFile, setCBankProofFile] = useState(null)

  // Submission states
  const [submitting, setSubmitting] = useState(false)
  const [sameAsCorrespondence, setSameAsCorrespondence] = useState(false)
  const [message, setMessage] = useState("")
  const [messageType, setMessageType] = useState("") // "success" or "error"

  const handleCheckboxChange = (e) => {
    const checked = e.target.checked
    setSameAsCorrespondence(checked)

    if (checked) {
      setPAddress1(co_address1)
      setPAddress2(co_address2)
      setPState(co_state)
      setPCity(co_city)
      setPPincode(co_pincode)
    } else {
      setPAddress1("")
      setPAddress2("")
      setPState("")
      setPCity("")
      setPPincode("")
    }
  }

  const addExperience = () => {
    setExperiences([
      ...experiences,
      {
        organization: "",
        designation: "",
        from: "",
        to: "",
        currentlyWorking: false,
      },
    ])
  }

  const removeExperience = (index) => {
    setExperiences((s) => {
      if (s.length === 1) return s
      const copy = [...s]
      copy.splice(index, 1)
      return copy
    })
  }

  const updateExperience = (index, field, value) => {
    setExperiences((s) => {
      const copy = [...s]
      copy[index] = { ...copy[index], [field]: value }
      return copy
    })
  }

  const buildAddress = (line1, line2, city, state, pincode) => {
    return [line1, line2, city, state, pincode].filter(Boolean).join(", ")
  }

  const validateAndBuildPayload = () => {
    if (!workerType) {
      alert("Please select worker type.")
      return null
    }

    if (workerType === "Permanent") {
      if (!p_name || !p_email || !p_phone) {
        alert("Please fill required personal fields for Permanent employee (Name, Email, Phone).")
        return null
      }
      if (!p_aadhaarFile1 || !p_panFile || !p_personPhoto) {
        alert("Please upload Aadhaar, PAN and Person Photo for Permanent employee.")
        return null
      }

      return {
        name: p_name,
        email: p_email,
        contactNo: p_phone,
        gender: p_gender,
        address: buildAddress(co_address1, co_address2, co_city, co_state, co_pincode),
        dob: p_dob,
        employeeType: "Permanent",
      }
    } else {
      if (!c_name || !c_phone) {
        alert("Please fill required fields for Contractual employee (Name, Phone).")
        return null
      }
      if (!c_aadhaarFile1 || !c_personPhoto) {
        alert("Please upload Aadhaar and Person Photo for Contractual employee.")
        return null
      }

      return {
        name: c_name,
        email: p_email || "",
        contactNo: c_phone,
        gender: "",
        address: buildAddress(c_address1, c_address2, c_city, c_state, c_pincode),
        dob: c_dob,
        employeeType: "Contractual",
      }
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const payload = validateAndBuildPayload()
    if (!payload) return

    setSubmitting(true)
    setMessage("")
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      const result = await response.json()

      if (response.ok) {
        setMessageType("success")
        setMessage(result.message || "Employee added successfully!")
        // Reset form after success
        setTimeout(() => {
          setWorkerType("")
          setPName("")
          setPEmail("")
          setPPhone("")
          setMessage("")
        }, 2000)
      } else {
        setMessageType("error")
        setMessage(result.message || "Failed to add employee")
      }
    } catch (err) {
      console.error("Submission error:", err)
      setMessageType("error")
      setMessage("Error submitting form. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  const handleClick = (e) => {
    e.preventDefault()
    setMessage("Link sent successfully!")
    setMessageType("success")
    setTimeout(() => setMessage(""), 3000)
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50 px-4 pt-8 pb-10">
        <div className="max-w-4xl mx-auto bg-white shadow rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-4 text-center text-[#E4002B]">Employee Registration</h2>

          {/* Worker Type selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-3 text-gray-700 text-center">Select Type of Worker</label>

            <div className="flex justify-center gap-4 flex-wrap">
              <button
                type="button"
                onClick={() => setWorkerType("Permanent")}
                className={`cursor-pointer w-44 md:w-52 border-2 rounded-xl p-4 flex flex-col items-center justify-center text-center transition-all duration-200 ${workerType === "Permanent"
                    ? "border-[#E4002B] bg-[#E4002B]/10 shadow"
                    : "border-gray-200 hover:border-[#E4002B] hover:bg-gray-50"
                  }`}
              >
                <span className={`font-semibold ${workerType === "Permanent" ? "text-[#E4002B]" : "text-gray-700"}`}>
                  Permanent
                </span>
                <span className="text-xs text-gray-500 mt-1">Full-time employee</span>
              </button>

              <button
                type="button"
                onClick={() => setWorkerType("Contractual")}
                className={`cursor-pointer w-44 md:w-52 border-2 rounded-xl p-4 flex flex-col items-center justify-center text-center transition-all duration-200 ${workerType === "Contractual"
                    ? "border-[#E4002B] bg-[#E4002B]/10 shadow"
                    : "border-gray-200 hover:border-[#E4002B] hover:bg-gray-50"
                  }`}
              >
                <span className={`font-semibold ${workerType === "Contractual" ? "text-[#E4002B]" : "text-gray-700"}`}>
                  Contractual
                </span>
                <span className="text-xs text-gray-500 mt-1">Fixed-term / temporary</span>
              </button>
            </div>
          </div>

          {message && (
            <div
              className={`mb-6 p-4 rounded-lg ${messageType === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}
            >
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {workerType === "Permanent" && (
              <>
                <section className="space-y-4">
                  <h3 className="text-lg font-medium text-[#E4002B]">Personal Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <IconInput
                      icon={FaUser}
                      label={
                        <>
                          Full Name (as per Aadhaar) <span className="text-red-500">*</span>
                        </>
                      }
                      placeholder="Enter your name"
                      value={p_name}
                      onChange={(e) => setPName(e.target.value)}
                      required
                    />
                    <IconInput
                      icon={FaEnvelope}
                      label={
                        <>
                          Email <span className="text-red-500">*</span>
                        </>
                      }
                      placeholder="example@gmail.com"
                      type="email"
                      value={p_email}
                      onChange={(e) => setPEmail(e.target.value)}
                      required
                    />

                    <IconInput
                      icon={FaPhoneAlt}
                      label={
                        <>
                          Phone Number <span className="text-red-500">*</span>
                        </>
                      }
                      placeholder="+91 1234567890"
                      value={p_phone}
                      onChange={(e) => setPPhone(e.target.value.replace(/\D/g, ""))}
                      maxLength={10}
                      required
                    />

                    <div className="flex items-center gap-3 mt-5">
                      <button
                        type="button"
                        onClick={handleClick}
                        className="bg-[#E4002B] hover:bg-red-700 text-white font-medium py-2 px-6 rounded-xl transition-all duration-200 shadow-md cursor-pointer"
                      >
                        Notify Employee
                      </button>
                    </div>

                    <IconInput
                      icon={FaSortNumericDownAlt}
                      label={
                        <>
                          Highest Qualification <span className="text-red-500">*</span>
                        </>
                      }
                      placeholder="e.g., MBA, B.Tech"
                      value={p_highestQualification}
                      onChange={(e) => setPHighestQualification(e.target.value)}
                      required
                    />

                    <SearchableSelect
                      label={
                        <>
                          Gender <span className="text-red-500">*</span>
                        </>
                      }
                      placeholder="Select gender"
                      options={["Male", "Female", "Other", "Prefer not to say"]}
                      value={p_gender}
                      onChange={setPGender}
                      required
                    />

                    <IconInput
                      icon={FaCalendarAlt}
                      label={
                        <>
                          Date of Birth <span className="text-red-500">*</span>
                        </>
                      }
                      placeholder=""
                      type="date"
                      value={p_dob}
                      onChange={(e) => setPDob(e.target.value)}
                      required
                    />

                    <SearchableSelect
                      label={
                        <>
                          Marital Status <span className="text-red-500">*</span>
                        </>
                      }
                      placeholder="Select"
                      options={["Unmarried", "Married"]}
                      value={p_maritalStatus}
                      onChange={setPMaritalStatus}
                      required
                    />
                    <IconInput
                      icon={FaPhoneAlt}
                      label="Alternate Phone Number"
                      placeholder="+91 1234567890"
                      value={p_alternatePhone}
                      onChange={(e) => setPAlternatePhone(e.target.value.replace(/\D/g, ""))}
                      maxLength={10}
                      required
                    />
                  </div>
                </section>
                <section className="space-y-4">
                  <h3 className="text-lg font-medium text-[#E4002B]">Address Details</h3>

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-[#E4002B]">Correspondence Address</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <IconInput
                        icon={FaFileAlt}
                        label={
                          <>
                            Address Line 1 <span className="text-red-500">*</span>
                          </>
                        }
                        placeholder="House no, street, area"
                        value={co_address1}
                        onChange={(e) => setCoAddress1(e.target.value)}
                        required
                      />

                      <IconInput
                        icon={FaFileAlt}
                        label="Address Line 2"
                        placeholder="Landmark, locality"
                        value={co_address2}
                        onChange={(e) => setCoAddress2(e.target.value)}
                      />

                      <IconInput
                        icon={FaBuilding}
                        label={
                          <>
                            State <span className="text-red-500">*</span>
                          </>
                        }
                        placeholder="Delhi"
                        value={co_state}
                        onChange={(e) => setCoState(e.target.value)}
                        required
                      />

                      <IconInput
                        icon={FaBuilding}
                        label={
                          <>
                            City <span className="text-red-500">*</span>
                          </>
                        }
                        placeholder="New Delhi"
                        value={co_city}
                        onChange={(e) => setCoCity(e.target.value)}
                        required
                      />

                      <IconInput
                        icon={FaSortNumericDownAlt}
                        label={
                          <>
                            Pincode <span className="text-red-500">*</span>
                          </>
                        }
                        placeholder="110001"
                        value={co_pincode}
                        onChange={(e) => setCoPincode(e.target.value.replace(/\D/g, ""))}
                        maxLength={6}
                        required
                      />
                    </div>
                  </div>

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

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-[#E4002B]">Permanent Address</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <IconInput
                        icon={FaFileAlt}
                        label={
                          <>
                            Address Line 1 <span className="text-red-500">*</span>
                          </>
                        }
                        placeholder="House no, street, area"
                        value={p_address1}
                        onChange={(e) => setPAddress1(e.target.value)}
                        required
                      />

                      <IconInput
                        icon={FaFileAlt}
                        label="Address Line 2"
                        placeholder="Landmark, locality"
                        value={p_address2}
                        onChange={(e) => setPAddress2(e.target.value)}
                      />

                      <IconInput
                        icon={FaBuilding}
                        label={
                          <>
                            State <span className="text-red-500">*</span>
                          </>
                        }
                        placeholder="Delhi"
                        value={p_state}
                        onChange={(e) => setPState(e.target.value)}
                        required
                      />

                      <IconInput
                        icon={FaBuilding}
                        label={
                          <>
                            City <span className="text-red-500">*</span>
                          </>
                        }
                        placeholder="New Delhi"
                        value={p_city}
                        onChange={(e) => setPCity(e.target.value)}
                        required
                      />

                      <IconInput
                        icon={FaSortNumericDownAlt}
                        label={
                          <>
                            Pincode <span className="text-red-500">*</span>
                          </>
                        }
                        placeholder="110001"
                        value={p_pincode}
                        onChange={(e) => setPPincode(e.target.value.replace(/\D/g, ""))}
                        maxLength={6}
                        required
                      />
                    </div>
                  </div>
                </section>

                <section className="space-y-4">
                  <h3 className="text-lg font-medium text-[#E4002B]">Family Background</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <IconInput
                      icon={FaUser}
                      placeholder="Enter father's name"
                      label={
                        <>
                          Father's Name <span className="text-red-500">*</span>
                        </>
                      }
                      value={p_fathersName}
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
                      value={p_fatherDob}
                      onChange={(e) => setPFatherDob(e.target.value)}
                      required
                    />
                    <IconInput
                      icon={FaUser}
                      placeholder="Enter mother's name"
                      label={
                        <>
                          Mother's Name <span className="text-red-500">*</span>
                        </>
                      }
                      value={p_motherName}
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
                      value={p_motherDob}
                      onChange={(e) => setPMotherDob(e.target.value)}
                      required
                    />
                    <IconInput
                      icon={FaUser}
                      placeholder={"Enter spouse's name"}
                      label="Spouse Name (if applicable)"
                      value={p_spouseName}
                      onChange={(e) => setPSpouseName(e.target.value)}
                    />
                    <IconInput
                      icon={FaCalendarAlt}
                      label="Spouse DOB"
                      type="date"
                      value={p_spouseDob}
                      onChange={(e) => setPSpouseDob(e.target.value)}
                    />
                    <IconInput
                      icon={FaUser}
                      placeholder={"Enter child 1's name"}
                      label="Child 1 Name"
                      value={p_child1Name}
                      onChange={(e) => setPChild1Name(e.target.value)}
                    />
                    <IconInput
                      icon={FaCalendarAlt}
                      label="Child 1 DOB"
                      type="date"
                      value={p_child1Dob}
                      onChange={(e) => setPChild1Dob(e.target.value)}
                    />
                    <IconInput
                      icon={FaUser}
                      placeholder={"Enter child 2's name"}
                      label="Child 2 Name"
                      value={p_child2Name}
                      onChange={(e) => setPChild2Name(e.target.value)}
                    />
                    <IconInput
                      icon={FaCalendarAlt}
                      label="Child 2 DOB"
                      type="date"
                      value={p_child2Dob}
                      onChange={(e) => setPChild2Dob(e.target.value)}
                    />
                  </div>
                </section>

                <section className="space-y-4">
                  <h3 className="text-lg font-medium text-[#E4002B]">Identification & Bank</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <IconInput
                      icon={FaIdCard}
                      label={
                        <>
                          PAN Number <span className="text-red-500">*</span>
                        </>
                      }
                      placeholder="ABCDE1234F"
                      value={p_pan}
                      onChange={(e) => setPPan(e.target.value.toUpperCase())}
                      maxLength={10}
                      required
                    />

                    <IconInput
                      icon={FaIdCard}
                      label={
                        <>
                          Aadhaar Number <span className="text-red-500">*</span>
                        </>
                      }
                      placeholder="1234 5678 9012"
                      value={p_aadhaar}
                      onChange={(e) => setPAadhaar(e.target.value.replace(/\D/g, ""))}
                      maxLength={12}
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
                      value={p_uan}
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
                      value={p_pf}
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
                      value={p_esi}
                      onChange={(e) => setPEsi(e.target.value)}
                      required
                    />

                    <IconInput
                      icon={FaBuilding}
                      label="Preferred ESI Dispensary Location (if covered under ESI)"
                      placeholder="Enter location"
                      value={p_esiDispensary}
                      onChange={(e) => setPEsiDispensary(e.target.value)}
                    />

                    <IconInput
                      icon={FaSortNumericDownAlt}
                      label={
                        <>
                          Bank Account Number <span className="text-red-500">*</span>
                        </>
                      }
                      placeholder="123456789012"
                      value={p_bankAccount}
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
                      value={p_ifsc}
                      onChange={(e) => setPIfsc(e.target.value.toUpperCase())}
                      maxLength={11}
                      required
                    />

                    <IconInput
                      icon={FaUniversity}
                      label={
                        <>
                          Bank Name <span className="text-red-500">*</span>
                        </>
                      }
                      placeholder="Bank name"
                      value={p_bankName}
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
                      value={p_branchName}
                      onChange={(e) => setPBranchName(e.target.value)}
                      required
                    />
                  </div>
                </section>

                <section className="space-y-4">
                  <h3 className="text-lg font-medium text-[#E4002B]">Prior Work Experience</h3>

                  {experiences.map((exp, idx) => (
                    <div key={idx} className="border border-gray-200 rounded-lg p-4 relative">
                      <div className="absolute right-3 top-3 flex gap-2">
                        <button
                          type="button"
                          onClick={() => removeExperience(idx)}
                          className="text-sm text-red-500 hover:underline flex items-center gap-1"
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
                          placeholder=""
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
                          placeholder=""
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
                            const checked = e.target.checked
                            updateExperience(idx, "currentlyWorking", checked)
                            if (checked) {
                              updateExperience(idx, "to", "")
                            }
                          }}
                          className="w-4 h-4 accent-[#E4002B] cursor-pointer"
                        />
                        <label htmlFor={`currentlyWorking-${idx}`} className="text-sm text-gray-700 cursor-pointer">
                          Currently Working Here
                        </label>
                      </div>
                    </div>
                  ))}

                  <div>
                    <button
                      type="button"
                      onClick={addExperience}
                      className="inline-flex items-center gap-2 text-[#E4002B] hover:underline"
                    >
                      <FaPlus /> Add Another Experience
                    </button>
                  </div>
                </section>

                <section className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium">File Uploads</h3>
                    <p className="text-[11px] text-gray-500 mt-1">
                      <span className="text-red-500">*</span> Accepted formats: PNG, JPG, JPEG, PDF, DOC — less than 1
                      MB
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FileInput
                      label="Aadhaar(front)"
                      accept="image/*,.pdf"
                      file={p_aadhaarFile1}
                      setFile={setPAadhaarFile1}
                      required
                    />
                    <FileInput
                      label="Aadhaar(back)"
                      accept="image/*,.pdf"
                      file={p_aadhaarFile2}
                      setFile={setPAadhaarFile2}
                      required
                    />
                    <FileInput label="PAN Card" accept="image/*,.pdf" file={p_panFile} setFile={setPPanFile} required />
                    <FileInput
                      label="Passport Size Photograph"
                      accept="image/*"
                      file={p_personPhoto}
                      setFile={setPPersonPhoto}
                      required
                    />
                    <FileInput
                      label="Family Photo"
                      accept="image/*"
                      file={p_familyPhoto}
                      setFile={setPFamilyPhoto}
                      required
                    />
                    <FileInput
                      label="Cancelled Cheque / Passbook / Bank Statement Copy"
                      accept="image/*,.pdf"
                      file={p_bankProofFile}
                      setFile={setPBankProofFile}
                      required
                    />
                    <FileInput label="ESI Form" accept="image/*,.pdf" file={p_esiForm} setFile={setPEsiForm} required />
                    <FileInput label="PF Form" accept="image/*,.pdf" file={p_pfForm} setFile={setPPfForm} required />
                    <FileInput
                      label="Employment Form"
                      accept="image/*,.pdf"
                      file={p_employmentForm}
                      setFile={setPEmploymentForm}
                      required
                    />
                    <FileInput label="Copy of CV" accept="image/*,.pdf" file={p_cv} setFile={setPCv} required />
                  </div>
                </section>
              </>
            )}

            {workerType === "Contractual" && (
              <>
                <section className="space-y-4">
                  <h3 className="text-lg font-medium text-[#E4002B]">Personal Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <IconInput
                      icon={FaUser}
                      label={
                        <>
                          Full Name <span className="text-red-500">*</span>
                        </>
                      }
                      placeholder="Enter your name"
                      value={c_name}
                      onChange={(e) => setCName(e.target.value)}
                      required
                    />

                    <IconInput
                      icon={FaCalendarAlt}
                      label={
                        <>
                          Date of Birth <span className="text-red-500">*</span>
                        </>
                      }
                      placeholder=""
                      type="date"
                      value={c_dob}
                      onChange={(e) => setCDob(e.target.value)}
                      required
                    />

                    <IconInput
                      icon={FaEnvelope}
                      label={
                        <>
                          Email <span className="text-red-500">*</span>
                        </>
                      }
                      placeholder="example@gmail.com"
                      type="email"
                      value={p_email}
                      onChange={(e) => setPEmail(e.target.value)}
                      required
                    />

                    <IconInput
                      icon={FaPhoneAlt}
                      label={
                        <>
                          Phone Number <span className="text-red-500">*</span>
                        </>
                      }
                      placeholder="+91 1234567890"
                      value={c_phone}
                      onChange={(e) => setCPhone(e.target.value.replace(/\D/g, ""))}
                      maxLength={10}
                      required
                    />
                    <IconInput
                      icon={FaIdCard}
                      label={
                        <>
                          Aadhaar Number <span className="text-red-500">*</span>
                        </>
                      }
                      placeholder="1234 5678 9012"
                      value={c_aadhaar}
                      onChange={(e) => setCAadhaar(e.target.value.replace(/\D/g, ""))}
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
                      value={c_pan}
                      onChange={(e) => setCPan(e.target.value.replace(/\D/g, ""))}
                      maxLength={12}
                      required
                    />

                    <IconInput
                      icon={FaSortNumericDownAlt}
                      label={
                        <>
                          Length of Contract <span className="text-red-500">*</span>
                        </>
                      }
                      placeholder="e.g., 6 months"
                      value={c_contractLength}
                      onChange={(e) => setCContractLength(e.target.value)}
                      required
                    />
                  </div>
                  <h3 className="text-lg font-medium text-[#E4002B]">Address Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <IconInput
                      icon={FaFileAlt}
                      label={
                        <>
                          Address Line 1 <span className="text-red-500">*</span>
                        </>
                      }
                      placeholder="House no, street, area"
                      value={c_address1}
                      onChange={(e) => setCAddress1(e.target.value)}
                      required
                    />

                    <IconInput
                      icon={FaFileAlt}
                      label="Address Line 2"
                      placeholder="Landmark, locality"
                      value={c_address2}
                      onChange={(e) => setCAddress2(e.target.value)}
                    />

                    <IconInput
                      icon={FaBuilding}
                      label={
                        <>
                          State <span className="text-red-500">*</span>
                        </>
                      }
                      placeholder="Delhi"
                      value={c_state}
                      onChange={(e) => setCState(e.target.value)}
                      required
                    />

                    <IconInput
                      icon={FaBuilding}
                      label={
                        <>
                          City <span className="text-red-500">*</span>
                        </>
                      }
                      placeholder="New Delhi"
                      value={c_city}
                      onChange={(e) => setCCity(e.target.value)}
                      required
                    />

                    <IconInput
                      icon={FaSortNumericDownAlt}
                      label={
                        <>
                          Pincode <span className="text-red-500">*</span>
                        </>
                      }
                      placeholder="110001"
                      value={c_pincode}
                      onChange={(e) => setCPincode(e.target.value.replace(/\D/g, ""))}
                      maxLength={6}
                      required
                    />
                  </div>
                </section>

                <section className="space-y-4 pt-2">
                  <h3 className="text-lg font-medium text-[#E4002B]">Bank Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <IconInput
                      icon={FaUniversity}
                      label={
                        <>
                          Account Number <span className="text-red-500">*</span>
                        </>
                      }
                      placeholder="Enter account number"
                      value={c_bankAccount}
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
                      placeholder="Enter IFSC code"
                      value={c_ifsc}
                      onChange={(e) => setCIfsc(e.target.value.toUpperCase())}
                      maxLength={11}
                      required
                    />

                    <IconInput
                      icon={FaBuilding}
                      label={
                        <>
                          Bank Name <span className="text-red-500">*</span>
                        </>
                      }
                      placeholder="Enter bank name"
                      value={c_bankName}
                      onChange={(e) => setCBankName(e.target.value)}
                      required
                    />

                    <IconInput
                      icon={FaBuilding}
                      label={
                        <>
                          Branch Name <span className="text-red-500">*</span>
                        </>
                      }
                      placeholder="Enter branch name"
                      value={c_branchName}
                      onChange={(e) => setCBranchName(e.target.value)}
                      required
                    />
                  </div>
                </section>

                <section className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium">File Uploads</h3>
                    <p className="text-[11px] text-gray-500 mt-1">
                      <span className="text-red-500">*</span> Accepted formats: PNG, JPG, JPEG, PDF, DOC — less than 1
                      MB
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FileInput
                      label="Aadhaar (front)"
                      accept="image/*,.pdf"
                      file={c_aadhaarFile1}
                      setFile={setCAadhaarFile1}
                      required
                    />
                    <FileInput
                      label="Aadhaar (back)"
                      accept="image/*,.pdf"
                      file={c_aadhaarFile2}
                      setFile={setCAadhaarFile2}
                      required
                    />
                    <FileInput label="PAN Card" accept="image/*,.pdf" file={c_panFile} setFile={setCPanFile} required />
                    <FileInput
                      label="Person Photo"
                      accept="image/*"
                      file={c_personPhoto}
                      setFile={setCPersonPhoto}
                      required
                    />
                    <FileInput
                      label="Cancelled Cheque / Passbook / Bank Statement Copy"
                      accept="image/*,.pdf"
                      file={c_bankProofFile}
                      setFile={setCBankProofFile}
                      required
                    />
                  </div>
                </section>
              </>
            )}

            <div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#E4002B] text-white py-3 rounded-lg font-medium hover:bg-[#C3002B] transition disabled:opacity-60"
              >
                {submitting ? "Creating..." : "Create Employee"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}

export default Profile

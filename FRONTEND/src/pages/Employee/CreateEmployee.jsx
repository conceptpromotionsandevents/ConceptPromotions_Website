import { useState, useRef, useEffect } from "react"
import { API_URL } from "../../url/base";
import {
  FaEnvelope,
  FaUser,
  FaPhoneAlt,
} from "react-icons/fa"
import { IoClose } from "react-icons/io5"
import { toast, ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"

const jobRoleOptions = [
  "Programme Manager",
  "Regional Manager",
  "Prog Coordinator",
  "Data Lead",
  "HR Manager",
  "MIS Executive",
  "HR Executive",
  "Supervisor",
  "Promoter/ Merchandiser/ Beauty Advisor/ Floater",
]

const SearchableSelect = ({ label, placeholder, options, value, onChange, required = false }) => {
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
      <label className="block text-sm font-medium mb-1 text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
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

const CreateEmployee = () => {
  const [workerType, setWorkerType] = useState("")
  const [jobRole, setJobRole] = useState("")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const handleNotifyEmployee = async () => {
    if (!workerType) {
      toast.error("Please select worker type.", { theme: "dark" })
      return
    }

    if (!name || !email || !phone || !jobRole) {
      toast.error("Please fill all required fields.", { theme: "dark" })
      return
    }

    const token = localStorage.getItem("token")
    if (!token) {
      toast.error("Unauthorized! Please login again.", { theme: "dark" })
      return
    }

    const payload = {
      name: name,
      email: email,
      contactNo: phone,
      employeeType: workerType,
      position: jobRole, // ✅ Changed from jobRole to position
    }

    setSubmitting(true)

    try {
      const response = await fetch(`${API_URL}/admin/employees`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      const result = await response.json()

      if (response.ok) {
        toast.success("Notification sent & employee initiated successfully!", { theme: "dark" })

        setTimeout(() => {
          setWorkerType("")
          setJobRole("")
          setName("")
          setEmail("")
          setPhone("")
        }, 1000)
      } else {
        toast.error(result.message || "Failed to notify employee", { theme: "dark" })
      }
    } catch (err) {
      console.error("Submission error:", err)
      toast.error("Something went wrong. Try again!", { theme: "dark" })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <ToastContainer />

      <div className="min-h-screen bg-[#171717] px-4 pt-8 pb-10">
        <div className="max-w-2xl mx-auto bg-[#EDEDED] shadow rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-6 text-center text-[#E4002B]">Employee Registration</h2>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-3 text-gray-700 text-center">Select Type of Worker</label>

            <div className="flex justify-center gap-4 flex-wrap">
              <button
                type="button"
                onClick={() => setWorkerType("Permanent")}
                className={`cursor-pointer w-44 md:w-52 border-2 rounded-xl p-4 flex flex-col items-center justify-center text-center transition-all duration-200 ${workerType === "Permanent"
                  ? "border-[#E4002B] bg-[#E4002B]/10 shadow"
                  : "border-gray-400 hover:border-[#E4002B] hover:bg-gray-50"
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
                  : "border-gray-400 hover:border-[#E4002B] hover:bg-gray-50"
                  }`}
              >
                <span className={`font-semibold ${workerType === "Contractual" ? "text-[#E4002B]" : "text-gray-700"}`}>
                  Contractual
                </span>
                <span className="text-xs text-gray-500 mt-1">Fixed-term / temporary</span>
              </button>
            </div>
          </div>

          {workerType && (
            <div className="space-y-4">
              <IconInput
                icon={FaUser}
                label={
                  <>
                    Full Name <span className="text-red-500">*</span>
                  </>
                }
                placeholder="Enter full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
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
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                maxLength={10}
                required
              />

              <SearchableSelect
                label="Job Role"
                placeholder="Select job role"
                options={jobRoleOptions}
                value={jobRole}
                onChange={setJobRole}
                required
              />

              <button
                type="button"
                onClick={handleNotifyEmployee}
                disabled={submitting}
                className="w-full bg-[#E4002B] hover:bg-red-700 text-white font-medium py-3 rounded-lg transition-all duration-200 shadow-md disabled:opacity-60 cursor-pointer"
              >
                {submitting ? "Notifying..." : "Notify Employee"}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default CreateEmployee
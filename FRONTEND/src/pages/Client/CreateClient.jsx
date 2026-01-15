import React, { useState } from "react";
import Select from "react-select";
import { API_URL } from "../../url/base";
import {
  FaEnvelope,
  FaUser,
  FaPhoneAlt,
  FaBuilding,
} from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const regionStates = {
  North: [
    "Jammu and Kashmir",
    "Ladakh",
    "Himachal Pradesh",
    "Punjab",
    "Haryana",
    "Uttarakhand",
    "Uttar Pradesh",
    "Delhi",
    "Chandigarh",
  ],
  South: [
    "Andhra Pradesh",
    "Karnataka",
    "Kerala",
    "Tamil Nadu",
    "Telangana",
    "Puducherry",
    "Lakshadweep",
  ],
  East: [
    "Bihar",
    "Jharkhand",
    "Odisha",
    "West Bengal",
    "Sikkim",
    "Andaman and Nicobar Islands",
    "Arunachal Pradesh",
    "Assam",
    "Manipur",
    "Meghalaya",
    "Mizoram",
    "Nagaland",
    "Tripura",
  ],
  West: [
    "Rajasthan",
    "Gujarat",
    "Maharashtra",
    "Madhya Pradesh",
    "Goa",
    "Chhattisgarh",
    "Dadra and Nagar Haveli and Daman and Diu",
  ],
};

const roleOptions = [
  { value: "national", label: "National Level" },
  { value: "state", label: "State Level" },
  { value: "regional", label: "Regional Level" },
];

const regionOptions = [
  { value: "north", label: "North" },
  { value: "south", label: "South" },
  { value: "east", label: "East" },
  { value: "west", label: "West" },
];

const customSelectStyles = {
  control: (provided, state) => ({
    ...provided,
    borderColor: state.isFocused ? "#E4002B" : "#d1d5db",
    boxShadow: state.isFocused ? "0 0 0 1px #E4002B" : "none",
    "&:hover": { borderColor: "#E4002B" },
    minHeight: "42px",
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isFocused ? "#FEE2E2" : "white",
    color: "#333",
    "&:active": { backgroundColor: "#FECACA" },
  }),
  multiValue: (provided) => ({
    ...provided,
    backgroundColor: "#FEE2E2",
  }),
  multiValueLabel: (provided) => ({
    ...provided,
    color: "#E4002B",
  }),
  multiValueRemove: (provided) => ({
    ...provided,
    color: "#E4002B",
    ":hover": {
      backgroundColor: "#E4002B",
      color: "white",
    },
  }),
  menu: (provided) => ({
    ...provided,
    zIndex: 20,
  }),
};

const CreateClient = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [contactNo, setContactNo] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [role, setRole] = useState(null);
  const [regions, setRegions] = useState([]);
  const [states, setStates] = useState([]);
  const [loading, setLoading] = useState(false);

  const getAllStates = () => {
    const allStates = Object.values(regionStates).flat();
    return allStates.map((state) => ({
      value: state.toLowerCase().replace(/\s+/g, "-"),
      label: state,
    }));
  };

  const getStateOptions = () => {
    if (!role) return [];

    if (role.value === "national") {
      return getAllStates();
    }

    if (role.value === "state") {
      return getAllStates();
    }

    if (role.value === "regional") {
      if (regions.length === 0) {
        return [];
      }

      const filteredStates = regions.flatMap((region) => {
        const regionKey = region.label;
        return regionStates[regionKey] || [];
      });

      return filteredStates.map((state) => ({
        value: state.toLowerCase().replace(/\s+/g, "-"),
        label: state,
      }));
    }

    return [];
  };

  const stateOptions = getStateOptions();

  const resetForm = () => {
    setName("");
    setEmail("");
    setContactNo("");
    setOrganizationName("");
    setRole(null);
    setRegions([]);
    setStates([]);
  };

  const handleRoleChange = (selectedRole) => {
    setRole(selectedRole);
    setRegions([]);
    setStates([]);

    // Auto-fill for national level
    if (selectedRole?.value === "national") {
      setRegions(regionOptions);
      setStates(getAllStates());
    }
  };

  const handleRegionChange = (selectedRegions) => {
    setRegions(selectedRegions);
    if (selectedRegions.length > 0) {
      const validStateLabels = selectedRegions.flatMap(
        (region) => regionStates[region.label] || []
      );
      const filteredStates = states.filter((state) =>
        validStateLabels.some(
          (validState) =>
            validState.toLowerCase().replace(/\s+/g, "-") === state.value
        )
      );
      setStates(filteredStates);
    } else {
      setStates([]);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);

    if (!name || !email || !organizationName || !role || !contactNo) {
      toast.error("Please fill all required fields!", { theme: "dark" });
      setLoading(false);
      return;
    }

    // Validate based on role
    if (role.value === "state" && states.length === 0) {
      toast.error("Please select at least one state!", { theme: "dark" });
      setLoading(false);
      return;
    }

    if (role.value === "regional" && (regions.length === 0 || states.length === 0)) {
      toast.error("Please select regions and states!", { theme: "dark" });
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem("token");

      // Prepare states array based on role
      let statesArray = [];
      let regionsArray = [];

      if (role.value === "national") {
        // For national level - send all states and all regions
        statesArray = getAllStates().map((s) => s.label);
        regionsArray = regionOptions.map((r) => r.label);
      } else if (role.value === "state") {
        // For state level - send selected states and determine their regions
        statesArray = states.map((s) => s.label);

        // Find which regions contain the selected states
        const selectedStateLabels = states.map((s) => s.label);
        const regionsSet = new Set();

        Object.entries(regionStates).forEach(([region, statesList]) => {
          if (statesList.some(state => selectedStateLabels.includes(state))) {
            regionsSet.add(region);
          }
        });

        regionsArray = Array.from(regionsSet);
      } else if (role.value === "regional") {
        // For regional level - send selected states and selected regions
        statesArray = states.map((s) => s.label);
        regionsArray = regions.map((r) => r.label);
      }

      const response = await fetch(
        `${API_URL}/admin/add-client-admin`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name,
            email,
            contactNo,
            organizationName,
            password: "TempPass@123",
            role: role.value,
            regions: regionsArray,
            states: statesArray,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || "Error in creating client", {
          theme: "dark",
        });
      } else {
        toast.success("Client created successfully!", {
          theme: "dark",
        });
        resetForm();
      }
    } catch (error) {
      console.error(error);
      toast.error("Server error", { theme: "dark" });
    }

    setLoading(false);
  };

  return (
    <>
      <ToastContainer />

      <div className="w-full max-w-lg bg-[#EDEDED] shadow-md rounded-xl p-8 mx-auto mb-10">
        {/* Header */}
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-[#E4002B]">Create Client</h1>
        </div>

        {/* Form */}
        <div className="space-y-5">
          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <FaUser className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Enter your full name"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#E4002B]"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <FaEnvelope className="absolute left-3 top-3 text-gray-400" />
              <input
                type="email"
                placeholder="Enter your email address"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#E4002B]"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <FaPhoneAlt className="absolute left-3 top-3 text-gray-400" />

              <input
                type="tel"
                placeholder="Enter your phone number"
                maxLength={10}                     
                onInput={(e) => {
                  e.target.value = e.target.value.replace(/\D/g, "");
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#E4002B]"
                required
                value={contactNo}
                onChange={(e) => setContactNo(e.target.value)}
              />
            </div>
          </div>

          {/* Organization Name */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Organization Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <FaBuilding className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Enter organization name"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#E4002B]"
                required
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
              />
            </div>
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium mb-1.5 text-gray-700">
              Role <span className="text-red-500">*</span>
            </label>
            <Select
              styles={customSelectStyles}
              options={roleOptions}
              value={role}
              onChange={handleRoleChange}
              isSearchable
              placeholder="Select or search role"
            />
          </div>

          {/* Region - Show for Regional Level only */}
          {role?.value === "regional" && (
            <div>
              <label className="block text-sm font-medium mb-1.5 text-gray-700">
                Region <span className="text-red-500">*</span>
              </label>
              <Select
                styles={customSelectStyles}
                options={regionOptions}
                value={regions}
                onChange={handleRegionChange}
                isSearchable
                isMulti
                placeholder="Select or search regions"
              />
            </div>
          )}

          {/* Region - Show for National Level (disabled, auto-filled) */}
          {role?.value === "national" && (
            <div>
              <label className="block text-sm font-medium mb-1.5 text-gray-700">
                Region <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value="All"
                disabled
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-100 text-gray-700 cursor-not-allowed"
              />
            </div>
          )}

          {/* State - Show for all roles except when regional is selected but no regions chosen */}
          {(role?.value === "state" || (role?.value === "regional" && regions.length > 0)) && (
            <div>
              <label className="block text-sm font-medium mb-1.5 text-gray-700">
                State <span className="text-red-500">*</span>
              </label>
              <Select
                styles={customSelectStyles}
                options={stateOptions}
                value={states}
                onChange={setStates}
                isSearchable
                isMulti
                placeholder="Select or search states"
              />
            </div>
          )}

          {/* State - Show for National Level (disabled, auto-filled) */}
          {role?.value === "national" && (
            <div>
              <label className="block text-sm font-medium mb-1.5 text-gray-700">
                State <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value="All"
                disabled
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-100 text-gray-700 cursor-not-allowed"
              />
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-[#E4002B] text-white py-2 rounded-lg font-medium hover:bg-[#C3002B] transition disabled:opacity-60 cursor-pointer"
          >
            {loading ? "Creating..." : "Create Client"}
          </button>
        </div>
      </div>
    </>
  );
};

export default CreateClient;
import React, { useState } from "react"
import Select from "react-select"
import { FaStore, FaCheckCircle, FaClipboardList, FaMoneyBillWave, FaSearch } from "react-icons/fa"

// Dummy dropdown options
const campaignOptions = [
  { value: "campaign1", label: "Campaign A" },
  { value: "campaign2", label: "Campaign B" },
  { value: "campaign3", label: "Campaign C" },
]

const regionOptions = [
  { value: "north", label: "North" },
  { value: "south", label: "South" },
  { value: "east", label: "East" },
  { value: "west", label: "West" },
]

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
}

const paymentOptions = [
  { value: "paid", label: "Paid" },
  { value: "pending", label: "Pending" },
  { value: "failed", label: "Failed" },
]

const dateOptions = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "last7days", label: "Last 7 Days" },
  { value: "last30days", label: "Last 30 Days" },
  { value: "thisMonth", label: "This Month" },
  { value: "lastMonth", label: "Last Month" },
  { value: "custom", label: "Custom Range" },
]

// Custom styling
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
}

const ClientHome = () => {
  const [campaigns, setCampaigns] = useState([])
  const [regions, setRegions] = useState([])
  const [states, setStates] = useState([])
  const [payment, setPayment] = useState(null)
  const [dateRange, setDateRange] = useState(null)
  const [showCustomDate, setShowCustomDate] = useState(false)
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [searchText, setSearchText] = useState("")

  const getStateOptions = () => {
    if (regions.length === 0) {
      const allStates = Object.values(regionStates).flat()
      return allStates.map(state => ({
        value: state.toLowerCase().replace(/\s+/g, '-'),
        label: state
      }))
    }

    const filteredStates = regions.flatMap(region => {
      const regionKey = region.label 
      return regionStates[regionKey] || []
    })

    return filteredStates.map(state => ({
      value: state.toLowerCase().replace(/\s+/g, '-'),
      label: state
    }))
  }

  const stateOptions = getStateOptions()

  const handleRegionChange = (selectedRegions) => {
    setRegions(selectedRegions)
    if (selectedRegions.length > 0) {
      const validStateLabels = selectedRegions.flatMap(region => regionStates[region.label] || [])
      const filteredStates = states.filter(state =>
        validStateLabels.some(validState =>
          validState.toLowerCase().replace(/\s+/g, '-') === state.value
        )
      )
      setStates(filteredStates)
    }
  }

  const handleDateChange = (selected) => {
    setDateRange(selected)
    if (selected?.value === "custom") {
      setShowCustomDate(true)
    } else {
      setShowCustomDate(false)
      setFromDate("")
      setToDate("")
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-[#E4002B]">Dashboard Overview</h2>

      {/* FILTERS */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        {/* Campaign and Date */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Campaign */}
          <div>
            <label className="block text-sm font-medium mb-1.5 text-gray-700">Campaign</label>
            <Select
              styles={customSelectStyles}
              options={campaignOptions}
              value={campaigns}
              onChange={setCampaigns}
              isSearchable
              isMulti
              placeholder="Select campaigns"
            />
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium mb-1.5 text-gray-700">Date Range</label>
            <Select
              styles={customSelectStyles}
              options={dateOptions}
              value={dateRange}
              onChange={handleDateChange}
              isSearchable
              placeholder="Select date range"
            />
          </div>
        </div>

        {/* Custom Date Range */}
        {showCustomDate && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1.5 text-gray-700">From Date</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="border border-gray-300 p-2.5 rounded w-full focus:outline-none focus:ring-1 focus:ring-[#E4002B] focus:border-[#E4002B]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 text-gray-700">To Date</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="border border-gray-300 p-2.5 rounded w-full focus:outline-none focus:ring-1 focus:ring-[#E4002B] focus:border-[#E4002B]"
              />
            </div>
          </div>
        )}

        {/* Region + State + Payment in one row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* Region */}
          <div>
            <label className="block text-sm font-medium mb-1.5 text-gray-700">Region</label>
            <Select
              styles={customSelectStyles}
              options={regionOptions}
              value={regions}
              onChange={handleRegionChange}
              isSearchable
              isMulti
              placeholder="Select regions"
            />
          </div>

          {/* State */}
          <div>
            <label className="block text-sm font-medium mb-1.5 text-gray-700">State</label>
            <Select
              styles={customSelectStyles}
              options={stateOptions}
              value={states}
              onChange={setStates}
              isSearchable
              isMulti
              placeholder="Select states"
            />
          </div>

          {/* Payment */}
          <div>
            <label className="block text-sm font-medium mb-1.5 text-gray-700">Payment</label>
            <Select
              styles={customSelectStyles}
              options={paymentOptions}
              value={payment}
              onChange={setPayment}
              isSearchable
              placeholder="Select payment"
            />
          </div>
        </div>


        {/* Search Bar with Button */}
        <div>
          <label className="block text-sm font-medium mb-1.5 text-gray-700">Search</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Search by name or outlet code..."
                className="border border-gray-300 pl-10 pr-4 py-2.5 rounded w-full focus:outline-none focus:ring-1 focus:ring-[#E4002B] focus:border-[#E4002B] transition-colors"
              />
            </div>
            <button
              onClick={() => console.log("Search clicked with:", searchText)}
              className="bg-[#E4002B] text-white px-6 py-2.5 rounded font-medium hover:bg-[#C3002B] transition-colors flex items-center gap-2"
            >
              <FaSearch />
              Search
            </button>
          </div>
        </div>
      </div>

      {/* CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-md text-center hover:shadow-lg transition-shadow">
          <FaStore className="text-[#E4002B] text-3xl mx-auto mb-2" />
          <h3 className="text-lg font-semibold">Outlets Enrolled</h3>
          <p className="text-3xl font-bold">XX</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-md text-center hover:shadow-lg transition-shadow">
          <FaCheckCircle className="text-[#E4002B] text-3xl mx-auto mb-2" />
          <h3 className="text-lg font-semibold">Outlets Activated</h3>
          <p className="text-3xl font-bold">XX</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-md text-center hover:shadow-lg transition-shadow">
          <FaClipboardList className="text-[#E4002B] text-3xl mx-auto mb-2" />
          <h3 className="text-lg font-semibold">Outlets Reported</h3>
          <p className="text-3xl font-bold">XX</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-md text-center hover:shadow-lg transition-shadow">
          <FaMoneyBillWave className="text-[#E4002B] text-3xl mx-auto mb-2" />
          <h3 className="text-lg font-semibold">Outlets Paid</h3>
          <p className="text-3xl font-bold">XX</p>
        </div>
      </div>

      <div className="text-gray-500 text-center">Graphs will appear here...</div>
    </div>
  )
}

export default ClientHome
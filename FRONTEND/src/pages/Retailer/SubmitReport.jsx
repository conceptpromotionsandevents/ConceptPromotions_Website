import { useState, useEffect } from "react"
import Select from "react-select"
import { FiPlus, FiX } from "react-icons/fi"
import axios from "axios"
import { API_URL } from "../../url/base";


const reportTypes = [
  { value: "Window Display", label: "Window Display" },
  { value: "Stock", label: "Stock" },
  { value: "Others", label: "Others" },
]


const frequencyOptions = [
  { value: "Daily", label: "Daily" },
  { value: "Weekly", label: "Weekly" },
  { value: "Fortnightly", label: "Fortnightly" },
  { value: "Monthly", label: "Monthly" },
  { value: "Adhoc", label: "Adhoc" },
]


const stockTypeOptions = [
  { value: "Opening Stock", label: "Opening Stock" },
  { value: "Closing Stock", label: "Closing Stock" },
  { value: "Purchase Stock", label: "Purchase Stock" },
  { value: "Sold Stock", label: "Sold Stock" },
]


const productTypeOptions = [
  { value: "Focus", label: "Focus" },
  { value: "All", label: "All" },
]


const customSelectStyles = {
  control: (provided, state) => ({
    ...provided,
    borderColor: state.isFocused ? "#E4002B" : "#d1d5db",
    boxShadow: state.isFocused ? "0 0 0 1px #E4002B" : "none",
    "&:hover": { borderColor: "#E4002B" },
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isFocused ? "#FEE2E2" : "white",
    color: "#333",
    "&:active": { backgroundColor: "#FECACA" },
  }),
}


// Helper function to get today's date in YYYY-MM-DD format
const getTodayDate = () => {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}


// Helper function to check if file is an image
const isImageFile = (file) => {
  return file && file.type && file.type.startsWith('image/')
}


const SubmitReport = ({ campaign }) => {
  const [reportType, setReportType] = useState(null)
  const [frequency, setFrequency] = useState(null)
  const [dateOfSubmission, setDateOfSubmission] = useState(getTodayDate())
  const [remarks, setRemarks] = useState("")
  
  // Stock fields
  const [stockType, setStockType] = useState(null)
  const [brand, setBrand] = useState("")
  const [product, setProduct] = useState("")
  const [sku, setSku] = useState("")
  const [productType, setProductType] = useState(null)
  const [quantity, setQuantity] = useState("")


  // Files
  const [shopDisplayImages, setShopDisplayImages] = useState([])
  const [billCopies, setBillCopies] = useState([])
  const [otherFiles, setOtherFiles] = useState([])


  // Retailer info
  const [retailerInfo, setRetailerInfo] = useState(null)
  const [campaignId, setCampaignId] = useState(null)
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")


  // Fetch retailer info and campaign ID on mount
  useEffect(() => {
    fetchRetailerInfo()
    if (campaign) {
      fetchCampaignId()
    }
  }, [campaign])


  const fetchRetailerInfo = async () => {
    try {
      const token = localStorage.getItem("retailer_token")
      if (!token) {
        setError("No token found. Please log in.")
        return
      }


      const response = await fetch(`${API_URL}/retailer/retailer/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })


      if (!response.ok) {
        throw new Error("Failed to load retailer profile")
      }


      const data = await response.json()
      console.log("Retailer data loaded:", {
        name: data.name,
        uniqueId: data.uniqueId,
        retailerCode: data.retailerCode,
        shopName: data.shopDetails?.shopName
      })
      setRetailerInfo(data)
    } catch (err) {
      console.error("Error fetching retailer info:", err)
      setError("Failed to load retailer information")
    }
  }


  const fetchCampaignId = async () => {
    try {
      const token = localStorage.getItem("retailer_token")
      const response = await axios.get(
        `${API_URL}/retailer/campaigns`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )
      
      const matchedCampaign = response.data.campaigns?.find(
        c => c.name === campaign.name
      )
      
      if (matchedCampaign) {
        setCampaignId(matchedCampaign._id)
        console.log("Campaign ID found:", matchedCampaign._id)
      }
    } catch (err) {
      console.error("Error fetching campaign ID:", err)
    }
  }


  const handleShopImagesChange = (e) => {
    const newFiles = Array.from(e.target.files || [])
    setShopDisplayImages(prev => [...prev, ...newFiles])
  }


  const handleBillCopiesChange = (e) => {
    const newFiles = Array.from(e.target.files || [])
    setBillCopies(prev => [...prev, ...newFiles])
  }


  const handleOtherFilesChange = (e) => {
    const newFiles = Array.from(e.target.files || [])
    setOtherFiles(prev => [...prev, ...newFiles])
  }


  const removeShopImage = (index) => {
    setShopDisplayImages(prev => prev.filter((_, i) => i !== index))
  }


  const removeBillCopy = (index) => {
    setBillCopies(prev => prev.filter((_, i) => i !== index))
  }


  const removeOtherFile = (index) => {
    setOtherFiles(prev => prev.filter((_, i) => i !== index))
  }


  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")


    // Validation
    if (!reportType) {
      setError("Please select a report type")
      return
    }
    if (!campaignId) {
      setError("Campaign information not loaded")
      return
    }
    if (!frequency) {
      setError("Please select frequency")
      return
    }
    if (!dateOfSubmission) {
      setError("Please select date of submission")
      return
    }
    if (!retailerInfo) {
      setError("Retailer information not loaded")
      return
    }


    // Check if uniqueId exists
    if (!retailerInfo.uniqueId) {
      setError("Retailer unique ID not found. Please contact support.")
      return
    }


    // Stock validation
    if (reportType.value === "Stock") {
      if (!stockType || !brand.trim() || !product.trim() || !sku.trim() || !productType || !quantity) {
        setError("Please fill all stock fields")
        return
      }
    }


    try {
      setLoading(true)
      const formData = new FormData()


      // Required fields
      formData.append("reportType", reportType.value)
      formData.append("campaignId", campaignId)
      formData.append("frequency", frequency.value)
      formData.append("dateOfSubmission", dateOfSubmission)
      
      // Submitter info (Retailer) - Using bracket notation for Cloudinary compatibility
      formData.append("submittedBy[role]", "Retailer")
      formData.append("submittedBy[userId]", retailerInfo._id)


      // Retailer info - Using bracket notation for Cloudinary compatibility
      formData.append("retailer[retailerId]", retailerInfo._id)
      formData.append("retailer[outletName]", retailerInfo.shopDetails?.shopName || retailerInfo.name || "")
      formData.append("retailer[retailerName]", retailerInfo.name || "")
      formData.append("retailer[outletCode]", retailerInfo.uniqueId)


      console.log("Submitting with:", {
        uniqueId: retailerInfo.uniqueId,
        dateOfSubmission: dateOfSubmission
      })


      // Optional remarks
      if (remarks) {
        formData.append("remarks", remarks)
      }


      // Stock-specific fields
      if (reportType.value === "Stock") {
        formData.append("stockType", stockType.value)
        formData.append("brand", brand)
        formData.append("product", product)
        formData.append("sku", sku)
        formData.append("productType", productType.value)
        formData.append("quantity", quantity)


        // Append bill copies - Backend will upload to Cloudinary
        billCopies.forEach((file) => {
          formData.append("billCopies", file)
        })
      }


      // Window Display images - Backend will upload to Cloudinary
      if (reportType.value === "Window Display") {
        shopDisplayImages.forEach((file) => {
          formData.append("shopDisplayImages", file)
        })
      }


      // Others files - Backend will upload to Cloudinary
      if (reportType.value === "Others") {
        otherFiles.forEach((file) => {
          formData.append("files", file)
        })
      }


      const token = localStorage.getItem("retailer_token")
      const response = await axios.post(`${API_URL}/reports/create`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      })


      if (response.data.success) {
        alert("Report submitted successfully!")
        // Reset form
        setReportType(null)
        setFrequency(null)
        setDateOfSubmission(getTodayDate())
        setRemarks("")
        setStockType(null)
        setBrand("")
        setProduct("")
        setSku("")
        setProductType(null)
        setQuantity("")
        setShopDisplayImages([])
        setBillCopies([])
        setOtherFiles([])
      }
    } catch (err) {
      console.error("Submission error:", err)
      setError(err.response?.data?.message || "Failed to submit report")
    } finally {
      setLoading(false)
    }
  }


  return (
    <div>
      <h3 className="text-xl font-semibold mb-4 text-[#E4002B]">Submit Report</h3>


      {/* Display Campaign Name */}
      <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
        <p className="text-sm text-gray-600">Campaign:</p>
        <p className="text-lg font-semibold text-gray-800">{campaign?.name || "Loading..."}</p>
      </div>


      {/* Display Retailer Info with Unique ID */}
      {retailerInfo && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-gray-600">Retailer:</p>
          <p className="text-md font-medium text-gray-800">{retailerInfo.name}</p>
          <p className="text-sm text-gray-600">{retailerInfo.shopDetails?.shopName}</p>
          <p className="text-xs text-gray-500">Unique ID: {retailerInfo.uniqueId || "Not assigned"}</p>
        </div>
      )}


      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}


      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Type of Report */}
        <div>
          <label className="block font-medium mb-1">Type of Report *</label>
          <Select
            styles={customSelectStyles}
            options={reportTypes}
            value={reportType}
            onChange={setReportType}
            placeholder="Select Report Type"
            isSearchable
          />
        </div>


        {/* Frequency */}
        <div>
          <label className="block font-medium mb-1">Frequency *</label>
          <Select
            styles={customSelectStyles}
            options={frequencyOptions}
            value={frequency}
            onChange={setFrequency}
            placeholder="Select Frequency"
            isSearchable
          />
        </div>


        {/* Date of Submission */}
        <div>
          <label className="block font-medium mb-1">Date of Submission *</label>
          <input
            type="date"
            className="border rounded p-2 w-full focus:outline-none focus:ring-2 focus:ring-[#E4002B] focus:border-transparent"
            value={dateOfSubmission}
            onChange={(e) => setDateOfSubmission(e.target.value)}
            max={getTodayDate()}
            required
          />
        </div>


        {/* Remarks */}
        <div>
          <label className="block font-medium mb-1">Remarks (Optional)</label>
          <textarea
            className="border rounded p-2 w-full focus:outline-none focus:ring-2 focus:ring-[#E4002B] focus:border-transparent"
            rows="3"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Add any additional notes..."
          />
        </div>


        {/* STOCK FIELDS */}
        {reportType?.value === "Stock" && (
          <div className="space-y-4 bg-gray-50 p-4 rounded-md border">
            <h4 className="font-semibold text-[#E4002B]">Stock Details</h4>
            
            <div>
              <label className="block font-medium mb-1">Type of Stock *</label>
              <Select
                styles={customSelectStyles}
                options={stockTypeOptions}
                value={stockType}
                onChange={setStockType}
                placeholder="Select Stock Type"
                isSearchable
              />
            </div>
            
            <div>
              <label className="block font-medium mb-1">Brand *</label>
              <input
                type="text"
                className="border rounded p-2 w-full focus:outline-none focus:ring-2 focus:ring-[#E4002B] focus:border-transparent"
                placeholder="Enter brand name"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
              />
            </div>
            
            <div>
              <label className="block font-medium mb-1">Product *</label>
              <input
                type="text"
                className="border rounded p-2 w-full focus:outline-none focus:ring-2 focus:ring-[#E4002B] focus:border-transparent"
                placeholder="Enter product name"
                value={product}
                onChange={(e) => setProduct(e.target.value)}
              />
            </div>
            
            <div>
              <label className="block font-medium mb-1">SKU *</label>
              <input
                type="text"
                className="border rounded p-2 w-full focus:outline-none focus:ring-2 focus:ring-[#E4002B] focus:border-transparent"
                placeholder="Enter SKU"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
              />
            </div>
            
            <div>
              <label className="block font-medium mb-1">Product Type *</label>
              <Select
                styles={customSelectStyles}
                options={productTypeOptions}
                value={productType}
                onChange={setProductType}
                placeholder="Select Product Type"
                isSearchable
              />
            </div>


            <div>
              <label className="block font-medium mb-1">Quantity *</label>
              <input
                type="number"
                className="border rounded p-2 w-full focus:outline-none focus:ring-2 focus:ring-[#E4002B] focus:border-transparent"
                placeholder="Enter quantity"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                min="0"
              />
            </div>


            {/* Bill Copies with Image Preview */}
            <div>
              <label className="block font-medium mb-1">Bill Copies (Images/PDF)</label>
              <label className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-gray-500 cursor-pointer hover:border-[#E4002B] transition-colors">
                <FiPlus className="text-3xl text-gray-400" />
                <span>Click or drop files here</span>
                <input
                  type="file"
                  accept="image/*, application/pdf"
                  multiple
                  className="hidden"
                  onChange={handleBillCopiesChange}
                />
              </label>


              {billCopies.length > 0 && (
                <div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {billCopies.map((file, index) => (
                    <div key={index} className="relative border-2 border-dashed rounded-lg overflow-hidden bg-gray-50 group">
                      {isImageFile(file) ? (
                        <>
                          <img
                            src={URL.createObjectURL(file)}
                            className="w-full h-32 object-cover"
                            alt={`bill-${index}`}
                          />
                          <button
                            type="button"
                            onClick={() => removeBillCopy(index)}
                            className="absolute top-1 right-1 bg-[#E4002B] text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <FiX size={16} />
                          </button>
                          <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 text-center truncate">
                            {file.name.length > 15 ? file.name.substring(0, 12) + "..." : file.name}
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-32 p-2 relative">
                          <div className="text-4xl text-gray-400 mb-2">📄</div>
                          <p className="text-xs text-gray-600 text-center truncate w-full px-2">
                            {file.name}
                          </p>
                          <button
                            type="button"
                            onClick={() => removeBillCopy(index)}
                            className="absolute top-1 right-1 bg-[#E4002B] text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <FiX size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}


        {/* WINDOW DISPLAY */}
        {reportType?.value === "Window Display" && (
          <div>
            <label className="block font-medium mb-1">Upload Shop Display Images</label>
            <label className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-gray-500 cursor-pointer hover:border-[#E4002B] transition-colors">
              <FiPlus className="text-3xl text-gray-400" />
              <span>Click or drop images here</span>
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleShopImagesChange}
              />
            </label>


            {shopDisplayImages.length > 0 && (
              <div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {shopDisplayImages.map((file, index) => (
                  <div key={index} className="relative border-2 border-dashed rounded-lg overflow-hidden bg-gray-50 group">
                    <img
                      src={URL.createObjectURL(file)}
                      className="w-full h-32 object-cover"
                      alt={`preview-${index}`}
                    />
                    <button
                      type="button"
                      onClick={() => removeShopImage(index)}
                      className="absolute top-1 right-1 bg-[#E4002B] text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <FiX size={16} />
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 text-center truncate">
                      {file.name.length > 15 ? file.name.substring(0, 12) + "..." : file.name}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* OTHERS - WITH IMAGE PREVIEW */}
        {reportType?.value === "Others" && (
          <div>
            <label className="block font-medium mb-1">Upload Files</label>
            <label className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-gray-500 cursor-pointer hover:border-[#E4002B] transition-colors">
              <FiPlus className="text-3xl text-gray-400" />
              <span>Click or drop files here</span>
              <input
                type="file"
                multiple
                className="hidden"
                onChange={handleOtherFilesChange}
              />
            </label>


            {otherFiles.length > 0 && (
              <div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {otherFiles.map((file, index) => (
                  <div key={index} className="relative border-2 border-dashed rounded-lg overflow-hidden bg-gray-50 group">
                    {isImageFile(file) ? (
                      <>
                        <img
                          src={URL.createObjectURL(file)}
                          className="w-full h-32 object-cover"
                          alt={`other-${index}`}
                        />
                        <button
                          type="button"
                          onClick={() => removeOtherFile(index)}
                          className="absolute top-1 right-1 bg-[#E4002B] text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <FiX size={16} />
                        </button>
                        <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 text-center truncate">
                          {file.name.length > 15 ? file.name.substring(0, 12) + "..." : file.name}
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-32 p-2 relative">
                        <div className="text-4xl text-gray-400 mb-2">📄</div>
                        <p className="text-xs text-gray-600 text-center truncate w-full px-2">
                          {file.name}
                        </p>
                        <button
                          type="button"
                          onClick={() => removeOtherFile(index)}
                          className="absolute top-1 right-1 bg-[#E4002B] text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <FiX size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}


        <button
          type="submit"
          disabled={loading}
          className="mt-3 px-6 py-2 bg-[#E4002B] text-white rounded disabled:bg-gray-400 disabled:cursor-not-allowed hover:bg-[#c60025] transition-colors font-medium"
        >
          {loading ? "Submitting..." : "Submit Report"}
        </button>
      </form>
    </div>
  )
}


export default SubmitReport
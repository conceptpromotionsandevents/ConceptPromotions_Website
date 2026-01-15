import React, { useState, useRef, useEffect } from "react";
import Select from "react-select";
import { FaUser, FaTrash, FaPlus } from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { API_URL } from "../../url/base";

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

const campaignTypeOptions = [
  { value: "Retailer Enrolment", label: "Retailer Enrolment" },
  { value: "Display Payment", label: "Display Payment" },
  { value: "Incentive Payment", label: "Incentive Payment" },
  { value: "Others", label: "Others" },
];

const regionOptions = [
  { value: "North", label: "North" },
  { value: "South", label: "South" },
  { value: "East", label: "East" },
  { value: "West", label: "West" },
  { value: "All", label: "All" },
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

const CreateCampaign = () => {
  // Basic fields
  const [campaignName, setCampaignName] = useState("");
  const [selectedClient, setSelectedClient] = useState(null); // ✅ Changed to object
  const [campaignStartDate, setCampaignStartDate] = useState("");
  const [campaignEndDate, setCampaignEndDate] = useState("");
  const [selectedCampaignType, setSelectedCampaignType] = useState(null);
  const [selectedRegions, setSelectedRegions] = useState([]);
  const [selectedStates, setSelectedStates] = useState([]);

  // Info fields
  const [description, setDescription] = useState("");
  const [termsAndConditions, setTermsAndConditions] = useState("");
  const [banners, setBanners] = useState([]);
  const [bannerPreviews, setBannerPreviews] = useState([]);

  // Gratification fields
  const [gratificationType, setGratificationType] = useState("");
  const [gratificationDescription, setGratificationDescription] = useState("");
  const [gratificationImages, setGratificationImages] = useState([]);
  const [gratificationImagePreviews, setGratificationImagePreviews] = useState([]);

  // ✅ NEW: Client state
  const [clientOptions, setClientOptions] = useState([]);
  const [loadingClients, setLoadingClients] = useState(false);

  // Refs for hidden file inputs
  const bannerInputRef = useRef(null);
  const gratificationInputRef = useRef(null);

  const [loading, setLoading] = useState(false);

  // ✅ FETCH ALL CLIENTS ON MOUNT
  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    setLoadingClients(true);
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(`${API_URL}/admin/client-admins`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // ✅ Transform clients into select options
        const options = data.clientAdmins.map((client) => ({
          value: client._id,
          label: `${client.name} • ${client.organizationName}`,
          clientData: client, // Store full client data for reference
        }));
        setClientOptions(options);
      } else {
        toast.error(data.message || "Failed to fetch clients", { theme: "dark" });
      }
    } catch (error) {
      console.error("Fetch clients error:", error);
      toast.error("Error fetching clients", { theme: "dark" });
    }
    setLoadingClients(false);
  };

  const getAllStates = () => {
    const allStates = Object.values(regionStates).flat();
    return allStates.map((state) => ({
      value: state,
      label: state,
    }));
  };

  const getStateOptions = () => {
    if (selectedRegions.length === 0) {
      return [];
    }

    if (selectedRegions.some((region) => region.value === "All")) {
      return getAllStates();
    }

    const filteredStates = selectedRegions.flatMap((region) => {
      return regionStates[region.value] || [];
    });

    return filteredStates.map((state) => ({
      value: state,
      label: state,
    }));
  };

  const stateOptions = getStateOptions();

  const handleRegionChange = (selected) => {
    setSelectedRegions(selected || []);

    if (selected?.some((region) => region.value === "All")) {
      setSelectedStates(getAllStates());
    } else if (selected && selected.length > 0) {
      const validStateValues = selected.flatMap(
        (region) => regionStates[region.value] || []
      );
      const filteredStates = selectedStates.filter((state) =>
        validStateValues.includes(state.value)
      );
      setSelectedStates(filteredStates);
    } else {
      setSelectedStates([]);
    }
  };

  // Handle Banner Upload
  const handleBannerUpload = (e) => {
    const files = Array.from(e.target.files);

    if (files.length + banners.length > 5) {
      toast.error("Maximum 5 banners allowed", { theme: "dark" });
      return;
    }

    setBanners([...banners, ...files]);

    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setBannerPreviews([...bannerPreviews, ...newPreviews]);
  };

  // Remove Banner
  const removeBanner = (index) => {
    const newBanners = banners.filter((_, i) => i !== index);
    const newPreviews = bannerPreviews.filter((_, i) => i !== index);
    setBanners(newBanners);
    setBannerPreviews(newPreviews);
  };

  // Handle Gratification Image Upload
  const handleGratificationImageUpload = (e) => {
    const files = Array.from(e.target.files);

    if (files.length + gratificationImages.length > 5) {
      toast.error("Maximum 5 gratification images allowed", { theme: "dark" });
      return;
    }

    setGratificationImages([...gratificationImages, ...files]);

    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setGratificationImagePreviews([...gratificationImagePreviews, ...newPreviews]);
  };

  // Remove Gratification Image
  const removeGratificationImage = (index) => {
    const newImages = gratificationImages.filter((_, i) => i !== index);
    const newPreviews = gratificationImagePreviews.filter((_, i) => i !== index);
    setGratificationImages(newImages);
    setGratificationImagePreviews(newPreviews);
  };

  const resetForm = () => {
    setCampaignName("");
    setSelectedClient(null);
    setSelectedCampaignType(null);
    setSelectedRegions([]);
    setSelectedStates([]);
    setCampaignStartDate("");
    setCampaignEndDate("");
    setDescription("");
    setTermsAndConditions("");
    setBanners([]);
    setBannerPreviews([]);
    setGratificationType("");
    setGratificationDescription("");
    setGratificationImages([]);
    setGratificationImagePreviews([]);
  };

  const handleSubmit = async () => {
    setLoading(true);

    if (
      !campaignName ||
      !selectedClient ||
      !selectedCampaignType ||
      selectedRegions.length === 0 ||
      selectedStates.length === 0 ||
      !campaignStartDate ||
      !campaignEndDate ||
      !termsAndConditions
    ) {
      toast.error("Please fill all required fields!", { theme: "dark" });
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem("token");

      const formData = new FormData();

      // ✅ Basic fields
      formData.append("name", campaignName);

      // ✅ Send organization name (not ID)
      formData.append("client", selectedClient.clientData.organizationName);

      formData.append("type", selectedCampaignType.value);
      formData.append("regions", JSON.stringify(selectedRegions.map((r) => r.value)));
      formData.append("states", JSON.stringify(selectedStates.map((s) => s.value)));
      formData.append("campaignStartDate", campaignStartDate);
      formData.append("campaignEndDate", campaignEndDate);

      // ✅ Info fields
      if (description) formData.append("description", description);
      formData.append("termsAndConditions", termsAndConditions);

      // ✅ Banners
      banners.forEach((banner) => {
        formData.append("banners", banner);
      });

      // ✅ Gratification fields
      if (gratificationType) formData.append("gratificationType", gratificationType);
      if (gratificationDescription) formData.append("gratificationDescription", gratificationDescription);

      // ✅ Gratification images
      gratificationImages.forEach((image) => {
        formData.append("gratificationImages", image);
      });

      const response = await fetch(`${API_URL}/admin/campaigns`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || "Error creating campaign", { theme: "dark" });
      } else {
        toast.success("Campaign created successfully!", { theme: "dark" });
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

      <div className="w-full max-w-3xl bg-[#EDEDED] shadow-md rounded-xl p-8 mx-auto my-8">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-[#E4002B]">Create Campaign</h1>
        </div>

        <div className="space-y-5">
          {/* Campaign Name */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Campaign Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <FaUser className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Type campaign name here"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#E4002B]"
              />
            </div>
          </div>

          {/* ✅ CLIENT DROPDOWN */}
          <div>
            <label className="block text-sm font-medium mb-1.5 text-gray-700">
              Client <span className="text-red-500">*</span>
            </label>
            <Select
              styles={customSelectStyles}
              options={clientOptions}
              value={selectedClient}
              onChange={setSelectedClient}
              isSearchable
              isLoading={loadingClients}
              placeholder={loadingClients ? "Loading clients..." : "Select a client"}
              noOptionsMessage={() => "No clients found"}
            />
            {selectedClient && (
              <p className="text-xs text-gray-500 mt-1">
                Organization: {selectedClient.clientData.organizationName}
              </p>
            )}
          </div>

          {/* Type of Campaign */}
          <div>
            <label className="block text-sm font-medium mb-1.5 text-gray-700">
              Type of Campaign <span className="text-red-500">*</span>
            </label>
            <Select
              styles={customSelectStyles}
              options={campaignTypeOptions}
              value={selectedCampaignType}
              onChange={setSelectedCampaignType}
              isSearchable
              placeholder="Select campaign type"
            />
          </div>

          {/* Region */}
          <div>
            <label className="block text-sm font-medium mb-1.5 text-gray-700">
              Region <span className="text-red-500">*</span>
            </label>
            <Select
              styles={customSelectStyles}
              options={regionOptions}
              value={selectedRegions}
              onChange={handleRegionChange}
              isSearchable
              isMulti
              placeholder="Select regions"
            />
          </div>

          {/* State */}
          <div>
            <label className="block text-sm font-medium mb-1.5 text-gray-700">
              State <span className="text-red-500">*</span>
            </label>
            <Select
              styles={customSelectStyles}
              options={stateOptions}
              value={selectedStates}
              onChange={setSelectedStates}
              isSearchable
              isMulti
              placeholder={
                selectedRegions.length > 0 ? "Select states" : "Select region first"
              }
              isDisabled={selectedRegions.length === 0}
            />
          </div>

          {/* Campaign Start Date */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Start Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={campaignStartDate}
              onChange={(e) => setCampaignStartDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#E4002B]"
            />
          </div>

          {/* Campaign End Date */}
          <div>
            <label className="block text-sm font-medium mb-1">
              End Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={campaignEndDate}
              onChange={(e) => setCampaignEndDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#E4002B]"
            />
          </div>

          {/* ✅ SECTION: INFO */}
          <div className="border-t pt-6 mt-6">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">
              Campaign Information <span className="text-red-500">(Optional)</span>
            </h2>

            {/* Description */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">
                Description
              </label>
              <textarea
                placeholder="Campaign description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#E4002B]"
              />
            </div>

            {/* Terms and Conditions */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">
                Terms & Conditions
              </label>
              <textarea
                placeholder="Enter terms and conditions"
                value={termsAndConditions}
                onChange={(e) => setTermsAndConditions(e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#E4002B]"
              />
            </div>

            {/* ✅ Banners Upload - STYLED */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Campaign Banners <span className="text-red-500">(Max Limit: 5)</span>
              </label>

              <input
                type="file"
                ref={bannerInputRef}
                accept="image/*"
                multiple
                onChange={handleBannerUpload}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => bannerInputRef.current?.click()}
                disabled={banners.length >= 5}
                className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#E4002B] hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-gray-600"
              >
                <FaPlus className="text-[#E4002B]" />
                <span className="font-medium">
                  {banners.length === 0
                    ? "Click to upload banners"
                    : `Add more banners (${banners.length}/5)`}
                </span>
              </button>

              {bannerPreviews.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
                  {bannerPreviews.map((preview, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={preview}
                        alt={`Banner ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => removeBanner(index)}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                      >
                        <FaTrash size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ✅ SECTION: GRATIFICATION */}
          <div className="border-t pt-6 mt-6">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">
              Gratification Details <span className="text-red-500">(Optional)</span>
            </h2>

            {/* Gratification Type */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">
                Gratification Type
              </label>
              <input
                type="text"
                placeholder="e.g., Cash, Gift, Points, Discount"
                value={gratificationType}
                onChange={(e) => setGratificationType(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#E4002B]"
              />
            </div>

            {/* Gratification Description */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">
                Gratification Description
              </label>
              <textarea
                placeholder="Describe the gratification details"
                value={gratificationDescription}
                onChange={(e) => setGratificationDescription(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#E4002B]"
              />
            </div>

            {/* ✅ Gratification Images Upload */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Gratification Images <span className="text-red-500">(Max Limit: 5)</span>
              </label>

              <input
                type="file"
                ref={gratificationInputRef}
                accept="image/*"
                multiple
                onChange={handleGratificationImageUpload}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => gratificationInputRef.current?.click()}
                disabled={gratificationImages.length >= 5}
                className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#E4002B] hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-gray-600"
              >
                <FaPlus className="text-[#E4002B]" />
                <span className="font-medium">
                  {gratificationImages.length === 0
                    ? "Click to upload gratification images"
                    : `Add more images (${gratificationImages.length}/5)`}
                </span>
              </button>

              {gratificationImagePreviews.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
                  {gratificationImagePreviews.map((preview, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={preview}
                        alt={`Gratification ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => removeGratificationImage(index)}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                      >
                        <FaTrash size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-[#E4002B] text-white py-3 rounded-lg font-medium hover:bg-[#C3002B] transition mt-6 disabled:opacity-60 cursor-pointer"
          >
            {loading ? "Creating..." : "Create Campaign"}
          </button>
        </div>
      </div>
    </>
  );
};

export default CreateCampaign;

import React, { useEffect, useState, useRef } from "react";
import Select from "react-select";
import { FaArrowLeft, FaPlus, FaTrash } from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { API_URL } from "../../url/base";

// Region & States Mapping
const regionStates = {
  North: ["Jammu and Kashmir", "Ladakh", "Himachal Pradesh", "Punjab", "Haryana", "Uttarakhand", "Uttar Pradesh", "Delhi", "Chandigarh"],
  South: ["Andhra Pradesh", "Karnataka", "Kerala", "Tamil Nadu", "Telangana", "Puducherry", "Lakshadweep"],
  East: ["Bihar", "Jharkhand", "Odisha", "West Bengal", "Sikkim", "Andaman and Nicobar Islands", "Arunachal Pradesh", "Assam", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Tripura"],
  West: ["Rajasthan", "Gujarat", "Maharashtra", "Madhya Pradesh", "Goa", "Chhattisgarh", "Dadra and Nagar Haveli and Daman and Diu"],
};

// Dropdown Styles
const customSelectStyles = {
  control: (provided, state) => ({
    ...provided,
    borderColor: state.isFocused ? "#E4002B" : "#d1d5db",
    boxShadow: state.isFocused ? "0 0 0 1px #E4002B" : "none",
    "&:hover": { borderColor: "#E4002B" },
    minHeight: "45px",
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isFocused ? "#FEE2E2" : "white",
    color: "#333",
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

const EditCampaign = ({ campaignId, onBack }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    name: "",
    client: "",
    type: null,
    regions: [],
    states: [],
    campaignStartDate: "",
    campaignEndDate: "",
  });

  // Info section
  const [description, setDescription] = useState("");
  const [termsAndConditions, setTermsAndConditions] = useState("");
  const [existingBanners, setExistingBanners] = useState([]);
  const [newBanners, setNewBanners] = useState([]);
  const [newBannerPreviews, setNewBannerPreviews] = useState([]);
  const [bannersToRemove, setBannersToRemove] = useState([]);

  // Gratification section
  const [gratificationType, setGratificationType] = useState("");
  const [gratificationDescription, setGratificationDescription] = useState("");
  const [existingGratificationImages, setExistingGratificationImages] = useState([]);
  const [newGratificationImages, setNewGratificationImages] = useState([]);
  const [newGratificationPreviews, setNewGratificationPreviews] = useState([]);
  const [gratificationImagesToRemove, setGratificationImagesToRemove] = useState([]);

  // Refs
  const bannerInputRef = useRef(null);
  const gratificationInputRef = useRef(null);

  const getAllStates = () => {
    const allStates = Object.values(regionStates).flat();
    return allStates.map((state) => ({ value: state, label: state }));
  };

  const getStateOptions = () => {
    if (formData.regions.length === 0) return [];
    if (formData.regions.some((r) => r.value === "All")) return getAllStates();

    const filtered = formData.regions.flatMap((r) => regionStates[r.value] || []);
    return filtered.map((state) => ({ value: state, label: state }));
  };

  const stateOptions = getStateOptions();

  // ✅ Fetch campaign data
  useEffect(() => {
    const fetchCampaign = async () => {
      try {
        const token = localStorage.getItem("token");

        const res = await fetch(`${API_URL}/admin/campaigns/${campaignId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();
        const c = data.campaign;

        setFormData({
          name: c.name || "",
          client: c.client || "",
          type: campaignTypeOptions.find((t) => t.value === c.type) || null,
          regions: c.regions?.map((r) => ({ value: r, label: r })) || [],
          states: c.states?.map((s) => ({ value: s, label: s })) || [],
          campaignStartDate: c.campaignStartDate ? c.campaignStartDate.split("T")[0] : "",
          campaignEndDate: c.campaignEndDate ? c.campaignEndDate.split("T")[0] : "",
        });

        // Info
        setDescription(c.info?.description || "");
        setTermsAndConditions(c.info?.tnc || "");
        setExistingBanners(c.info?.banners || []);

        // Gratification
        setGratificationType(c.gratification?.type || "");
        setGratificationDescription(c.gratification?.description || "");
        setExistingGratificationImages(c.gratification?.images || []);

      } catch (err) {
        console.error(err);
        toast.error("Error fetching campaign", { theme: "dark" });
      }
      setLoading(false);
    };

    fetchCampaign();
  }, [campaignId]);

  const handleRegionChange = (selected) => {
    setFormData((prev) => ({
      ...prev,
      regions: selected || [],
      states: selected?.some((r) => r.value === "All")
        ? getAllStates()
        : prev.states.filter((s) =>
            selected.flatMap((r) => regionStates[r.value]).includes(s.value)
          ),
    }));
  };

  // ✅ Handle new banner upload
  const handleBannerUpload = (e) => {
    const files = Array.from(e.target.files);
    
    const totalBanners = existingBanners.length - bannersToRemove.length + newBanners.length + files.length;
    
    if (totalBanners > 5) {
      toast.error("Maximum 5 banners allowed", { theme: "dark" });
      return;
    }

    setNewBanners([...newBanners, ...files]);
    const previews = files.map((file) => URL.createObjectURL(file));
    setNewBannerPreviews([...newBannerPreviews, ...previews]);
  };

  // ✅ Remove existing banner
  const removeExistingBanner = (publicId) => {
    setBannersToRemove([...bannersToRemove, publicId]);
    setExistingBanners(existingBanners.filter((b) => b.publicId !== publicId));
  };

  // ✅ Remove new banner
  const removeNewBanner = (index) => {
    setNewBanners(newBanners.filter((_, i) => i !== index));
    setNewBannerPreviews(newBannerPreviews.filter((_, i) => i !== index));
  };

  // ✅ Handle new gratification image upload
  const handleGratificationImageUpload = (e) => {
    const files = Array.from(e.target.files);
    
    const totalImages = existingGratificationImages.length - gratificationImagesToRemove.length + newGratificationImages.length + files.length;
    
    if (totalImages > 5) {
      toast.error("Maximum 5 gratification images allowed", { theme: "dark" });
      return;
    }

    setNewGratificationImages([...newGratificationImages, ...files]);
    const previews = files.map((file) => URL.createObjectURL(file));
    setNewGratificationPreviews([...newGratificationPreviews, ...previews]);
  };

  // ✅ Remove existing gratification image
  const removeExistingGratificationImage = (publicId) => {
    setGratificationImagesToRemove([...gratificationImagesToRemove, publicId]);
    setExistingGratificationImages(existingGratificationImages.filter((img) => img.publicId !== publicId));
  };

  // ✅ Remove new gratification image
  const removeNewGratificationImage = (index) => {
    setNewGratificationImages(newGratificationImages.filter((_, i) => i !== index));
    setNewGratificationPreviews(newGratificationPreviews.filter((_, i) => i !== index));
  };

  // ✅ Handle save
  const handleSave = async () => {
    setSaving(true);

    try {
      const token = localStorage.getItem("token");

      const formDataToSend = new FormData();

      // Basic fields
      formDataToSend.append("name", formData.name);
      formDataToSend.append("client", formData.client);
      formDataToSend.append("type", formData.type?.value);
      formDataToSend.append("regions", JSON.stringify(formData.regions.map((r) => r.value)));
      formDataToSend.append("states", JSON.stringify(formData.states.map((s) => s.value)));
      formDataToSend.append("campaignStartDate", formData.campaignStartDate);
      formDataToSend.append("campaignEndDate", formData.campaignEndDate);

      // Info
      formDataToSend.append("description", description);
      formDataToSend.append("termsAndConditions", termsAndConditions);

      // Banners to remove
      if (bannersToRemove.length > 0) {
        formDataToSend.append("removeBanners", JSON.stringify(bannersToRemove));
      }

      // New banners
      newBanners.forEach((banner) => {
        formDataToSend.append("banners", banner);
      });

      // Gratification
      formDataToSend.append("gratificationType", gratificationType);
      formDataToSend.append("gratificationDescription", gratificationDescription);

      // Gratification images to remove
      if (gratificationImagesToRemove.length > 0) {
        formDataToSend.append("removeGratificationImages", JSON.stringify(gratificationImagesToRemove));
      }

      // New gratification images
      newGratificationImages.forEach((image) => {
        formDataToSend.append("gratificationImages", image);
      });

      const res = await fetch(`${API_URL}/admin/campaigns/${campaignId}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: formDataToSend,
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Update failed", { theme: "dark" });
      } else {
        toast.success("Campaign updated successfully!", { theme: "dark" });
        setTimeout(onBack, 1000);
      }
    } catch (err) {
      console.error(err);
      toast.error("Update failed", { theme: "dark" });
    }
    setSaving(false);
  };

  return (
    <>
      <ToastContainer />
      <div className="min-h-screen bg-[#171717] pt-8 px-6 md:px-20 pb-10">
        <button onClick={onBack} className="flex items-center gap-2 text-[#E4002B] mb-6 hover:underline font-medium cursor-pointer">
          <FaArrowLeft /> Back to Campaigns
        </button>

        <div className="bg-[#EDEDED] p-6 shadow-md rounded-xl border max-w-3xl mx-auto w-full">
          <h1 className="text-2xl font-bold text-[#E4002B] mb-6 text-center">Edit Campaign</h1>

          {loading ? (
            <p className="text-center">Loading...</p>
          ) : (
            <div className="space-y-5">
              
              {/* Campaign Name */}
              <div>
                <label className="block text-sm font-medium mb-1">Campaign Name <span className="text-red-500">*</span></label>
                <input
                  placeholder="Campaign Name"
                  className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-[#E4002B]"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>

              {/* Client */}
              <div>
                <label className="block text-sm font-medium mb-1">Client <span className="text-red-500">*</span></label>
                <input
                  placeholder="Client Organization"
                  className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-[#E4002B]"
                  value={formData.client}
                  onChange={(e) => setFormData({...formData, client: e.target.value})}
                />
              </div>

              {/* Campaign Type */}
              <div>
                <label className="block text-sm font-medium mb-1">Campaign Type <span className="text-red-500">*</span></label>
                <Select
                  styles={customSelectStyles}
                  value={formData.type}
                  onChange={(v) => setFormData({...formData, type: v})}
                  options={campaignTypeOptions}
                  placeholder="Select campaign type"
                />
              </div>

              {/* Region */}
              <div>
                <label className="block text-sm font-medium mb-1">Region(s) <span className="text-red-500">*</span></label>
                <Select
                  styles={customSelectStyles}
                  value={formData.regions}
                  onChange={handleRegionChange}
                  options={regionOptions}
                  isMulti
                  placeholder="Select region(s)"
                />
              </div>

              {/* States */}
              <div>
                <label className="block text-sm font-medium mb-1">State(s) <span className="text-red-500">*</span></label>
                <Select
                  styles={customSelectStyles}
                  value={formData.states}
                  onChange={(v) => setFormData({...formData, states: v})}
                  options={stateOptions}
                  isMulti
                  placeholder="Select state(s)"
                  isDisabled={!formData.regions.length}
                />
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-sm font-medium mb-1">Start Date <span className="text-red-500">*</span></label>
                <input
                  type="date"
                  className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-[#E4002B]"
                  value={formData.campaignStartDate}
                  onChange={(e) => setFormData({...formData, campaignStartDate: e.target.value})}
                />
              </div>

              {/* End Date */}
              <div>
                <label className="block text-sm font-medium mb-1">End Date <span className="text-red-500">*</span></label>
                <input
                  type="date"
                  className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-[#E4002B]"
                  value={formData.campaignEndDate}
                  onChange={(e) => setFormData({...formData, campaignEndDate: e.target.value})}
                />
              </div>

              {/* ✅ INFO SECTION */}
              <div className="border-t pt-6 mt-6">
                <h2 className="text-lg font-semibold text-gray-700 mb-4">Campaign Information  <span className="text-red-500">(Optional)</span></h2>

                {/* Description */}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Description</label>
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
                  <label className="block text-sm font-medium mb-1">Terms & Conditions</label>
                  <textarea
                    placeholder="Enter terms and conditions"
                    value={termsAndConditions}
                    onChange={(e) => setTermsAndConditions(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#E4002B]"
                  />
                </div>

                {/* Banners */}
                <div>
                  <label className="block text-sm font-medium mb-2">Campaign Banners <span className="text-red-500">(Max Limit: 5)</span></label>
                  
                  {/* Existing banners */}
                  {existingBanners.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
                      {existingBanners.map((banner, idx) => (
                        <div key={idx} className="relative group">
                          <img
                            src={banner.url}
                            alt={`Banner ${idx + 1}`}
                            className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
                          />
                          <button
                            type="button"
                            onClick={() => removeExistingBanner(banner.publicId)}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                          >
                            <FaTrash size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* New banners */}
                  {newBannerPreviews.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
                      {newBannerPreviews.map((preview, idx) => (
                        <div key={idx} className="relative group">
                          <img
                            src={preview}
                            alt={`New Banner ${idx + 1}`}
                            className="w-full h-32 object-cover rounded-lg border-2 border-green-300"
                          />
                          <button
                            type="button"
                            onClick={() => removeNewBanner(idx)}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                          >
                            <FaTrash size={12} />
                          </button>
                          <span className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded">New</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Upload button */}
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
                    disabled={existingBanners.length + newBanners.length - bannersToRemove.length >= 5}
                    className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#E4002B] hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-gray-600"
                  >
                    <FaPlus className="text-[#E4002B]" />
                    <span className="font-medium">Add More Banners</span>
                  </button>
                </div>
              </div>

              {/* ✅ GRATIFICATION SECTION */}
              <div className="border-t pt-6 mt-6">
                <h2 className="text-lg font-semibold text-gray-700 mb-4">Gratification Details <span className="text-red-500">(Optional)</span></h2>

                {/* Gratification Type */}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Gratification Type</label>
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
                  <label className="block text-sm font-medium mb-1">Gratification Description</label>
                  <textarea
                    placeholder="Describe the gratification details"
                    value={gratificationDescription}
                    onChange={(e) => setGratificationDescription(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#E4002B]"
                  />
                </div>

                {/* Gratification Images */}
                <div>
                  <label className="block text-sm font-medium mb-2">Gratification Images <span className="text-red-500">(Max Limit: 5)</span></label>
                  
                  {/* Existing images */}
                  {existingGratificationImages.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
                      {existingGratificationImages.map((img, idx) => (
                        <div key={idx} className="relative group">
                          <img
                            src={img.url}
                            alt={`Gratification ${idx + 1}`}
                            className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
                          />
                          <button
                            type="button"
                            onClick={() => removeExistingGratificationImage(img.publicId)}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                          >
                            <FaTrash size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* New images */}
                  {newGratificationPreviews.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
                      {newGratificationPreviews.map((preview, idx) => (
                        <div key={idx} className="relative group">
                          <img
                            src={preview}
                            alt={`New Gratification ${idx + 1}`}
                            className="w-full h-32 object-cover rounded-lg border-2 border-green-300"
                          />
                          <button
                            type="button"
                            onClick={() => removeNewGratificationImage(idx)}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                          >
                            <FaTrash size={12} />
                          </button>
                          <span className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded">New</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Upload button */}
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
                    disabled={existingGratificationImages.length + newGratificationImages.length - gratificationImagesToRemove.length >= 5}
                    className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#E4002B] hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-gray-600"
                  >
                    <FaPlus className="text-[#E4002B]" />
                    <span className="font-medium">Add More Images</span>
                  </button>
                </div>
              </div>

              {/* Save Button */}
              <button
                disabled={saving}
                onClick={handleSave}
                className="w-full py-3 bg-[#E4002B] text-white rounded-lg hover:bg-[#C3002B] transition disabled:opacity-60 font-semibold mt-6 cursor-pointer"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>

            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default EditCampaign;

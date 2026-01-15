import React, { useState, useEffect, useRef } from "react";
import { FaUser, FaWallet, FaHome, FaUserCircle, FaBell, FaPhoneAlt, FaEdit, FaTrash, FaCamera } from "react-icons/fa";
import { API_URL } from "../../url/base";

import Profile from "./Profile";
import RetailerCampaigns from "./RetailerCampaigns";
import CampaignDetails from "./CampaignDetails";
import Passbook from "./Passbook";
import Notifications from "./Notifications";
import ContactUs from "./ContactUs";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const calculateProfileCompletion = (retailerData) => {
    if (!retailerData) return 0;

    const fields = [
        // Personal Details (8 fields)
        retailerData.name,
        retailerData.contactNo,
        retailerData.altContactNo,
        retailerData.email,
        retailerData.dob,
        retailerData.gender,
        retailerData.govtIdType,
        retailerData.govtIdNumber,

        // Shop Details (10 fields)
        retailerData.shopDetails?.shopName,
        retailerData.shopDetails?.businessType,
        retailerData.shopDetails?.ownershipType,
        retailerData.shopDetails?.GSTNo,
        retailerData.shopDetails?.PANCard,
        retailerData.shopDetails?.shopAddress?.address,
        retailerData.shopDetails?.shopAddress?.address2,
        retailerData.shopDetails?.shopAddress?.city,
        retailerData.shopDetails?.shopAddress?.state,
        retailerData.shopDetails?.shopAddress?.pincode,

        // Bank Details (4 fields)
        retailerData.bankDetails?.bankName,
        retailerData.bankDetails?.accountNumber,
        retailerData.bankDetails?.IFSC,
        retailerData.bankDetails?.branchName,

        // Files (4 fields)
        retailerData.govtIdPhoto?.url,
        retailerData.personPhoto?.url,
        retailerData.registrationFormFile?.url,
        retailerData.outletPhoto?.url,

        // Verifications (2 fields)
        retailerData.tnc,
        retailerData.pennyCheck,
    ];

    const filledFields = fields.filter(field => {
        if (typeof field === 'boolean') return field === true;
        if (typeof field === 'string') return field.trim() !== '';
        return field != null;
    }).length;

    const totalFields = fields.length;
    const percentage = Math.round((filledFields / totalFields) * 100);

    return percentage;
};

const calculateKYCStatus = (retailerData) => {
    if (!retailerData) return false;

    const kycFields = [
        retailerData.shopDetails?.PANCard,
        retailerData.govtIdType,
        retailerData.govtIdNumber,
        retailerData.govtIdPhoto?.url,
        retailerData.bankDetails?.bankName,
        retailerData.bankDetails?.accountNumber,
        retailerData.bankDetails?.IFSC,
        retailerData.bankDetails?.branchName,
        retailerData.pennyCheck,
    ];

    // Check if all KYC fields are filled
    const allFilled = kycFields.every(field => {
        if (typeof field === 'boolean') return field === true;
        if (typeof field === 'string') return field.trim() !== '';
        return field != null;
    });

    return allFilled;
};

const RetailerDashboard = () => {
    const [selectedComponent, setSelectedComponent] = useState("dashboard");
    const [selectedCampaignId, setSelectedCampaignId] = useState(null);

    // Profile Picture States
    const [profilePicture, setProfilePicture] = useState(null);
    const [isImageHovered, setIsImageHovered] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [retailerName, setRetailerName] = useState("");
    const [profileCompletion, setProfileCompletion] = useState(0);
    const [isKYCVerified, setIsKYCVerified] = useState(false);
    const fileInputRef = useRef(null);
    const mainContentRef = useRef(null);

    useEffect(() => {
        if (mainContentRef.current) {
            mainContentRef.current.scrollTo(0, 0);
        }
    }, [selectedComponent, selectedCampaignId]);

    // Fetch retailer profile data on mount
    useEffect(() => {
        // Load from localStorage immediately for instant display
        const retailerUser = JSON.parse(localStorage.getItem("retailer_user"));
        if (retailerUser) {
            if (retailerUser.name) {
                setRetailerName(retailerUser.name);
            }
            if (retailerUser.personPhoto) {
                setProfilePicture(retailerUser.personPhoto);
            }
        }

        // Then fetch fresh data from API
        fetchRetailerProfile();
    }, []);

    const fetchRetailerProfile = async () => {
        try {
            const token = localStorage.getItem("retailer_token");
            if (!token) {
                console.warn("No retailer token found");
                return;
            }

            const response = await fetch(`${API_URL}/retailer/retailer/me`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            if (response.ok) {
                const data = await response.json();
                console.log("📊 Full Response:", data);

                const retailer = data.retailer || data.data || data;
                console.log("👤 Retailer Object:", retailer);

                if (retailer.name) {
                    console.log("✅ Setting name:", retailer.name);
                    setRetailerName(retailer.name);
                }

                const personPhoto =
                    retailer.personPhoto ||
                    data.personPhoto ||
                    data.retailer?.personPhoto;

                console.log("📸 Person Photo:", personPhoto);

                if (personPhoto) {
                    setProfilePicture(personPhoto);
                }

                // ✅ ADD THESE LINES HERE (AFTER personPhoto)
                const completion = calculateProfileCompletion(retailer);
                setProfileCompletion(completion);

                // ✅ ADD KYC CHECK
                const kycVerified = calculateKYCStatus(retailer);
                setIsKYCVerified(kycVerified);

                // Update localStorage
                const storedUser = JSON.parse(localStorage.getItem("retailer_user")) || {};
                storedUser.name = retailer.name;
                storedUser.personPhoto = personPhoto;
                storedUser.profileCompletion = completion;
                storedUser.isKYCVerified = kycVerified;
                localStorage.setItem("retailer_user", JSON.stringify(storedUser));

            } else {
                console.error("Failed to fetch profile:", response.status);
            }
        } catch (error) {
            console.error("Failed to fetch profile:", error);
        }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith("image/")) {
            toast.error("Please upload an image file", { theme: "dark" });
            return;
        }

        // Validate file size (5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error("Image size should be less than 5MB", { theme: "dark" });
            return;
        }

        setUploadingImage(true);

        try {
            const token = localStorage.getItem("retailer_token");
            const formData = new FormData();
            formData.append("personPhoto", file);

            const response = await fetch(`${API_URL}/retailer/me`, {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Failed to upload image");
            }

            const data = await response.json();
            console.log("Upload response:", data); // Debug log

            // Handle different response structures
            const updatedPhoto = data.retailer?.personPhoto || data.personPhoto;
            setProfilePicture(updatedPhoto);

            // Update localStorage
            const retailerUser = JSON.parse(localStorage.getItem("retailer_user")) || {};
            retailerUser.personPhoto = updatedPhoto;
            localStorage.setItem("retailer_user", JSON.stringify(retailerUser));

            toast.success("Profile picture updated successfully!", { theme: "dark" });
        } catch (error) {
            console.error("Image upload error:", error);
            toast.error(error.message || "Failed to upload image", { theme: "dark" });
        } finally {
            setUploadingImage(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    const handleImageDelete = async () => {
        if (!window.confirm("Are you sure you want to delete your profile picture?")) {
            return;
        }

        setUploadingImage(true);

        try {
            const token = localStorage.getItem("retailer_token");

            const response = await fetch(
                `${API_URL}/retailer/retailer/profile-picture`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Failed to delete image");
            }

            setProfilePicture(null);

            // Update localStorage
            const retailerUser = JSON.parse(localStorage.getItem("retailer_user")) || {};
            retailerUser.personPhoto = null;
            localStorage.setItem("retailer_user", JSON.stringify(retailerUser));

            toast.success("Profile picture deleted successfully!", { theme: "dark" });
        } catch (error) {
            console.error("Image delete error:", error);
            toast.error(error.message || "Failed to delete image", { theme: "dark" });
        } finally {
            setUploadingImage(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("retailer_token");
        localStorage.removeItem("retailer_user");

        toast.success("Logout successful!", { theme: "dark" });

        setTimeout(() => {
            window.location.href = "/retailersignin";
        }, 1000);
    };

    const handleViewCampaign = (id) => {
        setSelectedCampaignId(id);
    };

    const handleBack = () => {
        setSelectedCampaignId(null);
    };

    const renderContent = () => {
        if (selectedCampaignId) {
            return <CampaignDetails campaignId={selectedCampaignId} onBack={handleBack} />;
        }

        switch (selectedComponent) {
            case "profile":
                return <Profile />;
            case "dashboard":
                return <RetailerCampaigns onView={handleViewCampaign} />;
            case "passbook":
                return <Passbook />;
            case "notifications":
                return <Notifications />;
            case "contact":
                return <ContactUs />;
            default:
                return <RetailerCampaigns onView={handleViewCampaign} />;
        }
    };

    const activeClass = "text-[#E4002B] font-semibold";

    return (
        <>
            <ToastContainer />
            {/* TOP NAVBAR */}
            <nav className="fixed top-0 w-full z-50 bg-black shadow-md px-6 md:px-10 border-b border-red-500">
                <div className="flex justify-between items-center py-4 max-w-screen-xl mx-auto relative">
                    <img
                        src="https://res.cloudinary.com/dltqp0vgg/image/upload/v1768037896/supreme_chdev9.png"
                        alt="Logo"
                        className="h-14 cursor-pointer"
                    />

                    <h2 className="absolute left-1/2 transform -translate-x-1/2 text-xl md:text-2xl font-bold text-[#E4002B]">
                        Concept Promotions and Events
                    </h2>

                    <button
                        onClick={handleLogout}
                        className="text-white border border-red-500 px-4 py-2 rounded-md hover:bg-red-500 transition cursor-pointer"
                    >
                        Logout
                    </button>
                </div>
            </nav>

            {/* Layout */}
            <div className="flex min-h-screen bg-gray-50 pt-20">
                {/* SIDEBAR */}
                <div className="w-64 bg-black shadow-md h-[calc(100vh-5rem)] fixed top-20 left-0 p-4">
                    <div className="text-center mb-6">
                        {/* Profile Picture with Hover Overlay */}
                        <div
                            className="relative inline-block"
                            onMouseEnter={() => setIsImageHovered(true)}
                            onMouseLeave={() => setIsImageHovered(false)}
                        >
                            {profilePicture?.url ? (
                                <img
                                    src={profilePicture.url}
                                    alt="Profile"
                                    className="h-20 w-20 mx-auto rounded-full object-cover border-2 border-[#E4002B]"
                                />
                            ) : (
                                <FaUserCircle className="h-20 w-20 mx-auto text-[#E4002B]" />
                            )}

                            {/* Hover Overlay */}
                            {isImageHovered && (
                                <div className="absolute inset-0 bg-gray-900 bg-opacity-90 rounded-full flex items-center justify-center gap-1 border-2 border-[#E4002B] cursor-pointer">
                                    {/* Upload/Edit Icon - Always Red */}
                                    <button
                                        onClick={() => fileInputRef.current.click()}
                                        className="text-[#E4002B] hover:text-[#ff0033] transition p-2 hover:bg-gray-800 rounded-full cursor-pointer"
                                        title={profilePicture?.url ? "Edit" : "Upload"}
                                        disabled={uploadingImage}
                                    >
                                        {profilePicture?.url ? (
                                            <FaEdit className="text-xl" />
                                        ) : (
                                            <FaCamera className="text-2xl" />
                                        )}
                                    </button>

                                    {/* Delete Icon - Only show if profile picture exists */}
                                    {profilePicture?.url && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleImageDelete();
                                            }}
                                            className="text-[#E4002B] hover:text-[#ff0033] transition p-2 hover:bg-gray-800 rounded-full cursor-pointer"
                                            title="Delete"
                                            disabled={uploadingImage}
                                        >
                                            <FaTrash className="text-lg" />
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* Hidden File Input */}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="hidden"
                            />
                        </div>

                        <h3 className="mt-3 text-lg font-semibold text-white">
                            Welcome, {retailerName || "Retailer"}
                        </h3>

                        {uploadingImage && (
                            <p className="text-sm text-gray-600 mt-1">
                                {profilePicture?.url ? "Updating..." : "Uploading..."}
                            </p>
                        )}

                        {/* ✅ ADD KYC STATUS BADGE */}
                        <div className="mt-2 mb-3">
                            {isKYCVerified ? (
                                <div className="flex items-center justify-center gap-2 bg-green-500/20 border border-green-500 rounded-full px-3 py-1">
                                    <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    <span className="text-xs font-medium text-green-500">KYC Verified</span>
                                </div>
                            ) : (
                                <div className="flex items-center justify-center gap-2 bg-red-500/20 border border-red-500 rounded-full px-3 py-1">
                                    <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                    <span className="text-xs font-medium text-red-500">KYC Not Verified</span>
                                </div>
                            )}
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-gray-700 rounded-full h-2 mt-3">
                            <div
                                className="bg-[#E4002B] h-2 rounded-full transition-all duration-500"
                                style={{ width: `${profileCompletion}%` }}
                            ></div>
                        </div>

                        <p className="text-sm text-white mt-1">
                            Profile {profileCompletion}% complete
                        </p>
                    </div>

                    <ul className="space-y-3 text-white font-medium">
                        <li
                            onClick={() => { setSelectedComponent("profile"); setSelectedCampaignId(null); }}
                            className={`cursor-pointer flex items-center gap-3 p-2 rounded-lg hover:bg-gray-800 
                            ${selectedComponent === "profile" ? activeClass : ""}`}
                        >
                            <FaUser /> Profile
                        </li>

                        <li
                            onClick={() => { setSelectedComponent("dashboard"); setSelectedCampaignId(null); }}
                            className={`cursor-pointer flex items-center gap-3 p-2 rounded-lg hover:bg-gray-800 
                            ${selectedComponent === "dashboard" ? activeClass : ""}`}
                        >
                            <FaHome /> Dashboard
                        </li>

                        <li
                            onClick={() => { setSelectedComponent("passbook"); setSelectedCampaignId(null); }}
                            className={`cursor-pointer flex items-center gap-3 p-2 rounded-lg hover:bg-gray-800 
                            ${selectedComponent === "passbook" ? activeClass : ""}`}
                        >
                            <FaWallet /> Passbook
                        </li>

                        <li
                            onClick={() => { setSelectedComponent("notifications"); setSelectedCampaignId(null); }}
                            className={`cursor-pointer flex items-center gap-3 p-2 rounded-lg hover:bg-gray-800 
                            ${selectedComponent === "notifications" ? activeClass : ""}`}
                        >
                            <FaBell /> Notifications
                        </li>

                        <li
                            onClick={() => { setSelectedComponent("contact"); setSelectedCampaignId(null); }}
                            className={`cursor-pointer flex items-center gap-3 p-2 rounded-lg hover:bg-gray-800 
                            ${selectedComponent === "contact" ? activeClass : ""}`}
                        >
                            <FaPhoneAlt /> Contact Us
                        </li>
                    </ul>
                </div>

                {/* MAIN CONTENT */}
                <div
                    ref={mainContentRef}
                    className="ml-64 p-6 w-full h-[calc(100vh-5rem)] overflow-y-auto bg-[#171717]"
                >
                    {renderContent()}
                </div>
            </div>
        </>
    );
};

export default RetailerDashboard;

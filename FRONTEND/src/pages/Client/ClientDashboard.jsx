// ClientDashboard.jsx
import React, { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import { API_URL } from "../../url/base";
import {
    FaHome,
    FaWallet,
    FaBell,
    FaFileAlt,
    FaPhoneAlt,
    FaUserCircle,
    FaEdit,
    FaTrash,
    FaCamera,
} from "react-icons/fa";


import ClientHome from "./ClientHome";
import Passbook from "./Passbook";
import Notifications from "./Notifications";
import DetailedReport from "./DetailedReport";
import ContactUs from "./ContactUs";


const ClientDashboard = () => {
    const [selectedComponent, setSelectedComponent] = useState("dashboard");
    const mainContentRef = useRef(null);
    const fileInputRef = useRef(null);


    // API DATA STATES
    const [campaigns, setCampaigns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isImageHovered, setIsImageHovered] = useState(false);
    const [profilePicture, setProfilePicture] = useState(null);
    const [uploadingImage, setUploadingImage] = useState(false);


    useEffect(() => {
        if (mainContentRef.current) {
            mainContentRef.current.scrollTo(0, 0);
        }
    }, [selectedComponent]);


    const handleLogout = () => {
        localStorage.removeItem("client_token");
        localStorage.removeItem("client_user");


        toast.success("Logout successful!", { theme: "dark", autoClose: 1000 });


        setTimeout(() => {
            window.location.href = "/clientsignin";
        }, 1000);
    };


    // Fetch Client Data
    const fetchClientData = async () => {
        try {
            const token = localStorage.getItem("client_token");


            if (!token) {
                console.warn("❗ No token found");
                setLoading(false);
                return;
            }


            const headers = {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            };


            // Fetch Campaigns
            const campRes = await fetch(`${API_URL}/client/client/campaigns`, {
                headers,
            });


            if (!campRes.ok) {
                console.error("Campaigns fetch failed:", campRes.status);
                throw new Error("Failed to fetch campaigns");
            }


            const campData = await campRes.json();
            setCampaigns(campData.campaigns || []);


            // Fetch Profile Picture
            const profileRes = await fetch(`${API_URL}/client/client/profile`, {
                headers,
            });


            if (profileRes.ok) {
                const profileData = await profileRes.json();
                setProfilePicture(profileData.profilePicture || profileData.client?.profilePicture);
            }
        } catch (error) {
            console.error("Client Dashboard API Error:", error);
            toast.error("Failed to load data", { theme: "dark", autoClose: 1000 });
        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        fetchClientData();
    }, []);


    // Handle Image Upload
    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;


        // Validate file type
        if (!file.type.startsWith("image/")) {
            toast.error("Please upload an image file", { theme: "dark", autoClose: 1000 });
            return;
        }


        // Validate file size (5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error("Image size should be less than 5MB", { theme: "dark", autoClose: 1000 });
            return;
        }


        setUploadingImage(true);


        try {
            const token = localStorage.getItem("client_token");
            const formData = new FormData();
            formData.append("profilePicture", file);


            const response = await fetch(
                `${API_URL}/client/client/profile-picture`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    body: formData,
                }
            );


            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Failed to upload image");
            }


            const data = await response.json();
            setProfilePicture(data.profilePicture);


            // Update localStorage
            const clientUser = JSON.parse(localStorage.getItem("client_user"));
            clientUser.profilePicture = data.profilePicture;
            localStorage.setItem("client_user", JSON.stringify(clientUser));


            toast.success("Profile picture updated successfully!", { theme: "dark", autoClose: 1000 });
        } catch (error) {
            console.error("Image upload error:", error);
            toast.error(error.message || "Failed to upload image", { theme: "dark", autoClose: 1000 });
        } finally {
            setUploadingImage(false);
            // Clear the file input
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };


    // Handle Image Delete
    const handleImageDelete = async () => {
        if (
            !window.confirm(
                "Are you sure you want to delete your profile picture?"
            )
        ) {
            return;
        }


        setUploadingImage(true);


        try {
            const token = localStorage.getItem("client_token");


            const response = await fetch(
                `${API_URL}/client/client/profile-picture`,
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
            const clientUser = JSON.parse(localStorage.getItem("client_user"));
            clientUser.profilePicture = null;
            localStorage.setItem("client_user", JSON.stringify(clientUser));


            toast.success("Profile picture deleted successfully!", { theme: "dark", autoClose: 1000 });
        } catch (error) {
            console.error("Image delete error:", error);
            toast.error(error.message || "Failed to delete image", { theme: "dark", autoClose: 1000 });
        } finally {
            setUploadingImage(false);
        }
    };


    const renderContent = () => {
        const sharedProps = {
            campaigns,
            loading,
        };


        switch (selectedComponent) {
            case "dashboard":
                return <ClientHome {...sharedProps} />;
            case "passbook":
                return <Passbook {...sharedProps} />;
            case "notifications":
                return <Notifications {...sharedProps} />;
            case "detailed":
                return <DetailedReport {...sharedProps} />;
            case "contact":
                return <ContactUs />;
            default:
                return <ClientHome {...sharedProps} />;
        }
    };


    const activeClass = "text-[#E4002B] font-semibold";
    const clientUser = JSON.parse(localStorage.getItem("client_user"));


    return (
        <>
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


            {/* LAYOUT */}
            <div className="flex min-h-screen bg-gray-50 pt-20">
                {/* SIDEBAR */}
                <div className="w-64 bg-black shadow-md h-[calc(100vh-5rem)] fixed top-20 left-0 p-4">
                    <div className="text-center mb-6 mt-4">
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
                            Welcome, {clientUser?.name || "Client"}
                        </h3>
                        {uploadingImage && (
                            <p className="text-sm text-gray-400 mt-1">
                                {profilePicture?.url ? "Updating..." : "Uploading..."}
                            </p>
                        )}
                    </div>


                    <ul className="space-y-3 text-white font-medium">
                        <li
                            onClick={() => setSelectedComponent("dashboard")}
                            className={`cursor-pointer flex items-center gap-3 p-2 rounded-lg hover:bg-gray-800 
                            ${selectedComponent === "dashboard" ? activeClass : ""}`}
                        >
                            <FaHome /> Dashboard
                        </li>


                        <li
                            onClick={() => setSelectedComponent("passbook")}
                            className={`cursor-pointer flex items-center gap-3 p-2 rounded-lg hover:bg-gray-800 
                            ${selectedComponent === "passbook" ? activeClass : ""}`}
                        >
                            <FaWallet /> Passbook
                        </li>


                        <li
                            onClick={() => setSelectedComponent("notifications")}
                            className={`cursor-pointer flex items-center gap-3 p-2 rounded-lg hover:bg-gray-800 
                            ${selectedComponent === "notifications" ? activeClass : ""}`}
                        >
                            <FaBell /> Notifications
                        </li>


                        <li
                            onClick={() => setSelectedComponent("detailed")}
                            className={`cursor-pointer flex items-center gap-3 p-2 rounded-lg hover:bg-gray-800 
                            ${selectedComponent === "detailed" ? activeClass : ""}`}
                        >
                            <FaFileAlt /> Detailed Report
                        </li>


                        <li
                            onClick={() => setSelectedComponent("contact")}
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


export default ClientDashboard;

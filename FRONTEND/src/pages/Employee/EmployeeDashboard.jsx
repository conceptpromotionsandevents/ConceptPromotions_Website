import React, { useState, useEffect, useRef } from "react";
import { ToastContainer, toast } from "react-toastify";
import { API_URL } from "../../url/base";
import "react-toastify/dist/ReactToastify.css";
import {
    FaUser,
    FaWallet,
    FaHome,
    FaUserCircle,
    FaBell,
    FaPhoneAlt,
    FaChartLine,
    FaEdit,
    FaTrash,
    FaCamera,
} from "react-icons/fa";

import Profile from "./Profile";
import EmployeeCampaigns from "./EmployeeCampaigns";
import CampaignDetails from "./CampaignDetails";
import Notifications from "./Notifications";
import ContactUs from "./ContactUs";
import TrackProgress from "./TrackProgress";
import Passbook from "./Passbook";
import LastVisitDetails from "./LastVisitDetails";

const EmployeeDashboard = () => {
    const [selectedComponent, setSelectedComponent] = useState("dashboard");
    const [selectedCampaignId, setSelectedCampaignId] = useState(null);
    const [selectedVisitData, setSelectedVisitData] = useState(null);
    const [employeeName, setEmployeeName] = useState("Employee");
    const [profileCompletion, setProfileCompletion] = useState(50);

    // Profile Picture States
    const [profilePicture, setProfilePicture] = useState(null);
    const [isImageHovered, setIsImageHovered] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const fileInputRef = useRef(null);

    const contentRef = useRef(null);

    useEffect(() => {
        if (contentRef.current) {
            contentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [selectedComponent, selectedCampaignId, selectedVisitData]);

    const handleLogout = () => {
        // Remove employee authentication data
        localStorage.removeItem("token");
        localStorage.removeItem("employeeData");

        toast.success("Logout successful!", {
            position: "top-right",
            autoClose: 1000,
            theme: "dark",
        });

        // Wait a little so toast appears
        setTimeout(() => {
            window.location.href = "/employeesignin";
        }, 1200);
    };

    // Fetch employee data on component mount
    useEffect(() => {
        const fetchEmployeeData = async () => {
            try {
                // First, try to get data from localStorage
                const storedData = localStorage.getItem("employeeData");
                if (storedData) {
                    const employee = JSON.parse(storedData);
                    setEmployeeName(employee.name || "Employee");

                    // ✅ FIX: personPhoto is inside files object
                    if (employee.files?.personPhoto) {
                        setProfilePicture(employee.files.personPhoto);
                    }
                }

                // Then fetch fresh data from API
                const token = localStorage.getItem("token");
                if (!token) {
                    console.error("No token found");
                    return;
                }

                const response = await fetch(
                    `${API_URL}/employee/profile`,
                    {
                        method: "GET",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                if (!response.ok) {
                    throw new Error("Failed to fetch profile");
                }

                const data = await response.json();

                if (data.employee) {
                    setEmployeeName(data.employee.name || "Employee");

                    // Calculate profile completion percentage
                    const completion = calculateProfileCompletion(data.employee);
                    setProfileCompletion(completion);

                    // ✅ FIX: Access personPhoto from files object
                    const personPhoto = data.employee.files?.personPhoto;

                    if (personPhoto && (personPhoto.url || personPhoto.publicId)) {
                        setProfilePicture(personPhoto);
                    }

                    // Update localStorage with fresh data
                    localStorage.setItem("employeeData", JSON.stringify(data.employee));
                }
            } catch (error) {
                console.error("Error fetching employee data:", error);
            }
        };

        fetchEmployeeData();
    }, []);

    // Calculate profile completion percentage based on employee type
    const calculateProfileCompletion = (employee) => {
        // Base fields common to all employees
        const baseFields = [
            employee.name,
            employee.email,
            employee.phone,
            employee.dob,
            employee.aadhaarNumber,
            employee.correspondenceAddress?.addressLine1,
            employee.correspondenceAddress?.city,
            employee.correspondenceAddress?.state,
            employee.correspondenceAddress?.pincode,
            employee.bankDetails?.accountNumber,
            employee.bankDetails?.ifsc,
            employee.bankDetails?.bankName,
            employee.bankDetails?.branchName,
            employee.files?.aadhaarFront?.url,
            employee.files?.aadhaarBack?.url,
            employee.files?.personPhoto?.url,
            employee.files?.bankProof?.url,
        ];

        let additionalFields = [];

        // Add fields specific to employee type
        if (employee.employeeType === "Permanent") {
            additionalFields = [
                employee.gender,
                employee.panNumber,
                employee.highestQualification,
                employee.maritalStatus,
                employee.fathersName,
                employee.motherName,
                employee.permanentAddress?.addressLine1,
                employee.permanentAddress?.city,
                employee.permanentAddress?.state,
                employee.permanentAddress?.pincode,
                employee.uanNumber,
                employee.pfNumber,
                employee.esiNumber,
                employee.files?.panCard?.url,
                employee.files?.pfForm?.url,
                employee.files?.esiForm?.url,
            ];
        } else if (employee.employeeType === "Contractual") {
            additionalFields = [
                employee.contractLength,
            ];
            // PAN is optional for contractual
            if (employee.panNumber) {
                additionalFields.push(employee.panNumber);
            }
        }

        const allFields = [...baseFields, ...additionalFields];

        // Count filled fields
        const filledFields = allFields.filter(field => {
            if (field === null || field === undefined) return false;
            if (typeof field === 'string' && field.trim() === '') return false;
            return true;
        }).length;

        const percentage = Math.round((filledFields / allFields.length) * 100);

        return percentage;
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
            const token = localStorage.getItem("token");
            const formData = new FormData();
            formData.append("personPhoto", file);

            const response = await fetch(`${API_URL}/employee/employee/profile`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Failed to upload image");
            }

            toast.success("Profile picture updated successfully!", { theme: "dark" });

            // ✅ SIMPLE FIX: Re-fetch complete profile after successful upload
            const profileResponse = await fetch(`${API_URL}/employee/profile`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });

            if (profileResponse.ok) {
                const profileData = await profileResponse.json();

                if (profileData.employee) {
                    // Update profile picture
                    const personPhoto = profileData.employee.files?.personPhoto;
                    if (personPhoto && (personPhoto.url || personPhoto.publicId)) {
                        setProfilePicture(personPhoto);
                    }

                    // Update profile completion
                    const completion = calculateProfileCompletion(profileData.employee);
                    setProfileCompletion(completion);

                    // Update localStorage
                    localStorage.setItem("employeeData", JSON.stringify(profileData.employee));
                }
            }

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
            const token = localStorage.getItem("token");

            // ✅ FIX: Use DELETE method and correct endpoint
            const response = await fetch(
                `${API_URL}/employee/employee/profile-picture`,
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
            const employeeData = JSON.parse(localStorage.getItem("employeeData")) || {};
            if (employeeData.files) {
                employeeData.files.personPhoto = null;
            }
            localStorage.setItem("employeeData", JSON.stringify(employeeData));

            toast.success("Profile picture deleted successfully!", { theme: "dark" });
        } catch (error) {
            console.error("Image delete error:", error);
            toast.error(error.message || "Failed to delete image", { theme: "dark" });
        } finally {
            setUploadingImage(false);
        }
    };

    const handleViewCampaign = (id) => {
        setSelectedCampaignId(id);
    };

    const handleBack = () => {
        setSelectedCampaignId(null);
    };

    const renderContent = () => {
        if (selectedCampaignId) {
            return (
                <CampaignDetails
                    campaignId={selectedCampaignId}
                    onBack={handleBack}
                />
            );
        }
        if (selectedVisitData) {
            return (
                <LastVisitDetails
                    data={selectedVisitData}
                    onBack={() => setSelectedVisitData(null)}
                />
            );
        }
        switch (selectedComponent) {
            case "profile":
                return <Profile />;

            case "dashboard":
                return <EmployeeCampaigns onView={handleViewCampaign} />;

            case "passbook":
                return <Passbook />;

            case "progress":
                return (
                    <TrackProgress
                        campaignId={selectedCampaignId}
                        onViewVisit={setSelectedVisitData}
                    />
                );

            case "notifications":
                return <Notifications />;

            case "contact":
                return <ContactUs />;

            default:
                return <EmployeeCampaigns onView={handleViewCampaign} />;
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
            <div className="flex min-h-screen bg-gray-50 pt-20 overflow-hidden">
                {/* SIDEBAR */}
                <div className="w-64 bg-black shadow-md h-[calc(100vh-5rem)] fixed top-20 left-0 p-4">
                    <div className="text-center mb-2 mt-2">
                        {/* Profile Picture with Hover Overlay */}
                        <div
                            className="relative inline-block"
                            onMouseEnter={() => setIsImageHovered(true)}
                            onMouseLeave={() => setIsImageHovered(false)}
                        >
                            {profilePicture?.url || profilePicture?.secureurl || profilePicture?.secureUrl ? (
                                <img
                                    src={profilePicture.secureurl || profilePicture.secureUrl || profilePicture.url}
                                    alt="Profile"
                                    className="h-20 w-20 mx-auto rounded-full object-cover border-2 border-[#E4002B]"
                                />
                            ) : (
                                <FaUserCircle className="h-20 w-20 mx-auto text-[#E4002B]" />
                            )}

                            {/* Hover Overlay */}
                            {isImageHovered && (
                                <div className="absolute inset-0 bg-gray-900 bg-opacity-90 rounded-full flex items-center justify-center gap-1 border-2 border-[#E4002B] cursor-pointer">
                                    {/* Upload/Edit Icon */}
                                    <button
                                        onClick={() => fileInputRef.current.click()}
                                        className="text-[#E4002B] hover:text-[#ff0033] transition p-2 hover:bg-gray-800 rounded-full cursor-pointer"
                                        title={profilePicture?.url ? "Edit" : "Upload"}
                                        disabled={uploadingImage}
                                    >
                                        {profilePicture?.url || profilePicture?.secureurl ? (
                                            <FaEdit className="text-xl" />
                                        ) : (
                                            <FaCamera className="text-2xl" />
                                        )}
                                    </button>

                                    {/* Delete Icon - Only show if profile picture exists */}
                                    {(profilePicture?.url || profilePicture?.secureurl) && (
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

                        <h3 className="mt-1 text-lg font-semibold text-white">
                            Welcome, {employeeName}
                        </h3>

                        {uploadingImage && (
                            <p className="text-sm text-gray-400 mt-1">
                                {profilePicture?.url ? "Updating..." : "Uploading..."}
                            </p>
                        )}

                        {/* Progress Bar */}
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                            <div
                                className="bg-[#E4002B] h-2 rounded-full transition-all duration-300"
                                style={{ width: `${profileCompletion}%` }}
                            ></div>
                        </div>

                        <p className="text-sm text-white mt-2">
                            Profile {profileCompletion}% complete
                        </p>
                    </div>

                    <ul className="space-y-3 text-white font-medium">
                        <li
                            onClick={() => {
                                setSelectedComponent("profile");
                                setSelectedCampaignId(null);
                                setSelectedVisitData(null);
                            }}
                            className={`cursor-pointer flex items-center gap-3 p-2 rounded-lg hover:bg-gray-800 
                            ${selectedComponent === "profile" ? activeClass : ""}`}
                        >
                            <FaUser /> Profile
                        </li>

                        <li
                            onClick={() => {
                                setSelectedComponent("dashboard");
                                setSelectedCampaignId(null);
                                setSelectedVisitData(null);
                            }}
                            className={`cursor-pointer flex items-center gap-3 p-2 rounded-lg hover:bg-gray-800 
                            ${selectedComponent === "dashboard" ? activeClass : ""}`}
                        >
                            <FaHome /> Dashboard
                        </li>

                        <li
                            onClick={() => {
                                setSelectedComponent("passbook");
                                setSelectedCampaignId(null);
                                setSelectedVisitData(null);
                            }}
                            className={`cursor-pointer flex items-center gap-3 p-2 rounded-lg hover:bg-gray-800 
                            ${selectedComponent === "passbook" ? activeClass : ""}`}
                        >
                            <FaWallet /> Passbook
                        </li>

                        <li
                            onClick={() => {
                                setSelectedComponent("progress");
                                setSelectedCampaignId(null);
                                setSelectedVisitData(null);
                            }}
                            className={`cursor-pointer flex items-center gap-3 p-2 rounded-lg hover:bg-gray-800 
                            ${selectedComponent === "progress" ? activeClass : ""}`}
                        >
                            <FaChartLine /> Track Progress
                        </li>

                        <li
                            onClick={() => {
                                setSelectedComponent("notifications");
                                setSelectedCampaignId(null);
                                setSelectedVisitData(null);
                            }}
                            className={`cursor-pointer flex items-center gap-3 p-2 rounded-lg hover:bg-gray-800 
                            ${selectedComponent === "notifications" ? activeClass : ""}`}
                        >
                            <FaBell /> Notifications
                        </li>

                        <li
                            onClick={() => {
                                setSelectedComponent("contact");
                                setSelectedCampaignId(null);
                                setSelectedVisitData(null);
                            }}
                            className={`cursor-pointer flex items-center gap-3 p-2 rounded-lg hover:bg-gray-800 
                            ${selectedComponent === "contact" ? activeClass : ""}`}
                        >
                            <FaPhoneAlt /> Contact Us
                        </li>
                    </ul>
                </div>

                {/* MAIN CONTENT */}
                <div
                    ref={contentRef}
                    className="ml-64 p-6 w-full bg-[#171717] overflow-y-auto h-[calc(100vh-5rem)]"
                >
                    {renderContent()}
                </div>
            </div>
        </>
    );
};

export default EmployeeDashboard;

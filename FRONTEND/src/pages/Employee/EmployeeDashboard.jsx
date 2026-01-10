import React, { useState, useEffect } from "react";
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

                    // Update localStorage with fresh data
                    localStorage.setItem("employeeData", JSON.stringify(data.employee));
                }
            } catch (error) {
                console.error("Error fetching employee data:", error);
                // Keep using localStorage data if API fails
            }
        };

        fetchEmployeeData();
    }, []);

    // Calculate profile completion percentage
    const calculateProfileCompletion = (employee) => {
        const fields = [
            employee.gender,
            employee.dob,
            employee.phone,
            employee.email,
            employee.aadhaarNumber,
            employee.panNumber,
            employee.correspondenceAddress?.address,
            employee.permanentAddress?.address,
            employee.bankDetails?.accountNumber,
        ];

        const filledFields = fields.filter(field => field && field.trim() !== "").length;
        return Math.round((filledFields / fields.length) * 100);
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
                        <FaUserCircle className="h-20 w-20 mx-auto text-[#E4002B]" />

                        <h3 className="mt-1 text-lg font-semibold text-white">
                            Welcome, {employeeName}
                        </h3>

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
                <div className="ml-64 p-6 w-full bg-gray-50 ">{renderContent()}</div>
            </div>
        </>
    );
};

export default EmployeeDashboard;
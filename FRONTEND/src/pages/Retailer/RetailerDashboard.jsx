import React, { useState } from "react";
import { FaUser, FaWallet, FaHome, FaUserCircle, FaBell, FaPhoneAlt } from "react-icons/fa";

import Profile from "./Profile";
import RetailerCampaigns from "./RetailerCampaigns";
import CampaignDetails from "./CampaignDetails";
import Passbook from "./Passbook";
import Notifications from "./Notifications";
import ContactUs from "./ContactUs";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const RetailerDashboard = () => {
    const [selectedComponent, setSelectedComponent] = useState("dashboard");

    const [selectedCampaignId, setSelectedCampaignId] = useState(null);

    const handleLogout = () => {
        localStorage.removeItem("retailer_token");
        localStorage.removeItem("retailer_user");

        toast.success("Logout successful!", {
            position: "top-right",
            autoClose: 1000,
            theme: "dark",
        });

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
                <div className="w-64 bg-white shadow-md h-[calc(100vh-5rem)] fixed top-20 left-0 p-4">
                    <div className="text-center mb-6">
                        <FaUserCircle className="h-20 w-20 mx-auto text-[#E4002B]" />

                        <h3 className="mt-3 text-lg font-semibold text-gray-800">
                            Welcome, Retailer
                        </h3>

                        {/* Silver Tier */}
                        <p className="text-sm font-medium text-[#E4002B] mt-1">
                            Silver Member
                        </p>

                        {/* Progress Bar */}
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                            <div className="bg-[#E4002B] h-2 rounded-full" style={{ width: "50%" }}></div>
                        </div>

                        <p className="text-sm text-gray-600 mt-1">
                            Profile 50% complete
                        </p>
                    </div>

                    <ul className="space-y-3 text-gray-700 font-medium">

                        <li
                            onClick={() => { setSelectedComponent("profile"); setSelectedCampaignId(null); }}
                            className={`cursor-pointer flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 
                            ${selectedComponent === "profile" ? activeClass : ""}`}
                        >
                            <FaUser /> Profile
                        </li>

                        <li
                            onClick={() => { setSelectedComponent("dashboard"); setSelectedCampaignId(null); }}
                            className={`cursor-pointer flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 
                            ${selectedComponent === "dashboard" ? activeClass : ""}`}
                        >
                            <FaHome /> Dashboard
                        </li>

                        <li
                            onClick={() => { setSelectedComponent("passbook"); setSelectedCampaignId(null); }}
                            className={`cursor-pointer flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 
                            ${selectedComponent === "passbook" ? activeClass : ""}`}
                        >
                            <FaWallet /> Passbook
                        </li>

                        <li
                            onClick={() => { setSelectedComponent("notifications"); setSelectedCampaignId(null); }}
                            className={`cursor-pointer flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 
                            ${selectedComponent === "notifications" ? activeClass : ""}`}
                        >
                            <FaBell /> Notifications
                        </li>

                        <li
                            onClick={() => { setSelectedComponent("contact"); setSelectedCampaignId(null); }}
                            className={`cursor-pointer flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 
                            ${selectedComponent === "contact" ? activeClass : ""}`}
                        >
                            <FaPhoneAlt /> Contact Us
                        </li>

                    </ul>
                </div>

                {/* MAIN CONTENT */}
                <div className="ml-64 p-6 w-full">
                    {renderContent()}
                </div>
            </div>
        </>
    );
};

export default RetailerDashboard;

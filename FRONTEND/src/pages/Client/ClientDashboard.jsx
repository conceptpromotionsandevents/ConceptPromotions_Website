import React, { useState, useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { API_URL } from "../../url/base";
import {
    FaHome,
    FaWallet,
    FaBell,
    FaFileAlt,
    FaPhoneAlt,
    FaUserCircle,
} from "react-icons/fa";

import ClientHome from "./ClientHome";
import Passbook from "./Passbook";
import Notifications from "./Notifications";
import DetailedReport from "./DetailedReport";
import ContactUs from "./ContactUs";

const ClientDashboard = () => {
    const [selectedComponent, setSelectedComponent] = useState("dashboard");

    // API DATA STATES
    const [campaigns, setCampaigns] = useState([]);
    const [payments, setPayments] = useState([]);
    const [reportedOutlets, setReportedOutlets] = useState([]);
    const [loading, setLoading] = useState(true);

    const handleLogout = () => {
        localStorage.removeItem("client_token");
        localStorage.removeItem("client_user");

        toast.success("Logout successful!", {
            position: "top-right",
            autoClose: 1000,
            theme: "dark",
        });

        setTimeout(() => {
            window.location.href = "/clientsignin";
        }, 1000);
    };

    // FETCH ALL CLIENT DATA
    const fetchClientData = async () => {
        try {
            const token = localStorage.getItem("client_token");

            if (!token) {
                console.warn("❗ No token found");
                setLoading(false);
                return;
            }

            const headers = {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
            };

            // 1️⃣ Fetch Campaigns
            const campRes = await fetch(
                `${API_URL}/client/client/campaigns`,
                { headers }
            );

            if (!campRes.ok) {
                console.error("Campaigns fetch failed:", campRes.status);
                throw new Error("Failed to fetch campaigns");
            }

            const campData = await campRes.json();

            // 2️⃣ Fetch Payments
            const payRes = await fetch(
                `${API_URL}/client/client/payments`,
                { headers }
            );

            if (!payRes.ok) {
                console.error("Payments fetch failed:", payRes.status);
            }

            const payData = payRes.ok ? await payRes.json() : { payments: [] };
            // 3️⃣ Fetch Reported Outlets
            const reportRes = await fetch(
                `${API_URL}/client/client/reported-outlets`,
                { headers }
            );

            if (!reportRes.ok) {
                console.error("Reported outlets fetch failed:", reportRes.status);
            }

            const reportData = reportRes.ok ? await reportRes.json() : { outlets: [] };

            setCampaigns(campData.campaigns || []);
            setPayments(payData.payments || []);
            setReportedOutlets(reportData.outlets || []);

        } catch (error) {
            console.error("Client Dashboard API Error:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClientData();
    }, []);

    const renderContent = () => {
        const sharedProps = {
            campaigns,
            payments,
            reportedOutlets,
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

            {/* LAYOUT */}
            <div className="flex min-h-screen bg-gray-50 pt-20">

                {/* SIDEBAR */}
                <div className="w-64 bg-black shadow-md h-[calc(100vh-5rem)] fixed top-20 left-0 p-4">
                    <div className="text-center mb-6 mt-4">
                        <FaUserCircle className="h-20 w-20 mx-auto text-[#E4002B]" />
                        <h3 className="mt-3 text-lg font-semibold text-white">
                            Welcome, {clientUser?.name || "Client"}
                        </h3>
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
                <div className="ml-64 p-6 w-full h-[calc(100vh-5rem)] overflow-y-auto bg-[#171717]">
                    {renderContent()}
                </div>
            </div>
        </>
    );
};

export default ClientDashboard;
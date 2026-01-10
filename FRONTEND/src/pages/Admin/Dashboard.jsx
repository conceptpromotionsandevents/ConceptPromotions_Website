import React, { useState, useEffect } from "react";
import { FaPlus, FaUpload, FaBriefcase, FaWallet, FaBullseye } from "react-icons/fa";
import { IoIosArrowDown, IoIosArrowUp } from "react-icons/io";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Create Operation
import CreateClient from "../Client/CreateClient";
import CreateRetailer from "../Retailer/CreateRetailer";
import CreateEmployee from "../Employee/CreateEmployee";

// Campaign Pages
import CampaignHome from "../Campaign/CampaignHome";
import CreateCampaign from "../Campaign/CreateCampaign";
import AssignCampaign from "../Campaign/AssignCampaign";
import EditCampaign from "../Campaign/EditCampaign";
import UpdateCampaign from "../Campaign/UpdateCampaign";
import ActivateDeactivateCampaign from "../Campaign/ActivateDeactivateCampaign";
import CampaignStaus from "../Campaign/CampaignStatus";
import MapEmployee from "../Campaign/MapEmployee";
import ScheduleUnscheduleTask from "../Campaign/ScheduleUnscheduleTask";

// Job
import PostJob from "./PostJob";
import UpdateJob from "./UpdateJob";
import EditJob from "./EditJob";
import JobTracking from "./JobTracking";
import JobDetails from "./JobDetails";
import BulkUpload from "./BulkUpload";
import ManageReports from "../Campaign/ManageReports";

// Passbook Pages
import PassbookHome from "./PassbookHome";
import SetBudget from "./SetBudget";
import ManageInstallments from "./ManageInstallments";

const Dashboard = () => {
    const [openMenu, setOpenMenu] = useState("");
    const [selectedComponent, setSelectedComponent] = useState("welcome");
    const [selectedJobId, setSelectedJobId] = useState(null);
    const [selectedCampaignId, setSelectedCampaignId] = useState(null);
    const [selectedPaymentId, setSelectedPaymentId] = useState(null);

    // Scroll to top whenever selectedComponent changes
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    }, [selectedComponent]);

    const toggleMenu = (menuName) => {
        setOpenMenu((prev) => {
            // If clicking same menu → close it
            if (prev === menuName) {
                if (menuName === "campaignManagement") {
                    setSelectedComponent("campaignHome"); // Show home when closed
                }
                if (menuName === "passbook") {
                    setSelectedComponent("passbookHome"); // Show home when closed
                }
                return "";
            }

            // When opening Campaign menu → default home
            if (menuName === "campaignManagement") {
                setSelectedComponent("campaignHome");
            }

            // When opening Passbook menu → default home
            if (menuName === "passbook") {
                setSelectedComponent("passbookHome");
            }

            return menuName;
        });
    };

    const handleLogout = () => {
        // Clear storage
        localStorage.removeItem("token");
        localStorage.removeItem("adminName");
        localStorage.removeItem("adminEmail");

        // Show toast
        toast.success("Logout successful!", {
            position: "top-right",
            autoClose: 1000,
            theme: "dark",
        });

        // Redirect after 1.5 sec
        setTimeout(() => {
            window.location.href = "/signin";
        }, 1000);
    };



    const renderContent = () => {
        switch (selectedComponent) {
            case "client":
                return <CreateClient />;

            case "retailer":
                return <CreateRetailer />;

            case "employee":
                return <CreateEmployee />;

            /* JOB MANAGEMENT */

            case "postJob":
                return <PostJob />;

            case "updateJob":
                return (
                    <UpdateJob
                        onEditJob={(id) => {
                            setSelectedJobId(id);
                            setSelectedComponent("editJob");
                        }}
                    />
                );

            case "editJob":
                return (
                    <EditJob
                        jobId={selectedJobId}
                        onBack={() => setSelectedComponent("updateJob")}
                    />
                );

            case "jobTracking":
                return (
                    <JobTracking
                        onViewJob={(id) => {
                            setSelectedJobId(id);
                            setSelectedComponent("jobDetails");
                        }}
                    />
                );

            case "jobDetails":
                return (
                    <JobDetails
                        jobId={selectedJobId}
                        onBack={() => setSelectedComponent("jobTracking")}
                    />
                );

            /* CAMPAIGN MANAGEMENT */

            case "campaignHome":
                return <CampaignHome />;

            case "createCampaign":
                return <CreateCampaign />;

            case "assignCampaign":
                return <AssignCampaign />;

            case "mapEmployee":
                return <MapEmployee />;
            case "scheduleUnscheduleTask":
                return <ScheduleUnscheduleTask />;
            case "manageReports":
                return <ManageReports />;
            case "editCampaign":
                return (
                    <UpdateCampaign
                        onEdit={(id) => {
                            setSelectedCampaignId(id);
                            setSelectedComponent("editCampaignDetails");
                        }}
                    />
                );

            case "editCampaignDetails":
                return (
                    <EditCampaign
                        campaignId={selectedCampaignId}
                        onBack={() => setSelectedComponent("editCampaign")}
                    />
                );

            case "activateDeactivateCampaign":
                return (
                    <CampaignStaus
                        onViewCampaign={(id) => {
                            setSelectedCampaignId(id);
                            setSelectedComponent(
                                "activateDeactivateCampaignDetails"
                            );
                        }}
                    />
                );

            case "activateDeactivateCampaignDetails":
                return (
                    <ActivateDeactivateCampaign
                        campaignId={selectedCampaignId}
                        onBack={() =>
                            setSelectedComponent("activateDeactivateCampaign")
                        }
                    />
                );

            /* PASSBOOK */
            case "passbookHome":
                return <PassbookHome />;

            case "setbudget":
                return <SetBudget />;

            case "manageinstallments":
                return <ManageInstallments />;

            /* BULK UPLOAD */

            case "bulkUpload":
                return <BulkUpload />;

            default:
                return (
                    <div className="text-center mt-10">
                        <h1 className="text-3xl font-bold text-gray-200">
                            Welcome to Admin Dashboard
                        </h1>
                        <p className="text-gray-500 mt-2">
                            Select an operation from the left sidebar to begin.
                        </p>
                    </div>
                );
        }
    };

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
            <div className="flex min-h-screen bg-[#171717] pt-20 overflow-hidden">
                {/* SIDEBAR */}
                <div className="w-72 bg-black shadow-md h-[calc(100vh-5rem)] fixed top-20 left-0 p-4 flex flex-col justify-between overflow-y-auto">
                    <ul className="space-y-2">
                        {/* CREATE MENU */}
                        <li>
                            <button
                                onClick={() => toggleMenu("create")}
                                className="flex items-center justify-between w-full text-white font-medium px-3 py-2 rounded-lg hover:bg-gray-800 transition"
                            >
                                <span className="flex items-center gap-2">
                                    <FaPlus className="text-[#E4002B]" />
                                    Create
                                </span>

                                {openMenu === "create" ? (
                                    <IoIosArrowUp className="text-white" />
                                ) : (
                                    <IoIosArrowDown className="text-white" />
                                )}
                            </button>

                            {openMenu === "create" && (
                                <ul className="mt-2 ml-6 space-y-2 text-gray-500">
                                    <li
                                        onClick={() =>
                                            setSelectedComponent("client")
                                        }
                                        className={`hover:text-[#E4002B] cursor-pointer ${selectedComponent === "client"
                                            ? "text-[#E4002B] font-semibold"
                                            : ""
                                            }`}
                                    >
                                        Client
                                    </li>

                                    <li
                                        onClick={() =>
                                            setSelectedComponent("retailer")
                                        }
                                        className={`hover:text-[#E4002B] cursor-pointer ${selectedComponent === "retailer"
                                            ? "text-[#E4002B] font-semibold"
                                            : ""
                                            }`}
                                    >
                                        Retailer
                                    </li>

                                    <li
                                        onClick={() =>
                                            setSelectedComponent("employee")
                                        }
                                        className={`hover:text-[#E4002B] cursor-pointer ${selectedComponent === "employee"
                                            ? "text-[#E4002B] font-semibold"
                                            : ""
                                            }`}
                                    >
                                        Employee
                                    </li>
                                </ul>
                            )}
                        </li>

                        {/* JOB MANAGEMENT */}
                        <li>
                            <button
                                onClick={() => toggleMenu("job")}
                                className="flex items-center justify-between w-full text-white font-medium px-3 py-2 rounded-lg hover:bg-gray-800 transition"
                            >
                                <span className="flex items-center gap-2">
                                    <FaBriefcase className="text-[#E4002B]" />
                                    Job Management
                                </span>

                                {openMenu === "job" ? (
                                    <IoIosArrowUp className="text-white" />
                                ) : (
                                    <IoIosArrowDown className="text-white" />
                                )}
                            </button>

                            {openMenu === "job" && (
                                <ul className="mt-2 ml-6 space-y-2 text-gray-500">
                                    <li
                                        onClick={() =>
                                            setSelectedComponent("postJob")
                                        }
                                        className={`hover:text-[#E4002B] cursor-pointer ${selectedComponent === "postJob"
                                            ? "text-[#E4002B] font-semibold"
                                            : ""
                                            }`}
                                    >
                                        Post New Job
                                    </li>

                                    <li
                                        onClick={() =>
                                            setSelectedComponent("updateJob")
                                        }
                                        className={`hover:text-[#E4002B] cursor-pointer ${selectedComponent === "updateJob"
                                            ? "text-[#E4002B] font-semibold"
                                            : ""
                                            }`}
                                    >
                                        Update Existing Jobs
                                    </li>

                                    <li
                                        onClick={() =>
                                            setSelectedComponent("jobTracking")
                                        }
                                        className={`hover:text-[#E4002B] cursor-pointer ${selectedComponent === "jobTracking"
                                            ? "text-[#E4002B] font-semibold"
                                            : ""
                                            }`}
                                    >
                                        Job Tracking
                                    </li>
                                </ul>
                            )}
                        </li>

                        {/* CAMPAIGN MANAGEMENT */}
                        <li>
                            <button
                                onClick={() => toggleMenu("campaignManagement")}
                                className="flex items-center justify-between w-full text-white font-medium px-3 py-2 rounded-lg hover:bg-gray-800 transition"
                            >
                                <span className="flex items-center gap-2">
                                    <FaBullseye className="text-[#E4002B]" />
                                    Campaign Management
                                </span>

                                {openMenu === "campaignManagement" ? (
                                    <IoIosArrowUp className="text-white" />
                                ) : (
                                    <IoIosArrowDown className="text-white" />
                                )}
                            </button>

                            {openMenu === "campaignManagement" && (
                                <ul className="mt-2 ml-6 space-y-2 text-gray-500">
                                    <li
                                        onClick={() =>
                                            setSelectedComponent(
                                                "createCampaign"
                                            )
                                        }
                                        className={`hover:text-[#E4002B] cursor-pointer ${selectedComponent ===
                                            "createCampaign"
                                            ? "text-[#E4002B] font-semibold"
                                            : ""
                                            }`}
                                    >
                                        Create Campaign
                                    </li>

                                    <li
                                        onClick={() =>
                                            setSelectedComponent(
                                                "assignCampaign"
                                            )
                                        }
                                        className={`hover:text-[#E4002B] cursor-pointer ${selectedComponent ===
                                            "assignCampaign"
                                            ? "text-[#E4002B] font-semibold"
                                            : ""
                                            }`}
                                    >
                                        Assign Campaign
                                    </li>

                                    <li
                                        onClick={() =>
                                            setSelectedComponent("editCampaign")
                                        }
                                        className={`hover:text-[#E4002B] cursor-pointer ${selectedComponent === "editCampaign"
                                            ? "text-[#E4002B] font-semibold"
                                            : ""
                                            }`}
                                    >
                                        Edit Campaign
                                    </li>

                                    <li
                                        onClick={() =>
                                            setSelectedComponent(
                                                "activateDeactivateCampaign"
                                            )
                                        }
                                        className={`hover:text-[#E4002B] cursor-pointer ${selectedComponent ===
                                            "activateDeactivateCampaign"
                                            ? "text-[#E4002B] font-semibold"
                                            : ""
                                            }`}
                                    >
                                        Activate / Deactivate Campaign
                                    </li>

                                    <li
                                        onClick={() =>
                                            setSelectedComponent("mapEmployee")
                                        }
                                        className={`hover:text-[#E4002B] cursor-pointer ${selectedComponent === "mapEmployee"
                                            ? "text-[#E4002B] font-semibold"
                                            : ""
                                            }`}
                                    >
                                        Map Employee
                                    </li>
                                    <li
                                        onClick={() =>
                                            setSelectedComponent(
                                                "scheduleUnscheduleTask"
                                            )
                                        }
                                        className={`hover:text-[#E4002B] cursor-pointer ${selectedComponent ===
                                            "scheduleUnscheduleTask"
                                            ? "text-[#E4002B] font-semibold"
                                            : ""
                                            }`}
                                    >
                                        Schedule / Unschedule Task
                                    </li>
                                    <li
                                        onClick={() =>
                                            setSelectedComponent(
                                                "manageReports"
                                            )
                                        }
                                        className={`hover:text-[#E4002B] cursor-pointer ${selectedComponent ===
                                            "manageReports"
                                            ? "text-[#E4002B] font-semibold"
                                            : ""
                                            }`}
                                    >
                                        Manage Reports
                                    </li>
                                </ul>
                            )}
                        </li>

                        {/* PASSBOOK */}
                        <li>
                            <button
                                onClick={() => toggleMenu("passbook")}
                                className="flex items-center justify-between w-full text-white font-medium px-3 py-2 rounded-lg hover:bg-gray-800 transition"
                            >
                                <span className="flex items-center gap-2">
                                    <FaWallet className="text-[#E4002B]" />
                                    Passbook
                                </span>

                                {openMenu === "passbook" ? (
                                    <IoIosArrowUp className="text-white" />
                                ) : (
                                    <IoIosArrowDown className="text-white" />
                                )}
                            </button>

                            {openMenu === "passbook" && (
                                <ul className="mt-2 ml-6 space-y-2 text-gray-500">
                                    <li
                                        onClick={() =>
                                            setSelectedComponent("setbudget")
                                        }
                                        className={`hover:text-[#E4002B] cursor-pointer ${selectedComponent === "setbudget"
                                            ? "text-[#E4002B] font-semibold"
                                            : ""
                                            }`}
                                    >
                                        Set Budget
                                    </li>
                                    <li
                                        onClick={() =>
                                            setSelectedComponent("manageinstallments")
                                        }
                                        className={`hover:text-[#E4002B] cursor-pointer ${selectedComponent === "manageinstallments"
                                            ? "text-[#E4002B] font-semibold"
                                            : ""
                                            }`}
                                    >
                                        Manage Installments
                                    </li>
                                </ul>
                            )}
                        </li>
                    </ul>

                    {/* BulkUpload */}
                    <div className="border-t pt-3">
                        <div
                            onClick={() => setSelectedComponent("bulkUpload")}
                            className={`flex items-center gap-2 text-white font-medium px-3 py-2 rounded-lg hover:bg-gray-800 cursor-pointer ${selectedComponent === "bulkUpload"
                                ? "text-[#E4002B] font-semibold"
                                : ""
                                }`}
                        >
                            <FaUpload className="text-[#E4002B]" />
                            Bulk Upload
                        </div>
                    </div>
                </div>

                {/* MAIN CONTENT */}
                <div className="ml-64 p-8 w-full">{renderContent()}</div>
            </div>
        </>
    );
};

export default Dashboard;

import React, { useState } from "react";
import {
  FaPlus,
  FaUpload,
  FaBriefcase,
} from "react-icons/fa";
import { IoIosArrowDown, IoIosArrowUp } from "react-icons/io";

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

// Job
import PostJob from "./PostJob";
import UpdateJob from "./UpdateJob";
import EditJob from "./EditJob";
import JobTracking from "./JobTracking";
import JobDetails from "./JobDetails";
import BulkUpload from "./BulkUpload";

const Dashboard = () => {
  const [openMenu, setOpenMenu] = useState("");
  const [selectedComponent, setSelectedComponent] = useState("welcome");
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [selectedCampaignId, setSelectedCampaignId] = useState(null);

  const toggleMenu = (menuName) => {
    setOpenMenu((prev) => {
      // If clicking same menu → close it
      if (prev === menuName) {
        if (menuName === "campaignManagement") {
          setSelectedComponent("campaignHome");   // ✅ Show home when closed
        }
        return "";
      }

      // When opening Campaign menu → default home
      if (menuName === "campaignManagement") {
        setSelectedComponent("campaignHome");
      }

      return menuName;
    });
  };

  const renderContent = () => {
    switch (selectedComponent) {
      case "client":
        return <CreateClient />;

      case "retailer":
        return <CreateRetailer />;

      case "employee":
        return <CreateEmployee />;

      /* =======================
            JOB MANAGEMENT
      ======================= */
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

      /* =======================
        ✅ CAMPAIGN MANAGEMENT
      ======================= */
      case "campaignHome":
        return <CampaignHome />;

      case "createCampaign":
        return <CreateCampaign />;

      case "assignCampaign":
        return <AssignCampaign />;

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
              setSelectedComponent("activateDeactivateCampaignDetails");
            }}
          />
        );

      case "activateDeactivateCampaignDetails":
        return (
          <ActivateDeactivateCampaign
            campaignId={selectedCampaignId}
            onBack={() => setSelectedComponent("activateDeactivateCampaign")}
          />
        );

      /* ======================= */
      case "bulkUpload":
        return <BulkUpload />;

      default:
        return (
          <div className="text-center mt-10">
            <h1 className="text-3xl font-bold text-gray-800">
              Welcome to Admin Dashboard
            </h1>
            <p className="text-gray-600 mt-2">
              Select an operation from the left sidebar to begin.
            </p>
          </div>
        );
    }
  };

  return (
    <>
      {/* TOP NAVBAR */}
      <nav className="fixed top-0 w-full z-50 bg-white shadow-md px-6 md:px-10">
        <div className="flex justify-between items-center py-4 max-w-screen-xl mx-auto relative">
          <img src="cpLogo.jpg" alt="Logo" className="h-14 cursor-pointer" />
          <h2 className="absolute left-1/2 transform -translate-x-1/2 text-xl md:text-2xl font-bold text-[#E4002B]">
            Admin Home Page
          </h2>
        </div>
      </nav>

      {/* Layout */}
      <div className="flex min-h-screen bg-gray-50 pt-20">
        {/* SIDEBAR */}
        <div className="w-70 bg-white shadow-md h-[calc(100vh-5rem)] fixed top-20 left-0 p-4 flex flex-col justify-between">
          <ul className="space-y-2">

            {/* CREATE MENU */}
            <li>
              <button
                onClick={() => toggleMenu("create")}
                className="flex items-center justify-between w-full text-gray-700 font-medium px-3 py-2 rounded-lg hover:bg-gray-100 transition"
              >
                <span className="flex items-center gap-2">
                  <FaPlus className="text-[#E4002B]" />
                  Create
                </span>

                {openMenu === "create" ? (
                  <IoIosArrowUp className="text-gray-600" />
                ) : (
                  <IoIosArrowDown className="text-gray-600" />
                )}
              </button>

              {openMenu === "create" && (
                <ul className="mt-2 ml-6 space-y-2 text-gray-600">
                  <li
                    onClick={() => setSelectedComponent("client")}
                    className={`hover:text-[#E4002B] cursor-pointer ${selectedComponent === "client" ? "text-[#E4002B] font-semibold" : ""
                      }`}
                  >
                    Client
                  </li>

                  <li
                    onClick={() => setSelectedComponent("retailer")}
                    className={`hover:text-[#E4002B] cursor-pointer ${selectedComponent === "retailer" ? "text-[#E4002B] font-semibold" : ""
                      }`}
                  >
                    Retailer
                  </li>

                  <li
                    onClick={() => setSelectedComponent("employee")}
                    className={`hover:text-[#E4002B] cursor-pointer ${selectedComponent === "employee" ? "text-[#E4002B] font-semibold" : ""
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
                className="flex items-center justify-between w-full text-gray-700 font-medium px-3 py-2 rounded-lg hover:bg-gray-100 transition"
              >
                <span className="flex items-center gap-2">
                  <FaBriefcase className="text-[#E4002B]" />
                  Job Management
                </span>

                {openMenu === "job" ? (
                  <IoIosArrowUp className="text-gray-600" />
                ) : (
                  <IoIosArrowDown className="text-gray-600" />
                )}
              </button>

              {openMenu === "job" && (
                <ul className="mt-2 ml-6 space-y-2 text-gray-600">
                  <li
                    onClick={() => setSelectedComponent("postJob")}
                    className={`hover:text-[#E4002B] cursor-pointer ${selectedComponent === "postJob" ? "text-[#E4002B] font-semibold" : ""
                      }`}
                  >
                    Post New Job
                  </li>

                  <li
                    onClick={() => setSelectedComponent("updateJob")}
                    className={`hover:text-[#E4002B] cursor-pointer ${selectedComponent === "updateJob" ? "text-[#E4002B] font-semibold" : ""
                      }`}
                  >
                    Update Existing Jobs
                  </li>

                  <li
                    onClick={() => setSelectedComponent("jobTracking")}
                    className={`hover:text-[#E4002B] cursor-pointer ${selectedComponent === "jobTracking" ? "text-[#E4002B] font-semibold" : ""
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
                className="flex items-center justify-between w-full text-gray-700 font-medium px-3 py-2 rounded-lg hover:bg-gray-100 transition"
              >
                <span className="flex items-center gap-2">
                  <FaBriefcase className="text-[#E4002B]" />
                  Campaign Management
                </span>

                {openMenu === "campaignManagement" ? (
                  <IoIosArrowUp className="text-gray-600" />
                ) : (
                  <IoIosArrowDown className="text-gray-600" />
                )}
              </button>

              {openMenu === "campaignManagement" && (
                <ul className="mt-2 ml-6 space-y-2 text-gray-600">
                  <li
                    onClick={() => setSelectedComponent("createCampaign")}
                    className={`hover:text-[#E4002B] cursor-pointer ${selectedComponent === "createCampaign" ? "text-[#E4002B] font-semibold" : ""
                      }`}
                  >
                    Create Campaign
                  </li>

                  <li
                    onClick={() => setSelectedComponent("assignCampaign")}
                    className={`hover:text-[#E4002B] cursor-pointer ${selectedComponent === "assignCampaign" ? "text-[#E4002B] font-semibold" : ""
                      }`}
                  >
                    Assign Campaign
                  </li>

                  <li
                    onClick={() => setSelectedComponent("editCampaign")}
                    className={`hover:text-[#E4002B] cursor-pointer ${selectedComponent === "editCampaign" ? "text-[#E4002B] font-semibold" : ""
                      }`}
                  >
                    Edit Campaign
                  </li>

                  <li
                    onClick={() => setSelectedComponent("activateDeactivateCampaign")}
                    className={`hover:text-[#E4002B] cursor-pointer ${selectedComponent === "activateDeactivateCampaign"
                      ? "text-[#E4002B] font-semibold"
                      : ""
                      }`}
                  >
                    Activate / Deactivate Campaign
                  </li>
                </ul>
              )}
            </li>
          </ul>

          {/* BulkUpload */}
          <div className="border-t pt-3">
            <div
              onClick={() => setSelectedComponent("bulkUpload")}
              className={`flex items-center gap-2 text-gray-700 font-medium px-3 py-2 rounded-lg hover:bg-gray-100 cursor-pointer ${selectedComponent === "bulkUpload" ? "text-[#E4002B] font-semibold" : ""
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

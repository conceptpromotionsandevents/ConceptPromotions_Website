import React, { useState } from "react";
import { FaPlus, FaUser, FaUpload } from "react-icons/fa";
import { IoIosArrowDown, IoIosArrowUp } from "react-icons/io";
import { Link } from "react-router-dom";

const Dashboard = () => {
  const [showCreateMenu, setShowCreateMenu] = useState(false);

  return (
    <>
      {/* Top Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-white shadow-md transition-all duration-300 ease-in-out px-6 md:px-10">
        <div className="flex justify-between items-center py-4 max-w-screen-xl mx-auto relative">
          {/* Logo on left */}
          <img src="cpLogo.png" alt="Logo" className="h-14 cursor-pointer" />

          {/* Center Heading */}
          <h2 className="absolute left-1/2 transform -translate-x-1/2 text-xl md:text-2xl font-bold text-[#E4002B]">
            Admin Home Page
          </h2>
        </div>
      </nav>

      {/* Main Layout */}
      <div className="flex min-h-screen bg-gray-50 pt-20">
        {/* Left Sidebar */}
        <div className="w-64 bg-white shadow-md h-[calc(100vh-5rem)] fixed top-20 left-0 p-4 flex flex-col justify-between">
          {/* Upper Section */}
          <ul className="space-y-2">
            {/* Create Menu */}
            <li>
              <button
                onClick={() => setShowCreateMenu(!showCreateMenu)}
                className="flex items-center justify-between w-full text-gray-700 font-medium px-3 py-2 rounded-lg hover:bg-gray-100 transition"
              >
                <span className="flex items-center gap-2">
                  <FaPlus className="text-[#E4002B]" />
                  Create
                </span>
                {showCreateMenu ? (
                  <IoIosArrowUp className="text-gray-600" />
                ) : (
                  <IoIosArrowDown className="text-gray-600" />
                )}
              </button>

              {/* Submenu */}
              {showCreateMenu && (
                <ul className="mt-2 ml-6 space-y-2 text-gray-600">
                  <li>
                    <Link
                      to="/clientsignup"
                      className="block hover:text-[#E4002B] cursor-pointer"
                    >
                      Client
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/retailersignup"
                      className="block hover:text-[#E4002B] cursor-pointer"
                    >
                      Retailer
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/employeesignup"
                      className="block hover:text-[#E4002B] cursor-pointer"
                    >
                      Employee
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/campaignsignup"
                      className="block hover:text-[#E4002B] cursor-pointer"
                    >
                      Campaign
                    </Link>
                  </li>
                </ul>
              )}
            </li>

            {/* Employee Operation */}
            <li>
              <button className="flex items-center gap-2 w-full text-gray-700 font-medium px-3 py-2 rounded-lg hover:bg-gray-100 transition">
                <FaUser className="text-[#E4002B]" />
                Employee Operation
              </button>
            </li>
          </ul>

          {/* Bottom Section - Bulk Upload */}
          <div className="border-t pt-3">
            <Link
              to="/bulkupload"
              className="flex items-center gap-2 text-gray-700 font-medium px-3 py-2 rounded-lg hover:bg-gray-100 transition"
            >
              <FaUpload className="text-[#E4002B]" />
              Bulk Upload
            </Link>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="ml-64 p-8 w-full">
          <h1 className="text-2xl font-semibold text-gray-800">
            Welcome to Admin Dashboard
          </h1>
          <p className="text-gray-600 mt-2">
            Select an option from the left sidebar to begin.
          </p>
        </div>
      </div>
    </>
  );
};

export default Dashboard;

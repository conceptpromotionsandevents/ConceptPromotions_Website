import React, { useState } from "react";
import {
  FaUser,
  FaPhoneAlt,
  FaEnvelope,
  FaCity,
  FaRegEdit,
} from "react-icons/fa";
import { FiMail, FiPhone, FiMapPin } from "react-icons/fi";
import { IoChevronDown, IoClose } from "react-icons/io5";

const ContactForm = () => {
  const [showOtpBox, setShowOtpBox] = useState(false);
  const [subject, setSubject] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [otherSubject, setOtherSubject] = useState("");

  const subjectOptions = [
    "Complaint",
    "Suggestion",
    "Business Query",
    "Others",
  ];

  const filteredOptions = subjectOptions.filter((opt) =>
    opt.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (value) => {
    setSubject(value);
    setDropdownOpen(false);
    setSearchTerm("");
    if (value !== "Others") {
      setOtherSubject("");
    }
  };

  const handleClickOutside = (e) => {
    if (!e.target.closest('.dropdown-container')) {
      setDropdownOpen(false);
    }
  };

  React.useEffect(() => {
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission
  };

  return (
    <section className="min-h-[80vh] bg-gradient-to-b from-black via-gray-900 to-black text-white flex justify-center items-center py-10 px-6 mt-20">
      <div className="flex flex-col md:flex-row items-stretch w-full max-w-5xl shadow-2xl rounded-lg overflow-hidden border border-gray-800">
        {/* Left Info Box */}
        <div className="bg-red-600 text-white w-full md:w-[40%] p-8 flex flex-col justify-center">
          <h3 className="text-2xl font-bold mb-6">INFO</h3>
          <div className="space-y-5 text-sm">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 p-2 rounded-full">
                <FiMail size={16} />
              </div>
              <p className="font-semibold">manager@conceptpromotions.in</p>
            </div>

            <div className="flex items-center space-x-3">
              <div className="bg-white/20 p-2 rounded-full">
                <FiPhone size={16} />
              </div>
              <p className="font-semibold">+91 9718779049</p>
            </div>

            <div className="flex items-center space-x-3">
              <div className="bg-white/20 p-2 rounded-full">
                <FiMapPin size={16} />
              </div>
              <p className="font-semibold">
                Communication Address: 32-33, WC-5, <br /> Bakshi House, Nehru Place, <br /> New Delhi - 110019
              </p>
            </div>
          </div>
        </div>

        {/* Right Form */}
        <div className="w-full md:w-[60%] bg-gray-900/90 backdrop-blur-xl p-8 relative">
          <h2 className="text-2xl font-bold mb-2 tracking-tight">
            Get in <span className="text-red-500">Touch</span>
          </h2>
          <p className="text-gray-400 mb-6 text-sm">
            We'd love to hear from you! Fill out the form below and we'll respond shortly.
          </p>

          <div className="space-y-4">
            {/* Name & City */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1 text-gray-300">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <FaUser
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="text"
                    placeholder="Enter your full name"
                    className="w-full pl-9 pr-3 py-2 rounded-md bg-gray-800/80 text-white placeholder-gray-400 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition text-sm"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-gray-300">
                  City <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <FaCity
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="text"
                    placeholder="Enter your city"
                    className="w-full pl-9 pr-3 py-2 rounded-md bg-gray-800/80 text-white placeholder-gray-400 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition text-sm"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Phone with Verify */}
            <div>
              <label className="block text-xs font-semibold mb-1 text-gray-300">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <FaPhoneAlt
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="tel"
                  placeholder="Enter your phone number"
                  className="w-full pl-9 pr-20 py-2 rounded-md bg-gray-800/80 text-white placeholder-gray-400 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition text-sm"
                  required
                />
                {/* <button
                  type="button"
                  onClick={() => setShowOtpBox(true)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-red-500 text-xs font-semibold hover:underline cursor-pointer"
                >
                  Verify
                </button> */}
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold mb-1 text-gray-300">
                Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <FaEnvelope
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="email"
                  placeholder="Enter your email address"
                  className="w-full pl-9 pr-3 py-2 rounded-md bg-gray-800/80 text-white placeholder-gray-400 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition text-sm"
                  required
                />
              </div>
            </div>

            {/* Subject - Searchable Dropdown */}
            <div className="relative dropdown-container">
              <label className="block text-xs font-semibold mb-1 text-gray-300">
                Subject <span className="text-red-500">*</span>
              </label>
              <div
                className="relative cursor-pointer"
                onClick={() => setDropdownOpen((prev) => !prev)}
              >
                <FaRegEdit
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
                <input
                  type="text"
                  placeholder="Select or search subject"
                  value={dropdownOpen ? searchTerm : subject}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  readOnly={!dropdownOpen}
                  className="w-full pl-9 pr-8 py-2 rounded-md bg-gray-800/80 text-white placeholder-gray-400 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition text-sm"
                  required
                />
                <IoChevronDown
                  size={16}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-transform duration-200 ${
                    dropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </div>

              {/* Dropdown List */}
              {dropdownOpen && (
                <div className="absolute z-20 w-full bg-gray-800 border border-gray-700 rounded-md mt-1 max-h-40 overflow-y-auto shadow-lg">
                  {filteredOptions.length > 0 ? (
                    filteredOptions.map((option, index) => (
                      <div
                        key={index}
                        onClick={() => handleSelect(option)}
                        className="px-3 py-2 text-sm hover:bg-red-600 cursor-pointer"
                      >
                        {option}
                      </div>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-gray-400 text-sm">No match found</div>
                  )}
                </div>
              )}
            </div>

            {/* Other Subject Input */}
            {subject === "Others" && (
              <div>
                <label className="block text-xs font-semibold mb-1 text-gray-300">
                  Please Specify <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter your subject"
                  value={otherSubject}
                  onChange={(e) => setOtherSubject(e.target.value)}
                  className="w-full px-3 py-2 rounded-md bg-gray-800/80 text-white placeholder-gray-400 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition text-sm"
                  required
                />
              </div>
            )}

            {/* Message */}
            <div>
              <label className="block text-xs font-semibold mb-1 text-gray-300">
                Message <span className="text-red-500">*</span>
              </label>
              <textarea
                placeholder="Write your message..."
                rows="3"
                className="w-full px-3 py-2 rounded-md bg-gray-800/80 text-white placeholder-gray-400 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition resize-none text-sm"
                required
              />
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              className="w-full bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-600 text-white font-semibold py-2 rounded-md transition-all duration-300 transform hover:scale-[1.02] shadow-md text-sm"
            >
              Send Message
            </button>
          </div>

          {/* OTP Modal */}
          {showOtpBox && (
            <div className="fixed inset-0 flex justify-center items-center bg-black/60 z-50">
              <div className="bg-gray-900 border border-gray-700 p-6 rounded-lg shadow-lg w-80 text-center">
                <h3 className="text-lg font-semibold mb-3 text-white">Enter OTP</h3>
                <input
                  type="text"
                  maxLength="6"
                  placeholder="Enter 6-digit OTP"
                  className="w-full px-3 py-2 rounded-md bg-gray-800 text-white placeholder-gray-400 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition text-sm mb-4"
                />
                <div className="flex justify-center space-x-4">
                  <button
                    onClick={() => setShowOtpBox(false)}
                    className="px-4 py-2 text-sm bg-gray-700 rounded-md hover:bg-gray-600 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => setShowOtpBox(false)}
                    className="px-4 py-2 text-sm bg-red-600 rounded-md hover:bg-red-500 transition"
                  >
                    Verify
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default ContactForm;
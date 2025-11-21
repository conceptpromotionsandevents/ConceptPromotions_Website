import React, { useState, useRef, useEffect } from "react";
import {
  FaUser,
  FaPhoneAlt,
  FaEnvelope,
  FaCity,
  FaRegEdit,
} from "react-icons/fa";
import { FiMail, FiPhone, FiMapPin } from "react-icons/fi";
import { IoChevronDown } from "react-icons/io5";

const ContactForm = () => {
  const [subject, setSubject] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const dropdownRef = useRef(null);

  const subjectOptions = ["Complaint", "Suggestion", "Business Query", "Others"];

  const filteredOptions = subjectOptions.filter((opt) =>
    opt.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (value) => {
    setSubject(value);
    setDropdownOpen(false);
    setSearchTerm("");
  };

  /* Close dropdown when click outside */
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <section className="min-h-screen bg-white pt-6 pb-16 px-6">
      <h2 className="text-3xl font-bold mb-8 text-[#E4002B] ml-3">Need Help?</h2>
      <div className="max-w-4xl mx-auto space-y-10">

        {/* INFO SECTION */}
        <div className="bg-[#E4002B] text-white p-8 rounded-xl shadow-md">
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
                WC-5, Bakshi House, <br /> Nehru Place, New Delhi - 110019
              </p>
            </div>
          </div>
        </div>

        {/* CONTACT FORM SECTION */}
        <div className="p-8 rounded-xl shadow-md border bg-white">
          <h2 className="text-3xl font-bold mb-2">
            Get in <span className="text-[#E4002B]">Touch</span>
          </h2>
          <p className="text-gray-600 text-sm mb-6">
            We'd love to hear from you!
          </p>

          <form className="space-y-5">

            {/* Full Name + City */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs mb-1 font-semibold text-gray-700">
                  Full Name
                </label>
                <div className="relative">
                  <FaUser
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="text"
                    placeholder="Enter your name"
                    className="w-full pl-9 pr-3 py-2 rounded-md border border-gray-300 
                               focus:outline-none focus:ring-2 focus:ring-[#E4002B] transition text-sm"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs mb-1 font-semibold text-gray-700">
                  City
                </label>
                <div className="relative">
                  <FaCity
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="text"
                    placeholder="Enter your city"
                    className="w-full pl-9 pr-3 py-2 rounded-md border border-gray-300 
                               focus:outline-none focus:ring-2 focus:ring-[#E4002B] transition text-sm"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs mb-1 font-semibold text-gray-700">
                Phone Number
              </label>
              <div className="relative">
                <FaPhoneAlt
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="tel"
                  placeholder="+91 12345 67890"
                  className="w-full pl-9 pr-3 py-2 rounded-md border border-gray-300 
                             focus:outline-none focus:ring-2 focus:ring-[#E4002B] transition text-sm"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs mb-1 font-semibold text-gray-700">
                Email Address
              </label>
              <div className="relative">
                <FaEnvelope
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="email"
                  placeholder="abc@example.com"
                  className="w-full pl-9 pr-3 py-2 rounded-md border border-gray-300 
                             focus:outline-none focus:ring-2 focus:ring-[#E4002B] transition text-sm"
                  required
                />
              </div>
            </div>

            {/* Subject Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <label className="block text-xs mb-1 font-semibold text-gray-700">
                Subject
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
                  className="w-full pl-9 pr-8 py-2 rounded-md border border-gray-300 
                             focus:outline-none focus:ring-2 focus:ring-[#E4002B] transition text-sm"
                  required
                />
                <IoChevronDown
                  size={16}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-transform ${dropdownOpen ? "rotate-180" : ""
                    }`}
                />
              </div>

              {dropdownOpen && (
                <div className="absolute z-20 w-full bg-white border border-gray-300 
                                rounded-md mt-1 max-h-40 overflow-y-auto shadow-md">
                  {filteredOptions.length > 0 ? (
                    filteredOptions.map((option, index) => (
                      <div
                        key={index}
                        onClick={() => handleSelect(option)}
                        className="px-3 py-2 text-sm hover:bg-[#E4002B] hover:text-white cursor-pointer"
                      >
                        {option}
                      </div>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-gray-400 text-sm">
                      No match found
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Message */}
            <div>
              <label className="block text-xs mb-1 font-semibold text-gray-700">
                Message
              </label>
              <textarea
                placeholder="Write your message..."
                rows="3"
                className="w-full px-3 py-2 rounded-md border border-gray-300 
                           focus:outline-none focus:ring-2 focus:ring-[#E4002B] transition resize-none text-sm"
                required
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="w-full bg-[#E4002B] hover:bg-[#C00026] text-white font-semibold py-2 rounded-md transition text-sm"
            >
              Send Message
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default ContactForm;

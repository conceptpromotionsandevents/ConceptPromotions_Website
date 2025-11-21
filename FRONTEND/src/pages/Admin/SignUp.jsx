import React, { useState } from "react";
import {
  FaEnvelope,
  FaLock,
  FaUser,
  FaPhoneAlt,
} from "react-icons/fa";
import { IoEyeOffOutline, IoEyeOutline } from "react-icons/io5";
import { Link } from "react-router-dom";

const SignUp = () => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <>
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-white shadow-md transition-all duration-300 ease-in-out px-6 md:px-10">
        <div className="flex justify-between items-center py-4 max-w-screen-xl mx-auto">
          {/* Logo on left */}
          <img
            src="cpLogo.jpg"
            alt="Logo"
            className="h-14 cursor-pointer"
          />

          {/* Center Heading */}
          <h2 className="absolute left-1/2 transform -translate-x-1/2 text-xl md:text-2xl font-bold text-[#E4002B]">
            Admin Registration Page
          </h2>
        </div>
      </nav>

      {/* Main Section */}
      <div className="min-h-screen flex justify-center items-center bg-white px-4 pt-28 pb-10">
        <div className="w-full max-w-sm">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold">Create an Account</h1>
            <p className="text-gray-600 mt-2">
              Join us and start your journey today.
            </p>
          </div>

          {/* Form */}
          <form className="space-y-5">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium mb-1">Full Name</label>
              <div className="relative">
                <FaUser className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Type name here"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#E4002B] focus:border-[#E4002B]"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <div className="relative">
                <FaEnvelope className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="email"
                  placeholder="example@gmail.com"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#E4002B] focus:border-[#E4002B]"
                  required
                />
              </div>
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-sm font-medium mb-1">Phone Number</label>
              <div className="relative">
                <FaPhoneAlt className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="tel"
                  placeholder="123-456-7890"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#E4002B] focus:border-[#E4002B]"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium mb-1">Password</label>
              <div className="relative">
                <FaLock className="absolute left-3 top-3 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="At least 8 characters"
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#E4002B] focus:border-[#E4002B]"
                  required
                />
                <div
                  className="absolute right-3 top-3 text-gray-500 cursor-pointer"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <IoEyeOffOutline /> : <IoEyeOutline />}
                </div>
              </div>
            </div>

            {/* Sign Up Button */}
            <button
              type="submit"
              className="w-full bg-[#E4002B] text-white py-2 rounded-lg font-medium hover:bg-[#C3002B] transition"
            >
              Sign Up
            </button>
          </form>

          {/* Footer */}
          <p className="text-center text-gray-600 text-sm mt-6">
            Already have an account?{" "}
            <Link to="/signin" className="text-blue-500 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </>
  );
};

export default SignUp;

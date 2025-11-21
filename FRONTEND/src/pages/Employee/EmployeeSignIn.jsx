import React, { useState } from "react";
import { FaGoogle, FaPhoneAlt, FaMicrosoft, FaEnvelope, FaLock } from "react-icons/fa";
import { IoEyeOffOutline, IoEyeOutline } from "react-icons/io5";
import { Link } from "react-router-dom";

const SignIn = () => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <>
      <nav className="fixed top-0 w-full z-50 bg-white shadow-md transition-all duration-300 ease-in-out px-6 md:px-10">
        <div className="flex justify-between items-center py-4 max-w-screen-xl mx-auto">
          {/* Logo on left */}
          <img src="cpLogo.jpg" alt="Logo" className="h-14 cursor-pointer" />

          {/* Center Heading */}
          <h2 className="absolute left-1/2 transform -translate-x-1/2 text-xl md:text-2xl font-bold text-[#E4002B]">
            Employee Login Page
          </h2>
        </div>
      </nav>

      <div className="min-h-screen flex justify-center items-center bg-white px-4 pt-28 pb-10">
        <div className="w-full max-w-sm">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold">Welcome !</h1>
            <p className="text-gray-600 mt-2">
              Login is quick and easy. <br />
              Let's get started on something great.
            </p>
          </div>

          {/* Form */}
          <form className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <div className="relative">
                <FaEnvelope className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="email"
                  placeholder="Example@gmail.com"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#E4002B]"
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
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#E4002B]"
                  required
                />
                <div
                  className="absolute right-3 top-3 text-gray-500 cursor-pointer"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <IoEyeOffOutline /> : <IoEyeOutline />}
                </div>
              </div>
              <p className="text-right text-sm text-blue-500 mt-1 cursor-pointer hover:underline">
                forgot the password?
              </p>
            </div>

            {/* Login Button */}
            <Link to="/employee-dashboard">
              <button
                type="button"
                className="w-full bg-[#E4002B] text-white py-2 rounded-lg font-medium hover:bg-[#C3002B] transition"
              >
                Login
              </button>
            </Link>
          </form>

          {/* Divider */}
          <div className="flex items-center my-6">
            <hr className="flex-grow border-gray-300" />
            <span className="mx-2 text-gray-500 text-sm">OR</span>
            <hr className="flex-grow border-gray-300" />
          </div>

          {/* Social Login */}
          <div className="flex flex-col items-center space-y-3">
            <div className="flex justify-center space-x-4">
              <button className="border border-gray-300 rounded-lg p-2 hover:bg-gray-100">
                <FaGoogle className="text-xl text-gray-700" />
              </button>
              <button className="border border-gray-300 rounded-lg p-2 hover:bg-gray-100">
                <FaMicrosoft className="text-xl text-gray-700" />
              </button>
              <button className="border border-gray-300 rounded-lg p-2 hover:bg-gray-100">
                <FaPhoneAlt className="text-xl text-gray-700" />
              </button>
            </div>

            {/* Caption below icons */}
            <p className="text-gray-500 text-sm">Choose one of the methods below to quickly login.</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default SignIn;

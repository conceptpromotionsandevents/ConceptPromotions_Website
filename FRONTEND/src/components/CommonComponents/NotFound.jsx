import React from "react";
import { useNavigate } from "react-router-dom";
import { FaHome } from "react-icons/fa";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-red-950 flex items-center justify-center px-6 pt-20">
      <div className="text-center max-w-2xl">
        {/* 404 Number */}
        <h1 className="text-9xl md:text-[12rem] font-bold text-red-500 mb-4">
          404
        </h1>

        {/* Error Message */}
        <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
          Oops! Page Not Found
        </h2>

        <p className="text-gray-300 text-lg md:text-xl mb-8 leading-relaxed">
          Sorry, the page you're looking for doesn't exist or has been moved.
          Let's get you back on track!
        </p>

        {/* Action Button */}
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold px-8 py-3 rounded-lg transition duration-300 mx-auto cursor-pointer"
        >
          <FaHome className="text-xl" />
          Go to Homepage
        </button>
      </div>
    </div>
  );
};

export default NotFound;

import React, { useState } from "react";
import {
  FaEnvelope,
  FaUser,
  FaPhoneAlt,
  FaBuilding,
} from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const CreateClient = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [contactNo, setContactNo] = useState("");
  const [organizationName, setOrganizationName] = useState("");

  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setName("");
    setEmail("");
    setContactNo("");
    setOrganizationName("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!name || !email || !organizationName) {
      toast.error("Please fill all required fields!", { theme: "dark" });
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        "https://supreme-419p.onrender.com/api/admin/add-client-admin",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name,
            email,
            contactNo,
            organizationName,
            password: "", // sending blank — backend must handle
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || "Error creating client", {
          theme: "dark",
        });
      } else {
        toast.success("✅ Client created successfully!", {
          theme: "dark",
        });
        resetForm();
      }
    } catch (error) {
      console.error(error);
      toast.error("Server error", { theme: "dark" });
    }

    setLoading(false);
  };

  return (
    <>
      <ToastContainer />

      <div className="w-full max-w-lg bg-white shadow-md rounded-xl p-8 mx-auto">
        {/* Header */}
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-[#E4002B]">
            Create Client
          </h1>
          <p className="text-gray-600 mt-1 text-sm">
            Add a new client for your organization.
          </p>
        </div>

        {/* Form */}
        <form className="space-y-5" onSubmit={handleSubmit}>
          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <FaUser className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Type name here"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#E4002B]"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <FaEnvelope className="absolute left-3 top-3 text-gray-400" />
              <input
                type="email"
                placeholder="example@gmail.com"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#E4002B]"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Phone Number
            </label>
            <div className="relative">
              <FaPhoneAlt className="absolute left-3 top-3 text-gray-400" />
              <input
                type="tel"
                placeholder="123-456-7890"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#E4002B]"
                value={contactNo}
                onChange={(e) => setContactNo(e.target.value)}
              />
            </div>
          </div>

          {/* Organization Name */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Organization Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <FaBuilding className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Organization Name"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#E4002B]"
                required
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#E4002B] text-white py-2 rounded-lg font-medium hover:bg-[#C3002B] transition disabled:opacity-60"
          >
            {loading ? "Creating..." : "Create Client"}
          </button>
        </form>
      </div>
    </>
  );
};

export default CreateClient;

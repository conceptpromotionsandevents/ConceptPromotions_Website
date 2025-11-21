import React, { useState } from "react";
import { FaEnvelope, FaLock } from "react-icons/fa";
import { IoEyeOffOutline, IoEyeOutline } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const SignIn = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(
        "https://supreme-419p.onrender.com/api/admin/login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || "Login failed", {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          theme: "dark",
        });
        setLoading(false);
        return;
      }

      // Save token and user info
      localStorage.setItem("token", data.token);
      localStorage.setItem("adminName", data.admin?.name || "");
      localStorage.setItem("adminEmail", data.admin?.email || "");

      toast.success("Login successful! ✅", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "dark",
      });

      setTimeout(() => navigate("/dashboard"), 1500);
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Something went wrong. Please try again.", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "dark",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ToastContainer />

      <nav className="fixed top-0 w-full z-50 bg-white shadow-md px-6 md:px-10">
        <div className="flex justify-between items-center py-4 max-w-screen-xl mx-auto">
          <img src="cpLogo.jpg" alt="Logo" className="h-14 cursor-pointer" />
          <h2 className="absolute left-1/2 transform -translate-x-1/2 text-xl md:text-2xl font-bold text-[#E4002B]">
            Admin Login Page
          </h2>
        </div>
      </nav>

      <div className="min-h-screen flex justify-center items-center bg-white px-4 pt-28 pb-10">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold">Welcome!</h1>
            <p className="text-gray-600 mt-2">
              Login is quick and easy. <br /> Let's get started on something
              great.
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleLogin}>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
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

            <div>
              <label className="block text-sm font-medium mb-1">Password</label>
              <div className="relative">
                <FaLock className="absolute left-3 top-3 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="At least 8 characters"
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#E4002B]"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <div
                  className="absolute right-3 top-3 text-gray-500 cursor-pointer"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <IoEyeOffOutline /> : <IoEyeOutline />}
                </div>
              </div>
              <p className="text-right text-sm text-blue-500 mt-1 cursor-pointer hover:underline">
                Forgot password?
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#E4002B] text-white py-2 rounded-lg font-medium hover:bg-[#C3002B] transition disabled:opacity-60"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default SignIn;

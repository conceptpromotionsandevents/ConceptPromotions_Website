import { useEffect, useState } from "react";
import { FaLock, FaPhone } from "react-icons/fa";
import { IoEyeOffOutline, IoEyeOutline } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { API_URL } from "../../url/base";

const ForgotPassword = () => {
    const [step, setStep] = useState(1); // 1: Phone, 2: OTP, 3: New Password
    const [phone, setPhone] = useState("");
    const [otp, setOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [otpTimer, setOtpTimer] = useState(0);

    const navigate = useNavigate();

    // OTP Timer
    useEffect(() => {
        if (otpTimer > 0) {
            const interval = setInterval(() => {
                setOtpTimer((prev) => prev - 1);
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [otpTimer]);

    // Step 1: Submit phone number
    const handlePhoneSubmit = async (e) => {
        e.preventDefault();

        if (!/^\d{10}$/.test(phone)) {
            toast.error("Please enter a valid 10-digit phone number", {
                theme: "dark",
            });
            return;
        }

        setLoading(true);

        try {
            console.log("API_URL:", API_URL); // Add this line
            console.log("Full URL:", `${API_URL}/password-reset/initiate`); // Add this

            const response = await fetch(`${API_URL}/password-reset/initiate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phone }),
            });

            const data = await response.json();

            if (!response.ok) {
                toast.error(data.message || "Failed to initiate reset", {
                    theme: "dark",
                });
                setLoading(false);
                return;
            }

            if (data.phoneExists) {
                setStep(2);
                toast.success("Phone verified. Please request OTP", {
                    theme: "dark",
                });
            } else {
                toast.info(data.message, { theme: "dark" });
            }
        } catch (err) {
            console.error("Phone verification error:", err);
            toast.error("Server error. Try again later.", { theme: "dark" });
        }

        setLoading(false);
    };

    // Step 2: Send OTP
    const handleSendOTP = async () => {
        setLoading(true);

        try {
            const response = await fetch(`${API_URL}/otp/send`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phone, type: "verification" }),
            });

            const data = await response.json();

            if (!response.ok) {
                toast.error(data.message || "Failed to send OTP", {
                    theme: "dark",
                });
                setLoading(false);
                return;
            }

            toast.success("OTP sent successfully!", { theme: "dark" });
            setOtpTimer(60); // 60 seconds cooldown

            if (process.env.NODE_ENV === "development" && data.otp) {
                console.log("OTP:", data.otp);
            }
        } catch (err) {
            console.error("OTP send error:", err);
            toast.error("Failed to send OTP", { theme: "dark" });
        }

        setLoading(false);
    };

    // Step 3: Verify OTP and reset password
    const handleResetPassword = async (e) => {
        e.preventDefault();

        if (otp.length !== 6) {
            toast.error("Please enter a valid 6-digit OTP", { theme: "dark" });
            return;
        }

        if (newPassword.length < 6) {
            toast.error("Password must be at least 6 characters", {
                theme: "dark",
            });
            return;
        }

        if (newPassword !== confirmPassword) {
            toast.error("Passwords do not match", { theme: "dark" });
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(`${API_URL}/password-reset/reset`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phone, otp, newPassword }),
            });

            const data = await response.json();

            if (!response.ok) {
                toast.error(data.message || "Failed to reset password", {
                    theme: "dark",
                });
                setLoading(false);
                return;
            }

            toast.success("Password reset successfully!", { theme: "dark" });

            setTimeout(() => {
                navigate("/retailersignin");
            }, 1500);
        } catch (err) {
            console.error("Password reset error:", err);
            toast.error("Server error. Try again later.", { theme: "dark" });
        }

        setLoading(false);
    };

    return (
        <>
            <ToastContainer />

            {/* NAVBAR */}
            <nav className="fixed top-0 w-full z-50 bg-black shadow-md px-6 md:px-10">
                <div className="flex justify-between items-center py-4 max-w-screen-xl mx-auto">
                    <img
                        src="https://res.cloudinary.com/dltqp0vgg/image/upload/v1768037896/supreme_chdev9.png"
                        alt="Logo"
                        className="h-14 cursor-pointer"
                    />
                    <h2 className="absolute left-1/2 transform -translate-x-1/2 text-xl md:text-2xl font-bold text-[#E4002B]">
                        Reset Password
                    </h2>
                </div>
            </nav>

            {/* MAIN */}
            <div className="min-h-screen flex justify-center items-center bg-[#171717] px-4 pt-28 pb-10">
                <div className="w-full max-w-sm">
                    {/* Step 1: Phone Number */}
                    {step === 1 && (
                        <form
                            onSubmit={handlePhoneSubmit}
                            className="space-y-5"
                        >
                            <div className="mb-6 text-center">
                                <h1 className="text-2xl font-bold text-white">
                                    Forgot Password?
                                </h1>
                                <p className="text-gray-300 mt-2">
                                    Enter your registered phone number
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-200">
                                    Phone Number{" "}
                                    <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <FaPhone className="absolute left-3 top-3 text-gray-400" />
                                    <input
                                        type="tel"
                                        placeholder="10-digit phone number"
                                        value={phone}
                                        maxLength={10}
                                        onChange={(e) =>
                                            setPhone(
                                                e.target.value.replace(
                                                    /\D/g,
                                                    "",
                                                ),
                                            )
                                        }
                                        className="w-full pl-10 pr-4 py-2 bg-[#222] text-white border border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-[#E4002B]"
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-[#E4002B] text-white py-2 rounded-lg font-medium hover:bg-[#C3002B] transition disabled:opacity-60"
                            >
                                {loading ? "Verifying..." : "Continue"}
                            </button>

                            <p
                                className="text-center text-sm text-blue-400 cursor-pointer hover:underline"
                                onClick={() => navigate("/retailer-signin")}
                            >
                                Back to Login
                            </p>
                        </form>
                    )}

                    {/* Step 2: OTP Verification */}
                    {step === 2 && (
                        <form
                            onSubmit={handleResetPassword}
                            className="space-y-5"
                        >
                            <div className="mb-6 text-center">
                                <h1 className="text-2xl font-bold text-white">
                                    Enter OTP & New Password
                                </h1>
                                <p className="text-gray-300 mt-2">
                                    We'll send an OTP to {phone}
                                </p>
                            </div>

                            {/* Send OTP Button */}
                            <button
                                type="button"
                                onClick={handleSendOTP}
                                disabled={loading || otpTimer > 0}
                                className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-60"
                            >
                                {otpTimer > 0
                                    ? `Resend in ${otpTimer}s`
                                    : loading
                                      ? "Sending..."
                                      : "Send OTP"}
                            </button>

                            {/* OTP Input */}
                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-200">
                                    OTP <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="6-digit OTP"
                                    value={otp}
                                    maxLength={6}
                                    onChange={(e) =>
                                        setOtp(
                                            e.target.value.replace(/\D/g, ""),
                                        )
                                    }
                                    className="w-full px-4 py-2 bg-[#222] text-white border border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-[#E4002B]"
                                    required
                                />
                            </div>

                            {/* New Password */}
                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-200">
                                    New Password{" "}
                                    <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <FaLock className="absolute left-3 top-3 text-gray-400" />
                                    <input
                                        type={
                                            showPassword ? "text" : "password"
                                        }
                                        placeholder="Enter new password"
                                        value={newPassword}
                                        onChange={(e) =>
                                            setNewPassword(e.target.value)
                                        }
                                        className="w-full pl-10 pr-10 py-2 bg-[#222] text-white border border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-[#E4002B]"
                                        required
                                    />
                                    <div
                                        className="absolute right-3 top-3 text-gray-400 cursor-pointer"
                                        onClick={() =>
                                            setShowPassword(!showPassword)
                                        }
                                    >
                                        {showPassword ? (
                                            <IoEyeOffOutline />
                                        ) : (
                                            <IoEyeOutline />
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Confirm Password */}
                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-200">
                                    Confirm Password{" "}
                                    <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <FaLock className="absolute left-3 top-3 text-gray-400" />
                                    <input
                                        type={
                                            showConfirmPassword
                                                ? "text"
                                                : "password"
                                        }
                                        placeholder="Confirm new password"
                                        value={confirmPassword}
                                        onChange={(e) =>
                                            setConfirmPassword(e.target.value)
                                        }
                                        className="w-full pl-10 pr-10 py-2 bg-[#222] text-white border border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-[#E4002B]"
                                        required
                                    />
                                    <div
                                        className="absolute right-3 top-3 text-gray-400 cursor-pointer"
                                        onClick={() =>
                                            setShowConfirmPassword(
                                                !showConfirmPassword,
                                            )
                                        }
                                    >
                                        {showConfirmPassword ? (
                                            <IoEyeOffOutline />
                                        ) : (
                                            <IoEyeOutline />
                                        )}
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-[#E4002B] text-white py-2 rounded-lg font-medium hover:bg-[#C3002B] transition disabled:opacity-60"
                            >
                                {loading ? "Resetting..." : "Reset Password"}
                            </button>

                            <p
                                className="text-center text-sm text-blue-400 cursor-pointer hover:underline"
                                onClick={() => {
                                    setStep(1);
                                    setOtp("");
                                    setNewPassword("");
                                    setConfirmPassword("");
                                }}
                            >
                                Change Phone Number
                            </p>
                        </form>
                    )}
                </div>
            </div>
        </>
    );
};

export default ForgotPassword;

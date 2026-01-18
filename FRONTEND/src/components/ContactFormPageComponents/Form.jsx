import React, { useState } from "react";
import { API_URL } from "../../url/base";
import {
  FaUser,
  FaPhoneAlt,
  FaEnvelope,
  FaCity,
  FaRegEdit,
} from "react-icons/fa";
import { FiMail, FiPhone, FiMapPin } from "react-icons/fi";
import { IoChevronDown, IoClose } from "react-icons/io5";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";


const ContactForm = () => {
  const [showOtpBox, setShowOtpBox] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [otherSubject, setOtherSubject] = useState("");
  
  // OTP states
  const [otpValue, setOtpValue] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  const [formData, setFormData] = useState({
    from_name: "",
    city: "",
    phone_number: "",
    from_email: "",
    subject: "",
    message: ""
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

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
    setFormData(prev => ({ ...prev, subject: value }));
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Only allow digits for phone number
    if (name === "phone_number") {
      const cleaned = value.replace(/\D/g, "");
      setFormData(prev => ({ ...prev, [name]: cleaned }));
      
      // Reset verification if phone number changes
      if (isVerified && cleaned !== formData.phone_number) {
        setIsVerified(false);
        setOtpSent(false);
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  React.useEffect(() => {
    if (submitStatus === "success" || submitStatus === "error") {
      const timer = setTimeout(() => {
        setSubmitStatus(null);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [submitStatus]);

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

  // Send OTP Handler
  const handleSendOtp = async () => {
    // Validate phone number
    if (!formData.phone_number || !/^\d{10}$/.test(formData.phone_number)) {
      toast.error("Please enter a valid 10-digit phone number");
      return;
    }

    setIsSendingOtp(true);

    try {
      const res = await fetch(`${API_URL}/otp/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          phone: formData.phone_number,
          type: 'verification'
        })
      });

      const data = await res.json();

      if (data.success) {
        toast.success("OTP sent successfully!");
        setShowOtpBox(true);
        setOtpSent(true);
        
        // Show OTP in development mode
        if (data.otp) {
          toast.info(`Dev OTP: ${data.otp}`, { autoClose: 10000 });
        }
      } else {
        toast.error(data.message || "Failed to send OTP");
      }
    } catch (error) {
      console.error('OTP Send Error:', error);
      toast.error("Failed to send OTP. Please try again.");
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Verify OTP Handler
  const handleVerifyOtp = async () => {
    if (!otpValue || otpValue.length !== 6) {
      toast.error("Please enter a 6-digit OTP");
      return;
    }

    setIsVerifyingOtp(true);

    try {
      const res = await fetch(`${API_URL}/otp/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          phone: formData.phone_number,
          otp: otpValue 
        })
      });

      const data = await res.json();

      if (data.success) {
        toast.success("Phone verified successfully!");
        setIsVerified(true);
        setShowOtpBox(false);
        setOtpValue("");
      } else {
        toast.error(data.message || "Invalid OTP");
      }
    } catch (error) {
      console.error('OTP Verify Error:', error);
      toast.error("Verification failed. Please try again.");
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // Resend OTP Handler
  const handleResendOtp = async () => {
    setOtpValue("");
    await handleSendOtp();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);

    const finalSubject = formData.subject === "Others" ? otherSubject : formData.subject;

    // Frontend validation
    if (
      !formData.from_name ||
      !formData.city ||
      !formData.phone_number ||
      !formData.from_email ||
      !finalSubject ||
      !formData.message
    ) {
      toast.error("Please fill in all required fields");
      setIsSubmitting(false);
      return;
    }

    if (!/^\d{10}$/.test(formData.phone_number)) {
      toast.error("Please enter a valid 10-digit phone number");
      setIsSubmitting(false);
      return;
    }

    // Check if phone is verified
    if (!isVerified) {
      toast.error("Please verify your phone number first");
      setIsSubmitting(false);
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.from_email)) {
      toast.error("Please enter a valid email address");
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/contact/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName: formData.from_name,
          city: formData.city,
          phone: formData.phone_number,
          email: formData.from_email,
          subject: finalSubject,
          message: formData.message,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Failed to send message");
        setSubmitStatus("error");
        setIsSubmitting(false);
        return;
      }

      // Success
      toast.success("Message sent successfully!");
      setSubmitStatus("success");

      // Reset form
      setFormData({
        from_name: "",
        city: "",
        phone_number: "",
        from_email: "",
        subject: "",
        message: "",
      });
      setOtherSubject("");
      setIsVerified(false);
      setOtpSent(false);
      setOtpValue("");

    } catch (err) {
      console.error("CONTACT API ERROR:", err);
      toast.error("Something went wrong. Try again later.");
      setSubmitStatus("error");
    }

    setIsSubmitting(false);
  };

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} theme="dark" />

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
                  Communication Address: 40-41, WC-5, <br /> Bakshi House, Nehru Place, <br /> New Delhi - 110019
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

            <form onSubmit={handleSubmit}>
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
                        name="from_name"
                        value={formData.from_name}
                        onChange={handleInputChange}
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
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
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
                      name="phone_number"
                      maxLength={10}
                      value={formData.phone_number}
                      onChange={handleInputChange}
                      placeholder="Enter your phone number"
                      disabled={isVerified}
                      className={`w-full pl-9 pr-20 py-2 rounded-md bg-gray-800/80 text-white placeholder-gray-400 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition text-sm ${
                        isVerified ? 'opacity-70 cursor-not-allowed' : ''
                      }`}
                      required
                    />
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={isVerified || isSendingOtp || formData.phone_number.length !== 10}
                      className={`absolute right-2 top-1/2 -translate-y-1/2 text-xs font-semibold transition cursor-pointer ${
                        isVerified 
                          ? 'text-green-500 cursor-default' 
                          : isSendingOtp || formData.phone_number.length !== 10
                          ? 'text-gray-500 cursor-not-allowed'
                          : 'text-red-500 hover:underline cursor-pointer'
                      }`}
                    >
                      {isVerified ? '✓ Verified' : isSendingOtp ? 'Sending...' : 'Verify'}
                    </button>
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
                      name="from_email"
                      value={formData.from_email}
                      onChange={handleInputChange}
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
                      name="subject"
                      placeholder="Select or search subject"
                      value={dropdownOpen ? searchTerm : formData.subject}
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
                {formData.subject === "Others" && (
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
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full px-3 py-2 rounded-md bg-gray-800/80 text-white placeholder-gray-400 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition resize-none text-sm"
                    required
                  />
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isSubmitting || !isVerified}
                  className={`
                    w-full text-white font-semibold py-2 rounded-md shadow-md text-sm transition-all duration-300 transform cursor-pointer
                    ${isSubmitting || !isVerified
                      ? "bg-gray-500 cursor-not-allowed"
                      : "bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-600"
                    }
                  `}
                >
                  {isSubmitting ? "Sending..." : !isVerified ? "Verify Phone First" : "Send Message"}
                </button>
                
                {submitStatus === 'success' && (
                  <div className="text-green-400 text-sm text-center">
                    ✓ Message sent successfully!
                  </div>
                )}
                {submitStatus === 'error' && (
                  <div className="text-red-400 text-sm text-center">
                    ✗ Failed to send. Please try again.
                  </div>
                )}
              </div>
            </form>

            {/* OTP Modal */}
            {showOtpBox && (
              <div className="fixed inset-0 flex justify-center items-center bg-black/60 z-50 backdrop-blur-sm">
                <div className="bg-gray-900 border border-gray-700 p-6 rounded-lg shadow-lg w-80 text-center relative">
                  <button
                    onClick={() => {
                      setShowOtpBox(false);
                      setOtpValue("");
                    }}
                    className="absolute top-3 right-3 text-gray-400 hover:text-white transition"
                  >
                    <IoClose size={20} />
                  </button>
                  
                  <h3 className="text-lg font-semibold mb-2 text-white">Enter OTP</h3>
                  <p className="text-gray-400 text-xs mb-4">
                    OTP sent to <span className="text-white font-semibold">{formData.phone_number}</span>
                  </p>
                  
                  <input
                    type="text"
                    maxLength="6"
                    value={otpValue}
                    onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter 6-digit OTP"
                    className="w-full px-3 py-2 rounded-md bg-gray-800 text-white placeholder-gray-400 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition text-sm mb-4 text-center tracking-widest text-lg"
                  />
                  
                  <div className="flex justify-center space-x-3 mb-3">
                    <button
                      onClick={() => {
                        setShowOtpBox(false);
                        setOtpValue("");
                      }}
                      className="px-4 py-2 text-sm bg-gray-700 rounded-md hover:bg-gray-600 transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleVerifyOtp}
                      disabled={isVerifyingOtp || otpValue.length !== 6}
                      className={`px-4 py-2 text-sm rounded-md transition cursor-pointer ${
                        isVerifyingOtp || otpValue.length !== 6
                          ? 'bg-gray-600 cursor-not-allowed'
                          : 'bg-red-600 hover:bg-red-500'
                      }`}
                    >
                      {isVerifyingOtp ? 'Verifying...' : 'Verify'}
                    </button>
                  </div>
                  
                  <button
                    onClick={handleResendOtp}
                    disabled={isSendingOtp}
                    className="text-red-500 text-xs hover:underline disabled:text-gray-500 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isSendingOtp ? 'Sending...' : 'Resend OTP'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
};

export default ContactForm;

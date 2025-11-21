import React, { useState, useEffect, useRef } from "react";
import {
  FaUser,
  FaPhoneAlt,
  FaEnvelope,
  FaCity,
  FaBriefcase,
  FaUpload,
  FaTimes,
  FaChevronDown,
  FaSpinner,
} from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const JobSeekers = () => {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [selectedJob, setSelectedJob] = useState("");
  const [selectedJobId, setSelectedJobId] = useState("");
  const [jobs, setJobs] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("Upload your CV");
  const [fileSelected, setFileSelected] = useState(false);
  const [loading, setLoading] = useState(false); // ✅ Loading state
  const [showTerms, setShowTerms] = useState(false);
  const dropdownRef = useRef(null);

  // ✅ Fetch job roles
  useEffect(() => {
    fetch("https://supreme-419p.onrender.com/api/career/jobs")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setJobs(data);
        else if (Array.isArray(data.jobs)) setJobs(data.jobs);
      })
      .catch((err) => console.error("Error fetching jobs:", err));
  }, []);

  // ✅ Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ✅ File change
  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      setFileName(selected.name);
      setFileSelected(true);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setFileName("Upload your CV");
    setFileSelected(false);
    document.getElementById("cv-upload").value = "";
  };

  // ✅ Submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!fullName || !email || !phone || !city || !selectedJobId || !file) {
      toast.error("Please fill all required fields!", {
        position: "top-right",
        autoClose: 3000,
        theme: "dark",
      });
      return;
    }

    setLoading(true); // ✅ Start loading

    const formData = new FormData();
    formData.append("fullName", fullName);
    formData.append("email", email);
    formData.append("phone", phone);
    formData.append("city", city);
    formData.append("jobId", selectedJobId);
    formData.append("resume", file);

    try {
      const response = await fetch("https://supreme-419p.onrender.com/api/career/apply", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || "Application submission failed!", {
          position: "top-right",
          autoClose: 3000,
          theme: "dark",
        });
        return;
      }

      toast.success("Application submitted successfully! ✅", {
        position: "top-right",
        autoClose: 3000,
        theme: "dark",
      });

      // Reset form
      setFullName("");
      setPhone("");
      setEmail("");
      setCity("");
      setSelectedJob("");
      setSelectedJobId("");
      setFile(null);
      setFileName("Upload your CV");
      setFileSelected(false);
    } catch (error) {
      toast.error("Network error, please try again later!", {
        position: "top-right",
        autoClose: 3000,
        theme: "dark",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="relative bg-gradient-to-t from-black via-gray-900 to-red-950 text-white px-6 py-20 overflow-hidden" id="job-seekers">
      <div className="relative max-w-xl mx-auto bg-gray-900/80 border border-red-700/40 rounded-2xl p-6 shadow-2xl backdrop-blur-sm">
        <h2 className="text-3xl font-extrabold text-center mb-2">
          Job <span className="text-red-500">Seekers</span>
        </h2>
        <p className="text-gray-300 text-center mb-6 text-sm">
          Fill in your details below and apply for exciting opportunities with us.
        </p>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {/* Full Name */}
          <div className="flex items-center gap-3">
            <label className="w-20 md:w-28 text-xs font-semibold text-gray-300">
              Full Name: <span className="text-red-500">*</span>
            </label>
            <div className="relative flex-1">
              <FaUser className="absolute left-3 top-2.5 text-gray-400 text-xs" />
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full pl-8 pr-3 py-2 rounded-md bg-gray-800 text-white text-xs border border-gray-700 focus:ring-1 focus:ring-red-500 outline-none"
              />
            </div>
          </div>

          {/* Phone */}
          <div className="flex items-center gap-3">
            <label className="w-20 md:w-28 text-xs font-semibold text-gray-300">
              Phone: <span className="text-red-500">*</span>
            </label>
            <div className="relative flex-1">
              <FaPhoneAlt className="absolute left-3 top-2.5 text-gray-400 text-xs" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter your phone number"
                pattern="[0-9]{10}"
                maxLength={10}
                title="Enter a valid 10-digit phone number"
                className="w-full pl-8 pr-3 py-2 rounded-md bg-gray-800 text-white text-xs border border-gray-700 focus:ring-1 focus:ring-red-500 outline-none"
              />
            </div>
          </div>

          {/* Email */}
          <div className="flex items-center gap-3">
            <label className="w-20 md:w-28 text-xs font-semibold text-gray-300">
              Email: <span className="text-red-500">*</span>
            </label>
            <div className="relative flex-1">
              <FaEnvelope className="absolute left-3 top-2.5 text-gray-400 text-xs" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className="w-full pl-8 pr-3 py-2 rounded-md bg-gray-800 text-white text-xs border border-gray-700 focus:ring-1 focus:ring-red-500 outline-none"
              />
            </div>
          </div>

          {/* City */}
          <div className="flex items-center gap-3">
            <label className="w-20 md:w-28 text-xs font-semibold text-gray-300">
              City: <span className="text-red-500">*</span>
            </label>
            <div className="relative flex-1">
              <FaCity className="absolute left-3 top-2.5 text-gray-400 text-xs" />
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Enter your city"
                className="w-full pl-8 pr-3 py-2 rounded-md bg-gray-800 text-white text-xs border border-gray-700 focus:ring-1 focus:ring-red-500 outline-none"
              />
            </div>
          </div>

          {/* Job Role Dropdown */}
          <div className="flex items-center gap-3" ref={dropdownRef}>
            <label className="w-20 md:w-28 text-xs font-semibold text-gray-300">
              Job Role: <span className="text-red-500">*</span>
            </label>
            <div className="relative flex-1">
              <FaBriefcase className="absolute left-3 top-2.5 text-gray-400 text-xs" />
              <input
                type="text"
                placeholder="Search or select a job"
                value={searchTerm || selectedJob}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setDropdownOpen(true);
                }}
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="w-full pl-8 pr-8 py-2 rounded-md bg-gray-800 text-white text-xs border border-gray-700 focus:ring-1 focus:ring-red-500 outline-none cursor-pointer"
              />
              <FaChevronDown className="absolute right-3 top-3 text-gray-400 text-xs" />

              {dropdownOpen && (
                <ul className="absolute w-full bg-gray-800 border border-gray-700 mt-1 rounded-md max-h-40 overflow-y-auto text-xs z-10">
                  {jobs
                    .filter((job) =>
                      (job.title || job.name || "")
                        .toLowerCase()
                        .includes(searchTerm.toLowerCase())
                    )
                    .map((job, index) => (
                      <li
                        key={index}
                        onClick={() => {
                          setSelectedJob(job.title || job.name || job);
                          setSelectedJobId(job._id || job.id || "");
                          setSearchTerm("");
                          setDropdownOpen(false);
                        }}
                        className="px-3 py-2 hover:bg-red-600 hover:text-white cursor-pointer"
                      >
                        {job.title || job.name || job}
                      </li>
                    ))}
                </ul>
              )}
            </div>
          </div>

          {/* Upload CV */}
          <div className="flex items-start gap-3">
            <label className="w-20 md:w-28 text-xs font-semibold text-gray-300 mt-2">
              Upload CV: <span className="text-red-500">*</span>
            </label>
            <div className="flex-1">
              <div className="relative border-2 border-dashed border-red-600 rounded-md p-2 hover:border-red-400 transition-all cursor-pointer text-center">
                {!fileSelected ? (
                  <>
                    <input
                      type="file"
                      id="cv-upload"
                      accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <label
                      htmlFor="cv-upload"
                      className="flex items-center justify-center gap-2 text-gray-300 hover:text-white text-xs font-medium"
                    >
                      <FaUpload className="text-red-500" />
                      {fileName}
                    </label>
                  </>
                ) : (
                  <div className="flex items-center justify-between text-xs px-2 text-gray-200">
                    <span className="truncate">{fileName}</span>
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      className="text-red-400 hover:text-red-600 transition-colors flex items-center gap-1"
                    >
                      <FaTimes size={10} />
                      Remove
                    </button>
                  </div>
                )}
              </div>

              <p className="mt-1 text-[10px] text-gray-400 text-left">
                Accepted formats: JPG, JPEG, PNG, PDF, DOC (Max size: 1MB)
              </p>
            </div>
          </div>

          {/* Terms and Conditions */}
          <div className="flex items-center mt-2 gap-2 text-xs text-gray-300">
            <input
              type="checkbox"
              id="terms"
              className="w-3 h-3 accent-red-600"
              required
            />
            <label htmlFor="terms" className="flex items-center gap-1">
              I agree to the{" "}
              <button
                type="button"
                onClick={() => setShowTerms(true)}
                className="text-red-500 hover:underline"
              >
                Terms & Conditions
              </button>
            </label>
          </div>

          {/* Modal for Terms and Conditions */}
          {showTerms && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50 transition-opacity duration-300">
              <div className="bg-gray-900 text-gray-200 rounded-lg shadow-2xl w-[90%] md:w-[600px] relative p-6 border border-red-700 max-h-[80vh] overflow-y-auto scrollbar-thin scrollbar-thumb-red-600 scrollbar-track-gray-800 scrollbar-thumb-rounded-full">
                {/* Close Button */}
                <button
                  onClick={() => setShowTerms(false)}
                  className="absolute top-3 right-3 text-gray-400 hover:text-red-500"
                >
                  <FaTimes />
                </button>

                <h3 className="text-lg font-semibold mb-4 text-red-500 text-center">
                  Terms & Conditions
                </h3>

                <div className="text-xs text-gray-300 space-y-2 leading-relaxed text-justify">
                  <p>
                    <strong>Concept Promotions and events (CPE)</strong> respects your
                    privacy and is committed to protecting your personal data. This notice
                    and request for consent ("Notice") will inform you about how the CPE
                    proposes to collect, handle, store, use, disclose and transfer
                    ("Process") your personal data.
                  </p>

                  <p>
                    <strong>1. Categories of Personal Data:</strong> We may Process the
                    following types of your personal data:
                  </p>
                  <ol className="list-[lower-alpha] ml-4 space-y-1">
                    <li>
                      Identity and/or contact information and other details
                      for you or your outlet such as name, physical address,
                      mobile number, email address, signatures, date of birth,
                      copy of identity and residence identifiers such as Aadhaar
                      or other officially valid documents, Permanent Account Number,
                      passport, biometric information, marital status, citizenship,
                      residential status etc.
                    </li>
                    <li>
                      Financial or related information such as income details,
                      account statements, passbooks, employment or occupational information,
                      information collected when you undertake transactions including when
                      you send or receive payments, etc.
                    </li>
                    <li>
                      Information that you provide about others such as nominee details,
                      family details, associate details, employer details, authorized
                      signatories and other authorized representatives in case of
                      non-individual applicants, etc.
                    </li>
                    <li>
                      Information that others provide about you such as data obtained from
                      other parties who are involved in transactions undertaken by you, from
                      any persons / organisations involved in any payment system or infrastructure
                      or architecture of which we are a part and whether your interface/
                      interaction is directly with us or indirectly through such third parties, etc.
                    </li>
                    <li>
                      Information from and about your online activities such as your location,
                      IP address, device and operating system, unique identifiers such as
                      International Mobile Equipment Identity (IMEI) number, technical usage
                      data, contact lists, fingerprint (if you choose to enable it), passwords
                      or PINs in encrypted form, etc.
                    </li>
                    <li>
                      Information such as records of our correspondence with you, your
                      interaction with CPE including chats, emails, telephone conversations,
                      grievances, etc.
                    </li>
                  </ol>

                  <p>
                    <strong>2. Purposes of Processing:</strong> We Process your personal
                    data for:
                  </p>
                  <ol className="list-[lower-alpha] ml-4 space-y-1">
                    <li>
                      To meet our legal, regulatory or compliance obligations such as customer
                      due diligence, know your customer/ anti-money laundering checks, undertaking
                      data protection impact assessments, data audits, etc.
                    </li>
                    <li>
                      To assess and monitor your continued eligibility and suitability for the
                      Requested Product such as your KYC status, risk assessment, including by
                      way of background checks, inspections, verifications, etc.
                    </li>
                    <li>
                      To provide you with and enable your use of the Requested Product.
                    </li>
                    <li>
                      To initiate legal or regulatory proceedings for enforcement of our
                      rights or defending your claims.
                    </li>
                    <li>
                      To provide you with customer service and to communicate with you through
                      emails, chats, telephone calls and other means.
                    </li>
                    <li>
                      To take actions necessary for prevention and detection of crime and
                      fraud, portfolio sensitivity analysis, etc.
                    </li>
                  </ol>
                  <p className="text-gray-400 text-[11px]">
                    Note: We may undertake the abovementioned activities either ourselves or
                    through our affiliates or third parties such as vendors, service providers,
                    other regulated entities such as credit information companies and KYC
                    registration and authentication service agencies, etc., in accordance with
                    our internal policies and applicable law.
                  </p>

                  <p>
                    <strong>3. Data Sharing:</strong> We may share your personal data with
                    our affiliates or third parties such as credit information companies,
                    bureaus, switches, networks, agencies, vendors, card association, settlement,
                    transfer and processing intermediaries, payment aggregators, payment gateways,
                    payments systems, service providers, consultants, vendors, agents, fintech
                    entities, co-brand entities / partners, distributors, selling/ marketing agents,
                    any partners, collaborators, co-lenders, co-originators, merchants, aggregators,
                    lead generators, sourcing entities, clients, customers or other persons with
                    whom we have any direct or indirect arrangement or tie-up or contract for any
                    products or services, any TPAPs, or other players/ intermediaries in any
                    ecosystem of which the CPE is a part, with entities managing loyalty programmes,
                    managing, generating and/or implementing any offers, discounts, cashbacks,
                    chargebacks, features, etc., and such entities may share your personal data
                    with their service providers, consultants, vendors, etc., for the purposes
                    mentioned in this Notice. In certain cases, these entities, which receive your
                    personal data from us may also be legally required to give you a notice
                    regarding their Processing of your personal data and request for your consent
                    before they Process the same. We encourage you to read their privacy notices
                    and contact them if you have any questions regarding how they Process your
                    personal data.
                  </p>

                  <p>
                    <strong>4. Withdrawal of Consent:</strong> You have the right to withdraw
                    your consent at any time by following the process provided under the
                    'Consent Withdrawal' section of the Privacy Policy. <br></br>
                    Please note that our Processing of your personal data before you withdraw
                    your consent will not be impacted. You should also be aware that if you withdraw
                    your consent for us to Process your personal data for some of the purposes we
                    have mentioned in this Notice, we may not be able to continue offering you the
                    Requested Product. This could mean that the terms and conditions applicable to
                    discontinuation or closure of your Requested Product will become applicable.<br></br>
                    We encourage you to review the terms and conditions applicable to the Requested
                    Product to understand the consequences of withdrawal of your consent in respect
                    of use of your personal data.
                  </p>

                  <p>
                    <strong>5. Grievances:</strong> If you believe that you have any concerns
                    regarding how we Process your personal data, you have the right to let us
                    know your grievances. Please contact us at the details provided under
                    'Contact Information' below to register your concerns.
                  </p>
                  <p className="text-gray-400 text-[11px]">
                    <strong>Contact Information:</strong> <span className="text-red-500 hover:underline">manager@conceptpromotions.in</span>
                  </p>

                  <p>
                    <strong>6. Consent Declaration:</strong> By providing your consent by ticking
                    the checkbox, you acknowledge and agree to the following:
                  </p>
                  <ol className="list-[lower-alpha] ml-4 space-y-1">
                    <li>
                      That you have read and understood the contents of this Notice and consent to
                      the Processing of your personal data as described here.
                    </li>
                    <li>
                      That you give your consent voluntarily, without any coercion or influence
                      from the CPE or any other person.
                    </li>
                    <li>
                      That you will provide and ensure that the CPE maintains accurate, updated,
                      complete and consistent personal data.
                    </li>
                    <li>
                      The CPE may Process your personal data for certain other purposes without
                      your consent, where the law allows us to do so such as enforcement of a
                      legal claim against you or for the CPE to make regulatory disclosures.
                    </li>
                  </ol>
                </div>
              </div>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full mt-4 flex items-center justify-center gap-2 bg-gradient-to-r from-red-700 to-red-500 hover:from-red-500 hover:to-red-700 text-white font-semibold py-2 rounded-md transition-all shadow-md text-xs ${loading ? "opacity-70 cursor-not-allowed" : ""
              }`}
          >
            {loading ? (
              <>
                <FaSpinner className="animate-spin text-white" />
                Submitting...
              </>
            ) : (
              "Submit Application"
            )}
          </button>
        </form>
      </div>

      <ToastContainer />
    </section>
  );
};

export default JobSeekers;

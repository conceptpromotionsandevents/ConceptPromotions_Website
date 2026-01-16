import React from "react";
import {
  FaFacebookF,
  FaLinkedinIn,
  FaTwitter,
  FaInstagram,
  FaEnvelope,
  FaPhoneAlt,
  FaMapMarkerAlt,
} from "react-icons/fa";

const Footer = () => {
  // Social media links
  const socialLinks = [
    { Icon: FaFacebookF, url: "#" },
    { Icon: FaTwitter, url: "https://x.com/Conceptpro_22" },
    { Icon: FaLinkedinIn, url: "https://www.linkedin.com/in/concept-promotions-8782463a6/" },
    { Icon: FaInstagram, url: "https://www.instagram.com/concept_promotions_22/" },
  ];

  return (
    <>
      <div className="border-b border-gray-700 mx-auto"></div>
      <footer className="pt-8 pb-4 px-6 md:px-16 bg-gradient-to-b from-black to-gray-900 text-gray-300">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-12 text-sm text-center md:text-left">
          {/* Left Section */}
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-white">
              Concept<span className="text-red-600">Promotions</span>
            </h2>

            <ul className="flex justify-center md:justify-start flex-wrap gap-3 text-gray-400 text-xs md:text-sm">
              <li><a href="/" className="hover:text-red-500 transition">Home</a></li>
              <li>|</li>
              <li><a href="/about" className="hover:text-red-500 transition">About</a></li>
              <li>|</li>
              <li><a href="/services" className="hover:text-red-500 transition">Services</a></li>
              <li>|</li>
              <li><a href="/careers" className="hover:text-red-500 transition">Careers</a></li>
              <li>|</li>
              <li><a href="/contact" className="hover:text-red-500 transition">Contact</a></li>
            </ul>

            <div className="text-gray-500 text-xs flex justify-center md:justify-start gap-2">
              <p>
                © {new Date().getFullYear()} Concept Promotions & Events
              </p>
              <p>|</p>
              {/* Privacy Policy Link */}
              <a
                href="/privacy"
                className="hover:text-red-500 transition"
              >
                Privacy Policy
              </a>
            </div>
          </div>

          {/* Middle Section */}
          <div className="space-y-4">
            <div className="flex justify-center md:justify-start items-start space-x-3">
              <FaMapMarkerAlt className="text-red-600 mt-1" />
              <p>
                Communication Address: 40-41, WC-5, <br />
                Bakshi House, Nehru Place, <br />
                New Delhi - 110019
              </p>
            </div>
            <div className="flex justify-center md:justify-start items-center space-x-3">
              <FaPhoneAlt className="text-red-600" />
              <p>+91 9718779049</p>
            </div>
            <div className="flex justify-center md:justify-start items-center space-x-3">
              <FaEnvelope className="text-red-600" />
              <a
                href="mailto:manager@conceptpromotions.in"
                className="hover:text-red-400 transition"
              >
                manager@conceptpromotions.in
              </a>
            </div>
          </div>

          {/* Right Section */}
          <div className="space-y-4">
            <h3 className="font-semibold text-white text-lg">
              Follow us on
            </h3>
            <div className="flex justify-center md:justify-start space-x-4 pt-2">
              {socialLinks.map(({ Icon, url }, idx) => (
                <a
                  key={idx}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-xl border border-gray-600 bg-gradient-to-b from-gray-900 shadow-md hover:border-red-500 hover:shadow-red-500/40 hover:text-red-500 transition-all duration-300"
                >
                  <Icon className="text-gray-300 text-lg" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </>
  );
};

export default Footer;

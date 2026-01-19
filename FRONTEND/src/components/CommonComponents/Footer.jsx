import React from "react";
import {
  FaFacebookF,
  FaLinkedinIn,
  FaInstagram,
  FaEnvelope,
  FaPhoneAlt,
  FaMapMarkerAlt,
} from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";

const Footer = () => {
  const socialLinks = [
    {
      Icon: FaFacebookF,
      url: "#",
      bgColor: "bg-[#1877F2]",
      hoverShadow: "hover:shadow-lg hover:shadow-[#1877F2]/50",
    },
    {
      Icon: FaXTwitter,
      url: "https://x.com/Conceptpro_22",
      bgColor: "bg-black",
      hoverShadow: "hover:shadow-lg hover:shadow-gray-700/50",
    },
    {
      Icon: FaLinkedinIn,
      url: "https://www.linkedin.com/in/concept-promotions-8782463a6/",
      bgColor: "bg-[#0A66C2]",
      hoverShadow: "hover:shadow-lg hover:shadow-[#0A66C2]/50",
    },
    {
      Icon: FaInstagram,
      url: "https://www.instagram.com/concept_promotions_22/",
      bgGradient: "bg-gradient-to-tr from-[#FFDC80] via-[#FCAF45] via-[#F77737] via-[#F56040] via-[#FD1D1D] via-[#E1306C] via-[#C13584] via-[#833AB4] to-[#405DE6]", // Official Instagram gradient
      hoverShadow: "hover:shadow-lg hover:shadow-pink-500/50",
      isGradient: true,
    },
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
              <p>© {new Date().getFullYear()} Concept Promotions & Events</p>
              <p>|</p>
              <a href="/privacy" className="hover:text-red-500 transition">
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
            <h3 className="font-semibold text-white text-lg">Follow us on</h3>
            <div className="flex justify-center md:justify-start space-x-4 pt-2">
              {socialLinks.map(({ Icon, url, bgColor, bgGradient, hoverShadow, isGradient }, idx) => (
                <a
                  key={idx}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`
                    p-2 rounded-xl 
                    border-1 border-white
                    ${isGradient ? bgGradient : bgColor}
                    ${hoverShadow}
                    hover:scale-110 
                    transition-all duration-300 
                    transform
                  `}
                >
                  <Icon className="text-xl text-white" />
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

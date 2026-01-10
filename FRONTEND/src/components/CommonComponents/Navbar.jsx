import React, { useState, useEffect } from "react";
import { FaBars, FaTimes, FaChevronDown } from "react-icons/fa";
import { Link, useLocation } from "react-router-dom";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [active, setActive] = useState("Home");
  const [mobileDropdownOpen, setMobileDropdownOpen] = useState(false);
  const location = useLocation();

  const menuItems = [
    { name: "Home", path: "/" },
    { name: "About Us", path: "/about" },
    { name: "Clients", path: "/clients" },
    { name: "Our Services", path: "/services" },
    { name: "Our Network", path: "/network" },  
    { name: "Careers", path: "/careers" },
    { name: "Contact Us", path: "/contact" },
  ];

  const dropdownItems = [
    { name: "Admin Login", path: "/signin" },
    { name: "Client Login", path: "/clientsignin" },
    { name: "Retailer Login", path: "/retailersignin" },
    { name: "Employee Login", path: "/employeesignin" },
  ];

  useEffect(() => {
    const currentItem = menuItems.find((item) => item.path === location.pathname);
    if (currentItem) {
      setActive(currentItem.name);
    } else {
      setActive("");
    }
  }, [location.pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleClick = (item) => {
    setActive(item);
    setIsOpen(false);
    setMobileDropdownOpen(false);
  };

  const handleMobileDropdownToggle = () => {
    setMobileDropdownOpen(!mobileDropdownOpen);
  };

  return (
    <nav className="flex items-center justify-between px-8 py-4 bg-black bg-opacity-90 fixed w-full top-0 z-50 shadow-md backdrop-blur-sm">

      {/* Logo */}
      <div className="flex items-center">
        <Link to="/">
          <img
            src="https://res.cloudinary.com/dltqp0vgg/image/upload/v1768038270/cpfullloog_ha27fk.jpg"
            alt="Concept Promotions Logo"
            className="h-12 w-auto object-contain cursor-pointer"
          />
        </Link>
      </div>

      {/* Desktop Menu */}
      <ul className="hidden md:flex items-center space-x-8 font-medium text-white mx-auto">
        {menuItems.map((item) => (
          <li key={item.name}>
            <Link
              to={item.path}
              onClick={() => handleClick(item.name)}
              className={`transition-colors ${
                active === item.name ? "text-red-500" : "hover:text-red-500 text-white"
              }`}
            >
              {item.name}
            </Link>
          </li>
        ))}
      </ul>

      {/* Supreme Login */}
      <div className="hidden md:block relative group">
        <span className="cursor-pointer bg-gradient-to-r from-red-600 to-red-500 text-white font-semibold px-4 py-2 rounded-full shadow-[0_0_15px_rgba(255,0,0,0.4)] flex items-center gap-1 transition-all duration-300 hover:shadow-[0_0_25px_rgba(255,0,0,0.7)]">
          <span>Supreme Login</span>
          <FaChevronDown className="text-xs mt-[2px]" />
        </span>

        <ul className="absolute right-0 mt-3 w-52 bg-black border border-red-600/40 rounded-xl shadow-[0_0_25px_rgba(255,0,0,0.3)] z-[1000] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300">
          {dropdownItems.map((item) => (
            <li key={item.name}>
              <Link
                to={item.path}
                className="block px-4 py-3 text-white hover:bg-red-600/20 hover:text-red-400 transition-all rounded-lg"
              >
                {item.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* Hamburger Icon */}
      <div
        className="md:hidden text-white text-2xl cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <FaTimes /> : <FaBars />}
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="fixed top-20 left-0 w-full h-[calc(100vh-5rem)] bg-black bg-opacity-95 z-[999] md:hidden overflow-y-auto transition-all duration-300">
          <ul className="flex flex-col items-center space-y-6 py-8 text-white">

            {menuItems.map((item) => (
              <li key={item.name}>
                <Link
                  to={item.path}
                  onClick={() => handleClick(item.name)}
                  className={`text-lg transition-colors ${
                    active === item.name ? "text-red-500" : "hover:text-red-500 text-white"
                  }`}
                >
                  {item.name}
                </Link>
              </li>
            ))}

            {/* Mobile Supreme Login */}
            <li className="relative w-full flex flex-col items-center">
              <button
                onClick={handleMobileDropdownToggle}
                className="cursor-pointer w-[90%] mx-auto bg-gradient-to-r from-red-600 to-red-500 text-white font-semibold px-6 py-3 rounded-full shadow-[0_0_15px_rgba(255,0,0,0.4)] hover:shadow-[0_0_25px_rgba(255,0,0,0.7)] hover:scale-105 transition-all flex items-center justify-center gap-2"
              >
                Supreme Login
                <FaChevronDown className={`text-xs transition-transform duration-300 ${mobileDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {mobileDropdownOpen && (
                <ul className="mt-3 w-56 mx-auto bg-black border border-red-600/40 rounded-xl shadow-[0_0_25px_rgba(255,0,0,0.3)]">
                  {dropdownItems.map((item) => (
                    <li key={item.name}>
                      <Link
                        to={item.path}
                        className="block px-4 py-3 text-white hover:bg-red-600/20 hover:text-red-400 transition-all rounded-lg"
                        onClick={() => {
                          setIsOpen(false);
                          setMobileDropdownOpen(false);
                        }}
                      >
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          </ul>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
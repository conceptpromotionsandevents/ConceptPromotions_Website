import React from "react";
import Navbar from "../../components/CommonComponents/Navbar";
import ServiceSection from "../../components/ServicesPageComponents/ServicesSection";
import Footer from "../../components/CommonComponents/Footer";

const Services = () => {
  return (
    <div className="bg-black text-white">
      <Navbar />
      <ServiceSection />
      <Footer />
    </div>
  );
};

export default Services;

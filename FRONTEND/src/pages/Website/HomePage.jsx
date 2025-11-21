import React from "react";
import Navbar from "../../components/CommonComponents/Navbar";
import HeroSection from "../../components/HomePageComponents/HeroSection";
import ServiceSection from "../../components/HomePageComponents/ServiceSection";
import Footer from "../../components/CommonComponents/Footer";

const Home = () => {
  return (
    <div className="bg-black text-white">
      <Navbar />
      <HeroSection />
      <ServiceSection />
      <Footer />
    </div>
  );
};

export default Home;

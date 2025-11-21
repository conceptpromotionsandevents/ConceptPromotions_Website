import React from "react";
import Navbar from "../../components/CommonComponents/Navbar";
import AboutSection from "../../components/AboutPageComponents/AboutSection";
import Footer from "../../components/CommonComponents/Footer";
import DiversitySection from "../../components/AboutPageComponents/DiversitySection";

const About = () => {
  return (
    <div className="bg-black text-white">
      <Navbar />
      <AboutSection />
      <DiversitySection />
      <Footer />
    </div>
  );
};

export default About;

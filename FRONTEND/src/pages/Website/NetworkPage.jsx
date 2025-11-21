import React from "react";
import Navbar from "../../components/CommonComponents/Navbar";
import OurNetwork from "../../components/NetworkPageComponents/OurNetwork";
import Footer from "../../components/CommonComponents/Footer";
import ReachCoverage from "../../components/NetworkPageComponents/ReachCoverage";

const Network = () => {
  return (
    <div className="bg-black text-white">
      <Navbar />
      <OurNetwork />
      <ReachCoverage />
      <Footer />
    </div>
  );
};

export default Network;

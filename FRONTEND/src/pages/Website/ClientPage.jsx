import React from "react";
import Navbar from "../../components/CommonComponents/Navbar";
import OurClients from "../../components/ClientPageComponents/OurClients";
import ClientsTrust from "../../components/ClientPageComponents/ClientsTrust";
import Testimonials from "../../components/ClientPageComponents/Testimonials";
import Footer from "../../components/CommonComponents/Footer";

const ClientPage = () => {
  return (
    <div className="bg-black text-white">
      <Navbar />
      <OurClients />
      <ClientsTrust />
      <Testimonials />
      <Footer />
    </div>
  );
};

export default ClientPage;

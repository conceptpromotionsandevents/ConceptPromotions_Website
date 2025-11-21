import React from "react";
import Navbar from "../../components/CommonComponents/Navbar";
import Form from "../../components/ContactFormPageComponents/Form";
import Footer from "../../components/CommonComponents/Footer";

const ContactForm = () => {
  return (
    <div className="bg-black text-white">
      <Navbar />
      <Form />
      <Footer />
    </div>
  );
};

export default ContactForm;

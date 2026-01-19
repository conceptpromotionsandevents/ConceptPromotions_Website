import React from "react";
import Navbar from "../../components/CommonComponents/Navbar";
import PrivacyPolicyContent from "../../components/PrivacyPolicyComponents/PrivacyPolicyContent"
import Footer from "../../components/CommonComponents/Footer";

const PrivacyPolicy = () => {
    return (
        <div>
            <Navbar />
            <PrivacyPolicyContent />
            <Footer />
        </div>
    );
};

export default PrivacyPolicy;

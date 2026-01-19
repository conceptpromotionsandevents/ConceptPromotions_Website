import React from "react";
import Navbar from "../../components/CommonComponents/Navbar";
import NotFound from "../../components/CommonComponents/NotFound";
import Footer from "../../components/CommonComponents/Footer";

const NotFoundPage = () => {
    return (
        <div className="bg-black text-white">
            <Navbar />
            <NotFound />
            <Footer />
        </div>
    );
};

export default NotFoundPage;

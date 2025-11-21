import React from "react";
import Navbar from "../../components/CommonComponents/Navbar";
import CurrentOpenings from "../../components/CareersPageComponents/CurrentOpenings";
import JobSeekers from "../../components/CareersPageComponents/JobSeekers";
import Footer from "../../components/CommonComponents/Footer";

const Careers = () => {
    return (
        <div className="bg-black text-white">
            <Navbar />
            <CurrentOpenings />
            <JobSeekers />
            <Footer />
        </div>
    );
};

export default Careers;

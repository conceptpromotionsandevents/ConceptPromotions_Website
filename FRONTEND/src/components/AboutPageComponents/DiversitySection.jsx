import React from "react";
import { motion } from "framer-motion";

const DiversitySection = () => {
    return (
        <>
            {/* Divider */}
            <div className="w-[70%] border-b border-gray-700 mx-auto"></div>

            <section className="overflow-x-hidden bg-gradient-to-b from-black via-gray-900 to-red-950 text-white py-20 px-6 md:px-20">

                {/* Heading */}
                <div className="text-center mb-14">
                    <h2 className="text-4xl md:text-5xl font-extrabold mb-4">
                        Workforce <span className="text-red-500">Diversity</span>
                    </h2>
                    <p className="text-gray-300 max-w-2xl mx-auto text-lg">
                        Empowering Growth through an inclusive and progressive workforce.
                    </p>
                </div>

                <div className="overflow-x-hidden flex flex-col md:flex-row items-center gap-12">

                    {/* LEFT: Image with Zoom-In */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.2 }}          
                        whileInView={{ opacity: 1, scale: 0.9 }}        
                        transition={{ duration: 5, ease: "easeOut" }}
                        viewport={{ once: false, amount: 0.4 }}       
                        className="md:w-1/2 w-full h-[380px] overflow-hidden rounded-2xl border border-gray-700 shadow-lg relative"
                    >
                        <img
                            src="https://res.cloudinary.com/dltqp0vgg/image/upload/v1768037882/diversity_k7rzve.jpg"
                            alt="Diversity"
                            className="w-full h-full object-cover absolute inset-0 rounded-2xl"
                        />
                    </motion.div>

                    {/* RIGHT TEXT */}
                    <motion.div
                        initial={{ x: 60, opacity: 0 }}
                        whileInView={{ x: 0, opacity: 1 }}
                        transition={{ duration: 5 }}
                        viewport={{ once: false, amount: 0.3 }}
                        className="md:w-1/2 w-full text-center md:text-left"
                    >
                        <h3 className="text-3xl font-bold mb-4 text-red-500">
                            89.2% Women Workforce
                        </h3>

                        <p className="text-gray-300 text-lg leading-relaxed">
                            At Concept Promotions, diversity is not just a principle—it's a driving force
                            behind our growth and culture. With an outstanding
                            <span className="text-red-500 font-semibold"> 89.2% women workforce</span>,
                            we empower careers and foster leadership across India. (fig. as per Oct'25)
                        </p>

                        <p className="text-gray-300 mt-4 text-lg leading-relaxed">
                            This strong representation reflects our commitment to building a dynamic,
                            skilled, and inclusive workforce—ensuring excellence in every project.
                        </p>
                    </motion.div>

                </div>
            </section>
        </>
    );
};

export default DiversitySection;

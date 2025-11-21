import React from "react";

const ClientsTrust = () => {
    return (

        <section className="bg-gradient-to-b from-black via-gray-900 to-red-950 text-white py-20 px-6 md:px-20">
            <div className="max-w-6xl mx-auto text-center">
                <h2 className="text-4xl md:text-5xl font-extrabold mb-6">
                    Why Our Clients <span className="text-red-500">Trust Us</span>
                </h2>
                <p className="text-gray-300 max-w-2xl mx-auto mb-12 text-lg">
                    With years of experience and a proven track record of excellence, we've built strong
                    relationships with industry-leading companies. Our dedication to quality, integrity, and timely
                    service sets us apart as a reliable partner for long-term growth.
                </p>

                {/* 3-Column Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-10">
                    <div className="bg-white/10 border border-red-600/40 p-8 rounded-2xl hover:scale-105 hover:border-red-500 transition-all duration-300">
                        <h3 className="text-2xl font-semibold mb-3 text-red-500">Reliability</h3>
                        <p className="text-gray-300">
                            We ensure consistent, dependable service across all projects — always delivering on
                            our promises.
                        </p>
                    </div>

                    <div className="bg-white/10 border border-red-600/40 p-8 rounded-2xl hover:scale-105 hover:border-red-500 transition-all duration-300">
                        <h3 className="text-2xl font-semibold mb-3 text-red-500">Industry Expertise</h3>
                        <p className="text-gray-300">
                            Our team brings years of specialized experience, helping clients in diverse sectors achieve operational excellence.
                        </p>
                    </div>

                    <div className="bg-white/10 border border-red-600/40 p-8 rounded-2xl hover:scale-105 hover:border-red-500 transition-all duration-300">
                        <h3 className="text-2xl font-semibold mb-3 text-red-500">Nationwide Reach</h3>
                        <p className="text-gray-300">
                            We proudly serve clients across India, ensuring high-quality manpower and service wherever needed.
                        </p>
                    </div>
                </div>
            </div>
        </section>

    );
};

export default ClientsTrust;

import React from "react";
import { motion } from "framer-motion";
import { FaQuoteLeft } from "react-icons/fa";

const testimonials = [
  {
    id: 1,
    image: "/testi2.jpg",
    client: "ITC Limited",
    feedback:
      "Thank you ITC for your trust and partnership. We deeply value our collaboration and look forward to achieving many more milestones together.",
  },
];

const Testimonials = () => {
  return (
    <section className="bg-gradient-to-b from-red-950 via-gray-900 to-black text-white py-5 px-6 md:px-20 mb-10">
      <div className="text-center mb-16">
        <h2 className="text-4xl md:text-5xl font-extrabold mb-4">
          <span className="text-red-500">Testimonials</span>
        </h2>
        <p className="text-gray-300 max-w-2xl mx-auto text-base md:text-lg">
          We take pride in building long-lasting partnerships. Here's what our clients have to say
          about their experience working with Concept Promotions.
        </p>
      </div>

      {/* Single Testimonial Centered */}
      <div className="flex justify-center">
        {testimonials.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: index * 0.2 }}
            viewport={{ once: true }}
            className="bg-white/10 border border-red-600/30 rounded-2xl overflow-hidden shadow-lg hover:scale-[1.02] transition-transform duration-300 w-full max-w-4xl"
          >
            {/* Image Section */}
            <div className="relative">
              <img
                src={item.image}
                alt={item.client}
                className="w-full h-42 md:h-50 object-cover rounded-t-2xl"
              />
              <div className="absolute top-4 bg-red-600 text-white p-2 rounded-full">
                <FaQuoteLeft size={20} />
              </div>
            </div>

            {/* Text Section */}
            <div className="p-6 text-center">
              <h3 className="text-2xl font-semibold text-red-500 mb-2">{item.client}</h3>
              <p className="text-gray-300 text-lg leading-relaxed mb-2">
                “{item.feedback}”
              </p>

              <p className="text-gray-400 italic text-sm text-right pr-4 font-bold">
                — Abhijit Chowdhury
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default Testimonials;

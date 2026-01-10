import React from "react";

const clients = [
  { name: "Coca Cola", logo: "https://res.cloudinary.com/dltqp0vgg/image/upload/v1768038230/CocaCola_i5njec.jpg", zoom: true },
  { name: "ITC", logo: "https://res.cloudinary.com/dltqp0vgg/image/upload/v1768038232/ITC_m845tj.png", zoom: true },
  { name: "HUL", logo: "https://res.cloudinary.com/dltqp0vgg/image/upload/v1768038231/HUL_sibllg.png", zoom: true },
  { name: "Glenmark Pharma", logo: "https://res.cloudinary.com/dltqp0vgg/image/upload/v1768038230/Glenmark_cizjeb.jpg", zoom: true },
  { name: "Heritage Foods", logo: "https://res.cloudinary.com/dltqp0vgg/image/upload/v1768038230/Heritage_u0dtia.png" },
  { name: "Rajdhani", logo: "https://res.cloudinary.com/dltqp0vgg/image/upload/v1768038235/Rajdhani_qqm24l.png", zoom: true },
  { name: "Raymond", logo: "https://res.cloudinary.com/dltqp0vgg/image/upload/v1768038237/Raymond_gzrg3u.png", zoom: true },
  { name: "Vibhor Oil", logo: "https://res.cloudinary.com/dltqp0vgg/image/upload/v1768038238/Vibhor_m6u3jr.png", zoom: true },
  { name: "Henkel Swaskoff", logo: "https://res.cloudinary.com/dltqp0vgg/image/upload/v1768038231/Henkel_cpktu9.png", zoom: true },
  { name: "Pidilite", logo: "https://res.cloudinary.com/dltqp0vgg/image/upload/v1768038234/Pidilite_ea9pyk.jpg" },
  { name: "Tea Valley", logo: "https://res.cloudinary.com/dltqp0vgg/image/upload/v1768038238/TeaValley_z1nou9.png", zoom: true },
  { name: "Mangaldeep Agarbatti", logo: "https://res.cloudinary.com/dltqp0vgg/image/upload/v1768038233/Mangaldeep_nshdpe.jpg", zoom: true },
];

const OurClients = () => {
  return (
    <section className="flex flex-col md:flex-row w-full min-h-[70vh] mt-20 overflow-hidden">

      {/* Left Section */}
      <div className="bg-gradient-to-b from-[#E4002B] to-black text-white md:w-[35%] w-full py-16 px-8 flex flex-col justify-center items-center md:items-start text-center md:text-left relative">
        <div className="relative -translate-y-6">
          <h2 className="text-4xl md:text-5xl font-extrabold leading-tight">
            Our Clients
          </h2>
          <p className="text-gray-300 mt-4 text-sm md:text-base max-w-xs">
            Trusted by top brands across industries — building partnerships that grow with excellence.
          </p>
        </div>
      </div>

      {/* Right Section – Updated Boxes */}
      <div className="flex-1 bg-gradient-to-b from-black via-gray-900 to-black flex justify-center items-center py-14 px-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-8 w-full max-w-5xl">
          {clients.map((client, index) => (
            <div
              key={index}
              className="bg-white border-[5px] border-red-600 rounded-2xl shadow-[0_0_20px_rgba(228,0,43,0.2)]
                         hover:shadow-[0_0_35px_rgba(228,0,43,0.4)] transition-all duration-300
                         flex justify-center items-center p-6 hover:-translate-y-1"
            >
              <img
                src={client.logo}
                alt={client.name}
                className={`object-contain transition-all duration-300 max-h-14
                  ${client.zoom ? "scale-[1.25]" : "scale-100"}`}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default OurClients;

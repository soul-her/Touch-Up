import React from "react";

const AboutSection: React.FC = () => {
  return (
    <section
      id="about"
      className="mt-24 p-12 bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100"
    >
      <h2 className="text-4xl font-bold text-gray-800 text-center mb-12">
        Who We Are: Touch Up's Mission
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
        {/* Mission */}
        <div className="p-4">
          <i className="fas fa-bullseye text-4xl text-blue-500 mb-4"></i>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            Our Mission
          </h3>
          <p className="text-gray-600 leading-relaxed text-sm">
            To provide the highest quality purified water delivery service,
            promoting <strong>health, convenience</strong>, and environmental
            sustainability in every community we serve.
          </p>
        </div>

        {/* Vision */}
        <div className="p-4 border-l border-r border-gray-200">
          <i className="fas fa-glasses text-4xl text-blue-500 mb-4"></i>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            Our Vision
          </h3>
          <p className="text-gray-600 leading-relaxed text-sm">
            To be the leading name in sustainable water delivery, recognized for
            our commitment to customer satisfaction and for setting the industry
            standard for <strong>purity and reliability</strong>.
          </p>
        </div>

        {/* Core Values */}
        <div className="p-4">
          <i className="fas fa-handshake text-4xl text-blue-500 mb-4"></i>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            Core Values
          </h3>
          <p className="text-gray-600 leading-relaxed text-sm">
            <strong>Purity, Reliability, and Sustainability</strong> define
            everything we do. We promise the best water with the most
            responsible practices.
          </p>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;

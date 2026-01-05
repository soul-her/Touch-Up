import React from "react";

const ContactSection: React.FC = () => {
  return (
    <section
      id="contact"
      className="mt-24 p-12 bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100"
    >
      <h2 className="text-4xl font-bold text-gray-800 text-center mb-4">
        Get In Touch
      </h2>
      <p className="text-center text-lg text-gray-600 mb-12">
        Have questions or need assistance? We're here to help!
      </p>

      <div className="flex flex-col md:flex-row justify-around items-start space-y-8 md:space-y-0 md:space-x-8">
        {/* Phone */}
        <div className="flex items-center space-x-4 w-full md:w-auto p-4 rounded-xl hover:bg-blue-50 transition duration-200">
          <i className="fas fa-phone-alt text-3xl text-blue-500"></i>
          <div>
            <p className="font-semibold text-gray-700">Call Us</p>
            <a
              href="tel:5551234567"
              className="text-gray-500 hover:text-blue-500 transition duration-200"
            >
              09287348229
            </a>
          </div>
        </div>

        {/* Email */}
        <div className="flex items-center space-x-4 w-full md:w-auto p-4 rounded-xl hover:bg-blue-50 transition duration-200">
          <i className="fas fa-envelope text-3xl text-blue-500"></i>
          <div>
            <p className="font-semibold text-gray-700">Email Us</p>
            <a
              href="mailto:support@touchupwater.com"
              className="text-gray-500 hover:text-blue-500 transition duration-200"
            >
              support@touchupwater.com
            </a>
          </div>
        </div>

        {/* Address */}
        <div className="flex items-center space-x-4 w-full md:w-auto p-4 rounded-xl hover:bg-blue-50 transition duration-200">
          <i className="fas fa-map-marker-alt text-3xl text-blue-500"></i>
          <div>
            <p className="font-semibold text-gray-700">Visit Our HQ</p>
            <p className="text-gray-500">Dr. V. Locsin St., Dumaguete City</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;

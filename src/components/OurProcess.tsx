import React from "react";

const OurProcess: React.FC = () => {
  return (
    <section id="process" className="mt-24">
      <h2 className="text-4xl font-bold text-gray-800 text-center mb-16">
        Simple Delivery Process
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {/* Step 1 */}
        <div className="process-step text-center relative group hover:scale-105 transition-transform">
          <div className="step-number">1</div>
          <div className="h-10"></div>
          <div className="text-5xl mb-4">🛒</div>
          <h3 className="font-semibold text-xl mb-2 text-gray-700">
            Place Your Order
          </h3>
          <p className="text-sm text-gray-500">
            Select your preferred water gallons and filters from our product list.
          </p>
          <span className="process-arrow hidden md:block">
            <i className="fas fa-arrow-right"></i>
          </span>
        </div>

        {/* Step 2 */}
        <div className="process-step text-center relative group hover:scale-105 transition-transform">
          <div className="step-number">2</div>
          <div className="h-10"></div>
          <div className="text-5xl mb-4">💳</div>
          <h3 className="font-semibold text-xl mb-2 text-gray-700">
            Secure Payment
          </h3>
          <p className="text-sm text-gray-500">
            Complete your transaction securely via the cart modal and checkout.
          </p>
          <span className="process-arrow hidden md:block">
            <i className="fas fa-arrow-right"></i>
          </span>
        </div>

        {/* Step 3 */}
        <div className="process-step text-center relative group hover:scale-105 transition-transform">
          <div className="step-number">3</div>
          <div className="h-10"></div>
          <div className="text-5xl mb-4">🚚</div>
          <h3 className="font-semibold text-xl mb-2 text-gray-700">
            Scheduled Delivery
          </h3>
          <p className="text-sm text-gray-500">
            We pick up your empties and drop off fresh, clean water at your door.
          </p>
          <span className="process-arrow hidden md:block">
            <i className="fas fa-arrow-right"></i>
          </span>
        </div>

        {/* Step 4 */}
        <div className="process-step text-center relative group hover:scale-105 transition-transform">
          <div className="step-number">4</div>
          <div className="h-10"></div>
          <div className="text-5xl mb-4">💧</div>
          <h3 className="font-semibold text-xl mb-2 text-gray-700">
            Stay Hydrated
          </h3>
          <p className="text-sm text-gray-500">
            Enjoy pure, refreshing water without ever leaving your home or office.
          </p>
        </div>
      </div>
    </section>
  );
};

export default OurProcess;

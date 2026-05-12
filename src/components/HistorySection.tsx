import React from "react";

const HistorySection: React.FC = () => {
  return (
    <section
      id="history"
      className="mt-16 p-12 bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100"
    >
      <h2 className="text-4xl font-bold text-gray-800 text-center mb-12">
        Our History: Since 2018
      </h2>

      <div className="relative max-w-4xl mx-auto">
        {/* Vertical timeline line */}
        <div className="border-l-2 border-blue-300 absolute h-full left-1/2 transform -translate-x-1/2 hidden md:block"></div>

        <div className="space-y-16">
          {/* Milestone 1 */}
          <div className="flex flex-col md:flex-row items-start md:justify-between w-full md:space-x-12 transition-all hover:bg-blue-50/30 p-4 rounded-lg">
            <div className="md:w-1/2 p-4 md:text-right">
              <h3 className="text-xl font-semibold text-gray-700">
                The Founding Idea
              </h3>
              <p className="text-gray-500 text-sm">
                Touch Up was founded in 2018 with a simple goal: to make
                accessing clean, refreshing water effortless for everyone.
              </p>
            </div>

            <div className="md:w-1/2 p-4 relative flex items-center md:justify-start gap-3 md:gap-4">
              <span className="bg-blue-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold shadow-md z-10 hover:scale-110 transition-transform">
                <i className="fas fa-home text-xs"></i>
              </span>
              <p className="text-blue-500 font-bold text-lg">2018</p>
            </div>
          </div>

          {/* Milestone 2 */}
          <div className="flex flex-col md:flex-row-reverse items-start md:justify-between w-full md:space-x-12 transition-all hover:bg-blue-50/30 p-4 rounded-lg">
            <div className="md:w-1/2 p-4 md:text-left">
              <h3 className="text-xl font-semibold text-gray-700">
                Logistics & Technology Investment
              </h3>
              <p className="text-gray-500 text-sm">
                We invested heavily in state-of-the-art filtration and logistics
                technology, moving beyond the single-truck operation to serve a
                wider region efficiently.
              </p>
            </div>

            <div className="md:w-1/2 p-4 relative flex items-center md:justify-end gap-3 md:gap-4">
              <p className="text-blue-500 font-bold text-lg md:text-right">
                2020
              </p>
              <span className="bg-blue-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold shadow-md z-10 hover:scale-110 transition-transform">
                <i className="fas fa-truck text-xs"></i>
              </span>
            </div>
          </div>

          {/* Milestone 3 */}
          <div className="flex flex-col md:flex-row items-start md:justify-between w-full md:space-x-12 transition-all hover:bg-blue-50/30 p-4 rounded-lg">
            <div className="md:w-1/2 p-4 md:text-right">
              <h3 className="text-xl font-semibold text-gray-700">
                The Sustainability Pledge
              </h3>
              <p className="text-gray-500 text-sm">
                We launched our container recycling and refill program, making a
                strong commitment to environmental sustainability and reducing
                plastic waste.
              </p>
            </div>

            <div className="md:w-1/2 p-4 relative flex items-center md:justify-start gap-3 md:gap-4">
              <span className="bg-blue-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold shadow-md z-10 hover:scale-110 transition-transform">
                <i className="fas fa-recycle text-xs"></i>
              </span>
              <p className="text-blue-500 font-bold text-lg">2023</p>
            </div>
          </div>

          {/* Milestone 4 - 2026 */}
          <div className="flex flex-col md:flex-row-reverse items-start md:justify-between w-full md:space-x-12 transition-all hover:bg-blue-50/30 p-4 rounded-lg">
            <div className="md:w-1/2 p-4 md:text-left">
              <h3 className="text-xl font-semibold text-gray-700">
                Digital Transformation
              </h3>
              <p className="text-gray-500 text-sm">
                Touch Up launched its new mobile app and expanded operations, 
                becoming the leading water delivery service with real-time tracking and 
                innovative delivery solutions for our satisfied customers.
              </p>
            </div>

            <div className="md:w-1/2 p-4 relative flex items-center md:justify-end gap-3 md:gap-4">
              <p className="text-blue-500 font-bold text-lg md:text-right">
                2026
              </p>
              <span className="bg-blue-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold shadow-md z-10 hover:scale-110 transition-transform">
                <i className="fas fa-rocket text-xs"></i>
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HistorySection;

import React, { useState } from "react";
import { Menu, X } from "lucide-react";

interface Props {
  setView: (view: string) => void;
}

const StaffSidebar: React.FC<Props> = ({ setView }) => {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("dashboard");

  const handleSelect = (view: string) => {
    setActive(view);
    setView(view);
    setOpen(false);
  };

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setOpen(true)}
        className="md:hidden fixed top-4 left-4 z-40 bg-gray-800 text-white p-2 rounded-lg shadow-lg"
      >
        <Menu size={22} />
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed z-30 md:static top-0 left-0 h-full w-64
        bg-gray-800 text-white flex flex-col
        transform transition-transform duration-300
        ${open ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-700">
          <h2 className="text-xl font-extrabold tracking-tight">
            Staff Panel
          </h2>

          <button
            onClick={() => setOpen(false)}
            className="md:hidden text-gray-300 hover:text-white"
          >
            <X size={22} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          <button
            onClick={() => handleSelect("dashboard")}
            className={`w-full px-4 py-2 rounded-lg text-left font-semibold transition
              ${
                active === "dashboard"
                  ? "bg-blue-600 text-white"
                  : "text-gray-300 hover:bg-gray-700 hover:text-white"
              }`}
          >
            Dashboard
          </button>

          <button
            onClick={() => handleSelect("staffpickup")}
            className={`w-full px-4 py-2 rounded-lg text-left font-semibold transition
              ${
                active === "staffpickup"
                  ? "bg-blue-600 text-white"
                  : "text-gray-300 hover:bg-gray-700 hover:text-white"
              }`}
          >
            Pickup Assignments
          </button>

          <button
            onClick={() => handleSelect("orders")}
            className={`w-full px-4 py-2 rounded-lg text-left font-semibold transition
              ${
                active === "orders"
                  ? "bg-blue-600 text-white"
                  : "text-gray-300 hover:bg-gray-700 hover:text-white"
              }`}
          >
            Orders
          </button>
        </nav>
      </aside>
    </>
  );
};

export default StaffSidebar;

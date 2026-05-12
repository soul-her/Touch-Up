import React from "react";

interface SidebarProps {
  setView: (view: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ setView }) => {
  return (
    <div className="w-64 bg-gray-800 text-white h-full p-4">
      <h3 className="text-xl font-bold mb-4">Dashboard</h3>
      <ul>
        <li className="mb-2">
          <button
            onClick={() => setView("orders")}
            className="w-full text-left px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded"
          >
            Orders
          </button>
        </li>
        <li>
          <button
            onClick={() => setView("pickups")}
            className="w-full text-left px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded"
          >
            Pickups
          </button>
        </li>
      </ul>
    </div>
  );
};

export default Sidebar;

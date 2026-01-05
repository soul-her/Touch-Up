// src/components/dashboards/ManagerDashboard.tsx
import React, { useState } from "react";
import type { User as AppUser } from "../../types";

import ManagerSidebar from "./ManagerSidebar";
import ManagerHeader from "./ManagerHeader";

import ManagerOrders from "./ManagerOrders";
import ManagerProducts from "./ManagerProducts";
import ManagerContainers from "./ManagerContainers";
import ManagerSales from "./ManagerSales";

type Tab = "orders" | "products" | "containers" | "sales";

interface ManagerDashboardProps {
  currentUser: AppUser | null;
  setView?: (view: string) => void;
}

const ManagerDashboard: React.FC<ManagerDashboardProps> = ({
  currentUser,
  setView,
}) => {
  const [activeTab, setActiveTab] = useState<Tab>("orders");

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Sidebar (keep your component) */}
      <ManagerSidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main */}
      <main className="flex flex-col flex-1 min-w-0">
        {/* Header (keep your component) */}
        <div className="sticky top-0 z-20 border-b border-white/10 bg-slate-900/60 backdrop-blur-xl">
          <ManagerHeader currentUser={currentUser} setView={setView} />
        </div>

        {/* Content */}
        <section className="flex-1 overflow-y-auto p-5 md:p-8">
          {/* Optional container for consistent width */}
          <div className="mx-auto w-full max-w-6xl">
            {activeTab === "orders" && <ManagerOrders />}
            {activeTab === "products" && <ManagerProducts />}
            {activeTab === "containers" && <ManagerContainers />}
            {activeTab === "sales" && <ManagerSales />}
          </div>
        </section>
      </main>
    </div>
  );
};

export default ManagerDashboard;

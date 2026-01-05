// src/components/dashboards/ManagerSidebar.tsx
import React, { useState } from "react";
import { Menu, X } from "lucide-react";

type Tab = "orders" | "products" | "containers" | "sales";

interface Props {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
}

const tabs: { id: Tab; label: string }[] = [
  { id: "orders", label: "Orders" },
  { id: "products", label: "Products" },
  { id: "containers", label: "Containers" },
  { id: "sales", label: "Sales" },
];

const ManagerSidebar: React.FC<Props> = ({ activeTab, setActiveTab }) => {
  const [open, setOpen] = useState(false);

  const selectTab = (t: Tab) => {
    setActiveTab(t);
    setOpen(false);
  };

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setOpen(true)}
        className="md:hidden fixed top-4 left-4 z-40 bg-slate-900/70 backdrop-blur-xl text-white p-2 rounded-xl border border-white/10 shadow"
      >
        <Menu size={22} />
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed z-30 md:static top-0 left-0 h-full w-72
        bg-slate-900/60 backdrop-blur-xl border-r border-white/10
        text-white flex flex-col transform transition-transform duration-300
        ${open ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <h2 className="text-xl font-extrabold tracking-tight">
            Manager Panel
          </h2>

          <button
            onClick={() => setOpen(false)}
            className="md:hidden text-white/70 hover:text-white"
          >
            <X size={22} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-2">
          {tabs.map((tab) => {
            const active = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => selectTab(tab.id)}
                className={`w-full text-left px-4 py-2.5 rounded-xl font-semibold transition
                  ${
                    active
                      ? "bg-blue-500 text-white shadow"
                      : "text-white/70 hover:bg-white/10 hover:text-white"
                  }
                `}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-white/10">
          <div className="rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-center text-xs text-white/60">
            Touch Up System
          </div>
        </div>
      </aside>

      {/* Backdrop (mobile) */}
      {open ? (
        <button
          aria-label="Close sidebar backdrop"
          className="fixed inset-0 z-20 bg-black/50 md:hidden"
          onClick={() => setOpen(false)}
        />
      ) : null}
    </>
  );
};

export default ManagerSidebar;

import React, { useEffect, useState } from "react";
import { auth } from "../../firebase";
import { signOut } from "firebase/auth";

import DriverOrders from "./DriverOrders";
import DriverPickups from "./DriverPickups";
import DriverContainers from "./DriverContainers";

import type { User } from "../../types";
import { Menu, X, Package, Truck, RefreshCcw, LogOut } from "lucide-react";

const DriverDashboard: React.FC<{ currentUser: User }> = ({ currentUser }) => {
  const [view, setView] = useState<"orders" | "pickups" | "containers">("orders");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await signOut(auth);
  };

  // Close sidebar on ESC (mobile)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSidebarOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const NavButton = ({
    id,
    label,
    icon,
  }: {
    id: "orders" | "pickups" | "containers";
    label: string;
    icon: React.ReactNode;
  }) => {
    const active = view === id;
    return (
      <button
        onClick={() => {
          setView(id);
          setSidebarOpen(false);
        }}
        className={[
          "group w-full flex items-center gap-3 px-4 py-3 rounded-xl transition",
          "focus:outline-none focus:ring-2 focus:ring-blue-400/40",
          active
            ? "bg-white/10 text-white shadow-[0_10px_30px_-15px_rgba(0,0,0,0.6)]"
            : "text-white/80 hover:bg-white/10 hover:text-white",
        ].join(" ")}
      >
        <span
          className={[
            "h-9 w-9 rounded-lg grid place-items-center transition",
            active ? "bg-blue-500/25" : "bg-white/5 group-hover:bg-white/10",
          ].join(" ")}
        >
          {icon}
        </span>
        <span className="font-semibold">{label}</span>

        {/* Active indicator */}
        <span
          className={[
            "ml-auto h-2 w-2 rounded-full transition",
            active ? "bg-blue-400" : "bg-transparent",
          ].join(" ")}
        />
      </button>
    );
  };

  return (
    <div className="min-h-screen relative">
      {/* Background */}
      <div className="fixed inset-0 -z-10">
        {/* gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800" />
        {/* subtle pattern */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.6) 1px, transparent 0)",
            backgroundSize: "18px 18px",
          }}
        />
        {/* soft glow blobs */}
        <div className="absolute -top-24 -left-24 h-80 w-80 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-indigo-500/20 blur-3xl" />
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/40 backdrop-blur-[1px] md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside
          className={[
            "fixed z-30 md:static top-0 left-0 h-full w-72",
            "transform transition-transform duration-300",
            sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          ].join(" ")}
        >
          <div className="h-full p-4">
            <div className="h-full rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_30px_80px_-40px_rgba(0,0,0,0.9)] flex flex-col overflow-hidden">
              {/* Brand */}
              <div className="p-5 border-b border-white/10 flex items-center justify-between">
                <div>
                  <p className="text-xs text-white/60">Touch Up</p>
                  <h2 className="text-xl font-extrabold tracking-tight text-white">
                    Driver Panel
                  </h2>
                </div>
                <button
                  className="md:hidden text-white/70 hover:text-white transition"
                  onClick={() => setSidebarOpen(false)}
                  aria-label="Close sidebar"
                >
                  <X size={22} />
                </button>
              </div>

              {/* Nav */}
              <nav className="p-4 space-y-2">
                <NavButton
                  id="orders"
                  label="Orders"
                  icon={<Package size={18} />}
                />
                <NavButton
                  id="pickups"
                  label="Pickups"
                  icon={<Truck size={18} />}
                />
                <NavButton
                  id="containers"
                  label="Containers"
                  icon={<RefreshCcw size={18} />}
                />
              </nav>

              {/* Footer */}
              <div className="mt-auto p-4 border-t border-white/10">
                <button
                  onClick={handleLogout}
                  className={[
                    "w-full flex items-center justify-center gap-2",
                    "bg-red-500/90 hover:bg-red-500 text-white",
                    "py-2.5 rounded-xl font-semibold transition",
                    "shadow-[0_12px_25px_-18px_rgba(0,0,0,0.9)]",
                    "focus:outline-none focus:ring-2 focus:ring-red-300/40",
                  ].join(" ")}
                >
                  <LogOut size={18} />
                  Log out
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 p-4 md:p-6 md:ml-0">
          {/* Top bar */}
          <div className="sticky top-0 z-10 mb-6">
            <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_25px_70px_-45px_rgba(0,0,0,0.9)] px-4 py-4 md:px-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  className="md:hidden text-white/90 hover:text-white transition p-2 rounded-xl bg-white/5 border border-white/10"
                  onClick={() => setSidebarOpen(true)}
                  aria-label="Open sidebar"
                >
                  <Menu size={22} />
                </button>

                <div>
                  <h1 className="text-xl md:text-2xl font-extrabold text-white tracking-tight">
                    Welcome, {currentUser?.displayName || "Driver"}
                  </h1>
                  <p className="text-xs md:text-sm text-white/60">
                    Manage deliveries, pickups, and container returns
                  </p>
                </div>
              </div>

              <div className="hidden md:flex items-center gap-2">
                <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-white/5 border border-white/10 text-white/80">
                  {view === "orders"
                    ? "Orders"
                    : view === "pickups"
                    ? "Pickups"
                    : "Containers"}
                </span>
              </div>
            </div>
          </div>

          {/* Content card */}
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_30px_90px_-55px_rgba(0,0,0,0.95)] p-4 md:p-6">
            {view === "orders" ? (
              <DriverOrders currentUser={currentUser} />
            ) : view === "pickups" ? (
              <DriverPickups currentUser={currentUser} />
            ) : (
              <DriverContainers currentUser={currentUser} />
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DriverDashboard;

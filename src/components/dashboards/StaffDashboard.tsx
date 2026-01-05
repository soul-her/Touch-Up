import React, { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { db, auth } from "../../firebase";
import { signOut } from "firebase/auth";
import type { Order, DBUser } from "../../types";

import OrdersTab from "../dashboards/StaffOrders";
import PickupsTab from "../dashboards/StaffPickups";

import { Menu, X, LogOut } from "lucide-react";

const StaffDashboard: React.FC<{ setView: (view: string) => void }> = ({
  setView,
}) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [pickups, setPickups] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<DBUser[]>([]);
  const [activeTab, setActiveTab] = useState<"orders" | "pickups">("orders");

  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingPickups, setLoadingPickups] = useState(true);
  const [loadingDrivers, setLoadingDrivers] = useState(true);

  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const ordersQuery = query(
      collection(db, "orders"),
      where("status", "in", [
        "pending",
        "Pending",
        "Placed",
        "Assigned",
        "Out for Delivery",
        "Delivered",
        "completed",
        "Completed",
      ]),
      orderBy("createdAt", "desc")
    );

    const unsubOrders = onSnapshot(
      ordersQuery,
      (snap) => {
        setOrders(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
        setLoadingOrders(false);
      },
      () => setLoadingOrders(false)
    );

    const driversQuery = query(collection(db, "users"), where("role", "==", "driver"));
    const unsubDrivers = onSnapshot(
      driversQuery,
      (snap) => {
        setDrivers(snap.docs.map((d) => ({ uid: d.id, ...(d.data() as any) })));
        setLoadingDrivers(false);
      },
      () => setLoadingDrivers(false)
    );

    const pickupsQuery = query(collection(db, "pickups"), orderBy("createdAt", "desc"));
    const unsubPickups = onSnapshot(
      pickupsQuery,
      (snap) => {
        setPickups(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
        setLoadingPickups(false);
      },
      () => setLoadingPickups(false)
    );

    return () => {
      unsubOrders();
      unsubDrivers();
      unsubPickups();
    };
  }, []);

  const loading = loadingOrders || loadingDrivers || loadingPickups;

  const handleLogout = async () => {
    await signOut(auth);
    setOrders([]);
    setPickups([]);
    setDrivers([]);
    setView("home");
  };

  const TabButton = ({
    tab,
    label,
  }: {
    tab: "orders" | "pickups";
    label: string;
  }) => (
    <button
      onClick={() => {
        setActiveTab(tab);
        setSidebarOpen(false);
      }}
      className={`w-full px-4 py-2 rounded-xl text-left font-semibold transition ${
        activeTab === tab
          ? "bg-blue-500 text-white"
          : "text-white/70 hover:bg-white/10 hover:text-white"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Mobile menu button */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="md:hidden fixed top-4 left-4 z-40 rounded-xl border border-white/10 bg-white/10 backdrop-blur px-3 py-2 shadow-lg"
      >
        <Menu size={22} />
      </button>

      {/* Sidebar (desktop + mobile drawer) */}
      <aside
        className={`fixed z-30 md:static top-0 left-0 h-full w-72 md:w-64
          bg-white/5 backdrop-blur-xl border-r border-white/10 p-6
          transform transition-transform duration-300
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-extrabold tracking-tight">Staff Panel</h2>

          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden text-white/70 hover:text-white"
          >
            <X size={22} />
          </button>
        </div>

        <nav className="space-y-2">
          <TabButton tab="orders" label="Orders" />
          <TabButton tab="pickups" label="Pickups" />
        </nav>

        <p className="mt-auto pt-6 text-xs text-white/40">
          Touch Up • Staff Console
        </p>
      </aside>

      {/* Main */}
      <main className="flex-1 p-6 md:ml-0 overflow-y-auto">
        {/* Top header with logout (UPPER RIGHT) */}
        <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="ml-12 md:ml-0">
            <h1 className="text-3xl font-extrabold tracking-tight">
              Staff Dashboard
            </h1>
            <p className="text-sm text-white/60">
              Manage orders, pickups, and driver assignments
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-xl bg-red-500/80 hover:bg-red-500 px-4 py-2 font-semibold transition shadow"
          >
            <LogOut size={18} />
            Logout
          </button>
        </header>

        {/* Content */}
        {loading ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 text-white/70">
            Loading data…
          </div>
        ) : (
          <>
            {activeTab === "orders" && <OrdersTab orders={orders} drivers={drivers} />}
            {activeTab === "pickups" && <PickupsTab pickups={pickups} drivers={drivers} />}
          </>
        )}
      </main>
    </div>
  );
};

export default StaffDashboard;

import React, { useState, useEffect } from "react";
import { db, auth } from "../../firebase";
import { collection, query, where, getDocs, updateDoc, doc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import DriverOrders from "./DriverOrders";
import DriverPickups from "./DriverPickups";
import type { User } from "../../types";
import { Menu, X } from "lucide-react"; // For icons

const DriverDashboard: React.FC<{ currentUser: User }> = ({ currentUser }) => {
  const [view, setView] = useState<"orders" | "pickups">("orders");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ✅ Automatically assign pickups to the current driver (if unassigned)
  useEffect(() => {
    const autoAssignPickups = async () => {
      if (!currentUser?.uid) return;

      try {
        const pickupsRef = collection(db, "pickups");
        const q = query(pickupsRef, where("driverId", "==", null));
        const snapshot = await getDocs(q);

        const batchUpdates = snapshot.docs.map(async (pickupDoc) => {
          const pickupRef = doc(db, "pickups", pickupDoc.id);
          await updateDoc(pickupRef, { driverId: currentUser.uid });
        });

        await Promise.all(batchUpdates);
      } catch (err) {
        console.error("Auto-assign error:", err);
      }
    };

    autoAssignPickups();
  }, [currentUser?.uid]);

  const handleLogout = async () => {
    await signOut(auth);
  };

  return (
    <div className="flex min-h-screen bg-gray-100 relative">
      {/* ========== Sidebar ========== */}
      <aside
        className={`fixed z-30 md:static md:translate-x-0 top-0 left-0 h-full w-64 bg-gray-800 text-white flex flex-col transform transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <h2 className="text-2xl font-bold">Driver Panel</h2>
          <button
            className="md:hidden text-gray-300 hover:text-white"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-3">
          <button
            onClick={() => {
              setView("orders");
              setSidebarOpen(false);
            }}
            className={`w-full text-left px-4 py-2 rounded-lg transition ${
              view === "orders" ? "bg-blue-600" : "hover:bg-gray-700"
            }`}
          >
            Orders
          </button>
          <button
            onClick={() => {
              setView("pickups");
              setSidebarOpen(false);
            }}
            className={`w-full text-left px-4 py-2 rounded-lg transition ${
              view === "pickups" ? "bg-blue-600" : "hover:bg-gray-700"
            }`}
          >
            Pickups
          </button>
        </nav>

        <div className="p-4 border-t border-gray-700">
          <button
            onClick={handleLogout}
            className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg"
          >
            Log out
          </button>
        </div>
      </aside>

      {/* ========== Main Content ========== */}
      <main className="flex-1 p-6 md:ml-0">
        {/* Top bar for mobile */}
        <div className="flex items-center justify-between mb-6">
          <button
            className="md:hidden text-gray-800"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={28} />
          </button>
          <h1 className="text-3xl font-bold text-gray-800">
            Welcome, {currentUser?.displayName || "Driver"}
          </h1>
        </div>

        {/* Render Selected View */}
        {view === "orders" ? (
          <DriverOrders currentUser={currentUser} />
        ) : (
          <DriverPickups currentUser={currentUser} />
        )}
      </main>
    </div>
  );
};

export default DriverDashboard;

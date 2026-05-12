import React, { useEffect, useState, useMemo } from "react";
import { db } from "../../firebase";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";

// Pickup interface
interface Pickup {
  id: string;
  status: string;
  driverName?: string;
  customerName?: string;
  address?: string;
  city?: string;
  zip?: string;
  date?: string;
  time?: string;
  userId?: string;
  createdAt: any;
}

const ManagerContainers: React.FC = () => {
  const [pickups, setPickups] = useState<Pickup[]>([]);
  const [error, setError] = useState<string>("");

  // Status filtering
  const [selectedStatus, setSelectedStatus] = useState<string>("Picked Up");

  // Fetch pickups with dynamic status filtering
  useEffect(() => {
    const q = query(
      collection(db, "pickups"),
      where("status", "==", selectedStatus), // Filter based on selected status
      orderBy("createdAt", "desc") // Order by createdAt time
    );

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const fetchedPickups = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Pickup),
        }));
        setPickups(fetchedPickups);
      },
      (err) => {
        console.error(err);
        setError("Failed to load pickups.");
      }
    );

    return () => unsubscribe(); // Cleanup subscription on component unmount
  }, [selectedStatus]);

  // Total Picked Up Containers
  const totalPickedUp = useMemo(() => {
    return pickups.filter((pickup) => pickup.status === "Picked Up").length;
  }, [pickups]);

  // Total Containers (count all pickups regardless of status)
  const totalContainers = useMemo(() => {
    return pickups.length;
  }, [pickups]);

  return (
    <section className="text-white space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight">Container Overview</h2>
          <p className="text-sm text-white/60">Picked up containers and all containers</p>
        </div>

        <span className="text-xs px-3 py-1 rounded-full bg-white/10 border border-white/10 text-white/70">
          {totalContainers} total containers
        </span>
      </div>

      {/* Error message */}
      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-5 shadow">
          <p className="text-sm text-white/60">Total Picked Up</p>
          <p className="text-3xl font-extrabold text-green-400">{totalPickedUp}</p>
          <p className="text-xs text-white/40 mt-2">Based on containers marked as "Picked Up"</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-5 shadow">
          <p className="text-sm text-white/60">Total Containers</p>
          <p className="text-3xl font-extrabold text-white">{totalContainers}</p>
          <p className="text-xs text-white/40 mt-2">Containers with status "Picked Up" or others</p>
        </div>
      </div>

      {/* Pickup Records */}
      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Pickup Records</h3>
          <span className="text-xs text-white/50">Showing {pickups.length} container(s)</span>
        </div>

        {/* Filter Dropdown */}
        <div className="mb-5">
          <label htmlFor="status" className="text-sm text-white/60">Filter by Status</label>
          <select
            id="status"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
          >
            <option value="Picked Up">Picked Up</option>
            <option value="Pending">Pending</option>
            <option value="On the Way">On the Way</option>
          </select>
        </div>

        {pickups.length === 0 ? (
          <p className="text-white/60">No container pickups found.</p>
        ) : (
          <ul className="divide-y divide-white/10">
            {pickups.map((pickup) => (
              <li key={pickup.id} className="py-3 flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-sm text-white/80 truncate">Pickup ID: {pickup.id}</p>
                  <p className="text-xs text-white/40">{pickup.status}</p>
                </div>
                <p className="font-bold text-white">
                  {pickup.driverName || "Unnamed Driver"}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
};

export default ManagerContainers;

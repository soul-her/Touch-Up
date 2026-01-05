// src/components/dashboards/ManagerContainers.tsx
import React, { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../../firebase";

const CONTAINER_PRODUCT_NAME = "New Container";

type Product = {
  id: string;
  name: string;
  stock?: number;
};

type Order = {
  id: string;
  status?: string;
};

type ContainerPickupLog = {
  id: string;
  driverId?: string;
  status?: string;
};

const ManagerContainers: React.FC = () => {
  const [inventory, setInventory] = useState<Product | null>(null);
  const [deliveredOrders, setDeliveredOrders] = useState<Order[]>([]);
  const [pickupLogs, setPickupLogs] = useState<ContainerPickupLog[]>([]);
  const [error, setError] = useState("");

  // Inventory
  useEffect(() => {
    const qInv = query(
      collection(db, "products"),
      where("name", "==", CONTAINER_PRODUCT_NAME)
    );

    return onSnapshot(
      qInv,
      (snap) => {
        if (snap.empty) {
          setInventory(null);
          return;
        }
        const d = snap.docs[0];
        setInventory({ id: d.id, ...(d.data() as any) });
      },
      (err) => setError(err.message)
    );
  }, []);

  // Delivered orders
  useEffect(() => {
    const qOrders = query(
      collection(db, "orders"),
      where("status", "==", "Delivered")
    );

    return onSnapshot(
      qOrders,
      (snap) =>
        setDeliveredOrders(
          snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }))
        ),
      (err) => setError(err.message)
    );
  }, []);

  // Container pickup logs
  useEffect(() => {
    const qLogs = query(
      collection(db, "containerPickups"),
      where("status", "==", "Completed")
    );

    return onSnapshot(
      qLogs,
      (snap) =>
        setPickupLogs(
          snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }))
        ),
      (err) => setError(err.message)
    );
  }, []);

  // Stats
  const stats = useMemo(() => {
    const totalWeHave = inventory?.stock ?? 0;
    const issued = deliveredOrders.length;
    const pickedUp = pickupLogs.length;
    const inUse = Math.max(0, issued - pickedUp);

    const byDriver: Record<string, number> = {};
    pickupLogs.forEach((l) => {
      const id = l.driverId || "Unknown";
      byDriver[id] = (byDriver[id] || 0) + 1;
    });

    const leaderboard = Object.entries(byDriver)
      .map(([driverId, count]) => ({ driverId, count }))
      .sort((a, b) => b.count - a.count);

    return { totalWeHave, issued, pickedUp, inUse, leaderboard };
  }, [inventory, deliveredOrders, pickupLogs]);

  return (
    <section className="text-white space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight">
            Container Overview
          </h2>
          <p className="text-sm text-white/60">
            Inventory, issued containers, and returns
          </p>
        </div>

        <span className="text-xs px-3 py-1 rounded-full bg-white/10 border border-white/10 text-white/70">
          Product: {CONTAINER_PRODUCT_NAME}
        </span>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        {[
          { label: "Stock Available", value: stats.totalWeHave },
          { label: "Issued (Delivered)", value: stats.issued },
          { label: "Picked Up", value: stats.pickedUp, color: "text-green-400" },
          { label: "In Use", value: stats.inUse, color: "text-yellow-400" },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-5 shadow"
          >
            <p className="text-sm text-white/60">{s.label}</p>
            <p className={`text-3xl font-bold ${s.color ?? ""}`}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Leaderboard */}
      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow">
        <h3 className="text-lg font-semibold mb-4">
          Picked Up per Driver
        </h3>

        {stats.leaderboard.length === 0 ? (
          <p className="text-white/60 text-sm">
            No container pickup logs yet.
          </p>
        ) : (
          <div className="divide-y divide-white/10">
            {stats.leaderboard.map((r) => (
              <div
                key={r.driverId}
                className="flex items-center justify-between py-3"
              >
                <span className="text-sm text-white/80 truncate">
                  {r.driverId}
                </span>
                <span className="font-bold text-white">
                  {r.count}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default ManagerContainers;

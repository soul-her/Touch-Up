// src/components/dashboards/ManagerSales.tsx
import React, { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../../firebase";

interface Order {
  id: string;
  total?: number;
  status: string;
  createdAt: any;
}

const ManagerSales: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    // ✅ TEMP: include Placed + Delivered
    const q = query(
      collection(db, "orders"),
      where("status", "in", ["Placed", "Delivered"])
    );

    return onSnapshot(q, (snap) => {
      setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Order)));
    });
  }, []);

  const totalSales = useMemo(() => {
    return orders.reduce((sum, o) => sum + (o.total ?? 0), 0);
  }, [orders]);

  return (
    <section className="text-white">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight">
            Sales Overview
          </h2>
          <p className="text-sm text-white/60">
            Summary based on Placed + Delivered orders
          </p>
        </div>

        <span className="text-xs px-3 py-1 rounded-full bg-white/10 border border-white/10 text-white/70">
          {orders.length} records
        </span>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-5 shadow">
          <p className="text-sm text-white/60">Total Sales</p>
          <p className="text-3xl font-extrabold text-green-400">
            ₱{totalSales.toLocaleString()}
          </p>
          <p className="text-xs text-white/40 mt-2">
            Computed from order totals
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-5 shadow">
          <p className="text-sm text-white/60">Orders Count</p>
          <p className="text-3xl font-extrabold text-white">{orders.length}</p>
          <p className="text-xs text-white/40 mt-2">
            Placed + Delivered only
          </p>
        </div>
      </div>

      {/* Records */}
      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Sales Records</h3>
          <span className="text-xs text-white/50">
            Showing {orders.length} order(s)
          </span>
        </div>

        {orders.length === 0 ? (
          <p className="text-white/60">No sales records yet.</p>
        ) : (
          <ul className="divide-y divide-white/10">
            {orders.map((o) => (
              <li key={o.id} className="py-3 flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-sm text-white/80 truncate">
                    Order #{o.id}
                  </p>
                  <p className="text-xs text-white/40">{o.status}</p>
                </div>

                <p className="font-bold text-white">
                  ₱{(o.total ?? 0).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
};

export default ManagerSales;

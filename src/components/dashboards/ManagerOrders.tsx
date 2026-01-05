// src/components/dashboards/ManagerOrders.tsx
import React, { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "../../firebase";

interface Order {
  id: string;
  customerName: string;
  status: string;
  createdAt: any;
  address?: {
    street?: string;
    barangay?: string;
    city?: string;
    province?: string;
  };
  total?: number;
}

const statusColor = (status: string) => {
  switch (status) {
    case "Delivered":
      return "bg-green-500/15 text-green-300 border border-green-500/20";
    case "Out for Delivery":
      return "bg-blue-500/15 text-blue-300 border border-blue-500/20";
    case "Assigned":
      return "bg-indigo-500/15 text-indigo-300 border border-indigo-500/20";
    case "Placed":
      return "bg-yellow-500/15 text-yellow-300 border border-yellow-500/20";
    default:
      return "bg-white/10 text-white/80 border border-white/10";
  }
};

const ManagerOrders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    return onSnapshot(
      query(collection(db, "orders"), orderBy("createdAt", "desc")),
      (snap) => setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Order)))
    );
  }, []);

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow">
      <div className="flex items-end justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-white">Orders</h2>
          <p className="text-sm text-white/60">Latest orders and status updates</p>
        </div>

        <span className="text-xs px-3 py-1 rounded-full bg-white/10 border border-white/10 text-white/70">
          {orders.length} total
        </span>
      </div>

      {orders.length === 0 ? (
        <p className="text-white/60">No orders found.</p>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <div
              key={o.id}
              className="rounded-2xl border border-white/10 bg-slate-950/20 p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-bold text-white">
                    {o.customerName || "—"}
                  </p>

                  <p className="text-sm text-white/70">
                    {(o.address?.street ?? "—")}
                    {o.address?.barangay ? `, ${o.address.barangay}` : ""}
                    {o.address?.city ? `, ${o.address.city}` : ""}
                    {o.address?.province ? `, ${o.address.province}` : ""}
                  </p>

                  <p className="text-xs text-white/50 mt-1">
                    {o.createdAt?.toDate ? o.createdAt.toDate().toLocaleString() : "—"}
                  </p>
                </div>

                <div className="text-right">
                  <span
                    className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${statusColor(
                      o.status
                    )}`}
                  >
                    {o.status || "—"}
                  </span>

                  {typeof o.total === "number" ? (
                    <p className="mt-2 text-lg font-extrabold text-white">
                      ₱{o.total}
                    </p>
                  ) : null}
                </div>
              </div>

              <p className="text-xs text-white/40 mt-3 break-all">
                Order ID: <span className="text-white/60">{o.id}</span>
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default ManagerOrders;

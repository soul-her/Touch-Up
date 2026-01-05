import React, { useEffect, useMemo, useState } from "react";
import { db } from "../../firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  orderBy,
} from "firebase/firestore";
import type { User } from "../../types";

interface Order {
  id: string;
  customerName?: string;
  name?: string;
  address?: any;
  time?: string;
  date?: string;
  status: string;
  userId: string;
  driverId?: string;
  createdAt?: any;
}

interface DriverOrdersProps {
  currentUser: User;
}

function statusPill(status?: string) {
  const s = (status || "").toLowerCase();

  if (s === "completed" || s === "delivered") {
    return "bg-green-500/20 text-green-300 border border-green-500/20";
  }
  if (s.includes("out") || s.includes("delivery")) {
    return "bg-blue-500/20 text-blue-300 border border-blue-500/20";
  }
  if (s === "assigned") {
    return "bg-yellow-500/20 text-yellow-300 border border-yellow-500/20";
  }
  return "bg-white/10 text-white/80 border border-white/10";
}

function safeDate(createdAt: any) {
  try {
    if (!createdAt?.toDate) return "N/A";
    return createdAt.toDate().toLocaleDateString();
  } catch {
    return "N/A";
  }
}

function safeTime(createdAt: any) {
  try {
    if (!createdAt?.toDate) return "N/A";
    return createdAt.toDate().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "N/A";
  }
}

function formatAddress(address: any) {
  if (!address) return "—";
  if (typeof address === "string") return address;

  // supports both old fields and your new address map
  const street = address.street || address.address || "—";
  const city = address.city || "—";
  const brgy = address.barangay ? `, ${address.barangay}` : "";
  const prov = address.province ? `, ${address.province}` : "";
  return `${street}, ${city}${brgy}${prov}`;
}

const DriverOrders: React.FC<DriverOrdersProps> = ({ currentUser }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!currentUser?.uid) return;

    setLoading(true);
    setError("");

    const q = query(
      collection(db, "orders"),
      where("driverId", "==", currentUser.uid),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map(
          (d) => ({ id: d.id, ...(d.data() as any) } as Order)
        );
        setOrders(data);
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setError(err?.message || "Failed to load orders.");
        setLoading(false);
      }
    );

    return () => unsub();
  }, [currentUser?.uid]);

  const updateOrderStatus = async (id: string, status: string) => {
    try {
      setError("");
      await updateDoc(doc(db, "orders", id), { status });
    } catch (err: any) {
      console.error("Update order status failed:", err);
      setError(err?.message || "Failed to update order status.");
    }
  };

  const title = useMemo(() => "My Deliveries", []);

  if (loading) return <p className="text-white/70">Loading deliveries…</p>;

  return (
    <div className="text-white">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
          {title}
        </h2>

        <span className="text-xs md:text-sm px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/70">
          {orders.length} total
        </span>
      </div>

      {error ? (
        <div className="mb-5 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      {orders.length === 0 ? (
        <p className="text-white/70">No assigned orders.</p>
      ) : (
        <ul className="space-y-6">
          {orders.map((o) => {
            const date = o.date || safeDate(o.createdAt);
            const time = o.time || safeTime(o.createdAt);
            const customer = o.customerName || o.name || "Unknown";
            const addr = formatAddress(o.address);

            return (
              <li
                key={o.id}
                className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-5 shadow-[0_20px_50px_-30px_rgba(0,0,0,0.9)]"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-white/50">Order ID</p>
                    <p className="font-semibold text-white break-all">
                      {o.id}
                    </p>
                  </div>

                  <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${statusPill(o.status)}`}>
                    {o.status}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-white/80">
                  <p>
                    <span className="font-semibold text-white">Customer:</span>{" "}
                    {customer}
                  </p>
                  <p>
                    <span className="font-semibold text-white">Date:</span>{" "}
                    {date}
                  </p>
                  <p className="md:col-span-2">
                    <span className="font-semibold text-white">Address:</span>{" "}
                    {addr}
                  </p>
                  <p>
                    <span className="font-semibold text-white">Time:</span>{" "}
                    {time}
                  </p>
                </div>

                {/* Action buttons */}
                <div className="mt-5 flex flex-wrap gap-2 justify-end">
                  {o.status === "Assigned" && (
                    <button
                      onClick={() => updateOrderStatus(o.id, "Out for Delivery")}
                      className="px-4 py-2 rounded-xl font-semibold bg-blue-500/80 hover:bg-blue-500 text-white transition shadow"
                    >
                      Out for Delivery
                    </button>
                  )}

                  {o.status === "Out for Delivery" && (
                    <button
                      onClick={() => updateOrderStatus(o.id, "Completed")}
                      className="px-4 py-2 rounded-xl font-semibold bg-green-500/80 hover:bg-green-500 text-white transition shadow"
                    >
                      Mark Completed
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default DriverOrders;

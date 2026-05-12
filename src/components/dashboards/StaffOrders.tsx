import React, { useEffect, useState } from "react";
import { db } from "../../firebase";
import { collection, query, where, onSnapshot, orderBy, updateDoc, doc, serverTimestamp } from "firebase/firestore";

interface Order {
  id: string;
  customerName: string;
  status: string;
  createdAt: any;
  total?: number;
  driverId?: string;
  driverName?: string; // Added to store the assigned driver's name
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
    case "Completed":
      return "bg-gray-500/15 text-gray-300 border border-gray-500/20";
    case "Cancelled":
      return "bg-red-500/15 text-red-300 border border-red-500/20";
    default:
      return "bg-white/10 text-white/80 border border-white/10";
  }
};

const StaffOrders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]); // List of drivers
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch orders
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const data = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Order),
        }));
        setOrders(data);
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setError("Failed to load orders.");
        setLoading(false);
      }
    );

    // Fetch drivers
    const qDrivers = query(collection(db, "users"), where("role", "==", "driver"));
    const unsubDrivers = onSnapshot(
      qDrivers,
      (snap) => {
        const driversData = snap.docs.map((d) => ({
          uid: d.id,
          ...(d.data() as any),
        }));
        setDrivers(driversData);
      },
      (err) => {
        console.error(err);
        setError("Failed to load drivers.");
      }
    );

    return () => {
      unsub();
      unsubDrivers();
    };
  }, []);

  const cancelOrder = async (orderId: string) => {
    try {
      const order = orders.find((o) => o.id === orderId);
      if (!order) return;

      const orderStatus = (order.status ?? "").toLowerCase();

      if (orderStatus === "completed" || orderStatus === "cancelled") {
        alert("This order cannot be cancelled as it is already completed or cancelled.");
        return;
      }

      await updateDoc(doc(db, "orders", orderId), {
        status: "Cancelled",
        cancelledAt: serverTimestamp(),
      });

      const updatedOrders = orders.map((o) =>
        o.id === orderId ? { ...o, status: "Cancelled" } : o
      );
      setOrders(updatedOrders);

      alert("Order successfully cancelled.");
    } catch (err) {
      console.error("Cancel order failed:", err);
      alert("Failed to cancel order.");
    }
  };

  const assignDriver = async (orderId: string, driverUid: string) => {
    try {
      const driver = drivers.find((d) => d.uid === driverUid);
      if (!driver) return;

      await updateDoc(doc(db, "orders", orderId), {
        driverId: driver.uid,
        driverName: driver.displayName ?? "",
        status: "Assigned",
        assignedAt: serverTimestamp(),
      });

      alert("Driver assigned successfully.");
    } catch (err) {
      console.error("Assign driver failed:", err);
      alert("Failed to assign driver.");
    }
  };

  if (loading) return <p className="text-center text-gray-600">Loading...</p>;

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow">
      <div className="flex items-end justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-white">Orders</h2>
          <p className="text-sm text-white/60">Manage orders by assigning drivers and updating delivery statuses</p>
        </div>

        <span className="text-xs px-3 py-1 rounded-full bg-white/10 border border-white/10 text-white/70">
          {orders.length} total
        </span>
      </div>

      {orders.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 text-white/70">No orders found.</div>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_20px_50px_-30px_rgba(0,0,0,0.9)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-white/5 border-b border-white/10">
                <tr className="text-left text-xs uppercase tracking-wider text-white/60">
                  <th className="px-4 py-3">Order ID</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Driver</th> {/* Added column to show driver */}
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/10">
                {orders.map((order) => {
                  const canCancel = order.status !== "Completed" && order.status !== "Cancelled";
                  const canAssignDriver = order.status !== "Completed" && order.status !== "Cancelled" && !order.driverId;

                  return (
                    <tr key={order.id} className="hover:bg-white/5 transition">
                      <td className="px-4 py-4 text-sm font-semibold text-white break-all">{order.id}</td>
                      <td className="px-4 py-4 text-sm text-white/80">{order.customerName ?? "N/A"}</td>
                      <td className="px-4 py-4 text-sm text-white/80">₱{order.total}</td>
                      <td className="px-4 py-4 text-sm text-white/80">{order.status}</td>
                      <td className="px-4 py-4 text-sm text-white/80">
                        {order.driverName ?? "No driver assigned"}
                      </td> {/* Display the driver name */}
                      <td className="px-4 py-4">
                        <div className="flex gap-2 flex-wrap">
                          <button
                            disabled={!canCancel}
                            onClick={() => cancelOrder(order.id)}
                            className={`px-3 py-2 rounded-xl text-sm font-semibold transition ${
                              canCancel ? "bg-red-500 hover:bg-red-600 text-white" : "bg-white/10 text-white/40 cursor-not-allowed"
                            }`}
                          >
                            Cancel Order
                          </button>

                          {canAssignDriver && (
                            <select
                              onChange={(e) => assignDriver(order.id, e.target.value)}
                              className="px-3 py-2 rounded-xl text-sm font-semibold bg-black text-white"
                              defaultValue="" // Set the default value to an empty string
                            >
                              <option value="" disabled>Select Driver</option>
                              {drivers.map((driver) => (
                                <option key={driver.uid} value={driver.uid}>
                                  {driver.displayName}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>

                        {order.status === "Cancelled" && (
                          <p className="text-xs text-white/50 mt-2">Order Cancelled</p>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
};

export default StaffOrders;

import React from "react";
import type { Order, DBUser } from "../../types";
import { db } from "../../firebase";
import { updateDoc, doc, serverTimestamp } from "firebase/firestore";

interface Props {
  orders: Order[];
  drivers: DBUser[];
}

const ASSIGNABLE_STATUSES = new Set(["pending", "Placed"]);
const DELIVERABLE_STATUSES = new Set(["Assigned"]);
const COMPLETABLE_STATUSES = new Set(["Delivered"]);

const StaffOrders: React.FC<Props> = ({ orders, drivers }) => {
  const assignOrderDriver = async (orderId: string, driverUid: string) => {
    try {
      const driver = drivers.find((d) => d.uid === driverUid);
      if (!driver) return;

      await updateDoc(doc(db, "orders", orderId), {
        driverId: driver.uid,
        driverName: driver.displayName ?? "",
        status: "Assigned",
        assignedAt: serverTimestamp(),
        isContainerPickedUp: false,
      });
    } catch (err) {
      console.error("Assign driver failed:", err);
      alert("Failed to assign driver. Check rules/permissions.");
    }
  };

  const markDelivered = async (orderId: string) => {
    try {
      await updateDoc(doc(db, "orders", orderId), {
        status: "Delivered",
        deliveredAt: serverTimestamp(),
      });
    } catch (err) {
      console.error("Mark delivered failed:", err);
      alert("Failed to mark delivered.");
    }
  };

  const markCompleted = async (orderId: string) => {
    try {
      await updateDoc(doc(db, "orders", orderId), {
        status: "completed",
        completedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error("Mark completed failed:", err);
      alert("Failed to mark completed.");
    }
  };

  return (
    <div className="text-white">
      {/* Header */}
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Orders
          </h1>
          <p className="text-sm text-white/60 mt-1">
            Assign drivers and update delivery progress.
          </p>
        </div>

        <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/70">
          {orders.length} total
        </span>
      </div>

      {/* Empty state */}
      {orders.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 text-white/70">
          No orders found.
        </div>
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
                  <th className="px-4 py-3">Driver</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/10">
                {orders.map((order) => {
                  const canAssign = ASSIGNABLE_STATUSES.has(order.status);
                  const canMarkDelivered = DELIVERABLE_STATUSES.has(order.status);
                  const canMarkCompleted = COMPLETABLE_STATUSES.has(order.status);

                  return (
                    <tr key={order.id} className="hover:bg-white/5 transition">
                      <td className="px-4 py-4 text-sm font-semibold text-white break-all">
                        {order.id}
                      </td>

                      <td className="px-4 py-4 text-sm text-white/80">
                        {order.customerName ?? order.name ?? "N/A"}
                      </td>

                      <td className="px-4 py-4 text-sm text-white/80">
                        ₱{order.total}
                      </td>

                      <td className="px-4 py-4 text-sm text-white/80">
                        {order.status}
                      </td>

                      <td className="px-4 py-4">
                        {canAssign ? (
                          <select
                            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-white/20"
                            defaultValue=""
                            onChange={(e) => {
                              const uid = e.target.value;
                              if (!uid) return;
                              assignOrderDriver(order.id, uid);
                            }}
                          >
                            <option value="" disabled className="text-black">
                              Select Driver
                            </option>
                            {drivers.map((d) => (
                              <option key={d.uid} value={d.uid} className="text-black">
                                {d.displayName}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-sm text-white/80">
                            {order.driverName ?? "—"}
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex gap-2 flex-wrap">
                          <button
                            disabled={!canMarkDelivered}
                            onClick={() => markDelivered(order.id)}
                            className={`px-3 py-2 rounded-xl text-sm font-semibold transition ${
                              canMarkDelivered
                                ? "bg-emerald-500/80 hover:bg-emerald-500 text-white"
                                : "bg-white/10 text-white/40 cursor-not-allowed"
                            }`}
                          >
                            Mark Delivered
                          </button>

                          <button
                            disabled={!canMarkCompleted}
                            onClick={() => markCompleted(order.id)}
                            className={`px-3 py-2 rounded-xl text-sm font-semibold transition ${
                              canMarkCompleted
                                ? "bg-indigo-500/80 hover:bg-indigo-500 text-white"
                                : "bg-white/10 text-white/40 cursor-not-allowed"
                            }`}
                          >
                            Mark Completed
                          </button>
                        </div>

                        {order.isContainerPickedUp ? (
                          <p className="text-xs text-white/50 mt-2">
                            Container already picked up
                          </p>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffOrders;

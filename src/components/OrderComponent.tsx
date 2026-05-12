import React, { useState, useEffect, useMemo } from "react";
import { db } from "../firebase";
import { collection, query, where, onSnapshot, doc, updateDoc, orderBy, serverTimestamp } from "firebase/firestore";
import type { AnyDoc } from "../types";

function statusBadge(status?: string) {
  const s = (status ?? "").toLowerCase();
  if (s === "placed" || s === "pending") return "bg-yellow-100 text-yellow-800";
  if (s === "assigned" || s === "out for delivery") return "bg-blue-100 text-blue-800";
  if (s === "delivered" || s === "completed") return "bg-green-100 text-green-800";
  if (s === "cancelled" || s === "canceled") return "bg-gray-200 text-gray-800";
  return "bg-gray-100 text-gray-800";
}

function isCompletedOrder(status?: string) {
  const s = (status ?? "").toLowerCase();
  return s === "completed" || s === "delivered";
}

function isCancelled(status?: string) {
  const s = (status ?? "").toLowerCase();
  return s === "cancelled" || s === "canceled";
}

function canUserCancelOrder(o: AnyDoc) {
  const status = (o?.status ?? "").toString().toLowerCase();
  const hasDriver = Boolean(o?.driverId) || Boolean(o?.driverName);
  const done = status === "delivered" || status === "completed";
  const cancelled = status === "cancelled" || status === "canceled";
  const allowedStatus = status === "placed" || status === "pending"; // Allow cancel only for Placed or Pending
  return !hasDriver && !done && !cancelled && allowedStatus;
}

const OrderComponent: React.FC<{ uid: string }> = ({ uid }) => {
  const [orders, setOrders] = useState<AnyDoc[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setOrders([]);
    setLoadingOrders(true);
    setError("");

    if (!uid) {
      setLoadingOrders(false);
      return;
    }

    const q = query(
      collection(db, "orders"),
      where("userId", "==", uid),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const data = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as AnyDoc),
        }));
        setOrders(data);
        setLoadingOrders(false);
      },
      (err) => {
        console.error(err);
        setError(err?.message || "Failed to load orders.");
        setLoadingOrders(false);
      }
    );

    return () => unsub();
  }, [uid]);

  const activeOrders = useMemo(() => orders.filter((o) => !isCompletedOrder(o.status) && !isCancelled(o.status)), [orders]);
  const completedOrders = useMemo(() => orders.filter((o) => isCompletedOrder(o.status)), [orders]);

  const handleCancelOrder = async (orderId: string) => {
    try {
      const orderRef = doc(db, "orders", orderId);
      await updateDoc(orderRef, {
        status: "Cancelled",
        cancelledAt: serverTimestamp(), // Set the time when the order was cancelled
      });
      alert("Order successfully cancelled.");
    } catch (err) {
      console.error("Error updating order status:", err);
      setError("Failed to cancel order. " + (err?.message || "Unknown error"));
    }
  };

  return (
    <div className="flex flex-wrap gap-4">
      <div className="border rounded-xl p-4 w-full">
        <h3 className="font-semibold text-lg mb-3">Active Orders</h3>
        {loadingOrders ? <p>Loading...</p> : activeOrders.map((o) => {
          const canCancel = canUserCancelOrder(o);
          return (
            <div key={o.id} className="p-4 border rounded-lg mb-4 bg-gray-50">
              <p>Order #{o.id.slice(-6)}</p>
              <p>Status: <span className={statusBadge(o.status)}>{o.status}</span></p>
              <button
                onClick={() => handleCancelOrder(o.id)}
                disabled={!canCancel}
                className={`mt-2 w-full px-4 py-2 rounded-lg ${canCancel ? "bg-red-600 text-white" : "bg-gray-300 text-gray-700"}`}
              >
                Cancel Order
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OrderComponent;

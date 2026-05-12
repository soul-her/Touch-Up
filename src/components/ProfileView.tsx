import React, { useState, useEffect, useMemo } from "react";
import { db } from "../firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  doc,
  updateDoc,
} from "firebase/firestore";
import SchedulePickupForm from "./SchedulePickupForm";
import type { View } from "../types";

type AnyDoc = Record<string, any>;

interface ProfileViewProps {
  currentUser: { uid: string; email?: string } | null;
  setView: (view: View) => void;
}

function safeToLocale(ts: any) {
  try {
    if (!ts) return "—";
    if (typeof ts?.toDate === "function") return ts.toDate().toLocaleString();
    const d = new Date(ts);
    return isNaN(d.getTime()) ? "—" : d.toLocaleString();
  } catch {
    return "—";
  }
}

function statusBadge(status?: string) {
  const s = (status ?? "").toLowerCase();
  if (s === "placed" || s === "pending") return "bg-yellow-100 text-yellow-800";
  if (s === "assigned" || s === "out for delivery")
    return "bg-blue-100 text-blue-800";
  if (s === "delivered" || s === "completed")
    return "bg-green-100 text-green-800";
  if (s === "cancelled" || s === "canceled")
    return "bg-gray-200 text-gray-800";
  return "bg-gray-100 text-gray-800";
}

function isCompletedOrder(status?: string) {
  const s = (status ?? "").toLowerCase();
  return s === "completed" || s === "delivered";
}

function isDelivered(status?: string) {
  const s = (status ?? "").toLowerCase();
  return s === "delivered";
}

function isCancelled(status?: string) {
  const s = (status ?? "").toLowerCase();
  return s === "cancelled" || s === "canceled";
}

const ProfileView: React.FC<ProfileViewProps> = ({ currentUser, setView }) => {
  const uid = currentUser?.uid;

  const [orders, setOrders] = useState<AnyDoc[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingPickups, setLoadingPickups] = useState(true);

  const [pickupOrderId, setPickupOrderId] = useState<string | null>(null);

  // one simple success banner (no “failed” UI)
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // auto-hide banner after a bit
  useEffect(() => {
    if (!successMessage) return;
    const t = setTimeout(() => setSuccessMessage(null), 3500);
    return () => clearTimeout(t);
  }, [successMessage]);

  // ORDERS
  useEffect(() => {
    setOrders([]);
    setLoadingOrders(true);

    if (!uid) {
      setLoadingOrders(false);
      return;
    }

    const q = query(
      collection(db, "orders"),
      where("userId", "==", uid),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as AnyDoc),
      }));
      setOrders(data);
      setLoadingOrders(false);
    });

    return () => unsub();
  }, [uid]);

  // PICKUPS
  useEffect(() => {
    setLoadingPickups(true);

    if (!uid) {
      setLoadingPickups(false);
      return;
    }

    const q = query(
      collection(db, "pickups"),
      where("userId", "==", uid),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(q, () => {
      setLoadingPickups(false);
    });

    return () => unsub();
  }, [uid]);

  const activeOrders = useMemo(
    () =>
      orders.filter(
        (o) => !isCompletedOrder(o.status) && !isCancelled(o.status)
      ),
    [orders]
  );

  const completedOrders = useMemo(
    () => orders.filter((o) => isCompletedOrder(o.status) && !isCancelled(o.status)),
    [orders]
  );

  const cancelledOrders = useMemo(
    () => orders.filter((o) => isCancelled(o.status)),
    [orders]
  );

  // ---- Actions: customer status updates (matches your Firestore intent) ----
  // No error UI. If the rule blocks it, nothing “failed” is shown.
  const cancelOrder = async (orderId: string) => {
    await updateDoc(doc(db, "orders", orderId), { status: "cancelled" });
    setSuccessMessage("✅ Order cancelled successfully.");
  };

  const markOrderCompleted = async (orderId: string) => {
    await updateDoc(doc(db, "orders", orderId), { status: "completed" });
    setSuccessMessage("✅ Order marked as completed.");
  };

  if (pickupOrderId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 flex items-center justify-between gap-3">
            <h2 className="text-3xl font-bold text-gray-800">
              Schedule Container Pickup
            </h2>
            <button
              onClick={() => setPickupOrderId(null)}
              className="px-6 py-3 bg-gray-200 text-gray-800 font-bold rounded-lg hover:bg-gray-300 transition"
            >
              ← Back
            </button>
          </div>

          <SchedulePickupForm
            currentUser={currentUser as any}
            setView={setView}
            orderId={pickupOrderId}
          />
        </div>
      </div>
    );
  }

  if (loadingOrders || loadingPickups) {
    return <p className="text-center mt-10 text-gray-600">Loading profile…</p>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-black text-gray-900">My Profile</h1>
            <p className="text-sm text-gray-600 mt-2">
              <strong>Email:</strong> {currentUser?.email || "—"}
            </p>
          </div>

          <button
            onClick={() => setView("products")}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold rounded-lg hover:shadow-lg transition-all"
          >
            Back to Shop
          </button>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="bg-green-100 text-green-900 border border-green-300 p-4 rounded-lg mb-6 font-medium">
            {successMessage}
          </div>
        )}

        {/* Active Orders Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
            <h2 className="text-xl font-bold text-white">Active Orders ({activeOrders.length})</h2>
          </div>

          {activeOrders.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p>No active orders</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Order ID</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Total</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Created</th>
                    <th className="px-6 py-3 text-center text-xs font-bold text-gray-700 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {activeOrders.map((o) => (
                    <tr key={o.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 text-sm font-mono text-gray-700">#{o.id.slice(-6)}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{o.customerName || o.name || "—"}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">₱{Number(o.total || 0).toFixed(2)}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusBadge(o.status)}`}>
                          {o.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{safeToLocale(o.createdAt).split(',')[0]}</td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => cancelOrder(o.id)}
                          className="px-4 py-2 bg-red-500 text-white text-sm font-semibold rounded-lg hover:bg-red-600 transition"
                        >
                          Cancel
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Completed Orders Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-4">
            <h2 className="text-xl font-bold text-white">Completed Orders ({completedOrders.length})</h2>
          </div>

          {completedOrders.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p>No completed orders</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Order ID</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Total</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Delivered</th>
                    <th className="px-6 py-3 text-center text-xs font-bold text-gray-700 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {completedOrders.map((o) => {
                    const pickupRequested = Boolean(o.pickupRequested);
                    const delivered = isDelivered(o.status);

                    return (
                      <tr key={o.id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4 text-sm font-mono text-gray-700">#{o.id.slice(-6)}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">{o.customerName || o.name || "—"}</td>
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900">₱{Number(o.total || 0).toFixed(2)}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusBadge(o.status)}`}>
                            {o.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{safeToLocale(o.deliveredAt || o.completedAt).split(',')[0]}</td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex gap-2 justify-center flex-wrap">
                            {delivered && (
                              <button
                                onClick={() => markOrderCompleted(o.id)}
                                className="px-3 py-2 bg-blue-500 text-white text-xs font-semibold rounded-lg hover:bg-blue-600 transition"
                              >
                                Mark Complete
                              </button>
                            )}
                            <button
                              disabled={pickupRequested}
                              onClick={() => setPickupOrderId(o.id)}
                              className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition whitespace-nowrap ${
                                pickupRequested
                                  ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                                  : "bg-green-500 text-white hover:bg-green-600"
                              }`}
                            >
                              {pickupRequested ? "Pickup Scheduled" : "Schedule Pickup"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Cancelled Orders Table */}
        {cancelledOrders.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-gray-500 to-gray-600 px-6 py-4">
              <h2 className="text-xl font-bold text-white">Cancelled Orders ({cancelledOrders.length})</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Order ID</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Total</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Cancelled</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {cancelledOrders.map((o) => (
                    <tr key={o.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 text-sm font-mono text-gray-700">#{o.id.slice(-6)}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{o.customerName || o.name || "—"}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">₱{Number(o.total || 0).toFixed(2)}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusBadge(o.status)}`}>
                          {o.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{safeToLocale(o.createdAt).split(',')[0]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileView;

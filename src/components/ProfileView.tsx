import React, { useEffect, useMemo, useState } from "react";
import { db } from "../firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
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
  return "bg-gray-100 text-gray-800";
}

function isCompletedOrder(status?: string) {
  const s = (status ?? "").toLowerCase();
  return s === "completed" || s === "delivered";
}

const ProfileView: React.FC<ProfileViewProps> = ({ currentUser, setView }) => {
  const uid = currentUser?.uid;

  const [orders, setOrders] = useState<AnyDoc[]>([]);
  const [pickups, setPickups] = useState<AnyDoc[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingPickups, setLoadingPickups] = useState(true);
  const [error, setError] = useState("");

  const [pickupOrderId, setPickupOrderId] = useState<string | null>(null);

  // ORDERS
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

  // PICKUPS
  useEffect(() => {
    setPickups([]);
    setLoadingPickups(true);
    setError("");

    if (!uid) {
      setLoadingPickups(false);
      return;
    }

    const q = query(
      collection(db, "pickups"),
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
        setPickups(data);
        setLoadingPickups(false);
      },
      (err) => {
        console.error(err);
        setError(err?.message || "Failed to load pickups.");
        setLoadingPickups(false);
      }
    );

    return () => unsub();
  }, [uid]);

  const activeOrders = useMemo(
    () => orders.filter((o) => !isCompletedOrder(o.status)),
    [orders]
  );

  const completedOrders = useMemo(
    () => orders.filter((o) => isCompletedOrder(o.status)),
    [orders]
  );

  // If user clicked a completed order => show the pickup form with correct orderId ✅
  if (pickupOrderId) {
    return (
      <div className="max-w-5xl mx-auto p-6 mt-10">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-2xl font-bold text-gray-800">
            Schedule Container Pickup
          </h2>
          <button
            onClick={() => setPickupOrderId(null)}
            className="px-4 py-2 rounded-lg border hover:bg-gray-50"
          >
            Back
          </button>
        </div>

        <SchedulePickupForm
          currentUser={currentUser as any}
          setView={setView}
          orderId={pickupOrderId}
        />
      </div>
    );
  }

  if (loadingOrders || loadingPickups) {
    return <p className="text-center mt-10 text-gray-600">Loading profile…</p>;
  }

  return (
    <div className="max-w-5xl mx-auto p-6 bg-white rounded-xl shadow-md mt-10">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">My Profile</h1>
          <p className="text-sm text-gray-600 mt-1">
            <strong>Email:</strong> {currentUser?.email || "—"}
          </p>
        </div>

        <button
          onClick={() => setView("products")}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Back to Shop
        </button>
      </div>

      {error ? (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {/* ORDERS */}
      <h2 className="text-2xl font-semibold text-gray-800 mb-3">Orders</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10">
        {/* Active */}
        <div className="border rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold">Active</h3>
            <span className="text-sm text-gray-500">{activeOrders.length}</span>
          </div>

          {activeOrders.length === 0 ? (
            <p className="text-gray-500">No active orders.</p>
          ) : (
            <div className="space-y-3">
              {activeOrders.map((o) => (
                <div key={o.id} className="p-4 border rounded-lg bg-gray-50">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold">Order #{o.id.slice(-6)}</p>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${statusBadge(
                        o.status
                      )}`}
                    >
                      {o.status}
                    </span>
                  </div>
                  <div className="text-sm text-gray-700 mt-2 space-y-1">
                    <div>
                      <strong>Name:</strong>{" "}
                      {o.customerName || o.name || "—"}
                    </div>
                    <div>
                      <strong>Total:</strong> ₱{Number(o.total || 0).toFixed(2)}
                    </div>
                    <div>
                      <strong>Created:</strong> {safeToLocale(o.createdAt)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Completed */}
        <div className="border rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold">Completed</h3>
            <span className="text-sm text-gray-500">
              {completedOrders.length}
            </span>
          </div>

          {completedOrders.length === 0 ? (
            <p className="text-gray-500">No completed orders yet.</p>
          ) : (
            <div className="space-y-3">
              {completedOrders.map((o) => {
                const pickupRequested = Boolean(o.pickupRequested);

                return (
                  <div key={o.id} className="p-4 border rounded-lg bg-green-50">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold">Order #{o.id.slice(-6)}</p>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${statusBadge(
                          o.status
                        )}`}
                      >
                        {o.status}
                      </span>
                    </div>

                    <div className="text-sm text-gray-700 mt-2 space-y-1">
                      <div>
                        <strong>Name:</strong>{" "}
                        {o.customerName || o.name || "—"}
                      </div>
                      <div>
                        <strong>Total:</strong> ₱{Number(o.total || 0).toFixed(2)}
                      </div>
                      <div>
                        <strong>Delivered:</strong>{" "}
                        {safeToLocale(o.deliveredAt || o.completedAt)}
                      </div>
                    </div>

                    <button
                      disabled={pickupRequested}
                      onClick={() => setPickupOrderId(o.id)} // ✅ Firestore doc id
                      className={`mt-3 w-full px-4 py-2 rounded-lg font-semibold ${
                        pickupRequested
                          ? "bg-gray-300 text-gray-700 cursor-not-allowed"
                          : "bg-green-600 text-white hover:bg-green-700"
                      }`}
                    >
                      {pickupRequested
                        ? "Pickup Already Requested"
                        : "Schedule Container Pickup"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* PICKUPS */}
      <h2 className="text-2xl font-semibold text-gray-800 mb-3">Pickups</h2>

      {pickups.length === 0 ? (
        <p className="text-gray-500">No pickups yet.</p>
      ) : (
        <div className="space-y-3">
          {pickups.map((p) => (
            <div key={p.id} className="border rounded-lg p-4 bg-purple-50">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold">Pickup #{p.id.slice(-6)}</p>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${statusBadge(
                    p.status
                  )}`}
                >
                  {p.status || "Pending"}
                </span>
              </div>

              <div className="text-sm text-gray-700 mt-2 space-y-1">
                <div>
                  <strong>Name:</strong>{" "}
                  {p.customerName || p.fullName || p.address?.fullName || "—"}
                </div>
                <div>
                  <strong>Date/Time:</strong> {p.date || "—"} • {p.time || "—"}
                </div>
                <div>
                  <strong>Address:</strong> {p.address?.address || "—"},{" "}
                  {p.address?.city || "—"} {p.address?.zip || ""}
                </div>
                <div>
                  <strong>Created:</strong> {safeToLocale(p.createdAt)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProfileView;

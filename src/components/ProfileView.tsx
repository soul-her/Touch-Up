import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
} from "firebase/firestore";
import type { Order } from "../types";

interface Pickup {
  id: string;
  address: {
    address: string;
    city: string;
    fullName: string;
    zip: string;
  };
  customerName: string;
  date: string;
  time: string;
  status: string;
  userId: string;
  createdAt: any;
}

interface ProfileViewProps {
  currentUser: { uid: string; email?: string } | null;
  setView: (view: string) => void;
}

const ProfileView: React.FC<ProfileViewProps> = ({ currentUser, setView }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [pickups, setPickups] = useState<Pickup[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 🔹 Fetch ORDERS
  useEffect(() => {
    if (!currentUser?.uid) return;

    const q = query(
      collection(db, "orders"),
      where("userId", "==", currentUser.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedOrders = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Order)
      );
      setOrders(fetchedOrders);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser?.uid]);

  // 🔹 Fetch PICKUPS
  useEffect(() => {
    if (!currentUser?.uid) return;

    const q = query(
      collection(db, "pickups"),
      where("userId", "==", currentUser.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedPickups = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Pickup)
      );
      setPickups(fetchedPickups);
    });

    return () => unsubscribe();
  }, [currentUser?.uid]);

  if (isLoading) {
    return <p className="text-center mt-10 text-gray-600">Loading profile...</p>;
  }

  // 🔹 Split active vs completed
  const activeOrders = orders.filter(
    (o) => o.status !== "Delivered" && o.status !== "Completed"
  );
  const completedOrders = orders.filter(
    (o) => o.status === "Delivered" || o.status === "Completed"
  );

  const activePickups = pickups.filter(
    (p) =>
      !["Completed", "Delivered"].includes(p.status)
  );
  const completedPickups = pickups.filter((p) =>
    ["Completed", "Delivered"].includes(p.status)
  );

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-md mt-10">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">My Profile</h1>

      {/* 🔹 User Info */}
      <div className="mb-8">
        <p className="text-gray-700">
          <strong>Email:</strong> {currentUser?.email}
        </p>
      </div>

      {/* ===========================
          ORDERS SECTION
      ============================ */}
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">
        Active Orders
      </h2>
      {activeOrders.length === 0 ? (
        <p className="text-gray-500 mb-8">No active orders.</p>
      ) : (
        <div className="space-y-5 mb-10">
          {activeOrders.map((order) => (
            <div
              key={order.id}
              className="p-4 border rounded-lg shadow-sm bg-blue-50"
            >
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold text-gray-800">
                  Order #{order.orderId || order.id}
                </h3>
                <span className="px-3 py-1 text-sm font-medium rounded-full bg-yellow-100 text-yellow-800">
                  {order.status}
                </span>
              </div>

              <ul className="text-sm text-gray-600 border-t mt-2 pt-2">
                {order.items?.map((item) => (
                  <li key={item.id}>
                    {item.name} (x{item.quantity}) - ₱
                    {(item.price * item.quantity).toFixed(2)}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      <h2 className="text-2xl font-semibold text-gray-800 mb-4">
        Completed Orders
      </h2>
      {completedOrders.length === 0 ? (
        <p className="text-gray-500 mb-8">No completed orders yet.</p>
      ) : (
        <div className="space-y-5 mb-10">
          {completedOrders.map((order) => (
            <div
              key={order.id}
              className="p-4 border rounded-lg shadow-sm bg-green-50"
            >
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold text-gray-800">
                  Order #{order.orderId || order.id}
                </h3>
                <span className="px-3 py-1 text-sm font-medium rounded-full bg-green-100 text-green-800">
                  {order.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ===========================
          PICKUPS SECTION
      ============================ */}
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">
        Active Pickups
      </h2>
      {activePickups.length === 0 ? (
        <p className="text-gray-500 mb-8">No active pickups.</p>
      ) : (
        <div className="space-y-5 mb-10">
          {activePickups.map((pickup) => (
            <div
              key={pickup.id}
              className="p-4 border rounded-lg shadow-sm bg-purple-50"
            >
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold text-gray-800">
                  Pickup for {pickup.customerName}
                </h3>
                <span
                  className={`px-3 py-1 text-sm font-medium rounded-full ${
                    pickup.status === "On the Way"
                      ? "bg-blue-100 text-blue-800"
                      : pickup.status === "Picked Up"
                      ? "bg-green-100 text-green-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {pickup.status}
                </span>
              </div>

              <p className="text-sm text-gray-700">
                <strong>Date:</strong> {pickup.date} |{" "}
                <strong>Time:</strong> {pickup.time}
              </p>
              <p className="text-sm text-gray-700 mt-1">
                <strong>Address:</strong> {pickup.address.address}, {pickup.address.city}
              </p>
            </div>
          ))}
        </div>
      )}

      <h2 className="text-2xl font-semibold text-gray-800 mb-4">
        Completed Pickups
      </h2>
      {completedPickups.length === 0 ? (
        <p className="text-gray-500 mb-8">No completed pickups yet.</p>
      ) : (
        <div className="space-y-5">
          {completedPickups.map((pickup) => (
            <div
              key={pickup.id}
              className="p-4 border rounded-lg shadow-sm bg-green-50"
            >
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold text-gray-800">
                  Pickup for {pickup.customerName}
                </h3>
                <span className="px-3 py-1 text-sm font-medium rounded-full bg-green-100 text-green-800">
                  {pickup.status}
                </span>
              </div>

              <p className="text-sm text-gray-700">
                <strong>Date:</strong> {pickup.date} |{" "}
                <strong>Time:</strong> {pickup.time}
              </p>
              <p className="text-sm text-gray-700 mt-1">
                <strong>Address:</strong> {pickup.address.address}, {pickup.address.city}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* 🔹 Back Button */}
      <div className="mt-8 text-center">
        <button
          onClick={() => setView("products")}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Back to Shop
        </button>
      </div>
    </div>
  );
};

export default ProfileView;

import React, { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../firebase";
import type { User, Order } from "../types";

import UserCircleIcon from "./icons/UserIcon";
import PencilIcon from "./icons/PencilIcon";
import ListBulletIcon from "./icons/ListBulletIcon";

interface ProfileViewProps {
  currentUser: User | null;
}

const ProfileView: React.FC<ProfileViewProps> = ({ currentUser }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!currentUser || !currentUser.uid) return;

    const ordersQuery = query(
      collection(db, "orders"),
      where("userId", "==", currentUser.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      ordersQuery,
      (snapshot) => {
        const userOrders = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Order[];

        console.log("Fetched orders:", userOrders);
        setOrders(userOrders);
        setIsLoading(false);
      },
      (error) => {
        console.error("Error fetching orders:", error);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser?.uid]);

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "Delivered":
        return "bg-green-100 text-green-800";
      case "Out for Delivery":
        return "bg-blue-100 text-blue-800";
      case "Assigned":
        return "bg-indigo-100 text-indigo-800";
      case "Placed":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Profile Card */}
      <div className="bg-white p-8 rounded-xl shadow-xl mb-8">
        <div className="flex flex-col items-center md:flex-row md:items-start md:gap-8">
          <UserCircleIcon />
          <div className="text-center md:text-left mt-4 md:mt-0">
            <h1 className="text-3xl font-bold text-gray-800">
              {currentUser?.displayName || "User"}
            </h1>
            <p className="text-gray-600 mt-1">{currentUser?.email}</p>
            <button className="mt-4 inline-flex items-center gap-2 text-sm text-blue-600 hover:underline font-semibold">
              <PencilIcon />
              Edit Profile
            </button>
          </div>
        </div>
      </div>

      {/* Order History */}
      <div className="bg-white p-8 rounded-xl shadow-xl">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3 border-b pb-4">
          <ListBulletIcon />
          Order History
        </h2>

        {isLoading ? (
          <p>Loading your orders...</p>
        ) : orders.length > 0 ? (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-bold text-lg text-gray-800">
                      Order #{order.id}
                    </p>
                    <p className="text-sm text-gray-500">
                      Placed on{" "}
                      {order.createdAt?.seconds
                        ? new Date(order.createdAt.seconds * 1000).toLocaleDateString()
                        : "N/A"}
                    </p>
                  </div>
                  <span
                    className={`text-sm font-bold px-3 py-1 rounded-full ${getStatusColor(
                      order.status
                    )}`}
                  >
                    {order.status || "Placed"}
                  </span>
                </div>

                {order.driverName && (
                  <p className="text-sm text-gray-600 mb-2">
                    Driver:{" "}
                    <span className="font-medium">{order.driverName}</span>
                  </p>
                )}

                <div className="text-sm text-gray-700 border-t pt-2">
                  {order.items?.map((item) => (
                    <div key={item.id} className="flex justify-between">
                      <span>
                        {item.name} (x{item.quantity})
                      </span>
                      <span>₱{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className="font-bold text-right mt-2 text-gray-800">
                  Total: ₱{order.total?.toFixed(2) || "0.00"}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-10 border-2 border-dashed border-gray-300 rounded-lg text-center text-gray-500">
            <p>Your past orders will appear here.</p>
            <p className="text-sm mt-1">You haven't placed any orders yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileView;

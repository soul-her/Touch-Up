import React, { useEffect, useState } from "react";
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
  customerName: string;
  address: string;
  time: string;
  date: string;
  status: string;
  userId: string;
  driverId?: string;
  createdAt?: any;
}

interface DriverOrdersProps {
  currentUser: User;
}

const DriverOrders: React.FC<DriverOrdersProps> = ({ currentUser }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser?.uid) return;

    const ordersRef = collection(db, "orders");
    const q = query(
      ordersRef,
      where("driverId", "==", currentUser.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedOrders: Order[] = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        })) as Order[];

        setOrders(fetchedOrders);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching driver orders:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser?.uid]);

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const orderRef = doc(db, "orders", orderId);
      await updateDoc(orderRef, { status: newStatus });
    } catch (err) {
      console.error("Error updating order:", err);
    }
  };

  if (loading) return <p className="text-gray-500">Loading orders...</p>;

  return (
    <div className="p-4 bg-white rounded-xl shadow-md">
      <h2 className="text-2xl font-semibold mb-4 text-gray-800">Orders</h2>

      {orders.length === 0 ? (
        <p className="text-gray-600">No assigned orders yet.</p>
      ) : (
        <ul className="space-y-4">
          {orders.map((order) => (
            <li
              key={order.id}
              className="border border-gray-200 rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between shadow-sm hover:shadow-md transition"
            >
              <div className="space-y-1">
                <p>
                  <span className="font-semibold">Order ID:</span> {order.id}
                </p>
                <p>
                  <span className="font-semibold">Customer:</span>{" "}
                  {order.customerName}
                </p>
                <p>
                  <span className="font-semibold">Address:</span>{" "}
                  {typeof order.address === "object"
                    ? `${order.address.street || ""}, ${order.address.city || ""}`
                    : order.address}
                </p>
                <p>
                  <span className="font-semibold">Date:</span> {order.date}
                </p>
                <p>
                  <span className="font-semibold">Time:</span> {order.time}
                </p>
                <p>
                  <span className="font-semibold">Status:</span>{" "}
                  <span
                    className={`${
                      order.status === "Completed"
                        ? "text-green-600"
                        : "text-blue-600"
                    } font-semibold`}
                  >
                    {order.status}
                  </span>
                </p>
              </div>

              {/* Action buttons */}
              <div className="mt-3 md:mt-0 space-x-2">
                {order.status === "Assigned" && (
                  <button
                    onClick={() => updateOrderStatus(order.id, "Out for Delivery")}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  >
                    Out for Delivery
                  </button>
                )}
                {order.status === "Out for Delivery" && (
                  <button
                    onClick={() => updateOrderStatus(order.id, "Completed")}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                  >
                    Mark Completed
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default DriverOrders;

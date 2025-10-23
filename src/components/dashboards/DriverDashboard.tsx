import React, { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  FirestoreError,
} from "firebase/firestore";
import { db } from "../../firebase";
import type { Order, User, OrderStatus, Pickup } from "../../types";

interface DriverDashboardProps {
  currentUser: User;
}

const DriverDashboard: React.FC<DriverDashboardProps> = ({ currentUser }) => {
  const [assignedOrders, setAssignedOrders] = useState<Order[]>([]);
  const [pickups, setPickups] = useState<Pickup[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    // --- Orders Query ---
    const ordersQuery = query(
      collection(db, "orders"),
      where("driverId", "==", currentUser.uid),
      where("status", "in", ["Assigned", "Out for Delivery"]),
      orderBy("createdAt", "desc")
    );

    const unsubscribeOrders = onSnapshot(
      ordersQuery,
      (snapshot) => {
        const ordersData = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as Order)
        );
        console.log("🚚 Orders fetched:", ordersData);
        setAssignedOrders(ordersData);
        setIsLoading(false);
      },
      (error: FirestoreError) => {
        console.error("🔥 Error fetching assigned orders:", error);
        setIsLoading(false);
      }
    );

    // --- Pickups Query ---
    const pickupsQuery = query(
      collection(db, "pickups"),
      where("status", "==", "Scheduled"),
      orderBy("date", "asc")
    );

    const unsubscribePickups = onSnapshot(
      pickupsQuery,
      (snapshot) => {
        const pickupsData = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as Pickup)
        );
        console.log("📦 Pickups fetched:", pickupsData);
        setPickups(pickupsData);
      },
      (error: FirestoreError) => {
        console.error("🔥 Error fetching pickups:", error);
      }
    );

    return () => {
      unsubscribeOrders();
      unsubscribePickups();
    };
  }, [currentUser]);

  // --- Update Delivery Status ---
  const handleStatusUpdate = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const orderRef = doc(db, "orders", orderId);
      await updateDoc(orderRef, { status: newStatus });
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update order status.");
    }
  };

  // --- Update Pickup Status ---
  const handlePickupStatusUpdate = async (pickupId: string) => {
    try {
      const pickupRef = doc(db, "pickups", pickupId);
      await updateDoc(pickupRef, { status: "Completed" });
    } catch (error) {
      console.error("Error completing pickup:", error);
      alert("Failed to update pickup status.");
    }
  };

  // --- Render address safely (handles both object or string) ---
  const renderAddress = (order: any): string => {
    if (order.shippingAddress) {
      const { address, city, zip } = order.shippingAddress;
      return [address, city, zip].filter(Boolean).join(", ");
    }
    if (order.address) return order.address;
    return "No address";
  };

  const renderPickupAddress = (address: any): string => {
    if (!address) return "No address";
    if (typeof address === "string") return address;
    return [address.fullName, address.address, address.city, address.zip]
      .filter(Boolean)
      .join(", ");
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 p-8">
      {/* Deliveries Section */}
      <div className="bg-white p-8 rounded-lg shadow-xl">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 border-b pb-4">
          My Deliveries
        </h1>

        {isLoading ? (
          <p>Loading assigned deliveries...</p>
        ) : assignedOrders.length === 0 ? (
          <div className="p-10 border-2 border-dashed border-gray-300 rounded-lg text-center text-gray-500">
            <p>You have no active deliveries assigned.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {assignedOrders.map((order) => (
              <div
                key={order.id}
                className="border rounded-lg p-4 bg-gray-50 hover:shadow-md transition"
              >
                <div className="flex flex-col md:flex-row justify-between md:items-center">
                  <div>
                    <p className="font-bold text-lg text-gray-800">
                      {order.orderId || order.id}
                    </p>
                    <p className="text-gray-600">
                      Customer:{" "}
                      <span className="font-medium">
                        {order.customerName || order.name || "Unknown"}
                      </span>
                    </p>
                    <p className="text-gray-600">
                      Address:{" "}
                      <span className="font-medium">
                        {renderAddress(order)}
                      </span>
                    </p>
                  </div>
                  <div className="mt-4 md:mt-0 flex items-center gap-4">
                    <span
                      className={`text-sm font-bold px-3 py-1 rounded-full ${
                        order.status === "Assigned"
                          ? "bg-indigo-100 text-indigo-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {order.status}
                    </span>
                    {order.status === "Assigned" && (
                      <button
                        onClick={() =>
                          handleStatusUpdate(order.id, "Out for Delivery")
                        }
                        className="bg-blue-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        Start Delivery
                      </button>
                    )}
                    {order.status === "Out for Delivery" && (
                      <button
                        onClick={() =>
                          handleStatusUpdate(order.id, "Delivered")
                        }
                        className="bg-green-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-600 transition-colors"
                      >
                        Mark as Delivered
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pickups Section */}
      <div className="bg-white p-8 rounded-lg shadow-xl">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 border-b pb-4">
          Scheduled Pickups
        </h1>

        {isLoading ? (
          <p>Loading scheduled pickups...</p>
        ) : pickups.length === 0 ? (
          <div className="p-10 border-2 border-dashed border-gray-300 rounded-lg text-center text-gray-500">
            <p>There are no scheduled pickups.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-4 uppercase font-semibold text-sm text-gray-600">
                    Customer
                  </th>
                  <th className="text-left py-3 px-4 uppercase font-semibold text-sm text-gray-600">
                    Address
                  </th>
                  <th className="text-left py-3 px-4 uppercase font-semibold text-sm text-gray-600">
                    Date & Time
                  </th>
                  <th className="text-left py-3 px-4 uppercase font-semibold text-sm text-gray-600">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="text-gray-700">
                {pickups.map((pickup) => (
                  <tr key={pickup.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      {pickup.customerName || "Unknown"}
                    </td>
                    <td className="py-3 px-4">
                      {renderPickupAddress(pickup.address)}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      {`${pickup.date || ""} at ${pickup.time || ""}`}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handlePickupStatusUpdate(pickup.id)}
                        className="bg-green-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-600 transition-colors"
                      >
                        Mark as Completed
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DriverDashboard;

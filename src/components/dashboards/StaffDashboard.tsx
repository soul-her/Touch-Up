import React, { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../firebase";
import type { Order, DBUser } from "../../types";

const StaffDashboard: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [drivers, setDrivers] = useState<DBUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);

    try {
      // --- Orders Listener ---
      const ordersRef = collection(db, "orders");
      const ordersQuery = query(
        ordersRef,
        where("status", "in", ["pending", "Placed", "Assigned"]),
        orderBy("createdAt", "desc")
      );

      const unsubscribeOrders = onSnapshot(
        ordersQuery,
        (snapshot) => {
          const ordersData = snapshot.docs.map(
            (docSnap) =>
              ({
                id: docSnap.id,
                ...docSnap.data(),
              } as Order)
          );

          console.log("📦 Orders fetched (raw):", ordersData);
          setOrders(ordersData);
        },
        (err) => {
          console.error("🔥 Firestore query error (orders):", err);
          if (err.code === "failed-precondition") {
            setError(
              "Firestore index required. Please create the suggested index in the Firebase Console."
            );
          } else {
            setError("Failed to load orders.");
          }
        }
      );

      // --- Drivers Listener ---
      const usersRef = collection(db, "users");
      const driversQuery = query(usersRef, where("role", "==", "driver"));

      const unsubscribeDrivers = onSnapshot(
        driversQuery,
        (snapshot) => {
          const driversData = snapshot.docs.map(
            (docSnap) => docSnap.data() as DBUser
          );
          console.log("🚗 Drivers fetched:", driversData);
          setDrivers(driversData);
          setIsLoading(false);
        },
        (err) => {
          console.error("🔥 Firestore query error (drivers):", err);
          setError("Failed to load drivers.");
          setIsLoading(false);
        }
      );

      return () => {
        unsubscribeOrders();
        unsubscribeDrivers();
      };
    } catch (err) {
      console.error("❌ Unexpected error:", err);
      setError("Unexpected error loading data.");
      setIsLoading(false);
    }
  }, []);

  // --- Assign driver ---
  const handleAssignDriver = async (orderId: string, driver: DBUser) => {
    if (!driver) return;
    try {
      const orderRef = doc(db, "orders", orderId);
      await updateDoc(orderRef, {
        driverId: driver.uid,
        driverName: driver.displayName || "Unnamed Driver",
        status: "Assigned",
      });
      console.log(`✅ Driver ${driver.displayName} assigned to order ${orderId}`);
    } catch (err) {
      console.error("Error assigning driver:", err);
      alert("Failed to assign driver.");
    }
  };

  // --- Status badge colors ---
  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "Placed":
        return "bg-blue-100 text-blue-800";
      case "Assigned":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // --- Safely extract name and address (works with different field structures) ---
  const getCustomerName = (order: any): string => {
    return (
      order.customerName ||
      order.name ||
      order.customer?.fullName ||
      order.userName ||
      "N/A"
    );
  };

  const getAddress = (order: any): string => {
    if (typeof order.shippingAddress === "string") return order.shippingAddress;
    if (order.shippingAddress)
      return `${order.shippingAddress.address || order.shippingAddress.street || ""}${
        order.shippingAddress.city ? ", " + order.shippingAddress.city : ""
      }`.trim();
    if (order.address) return order.address;
    if (order.shipping?.street)
      return `${order.shipping.street}, ${order.shipping.city || ""}`;
    return "No address";
  };

  return (
    <div className="bg-white p-8 rounded-lg shadow-xl max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        Staff Dashboard
      </h1>

      {isLoading && <p className="text-gray-600">Loading orders...</p>}
      {error && (
        <p className="text-red-600 font-medium mb-4 bg-red-50 p-3 rounded-md border border-red-200">
          {error}
        </p>
      )}

      {!isLoading && !error && (
        <div className="overflow-x-auto">
          {orders.length > 0 ? (
            <table className="min-w-full bg-white border border-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-4 uppercase font-semibold text-sm text-gray-600">
                    Order ID
                  </th>
                  <th className="text-left py-3 px-4 uppercase font-semibold text-sm text-gray-600">
                    Customer
                  </th>
                  <th className="text-left py-3 px-4 uppercase font-semibold text-sm text-gray-600">
                    Address
                  </th>
                  <th className="text-left py-3 px-4 uppercase font-semibold text-sm text-gray-600">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 uppercase font-semibold text-sm text-gray-600">
                    Assign Driver
                  </th>
                </tr>
              </thead>
              <tbody className="text-gray-700">
                {orders.map((order) => (
                  <tr key={order.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{order.id}</td>
                    <td className="py-3 px-4">{getCustomerName(order)}</td>
                    <td className="py-3 px-4 text-sm">{getAddress(order)}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-xs font-bold px-3 py-1 rounded-full ${getStatusColor(
                          order.status
                        )}`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {order.status === "pending" || order.status === "Placed" ? (
                        drivers.length > 0 ? (
                          <select
                            onChange={(e) => {
                              const selectedDriver = drivers.find(
                                (d) => d.uid === e.target.value
                              );
                              if (selectedDriver)
                                handleAssignDriver(order.id, selectedDriver);
                            }}
                            defaultValue=""
                            className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          >
                            <option value="" disabled>
                              Select a driver...
                            </option>
                            {drivers.map((driver) => (
                              <option key={driver.uid} value={driver.uid}>
                                {driver.displayName || "Unnamed Driver"}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-sm text-gray-500 italic">
                            No drivers available
                          </span>
                        )
                      ) : (
                        <span className="font-semibold text-gray-800">
                          {order.driverName || "Assigned"}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-10 border-2 border-dashed border-gray-300 rounded-lg text-center text-gray-500">
              <p className="font-semibold">No orders require assignment.</p>
              <p className="text-sm mt-1">Check back later for new orders.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StaffDashboard;

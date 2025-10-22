import React, { useState, useEffect } from "react";
import { db } from "../../firebase";
import {
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
  updateDoc,
  doc,
} from "firebase/firestore";
import type { Order, DBUser } from "../../types";

const StaffDashboard: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [drivers, setDrivers] = useState<DBUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);

    // Listen to orders (Placed or Assigned)
    const ordersQuery = query(
      collection(db, "orders"),
      where("status", "in", ["Placed", "Assigned"]),
      orderBy("createdAt", "desc")
    );

    const unsubscribeOrders = onSnapshot(
      ordersQuery,
      (snapshot) => {
        const ordersData = snapshot.docs.map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
            } as Order)
        );
        setOrders(ordersData);
      },
      (err) => {
        console.error("Error fetching orders:", err);
        setError("Failed to load orders.");
      }
    );

    // Listen to drivers
    const driversQuery = query(collection(db, "users"), where("role", "==", "driver"));
    const unsubscribeDrivers = onSnapshot(
      driversQuery,
      (snapshot) => {
        const driversData = snapshot.docs.map((doc) => doc.data() as DBUser);
        setDrivers(driversData);
        setIsLoading(false);
      },
      (err) => {
        console.error("Error fetching drivers:", err);
        setError("Failed to load drivers.");
        setIsLoading(false);
      }
    );

    return () => {
      unsubscribeOrders();
      unsubscribeDrivers();
    };
  }, []);

  const handleAssignDriver = async (orderId: string, driver: DBUser) => {
    try {
      const orderRef = doc(db, "orders", orderId);
      await updateDoc(orderRef, {
        driverId: driver.uid,
        driverName: driver.displayName,
        status: "Assigned",
      });
    } catch (err) {
      console.error("Error assigning driver:", err);
      alert("Failed to assign driver.");
    }
  };

  const getStatusColor = (status: string) => {
    return status === "Placed"
      ? "bg-yellow-100 text-yellow-800"
      : "bg-indigo-100 text-indigo-800";
  };

  return (
    <div className="bg-white p-8 rounded-lg shadow-xl max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-6 border-b pb-4">
        Staff Dashboard
      </h1>

      {isLoading && <p>Loading data...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {!isLoading && !error && (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border">
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
                  <td className="py-3 px-4 font-medium">{order.orderId}</td>
                  <td className="py-3 px-4">{order.customerName}</td>
                  <td className="py-3 px-4 text-sm">
                    {order.shippingAddress
                      ? `${order.shippingAddress.address}, ${order.shippingAddress.city}`
                      : "N/A"}
                  </td>
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
                    {order.status === "Placed" ? (
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
                            {driver.displayName}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="font-semibold text-gray-800">
                        {order.driverName || "N/A"}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {orders.length === 0 && (
            <div className="text-center text-gray-500 mt-6">
              No orders found.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StaffDashboard;

import React, { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
} from "firebase/firestore";
import { signOut } from "firebase/auth";
import { db, auth } from "../../firebase";
import type { Order, DBUser } from "../../types";

const StaffDashboard: React.FC<{ setView: (view: string) => void }> = ({
  setView,
}) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [drivers, setDrivers] = useState<DBUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 🔹 Fetch orders and drivers in real-time
  useEffect(() => {
    setIsLoading(true);

    try {
      // --- Orders Listener ---
      const ordersRef = collection(db, "orders");

      // 👇 include Delivered in query
      const ordersQuery = query(
        ordersRef,
        where("status", "in", ["pending", "Placed", "Assigned", "Delivered"]),
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
          setOrders(ordersData);
        },
        (err) => {
          console.error("🔥 Firestore query error (orders):", err);
          setError("Failed to load orders.");
        }
      );

      // --- Drivers Listener ---
      const usersRef = collection(db, "users");
      const driversQuery = query(usersRef, where("role", "==", "driver"));

      const unsubscribeDrivers = onSnapshot(
        driversQuery,
        (snapshot) => {
          const driverData = snapshot.docs.map((docSnap) => {
            const data = docSnap.data();
            return {
              id: docSnap.id,
              uid: data.uid || docSnap.id,
              displayName: data.displayName || data.name || "Unnamed Driver",
              email: data.email || "",
              role: data.role || "driver",
              ...data,
            } as DBUser;
          });
          setDrivers(driverData);
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

  // 🔹 Assign driver
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

  // 🔹 Logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
      alert("✅ Logged out successfully!");
      setView("home");
    } catch (err) {
      console.error("Logout error:", err);
      alert("❌ Failed to log out.");
    }
  };

  // 🔹 Status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "Placed":
        return "bg-blue-100 text-blue-800";
      case "Assigned":
        return "bg-indigo-100 text-indigo-800";
      case "Delivered":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // 🔹 Safely get name
  const getCustomerName = (order: any): string => {
    return (
      order.customerName ||
      order.name ||
      order.customer?.fullName ||
      order.userName ||
      order.userEmail ||
      "Unknown"
    );
  };

  // 🔹 Safely format address
  const getAddress = (order: any): string => {
    const address = order.address || order.shippingAddress || order.shipping;
    if (!address) return "No address available";
    if (typeof address === "string") return address;
    if (typeof address === "object") {
      const { street, barangay, city, province, postalCode } = address;
      return [street, barangay, city, province, postalCode]
        .filter(Boolean)
        .join(", ");
    }
    return "No address";
  };

  // 🔹 Format date
  const formatDate = (timestamp?: { seconds: number; nanoseconds: number }) => {
    if (!timestamp) return "N/A";
    const date = new Date(timestamp.seconds * 1000);
    return date.toLocaleString();
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-xl max-w-7xl mx-auto relative min-h-screen">
      <button
        onClick={handleLogout}
        className="fixed bottom-6 right-6 bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-full font-semibold shadow-lg transition md:top-6 md:right-6 md:bottom-auto"
      >
        Logout
      </button>

      <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
        Staff Dashboard
      </h1>

      {isLoading && <p className="text-gray-600">Loading orders...</p>}
      {error && (
        <p className="text-red-600 bg-red-50 border border-red-200 rounded-md p-3 mb-4">
          {error}
        </p>
      )}

      {!isLoading && !error && (
        <div className="overflow-x-auto">
          {orders.length > 0 ? (
            <table className="min-w-full border border-gray-200 rounded-lg">
              <thead className="bg-blue-600 text-white">
                <tr>
                  <th className="py-3 px-4 text-left text-sm font-semibold">
                    Order ID
                  </th>
                  <th className="py-3 px-4 text-left text-sm font-semibold">
                    Customer
                  </th>
                  <th className="py-3 px-4 text-left text-sm font-semibold">
                    Address
                  </th>
                  <th className="py-3 px-4 text-left text-sm font-semibold">
                    Total
                  </th>
                  <th className="py-3 px-4 text-left text-sm font-semibold">
                    Date
                  </th>
                  <th className="py-3 px-4 text-left text-sm font-semibold">
                    Status
                  </th>
                  <th className="py-3 px-4 text-left text-sm font-semibold">
                    Driver
                  </th>
                </tr>
              </thead>
              <tbody className="text-gray-800">
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b hover:bg-gray-50 transition duration-150"
                  >
                    <td className="py-3 px-4 font-medium">{order.id}</td>
                    <td className="py-3 px-4">{getCustomerName(order)}</td>
                    <td className="py-3 px-4 text-sm">{getAddress(order)}</td>
                    <td className="py-3 px-4 text-sm">₱{order.total}</td>
                    <td className="py-3 px-4 text-sm">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-xs font-semibold px-3 py-1 rounded-full ${getStatusColor(
                          order.status
                        )}`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {order.status === "pending" ||
                      order.status === "Placed" ? (
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
                            className="p-2 border border-gray-300 rounded-md text-sm"
                          >
                            <option value="" disabled>
                              Select driver...
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
                        <span className="font-semibold text-gray-700">
                          {order.driverName || "Assigned"}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-10 text-center border-2 border-dashed border-gray-300 rounded-lg text-gray-500">
              <p className="font-semibold">No orders available</p>
              <p className="text-sm">Check back later for new orders.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StaffDashboard;

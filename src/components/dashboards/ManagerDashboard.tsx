import React, { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "../../firebase";
import type { User as AppUser, Order } from "../../types";

// Define types for the users in Firestore
interface DBUser {
  uid: string;
  displayName?: string;
  email: string;
  role: string;
}

interface ManagerDashboardProps {
  currentUser: AppUser | null;
}

const ManagerDashboard: React.FC<ManagerDashboardProps> = ({ currentUser }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<DBUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);

    const ordersQuery = query(collection(db, "orders"), orderBy("createdAt", "desc"));
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

    const usersQuery = query(collection(db, "users"));
    const unsubscribeUsers = onSnapshot(
      usersQuery,
      (snapshot) => {
        const usersData = snapshot.docs.map((doc) => doc.data() as DBUser);
        setUsers(usersData);
        setIsLoading(false);
      },
      (err) => {
        console.error("Error fetching users:", err);
        setError("Failed to load users.");
        setIsLoading(false);
      }
    );

    return () => {
      unsubscribeOrders();
      unsubscribeUsers();
    };
  }, []);

  const getStatusColor = (status: string) => {
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

  const drivers = users.filter((u) => u.role === "driver");
  const staff = users.filter((u) => u.role === "staff");
  const customers = users.filter((u) => u.role === "customer");

  // Handle loading and error states
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-500 text-lg font-medium">Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-red-500 text-lg font-medium">{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-10 p-6">
      <header>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Welcome{currentUser?.displayName ? `, ${currentUser.displayName}` : ""} 👋
        </h1>
        <p className="text-gray-600">
          Here’s an overview of your business performance and recent activity.
        </p>
      </header>

      {/* Dashboard Stats */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            Total Orders
          </h3>
          <p className="mt-2 text-3xl font-bold text-gray-800">{orders.length}</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            Customers
          </h3>
          <p className="mt-2 text-3xl font-bold text-gray-800">{customers.length}</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            Drivers
          </h3>
          <p className="mt-2 text-3xl font-bold text-gray-800">{drivers.length}</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            Staff
          </h3>
          <p className="mt-2 text-3xl font-bold text-gray-800">{staff.length}</p>
        </div>
      </section>

      {/* Recent Orders Section */}
      <section className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Recent Orders</h2>

        {orders.length > 0 ? (
          <div className="space-y-4">
            {orders.slice(0, 5).map((order) => (
              <div
                key={order.id}
                className="border border-gray-200 rounded-lg p-4 flex justify-between items-center"
              >
                <div>
                  <p className="font-semibold text-gray-800">{order.orderId}</p>
                  <p className="text-sm text-gray-500">
                    {order.createdAt
                      ? new Date(order.createdAt.seconds * 1000).toLocaleString()
                      : "N/A"}
                  </p>
                </div>
                <span
                  className={`text-xs font-semibold px-3 py-1 rounded-full ${getStatusColor(
                    order.status
                  )}`}
                >
                  {order.status}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm text-center py-4">
            No recent orders yet.
          </p>
        )}
      </section>
    </div>
  );
};

export default ManagerDashboard;
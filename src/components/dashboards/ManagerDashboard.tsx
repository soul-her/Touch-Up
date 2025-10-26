// src/components/dashboards/ManagerDashboard.tsx
import React, { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db, auth } from "../../firebase";
import type { User as AppUser, Order } from "../../types";
import AdminAddProduct from "../AdminAddProduct";
import AdminProductList from "../ProductList";

interface DBUser {
  uid: string;
  displayName?: string;
  email: string;
  role: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  description?: string;
  image?: string;
  imageURL?: string;
}

interface ManagerDashboardProps {
  currentUser: AppUser | null;
  setView?: (view: string) => void;
}

const ManagerDashboard: React.FC<ManagerDashboardProps> = ({
  currentUser,
  setView,
}) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<DBUser[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [editedProduct, setEditedProduct] = useState<Partial<Product>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "stats" | "orders" | "add" | "list" | "edit" | "delete"
  >("stats");

  // ✅ Load data
  useEffect(() => {
    setIsLoading(true);

    const ordersQuery = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const unsubscribeOrders = onSnapshot(ordersQuery, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Order));
      setOrders(data);
    });

    const usersQuery = query(collection(db, "users"));
    const unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
      const data = snapshot.docs.map((doc) => doc.data() as DBUser);
      setUsers(data);
    });

    const unsubscribeProducts = onSnapshot(collection(db, "products"), (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Product));
      setProducts(data);
      setIsLoading(false);
    });

    return () => {
      unsubscribeOrders();
      unsubscribeUsers();
      unsubscribeProducts();
    };
  }, []);

  // ✅ Logout
  const handleLogout = async () => {
    try {
      await auth.signOut();
      alert("Logged out successfully!");
      if (setView) setView("login");
    } catch (error) {
      console.error("Logout failed:", error);
      alert("Logout failed. Please try again.");
    }
  };

  // ✅ Product update & delete
  const handleSaveEdit = async () => {
    if (!selectedProduct) return;
    const productRef = doc(db, "products", selectedProduct.id);
    await updateDoc(productRef, editedProduct);
    alert("Product updated successfully!");
    setSelectedProduct(null);
  };

  const handleDeleteProduct = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      await deleteDoc(doc(db, "products", id));
      alert("Product deleted successfully!");
    }
  };

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

  if (isLoading)
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-500 text-lg font-medium">Loading dashboard...</p>
      </div>
    );

  if (error)
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-red-500 text-lg font-medium">{error}</p>
      </div>
    );

  return (
    <div className="flex h-screen bg-gray-50">
      {/* ✅ Sidebar */}
      <aside className="w-72 bg-blue-700 text-white p-6 flex flex-col shadow-lg">
        <h2 className="text-2xl font-bold mb-6 text-center border-b border-blue-500 pb-3">
          Manager Panel
        </h2>

        <nav className="space-y-2">
          {[
            ["stats", "Statistics"],
            ["orders", "Orders"],
            ["list", "Product List"],
            ["add", "Add Product"],
            ["edit", "Edit Products"],
            ["delete", "Delete Products"],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as any)}
              className={`w-full text-left px-4 py-2 rounded-lg font-medium transition ${
                activeTab === key
                  ? "bg-blue-500 text-white"
                  : "text-blue-100 hover:bg-blue-600"
              }`}
            >
              {label}
            </button>
          ))}
        </nav>
      </aside>

      {/* ✅ Main Content */}
      <main className="flex-grow flex flex-col">
        {/* Header with Logout */}
        <header className="flex justify-between items-center bg-white shadow px-8 py-4 border-b">
          <h1 className="text-2xl font-bold text-gray-800">
            Welcome, {currentUser?.displayName || "Manager"}
          </h1>
          <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-600 transition"
          >
            Logout
          </button>
        </header>

        {/* Content */}
        <div className="flex-grow p-8 overflow-y-auto">
          {/* 📊 Statistics */}
          {activeTab === "stats" && (
            <section>
              <h2 className="text-xl font-bold text-gray-800 mb-4">Statistics</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  ["Total Orders", orders.length],
                  ["Customers", customers.length],
                  ["Drivers", drivers.length],
                  ["Staff", staff.length],
                ].map(([label, count]) => (
                  <div
                    key={label}
                    className="bg-white rounded-xl p-6 shadow-md border border-gray-100"
                  >
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                      {label}
                    </h3>
                    <p className="mt-2 text-3xl font-bold text-gray-800">{count}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 📦 Orders */}
          {activeTab === "orders" && (
            <section className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Recent Orders</h2>
              {orders.length > 0 ? (
                <div className="space-y-4">
                  {orders.slice(0, 10).map((order) => (
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
          )}

          {/* 🧾 Product List */}
          {activeTab === "list" && <AdminProductList />}

          {/* ➕ Add Product */}
          {activeTab === "add" && (
            <div className="border border-gray-200 rounded-xl shadow-md p-6 bg-gray-50">
              <AdminAddProduct />
            </div>
          )}

          {/* ✏️ Edit Product */}
          {activeTab === "edit" && (
            <section className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Edit Products</h2>

              {!selectedProduct ? (
                <ul className="divide-y divide-gray-200">
                  {products.map((p) => (
                    <li key={p.id} className="py-3 flex justify-between items-center">
                      <div>
                        <p className="font-medium">{p.name}</p>
                        <p className="text-gray-600">₱{p.price}</p>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedProduct(p);
                          setEditedProduct(p);
                        }}
                        className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition"
                      >
                        Edit
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="space-y-3">
                  <label className="block font-medium text-gray-700">Name</label>
                  <input
                    type="text"
                    value={editedProduct.name || ""}
                    onChange={(e) =>
                      setEditedProduct({ ...editedProduct, name: e.target.value })
                    }
                    className="border p-2 w-full rounded"
                  />

                  <label className="block font-medium text-gray-700">Price</label>
                  <input
                    type="number"
                    value={editedProduct.price || 0}
                    onChange={(e) =>
                      setEditedProduct({
                        ...editedProduct,
                        price: parseFloat(e.target.value),
                      })
                    }
                    className="border p-2 w-full rounded"
                  />

                  <label className="block font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    value={editedProduct.description || ""}
                    onChange={(e) =>
                      setEditedProduct({
                        ...editedProduct,
                        description: e.target.value,
                      })
                    }
                    className="border p-2 w-full rounded"
                  />

                  <label className="block font-medium text-gray-700">
                    Image URL
                  </label>
                  <input
                    type="url"
                    value={editedProduct.image || ""}
                    onChange={(e) =>
                      setEditedProduct({ ...editedProduct, image: e.target.value })
                    }
                    className="border p-2 w-full rounded"
                  />

                  {editedProduct.image && (
                    <img
                      src={editedProduct.image}
                      alt="Preview"
                      className="w-32 h-32 object-cover rounded-lg mb-2 border"
                      onError={(e) =>
                        ((e.target as HTMLImageElement).style.display = "none")
                      }
                    />
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveEdit}
                      className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 transition"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setSelectedProduct(null)}
                      className="bg-gray-400 text-white px-3 py-1 rounded hover:bg-gray-500 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* 🗑️ Delete Products */}
          {activeTab === "delete" && (
            <section className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Delete Products</h2>
              <ul className="divide-y divide-gray-200">
                {products.map((p) => (
                  <li key={p.id} className="py-3 flex justify-between items-center">
                    <div>
                      <p className="font-medium">{p.name}</p>
                      <p className="text-gray-600">₱{p.price}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteProduct(p.id)}
                      className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition"
                    >
                      Delete
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </main>
    </div>
  );
};

export default ManagerDashboard;

import React, { useEffect, useState } from "react";
import { db } from "../../firebase";
import { collection, query, where, onSnapshot, orderBy, startAt, endAt, limit } from "firebase/firestore";

interface Order {
  id: string;
  customerName: string;
  status: string;
  createdAt: any;
  total?: number;
}

const statusColor = (status: string) => {
  switch (status) {
    case "Delivered":
      return "bg-green-500/15 text-green-300 border border-green-500/20";
    case "Out for Delivery":
      return "bg-blue-500/15 text-blue-300 border border-blue-500/20";
    case "Assigned":
      return "bg-indigo-500/15 text-indigo-300 border border-indigo-500/20";
    case "Placed":
      return "bg-yellow-500/15 text-yellow-300 border border-yellow-500/20";
    case "Completed":
      return "bg-gray-500/15 text-gray-300 border border-gray-500/20";
    case "Cancelled":
      return "bg-red-500/15 text-red-300 border border-red-500/20";
    default:
      return "bg-white/10 text-white/80 border border-white/10";
  }
};

const ManagerOrders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter States
  const [statusFilter, setStatusFilter] = useState<string>(""); // Filter by status
  const [customerFilter, setCustomerFilter] = useState<string>(""); // Filter by customer name
  const [startDate, setStartDate] = useState<string>(""); // Start date for filtering
  const [endDate, setEndDate] = useState<string>(""); // End date for filtering

  const pageSize = 5; // Number of orders per page

  useEffect(() => {
    // Initialize base query with order by createdAt
    let q = query(
      collection(db, "orders"),
      orderBy("createdAt", "desc"),
      limit(pageSize)
    );

    // Apply status filter if provided
    if (statusFilter) {
      q = query(q, where("status", "==", statusFilter));
    }

    // Apply customer name filter if provided
    if (customerFilter) {
      q = query(q, where("customerName", "==", customerFilter));
    }

    // Apply date range filters if provided
    if (startDate) {
      q = query(q, where("createdAt", ">=", new Date(startDate)));
    }

    if (endDate) {
      q = query(q, where("createdAt", "<=", new Date(endDate)));
    }

    const unsub = onSnapshot(
      q,
      (snap) => {
        const data = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Order),
        }));
        setOrders(data);
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setError("Failed to load orders.");
        setLoading(false);
      }
    );

    return () => unsub();
  }, [statusFilter, customerFilter, startDate, endDate]); // Re-run the query when filters change

  // Filter handlers
  const handleStatusFilterChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(event.target.value);
  };

  const handleCustomerFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCustomerFilter(event.target.value);
  };

  const handleStartDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setStartDate(event.target.value);
  };

  const handleEndDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEndDate(event.target.value);
  };

  if (loading) return <p className="text-center text-gray-600">Loading...</p>;

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow">
      <div className="flex items-end justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-white">Orders</h2>
          <p className="text-sm text-white/60">Latest orders and status updates</p>
        </div>

        <span className="text-xs px-3 py-1 rounded-full bg-white/10 border border-white/10 text-white/70">
          {orders.length} total
        </span>
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-4">
        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={handleStatusFilterChange}
          className="px-4 py-2 border rounded-lg bg-black text-white"
        >
          <option value="">Filter by Status</option>
          <option value="Placed">Placed</option>
          <option value="Assigned">Assigned</option>
          <option value="Out for Delivery">Out for Delivery</option>
          <option value="Delivered">Delivered</option>
          <option value="Completed">Completed</option>
          <option value="Cancelled">Cancelled</option>
        </select>

        {/* Customer Name Filter */}
        <input
          type="text"
          value={customerFilter}
          onChange={handleCustomerFilterChange}
          placeholder="Filter by Customer Name"
          className="px-4 py-2 border rounded-lg w-full bg-black text-white"
        />

        {/* Start Date Filter */}
        <input
          type="date"
          value={startDate}
          onChange={handleStartDateChange}
          className="px-4 py-2 border rounded-lg bg-black text-white"
        />

        {/* End Date Filter */}
        <input
          type="date"
          value={endDate}
          onChange={handleEndDateChange}
          className="px-4 py-2 border rounded-lg bg-black text-white"
        />
      </div>

      {error ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-100">
          {error}
        </div>
      ) : null}

      {orders.length === 0 ? (
        <p className="text-white/60">No orders found.</p>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <div
              key={o.id}
              className="rounded-2xl border border-white/10 bg-slate-950/20 p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-bold text-white">
                    {o.customerName || "—"}
                  </p>

                  <p className="text-sm text-white/70">
                    {(o.address?.street ?? "—")}
                    {o.address?.barangay ? `, ${o.address.barangay}` : ""}
                    {o.address?.city ? `, ${o.address.city}` : ""}
                    {o.address?.province ? `, ${o.address.province}` : ""}
                  </p>

                  <p className="text-xs text-white/50 mt-1">
                    {o.createdAt?.toDate ? o.createdAt.toDate().toLocaleString() : "—"}
                  </p>
                </div>

                <div className="text-right">
                  <span
                    className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${statusColor(
                      o.status
                    )}`}
                  >
                    {o.status || "—"}
                  </span>

                  {typeof o.total === "number" ? (
                    <p className="mt-2 text-lg font-extrabold text-white">
                      ₱{o.total}
                    </p>
                  ) : null}
                </div>
              </div>

              <p className="text-xs text-white/40 mt-3 break-all">
                Order ID: <span className="text-white/60">{o.id}</span>
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default ManagerOrders;

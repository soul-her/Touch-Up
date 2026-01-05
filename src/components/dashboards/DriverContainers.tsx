import React, { useEffect, useMemo, useState } from "react";
import { db } from "../../firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  Timestamp,
} from "firebase/firestore";
import type { User } from "../../types";

/**
 * ✅ UI-only upgrade (logic unchanged)
 * - Keeps your filters/search/sort and updateDoc behavior the same
 * - Just restyles the layout to match a darker/glass UI
 */

type AddressMap = {
  street?: string;
  barangay?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  zip?: string;
  address?: string; // sometimes used
  lat?: number;
  lng?: number;
};

interface OrderDoc {
  id: string;

  // ✅ name fields
  customerName?: string;
  name?: string;
  fullName?: string;

  email?: string;
  phone?: string;

  // address can be map or string in older docs
  address?: AddressMap | string;

  status?: string;

  createdAt?: Timestamp | null;
  completedAt?: Timestamp | null;
  deliveredAt?: Timestamp | null;

  driverId?: string;
  driverName?: string;

  distanceKm?: number;

  // container
  isContainerPickedUp?: boolean;

  // ✅ denormalized pickup request (Option B)
  pickupRequested?: boolean;
  pickupRequestedAt?: Timestamp | null;
  pickupId?: string | null;
}

type SortBy = "oldest" | "newest" | "nearest";

function normalizeAddress(a: OrderDoc["address"]): AddressMap | null {
  if (!a) return null;
  if (typeof a === "string") return { address: a };
  return a;
}

function addressToString(aRaw: OrderDoc["address"]) {
  const a = normalizeAddress(aRaw);
  if (!a) return "N/A";

  const parts = [
    a.street,
    a.barangay,
    a.city,
    a.province,
    a.postalCode || a.zip,
  ].filter(Boolean);

  if (parts.length) return parts.join(", ");
  if (a.address) return a.address;

  return "N/A";
}

function getDoneDate(o: OrderDoc): Date | null {
  // You said: 3 days after delivered or done
  const ts = o.deliveredAt ?? o.completedAt;
  return ts ? ts.toDate() : null;
}

function daysSince(date: Date) {
  const diffMs = Date.now() - date.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

function buildSearchBlob(o: OrderDoc) {
  const a = normalizeAddress(o.address) ?? {};
  const name = o.customerName ?? o.fullName ?? o.name ?? "";
  return [
    name,
    o.email,
    o.phone,
    o.status,
    o.id,
    a.street,
    a.barangay,
    a.city,
    a.province,
    a.postalCode,
    a.zip,
    a.address,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function matchesTokens(text: string, q: string) {
  const tokens = q.toLowerCase().split(/\s+/).filter(Boolean);
  return tokens.every((t) => text.includes(t));
}

const DriverContainers: React.FC<{ currentUser: User }> = ({ currentUser }) => {
  const uid = currentUser?.uid;

  const [rawOrders, setRawOrders] = useState<OrderDoc[]>([]);
  const [error, setError] = useState("");

  // Filters
  const [selectedCity, setSelectedCity] = useState<string>("All");
  const [selectedBarangay, setSelectedBarangay] = useState<string>("All");
  const [minDays, setMinDays] = useState<number>(3);
  const [sortBy, setSortBy] = useState<SortBy>("oldest");

  const [searchText, setSearchText] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [savingId, setSavingId] = useState<string>("");

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchText.trim()), 250);
    return () => clearTimeout(t);
  }, [searchText]);

  // Subscribe to driver's assigned orders
  useEffect(() => {
    setError("");
    setRawOrders([]);

    if (!uid) return;

    const q = query(collection(db, "orders"), where("driverId", "==", uid));

    const unsub = onSnapshot(
      q,
      (snap) => {
        const data: OrderDoc[] = snap.docs.map((ds) => {
          const d = ds.data() as any;

          return {
            id: ds.id,

            customerName: d.customerName ?? "",
            fullName: d.fullName ?? "",
            name: d.customerName ?? d.fullName ?? d.name ?? "",

            email: d.email ?? "",
            phone: d.phone ?? "",

            address: d.address ?? null,

            status: d.status ?? "",

            createdAt: d.createdAt ?? null,
            completedAt: d.completedAt ?? null,
            deliveredAt: d.deliveredAt ?? null,

            driverId: d.driverId ?? "",
            driverName: d.driverName ?? "",

            distanceKm:
              typeof d.distanceKm === "number" ? d.distanceKm : undefined,

            isContainerPickedUp: Boolean(d.isContainerPickedUp),

            pickupRequested: Boolean(d.pickupRequested),
            pickupRequestedAt: d.pickupRequestedAt ?? null,
            pickupId: d.pickupId ?? null,
          };
        });

        setRawOrders(data);
      },
      (err) => {
        console.error("onSnapshot error:", err);
        setError(err?.message || "Failed to load orders.");
      }
    );

    return () => unsub();
  }, [uid]);

  // Dynamic filter options based on the driver’s actual orders
  const { cityOptions, barangayOptions } = useMemo(() => {
    const citySet = new Set<string>();
    const brgySet = new Set<string>();

    rawOrders.forEach((o) => {
      const a = normalizeAddress(o.address);
      if (a?.city) citySet.add(a.city);
      if (a?.barangay) brgySet.add(a.barangay);
    });

    const cities = ["All", ...Array.from(citySet).sort()];
    const brgys = ["All", ...Array.from(brgySet).sort()];

    return { cityOptions: cities, barangayOptions: brgys };
  }, [rawOrders]);

  // Filter + search + sort
  const orders = useMemo(() => {
    const filtered = rawOrders
      .filter((o) => {
        // ✅ only completed/delivered
        const s = (o.status || "").toLowerCase();
        const done = s === "completed" || s === "delivered";
        if (!done) return false;

        // ✅ container not picked up
        if (o.isContainerPickedUp) return false;

        // ✅ only those NOT requested by customer
        if (o.pickupRequested) return false;

        // ✅ city/barangay filters
        const a = normalizeAddress(o.address);
        if (selectedCity !== "All" && (a?.city || "") !== selectedCity)
          return false;
        if (
          selectedBarangay !== "All" &&
          (a?.barangay || "") !== selectedBarangay
        )
          return false;

        // ✅ Must be at least N days since delivered/completed
        const d = getDoneDate(o);
        if (!d) return false;
        if (daysSince(d) < minDays) return false;

        return true;
      })
      .filter((o) => {
        if (!debouncedSearch) return true;
        const blob = buildSearchBlob(o);
        return matchesTokens(blob, debouncedSearch);
      });

    const sorted = [...filtered].sort((a, b) => {
      const da = getDoneDate(a)?.getTime() ?? 0;
      const db = getDoneDate(b)?.getTime() ?? 0;

      if (sortBy === "oldest") return da - db;
      if (sortBy === "newest") return db - da;

      // nearest
      const ka =
        typeof a.distanceKm === "number" ? a.distanceKm : Number.POSITIVE_INFINITY;
      const kb =
        typeof b.distanceKm === "number" ? b.distanceKm : Number.POSITIVE_INFINITY;
      return ka - kb;
    });

    return sorted;
  }, [rawOrders, selectedCity, selectedBarangay, minDays, debouncedSearch, sortBy]);

  const markContainerPicked = async (orderId: string) => {
    try {
      setError("");
      setSavingId(orderId);

      /**
       * ✅ Rules allow drivers to update ONLY isContainerPickedUp
       */
      await updateDoc(doc(db, "orders", orderId), {
        isContainerPickedUp: true,
      });
    } catch (err: any) {
      console.error("update error:", err);
      setError(err?.message || "Failed to mark as picked up.");
    } finally {
      setSavingId("");
    }
  };

  const summaryText = useMemo(() => {
    if (!uid) return "No driver logged in.";
    if (error) return "There’s an error loading orders.";
    return `${orders.length} container(s) overdue and not requested by customer.`;
  }, [uid, error, orders.length]);

  return (
    <div className="text-white">
      {/* Header */}
      <div className="mb-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Container Pickups
            </h2>
            <p className="text-sm text-white/70">{summaryText}</p>
          </div>

          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/70">
            <span className="h-2 w-2 rounded-full bg-emerald-400/80" />
            {orders.length} pending
          </span>
        </div>
      </div>

      {/* Error */}
      {error ? (
        <div className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-100">
          {error}
        </div>
      ) : null}

      {/* Filters Card */}
      <div className="mb-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4 shadow-[0_20px_50px_-30px_rgba(0,0,0,0.9)]">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* City */}
          <div className="md:col-span-3">
            <label className="block text-xs font-semibold text-white/60 mb-1">
              City
            </label>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-white/20"
            >
              {cityOptions.map((c) => (
                <option key={c} value={c} className="text-black">
                  {c === "All" ? "All Cities" : c}
                </option>
              ))}
            </select>
          </div>

          {/* Barangay */}
          <div className="md:col-span-3">
            <label className="block text-xs font-semibold text-white/60 mb-1">
              Barangay
            </label>
            <select
              value={selectedBarangay}
              onChange={(e) => setSelectedBarangay(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-white/20"
            >
              {barangayOptions.map((b) => (
                <option key={b} value={b} className="text-black">
                  {b === "All" ? "All Barangays" : b}
                </option>
              ))}
            </select>
          </div>

          {/* Overdue slider */}
          <div className="md:col-span-3">
            <label className="block text-xs font-semibold text-white/60 mb-1">
              Overdue after: <span className="text-white">{minDays}d</span>
            </label>
            <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
              <input
                type="range"
                min={0}
                max={14}
                value={minDays}
                onChange={(e) => setMinDays(Number(e.target.value))}
                className="w-full accent-white"
              />
              <span className="text-xs font-semibold text-white/80 w-10 text-right">
                {minDays}d
              </span>
            </div>
          </div>

          {/* Sort */}
          <div className="md:col-span-3">
            <label className="block text-xs font-semibold text-white/60 mb-1">
              Sort
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-white/20"
            >
              <option value="oldest" className="text-black">
                Oldest first
              </option>
              <option value="newest" className="text-black">
                Newest first
              </option>
              <option value="nearest" className="text-black">
                Nearest first
              </option>
            </select>
          </div>

          {/* Search */}
          <div className="md:col-span-12">
            <label className="block text-xs font-semibold text-white/60 mb-1">
              Search
            </label>
            <input
              type="text"
              placeholder="Search name, email, address… (multi-word)"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 outline-none focus:ring-2 focus:ring-white/20"
            />
          </div>
        </div>
      </div>

      {/* List */}
      {orders.length ? (
        <div className="space-y-4">
          {orders.map((o) => {
            const doneDate = getDoneDate(o);
            const doneText = doneDate ? doneDate.toLocaleString("en-PH") : "N/A";
            const name = o.customerName || o.fullName || o.name || "Unknown";
            const addr = addressToString(o.address);

            const a = normalizeAddress(o.address);
            const brgy = a?.barangay ?? "N/A";
            const city = a?.city ?? "N/A";

            const isBusy = savingId === o.id;

            return (
              <div
                key={o.id}
                className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4 md:p-5 shadow-[0_20px_50px_-30px_rgba(0,0,0,0.9)]"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs text-white/50">Order ID</p>
                    <p className="font-semibold text-white break-all">{o.id}</p>
                  </div>

                  <span className="inline-flex items-center rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-200">
                    {o.status || "—"}
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-white/80">
                  <p className="min-w-0">
                    <span className="font-semibold text-white">Customer:</span>{" "}
                    <span className="truncate">{name}</span>
                  </p>

                  <p>
                    <span className="font-semibold text-white">Done:</span>{" "}
                    {doneText}
                  </p>

                  <p className="md:col-span-2">
                    <span className="font-semibold text-white">Address:</span>{" "}
                    {addr}
                  </p>

                  <p>
                    <span className="font-semibold text-white">Barangay:</span>{" "}
                    {brgy}
                  </p>

                  <p>
                    <span className="font-semibold text-white">City:</span> {city}
                  </p>

                  {typeof o.distanceKm === "number" ? (
                    <p className="md:col-span-2">
                      <span className="font-semibold text-white">Distance:</span>{" "}
                      {o.distanceKm} km
                    </p>
                  ) : null}
                </div>

                <div className="mt-4 flex items-center justify-end gap-2">
                  <button
                    disabled={isBusy}
                    onClick={() => markContainerPicked(o.id)}
                    className="rounded-xl bg-white text-gray-900 px-4 py-2 text-sm font-semibold hover:bg-white/90 transition disabled:opacity-60"
                  >
                    {isBusy ? "Saving…" : "Mark Picked Up"}
                  </button>
                </div>

                <p className="mt-3 text-xs text-white/50">
                  Completed/Delivered order, container still not picked up, and not requested by customer.
                </p>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 text-white/70">
          No overdue containers (not requested by customer) with the current filters.
        </div>
      )}
    </div>
  );
};

export default DriverContainers;

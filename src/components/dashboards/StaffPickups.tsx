import React, { useMemo, useState } from "react";
import type { DBUser } from "../../types";
import { db } from "../../firebase";
import { updateDoc, doc } from "firebase/firestore";

interface Props {
  pickups: any[];
  drivers: DBUser[];
}

const statusPill = (status?: string) => {
  const s = (status || "").toLowerCase();
  if (s === "assigned")
    return "bg-blue-500/20 text-blue-200 border border-blue-500/20";
  if (s === "on the way")
    return "bg-indigo-500/20 text-indigo-200 border border-indigo-500/20";
  if (s === "picked up" || s === "completed")
    return "bg-green-500/20 text-green-200 border border-green-500/20";
  return "bg-yellow-500/20 text-yellow-200 border border-yellow-500/20";
};

// ✅ Lock pickup if it is already completed/picked up
const isPickupLocked = (p: any) =>
  p?.status === "Picked Up" || p?.status === "Completed" || !!p?.completedAt;

const PickupsTab: React.FC<Props> = ({ pickups, drivers }) => {
  const [savingId, setSavingId] = useState<string>("");
  const [error, setError] = useState<string>("");

  const driverMap = useMemo(() => {
    const m = new Map<string, DBUser>();
    drivers.forEach((d) => m.set(d.uid, d));
    return m;
  }, [drivers]);

  const assignPickupDriver = async (pickupId: string, driverUid: string) => {
    const driver = driverMap.get(driverUid);
    if (!driver) return;

    try {
      setError("");
      setSavingId(pickupId);

      await updateDoc(doc(db, "pickups", pickupId), {
        driverId: driver.uid,
        driverName: driver.displayName || "Driver",
        status: "Assigned",
      });
    } catch (err: any) {
      console.error("Assign pickup failed:", err);
      setError(err?.message || "Failed to assign driver.");
    } finally {
      setSavingId("");
    }
  };

  return (
    <div className="text-white">
      {/* Header */}
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Pickups
          </h1>
          <p className="text-sm text-white/60 mt-1">
            Assign drivers and track pickup requests.
          </p>
        </div>

        <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/70">
          {pickups.length} total
        </span>
      </div>

      {/* Error */}
      {error ? (
        <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-100">
          {error}
        </div>
      ) : null}

      {/* Empty */}
      {pickups.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 text-white/70">
          No pickups found.
        </div>
      ) : (
        <div className="space-y-4">
          {pickups.map((p) => {
            const fullName = p?.address?.fullName || p?.fullName || "—";
            const addr = p?.address?.address || "—";
            const city = p?.address?.city || "—";
            const zip = p?.address?.zip || "—";

            const locked = isPickupLocked(p);
            const hasDriver = !!p.driverId;
            const isBusy = savingId === p.id;

            return (
              <div
                key={p.id}
                className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-5 shadow-[0_20px_50px_-30px_rgba(0,0,0,0.9)]"
              >
                {/* Top row */}
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs text-white/50">Pickup ID</p>
                    <p className="font-semibold text-white break-all">{p.id}</p>
                  </div>

                  <span
                    className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${statusPill(
                      p.status
                    )}`}
                  >
                    {p.status || "Pending"}
                  </span>
                </div>

                {/* Details */}
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-white/80">
                  <p>
                    <span className="font-semibold text-white">Name:</span>{" "}
                    {fullName}
                  </p>
                  <p>
                    <span className="font-semibold text-white">City:</span>{" "}
                    {city} {zip}
                  </p>
                  <p className="md:col-span-2">
                    <span className="font-semibold text-white">Address:</span>{" "}
                    {addr}
                  </p>
                </div>

                {/* Actions */}
                <div className="mt-5 flex items-center justify-between gap-3">
                  {/* ✅ If completed/picked up: lock assignment */}
                  {locked ? (
                    <p className="text-sm text-white/70">
                      <span className="font-semibold text-white">Driver:</span>{" "}
                      {p.driverName || p.driverId || "—"}
                      <span className="ml-2 text-xs text-green-300">
                        (pickup completed)
                      </span>
                    </p>
                  ) : hasDriver ? (
                    <p className="text-sm text-white/80">
                      <span className="font-semibold text-white">Driver:</span>{" "}
                      {p.driverName || p.driverId}
                    </p>
                  ) : (
                    <div className="flex flex-wrap items-center gap-3">
                      <label className="text-sm font-semibold text-white/70">
                        Assign driver:
                      </label>

                      <select
                        className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-white/20 disabled:opacity-60"
                        defaultValue=""
                        disabled={isBusy}
                        onChange={(e) => {
                          if (!e.target.value) return;
                          assignPickupDriver(p.id, e.target.value);
                        }}
                      >
                        <option value="" disabled className="text-black">
                          Select Driver
                        </option>
                        {drivers.map((d) => (
                          <option
                            key={d.uid}
                            value={d.uid}
                            className="text-black"
                          >
                            {d.displayName || d.email}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {isBusy ? (
                    <span className="text-sm text-white/60">Saving…</span>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PickupsTab;

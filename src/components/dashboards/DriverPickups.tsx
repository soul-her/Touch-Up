import React, { useEffect, useState } from "react";
import { db } from "../../firebase";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  Timestamp,
  query,
  orderBy,
  where,
} from "firebase/firestore";
import type { User } from "../../types";

interface Pickup {
  id: string;
  fullName?: string;
  customerName?: string;
  address?: {
    fullName?: string;
    address?: string;
    city?: string;
    zip?: string;
  };
  status: string;
  date?: string;
  time?: string;
  userId?: string;
  driverId?: string;
  createdAt?: any;
  completedAt?: any;
}

interface Props {
  currentUser: User;
}

const statusPill = (status?: string) => {
  const s = (status || "").toLowerCase();

  if (s === "picked up") {
    return "bg-green-500/20 text-green-300 border border-green-500/20";
  }
  if (s === "on the way") {
    return "bg-blue-500/20 text-blue-300 border border-blue-500/20";
  }
  if (s === "assigned") {
    return "bg-yellow-500/20 text-yellow-300 border border-yellow-500/20";
  }
  return "bg-white/10 text-white/80 border border-white/10";
};

const DriverPickups: React.FC<Props> = ({ currentUser }) => {
  const [pickups, setPickups] = useState<Pickup[]>([]);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState("");

  useEffect(() => {
    if (!currentUser?.uid) return;

    const q = query(
      collection(db, "pickups"),
      where("driverId", "==", currentUser.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map(
          (d) => ({ id: d.id, ...(d.data() as any) } as Pickup)
        );
        setPickups(data);
      },
      (err) => {
        console.error(err);
        setError(err?.message || "Failed to load pickups.");
      }
    );

    return () => unsubscribe();
  }, [currentUser?.uid]);

  const handleStatusUpdate = async (pickupId: string, newStatus: string) => {
    try {
      setError("");
      setSavingId(pickupId);

      const ref = doc(db, "pickups", pickupId);

      const patch: any = { status: newStatus };
      if (newStatus === "Picked Up") {
        patch.completedAt = Timestamp.fromDate(new Date());
      }

      await updateDoc(ref, patch);
    } catch (err: any) {
      console.error("Update pickup status failed:", err);
      setError(err?.message || "Failed to update pickup status.");
    } finally {
      setSavingId("");
    }
  };

  return (
    <div className="text-white space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
          My Pickups
        </h2>

        <span className="text-xs md:text-sm px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/70">
          {pickups.length} total
        </span>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {pickups.length === 0 ? (
        <p className="text-white/70">No assigned pickups yet.</p>
      ) : (
        <div className="space-y-6">
          {pickups.map((pickup) => {
            const name =
              pickup.address?.fullName ||
              pickup.fullName ||
              pickup.customerName ||
              "Unnamed Customer";

            const isBusy = savingId === pickup.id;

            return (
              <div
                key={pickup.id}
                className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-5 shadow-[0_20px_50px_-30px_rgba(0,0,0,0.9)]"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-white/50">Pickup</p>
                    <p className="text-lg font-semibold text-white">
                      {name}
                    </p>
                  </div>

                  <span
                    className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${statusPill(
                      pickup.status
                    )}`}
                  >
                    {pickup.status || "Pending"}
                  </span>
                </div>

                {/* Details */}
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-white/80">
                  <p className="md:col-span-2">
                    <span className="font-semibold text-white">Address:</span>{" "}
                    {pickup.address?.address || "—"},{" "}
                    {pickup.address?.city || "—"}{" "}
                    {pickup.address?.zip || ""}
                  </p>
                  <p>
                    <span className="font-semibold text-white">Date:</span>{" "}
                    {pickup.date || "—"}
                  </p>
                  <p>
                    <span className="font-semibold text-white">Time:</span>{" "}
                    {pickup.time || "—"}
                  </p>
                </div>

                {/* Actions */}
                <div className="mt-5 flex flex-wrap gap-2 justify-end">
                  {(pickup.status === "Pending" ||
                    pickup.status === "Assigned") && (
                    <button
                      disabled={isBusy}
                      onClick={() =>
                        handleStatusUpdate(pickup.id, "On the Way")
                      }
                      className="px-4 py-2 rounded-xl font-semibold bg-blue-500/80 hover:bg-blue-500 text-white transition shadow disabled:opacity-60"
                    >
                      {isBusy ? "Saving…" : "Mark as On the Way"}
                    </button>
                  )}

                  {pickup.status === "On the Way" && (
                    <button
                      disabled={isBusy}
                      onClick={() =>
                        handleStatusUpdate(pickup.id, "Picked Up")
                      }
                      className="px-4 py-2 rounded-xl font-semibold bg-green-500/80 hover:bg-green-500 text-white transition shadow disabled:opacity-60"
                    >
                      {isBusy ? "Saving…" : "Mark as Picked Up"}
                    </button>
                  )}
                </div>

                {/* Completion time */}
                {pickup.status === "Picked Up" &&
                  pickup.completedAt?.toDate && (
                    <p className="text-xs text-white/50 mt-3 text-right">
                      Picked up on{" "}
                      {pickup.completedAt
                        .toDate()
                        .toLocaleString("en-PH")}
                    </p>
                  )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DriverPickups;

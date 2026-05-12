import React, { useState, useEffect, useMemo } from "react";
import { db } from "../firebase";
import { collection, query, where, onSnapshot, orderBy, doc, updateDoc } from "firebase/firestore";
import type { AnyDoc } from "../types";

function canUserCancelPickup(p: AnyDoc) {
  const status = (p?.status ?? "").toString().toLowerCase();
  const activeStatus = status === "active"; // Allow cancel only for Active pickups
  return activeStatus;
}

const PickupComponent: React.FC<{ uid: string }> = ({ uid }) => {
  const [pickups, setPickups] = useState<AnyDoc[]>([]);
  const [loadingPickups, setLoadingPickups] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setPickups([]);
    setLoadingPickups(true);
    setError("");

    if (!uid) {
      setLoadingPickups(false);
      return;
    }

    const q = query(
      collection(db, "pickups"),
      where("userId", "==", uid),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const data = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as AnyDoc),
        }));
        setPickups(data);
        setLoadingPickups(false);
      },
      (err) => {
        console.error(err);
        setError(err?.message || "Failed to load pickups.");
        setLoadingPickups(false);
      }
    );

    return () => unsub();
  }, [uid]);

  const activePickups = useMemo(() => pickups.filter((p) => p.status !== "completed" && p.status !== "cancelled"), [pickups]);

  const handleCancelPickup = async (pickupId: string) => {
    try {
      const pickupRef = doc(db, "pickups", pickupId);
      await updateDoc(pickupRef, { status: "Cancelled" });
      alert("Pickup successfully cancelled.");
    } catch (err) {
      console.error("Error updating pickup status:", err);
      setError("Failed to cancel pickup. " + (err?.message || "Unknown error"));
    }
  };

  return (
    <div className="flex flex-wrap gap-4">
      <div className="border rounded-xl p-4 w-full">
        <h3 className="font-semibold text-lg mb-3">Active Pickups</h3>
        {loadingPickups ? <p>Loading...</p> : activePickups.map((p) => {
          const canCancel = canUserCancelPickup(p);
          return (
            <div key={p.id} className="p-4 border rounded-lg mb-4 bg-purple-50">
              <p>Pickup #{p.id.slice(-6)}</p>
              <p>Status: <span>{p.status}</span></p>
              <button
                onClick={() => handleCancelPickup(p.id)}
                disabled={!canCancel}
                className={`mt-2 w-full px-4 py-2 rounded-lg ${canCancel ? "bg-red-600 text-white" : "bg-gray-300 text-gray-700"}`}
              >
                Cancel Pickup
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PickupComponent;

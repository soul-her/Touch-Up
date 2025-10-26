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
} from "firebase/firestore";
import type { User } from "../../types";

interface Pickup {
  id: string;
  fullName: string;
  address: {
    address: string;
    city: string;
    zip: string;
  };
  status: string;
  date: string;
  time: string;
  userId: string;
  createdAt: any;
  customerName?: string;
}

interface Props {
  currentUser: User;
}

const DriverPickups: React.FC<Props> = ({ currentUser }) => {
  const [pickups, setPickups] = useState<Pickup[]>([]);

  useEffect(() => {
    const q = query(collection(db, "pickups"), orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Pickup));
      setPickups(data);
    });

    return () => unsubscribe();
  }, []);

  const handleStatusUpdate = async (pickupId: string, newStatus: string) => {
    const ref = doc(db, "pickups", pickupId);
    const completedAt = newStatus === "Picked Up" ? Timestamp.fromDate(new Date()) : null;
    await updateDoc(ref, { status: newStatus, completedAt }, { merge: true });
  };

  return (
    <div className="space-y-6">
      {pickups.length === 0 ? (
        <p className="text-gray-500">No scheduled pickups yet.</p>
      ) : (
        pickups.map((pickup) => (
          <div key={pickup.id} className="p-4 border rounded-lg bg-gray-50 shadow-sm">
            {/* Header */}
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold text-lg text-gray-800">
                {pickup.fullName || pickup.customerName || "Unnamed Customer"}
              </h3>
              <span
                className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  pickup.status === "Picked Up"
                    ? "bg-green-100 text-green-800"
                    : pickup.status === "On the Way"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-yellow-100 text-yellow-800"
                }`}
              >
                {pickup.status}
              </span>
            </div>

            {/* Address & Details */}
            <div className="text-gray-700 mb-2">
              <p>
                <strong>Address:</strong>{" "}
                {pickup.address?.address}, {pickup.address?.city} {pickup.address?.zip}
              </p>
              <p>
                <strong>Date:</strong> {pickup.date}
              </p>
              <p>
                <strong>Time:</strong> {pickup.time}
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-2 mt-3 justify-end">
              {pickup.status === "Pending" && (
                <button
                  onClick={() => handleStatusUpdate(pickup.id, "On the Way")}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Mark as On the Way
                </button>
              )}

              {pickup.status === "On the Way" && (
                <button
                  onClick={() => handleStatusUpdate(pickup.id, "Picked Up")}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Mark as Picked Up
                </button>
              )}
            </div>

            {/* Completion timestamp */}
            {pickup.status === "Picked Up" && pickup.createdAt?.toDate && (
              <p className="text-xs text-gray-500 mt-2 text-right">
                Picked up on {pickup.createdAt.toDate().toLocaleString("en-PH")}
              </p>
            )}
          </div>
        ))
      )}
    </div>
  );
};

export default DriverPickups;

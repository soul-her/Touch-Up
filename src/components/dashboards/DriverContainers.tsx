import React, { useEffect, useState } from "react";
import { db } from "../../firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
import { Package } from "lucide-react";
import type { User } from "../../types";

interface ContainerPickup {
  id: string;
  orderId: string;
  driverId?: string;
  address?: {
    street?: string;
    barangay?: string;
    city?: string;
  };
  pickedUpAt: any;
}

const DriverContainers: React.FC<{ currentUser: User }> = ({ currentUser }) => {
  const [containers, setContainers] = useState<ContainerPickup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (!currentUser?.uid) return;

    const q = query(
      collection(db, "containerPickups"),
      where("driverId", "==", currentUser.uid)
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const data = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as ContainerPickup),
        }));
        setContainers(data);
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setError("Failed to load container pickups");
        setLoading(false);
      }
    );

    return () => unsub();
  }, [currentUser?.uid]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white/60">Loading containers...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-red-200">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white">Container Pickups</h2>
          <p className="text-sm text-white/60">
            Manage water container returns
          </p>
        </div>
        <span className="px-3 py-1 rounded-full bg-white/10 border border-white/10 text-white text-sm font-semibold">
          {containers.length}
        </span>
      </div>

      {containers.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <Package size={48} className="text-white/20 mb-4" />
          <p className="text-white/60">No container pickups assigned yet</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {containers.map((container) => (
            <div
              key={container.id}
              className="rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition p-4 cursor-pointer"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Package size={18} className="text-blue-400 flex-shrink-0" />
                    <p className="font-semibold text-white truncate">
                      Container #{container.orderId.slice(0, 8)}
                    </p>
                  </div>

                  {container.address && (
                    <div className="text-sm text-white/70 space-y-1">
                      {container.address.street && (
                        <p>{container.address.street}</p>
                      )}
                      {container.address.barangay && (
                        <p>
                          {container.address.barangay}
                          {container.address.city
                            ? `, ${container.address.city}`
                            : ""}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="text-right text-xs text-white/50">
                  {container.pickedUpAt && (
                    <p>
                      {new Date(
                        container.pickedUpAt.toDate?.() || 0
                      ).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DriverContainers;

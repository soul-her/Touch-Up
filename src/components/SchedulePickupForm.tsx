import React, { useEffect, useMemo, useState } from "react";
import { db, auth } from "../firebase";
import { collection, doc, writeBatch, serverTimestamp } from "firebase/firestore";
import type { DBUser, ShippingAddress, View } from "../types";

interface SchedulePickupFormProps {
  currentUser: DBUser | null;
  setView: (view: View) => void;
  orderId: string; // ✅ required
}

const SchedulePickupForm: React.FC<SchedulePickupFormProps> = ({
  currentUser,
  setView,
  orderId,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [time, setTime] = useState("");
  const [useDifferentAddress, setUseDifferentAddress] = useState(
    !currentUser?.shippingAddress
  );

  const [addressForm, setAddressForm] = useState<ShippingAddress>({
    fullName: currentUser?.shippingAddress?.fullName || currentUser?.displayName || "",
    address: currentUser?.shippingAddress?.address || "",
    city: currentUser?.shippingAddress?.city || "",
    zip: currentUser?.shippingAddress?.zip || "",
  });

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  useEffect(() => {
    setUseDifferentAddress(!currentUser?.shippingAddress);

    if (currentUser) {
      setAddressForm({
        fullName:
          currentUser.shippingAddress?.fullName ||
          currentUser.displayName ||
          "",
        address: currentUser.shippingAddress?.address || "",
        city: currentUser.shippingAddress?.city || "",
        zip: currentUser.shippingAddress?.zip || "",
      });
    } else {
      setAddressForm({ fullName: "", address: "", city: "", zip: "" });
    }
  }, [currentUser]);

  const handleAddressInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAddressForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const user = auth.currentUser;
    if (!user) {
      alert("Please log in first.");
      setView("login");
      return;
    }

    if (!selectedDate || !time) return;

    const finalAddress =
      useDifferentAddress || !currentUser?.shippingAddress
        ? addressForm
        : currentUser.shippingAddress;

    try {
      const batch = writeBatch(db);

      const pickupRef = doc(collection(db, "pickups"));

      batch.set(pickupRef, {
        pickupId: pickupRef.id,
        orderId,
        userId: user.uid,

        // keep both (your UI uses both styles)
        fullName: finalAddress.fullName,
        customerName: finalAddress.fullName,

        // ✅ IMPORTANT: PickupsTab expects p.address.fullName
        address: {
          fullName: finalAddress.fullName,
          address: finalAddress.address,
          city: finalAddress.city,
          zip: finalAddress.zip,
        },

        date: selectedDate.toISOString().split("T")[0],
        time,

        status: "Pending",
        driverId: null,
        createdAt: serverTimestamp(),
      });

      batch.update(doc(db, "orders", orderId), {
        pickupRequested: true,
        pickupRequestedAt: serverTimestamp(),
        pickupId: pickupRef.id,
      });

      await batch.commit();

      alert("Pickup successfully scheduled!");
      setSelectedDate(null);
      setTime("");
      setView("profile");
    } catch (err) {
      console.error("Schedule pickup error:", err);
      alert("Failed to schedule pickup.");
    }
  };

  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDay = firstDay.getDay();
    const days: (Date | null)[] = [];

    for (let i = 0; i < startDay; i++) days.push(null);
    for (let day = 1; day <= lastDay.getDate(); day++) {
      days.push(new Date(year, month, day));
    }
    return days;
  }, [currentDate]);

  const changeMonth = (offset: number) => {
    setCurrentDate((prev) => {
      const nd = new Date(prev);
      nd.setMonth(prev.getMonth() + offset);
      return nd;
    });
  };

  const handleDateSelect = (day: Date) => {
    if (day >= today) setSelectedDate(day);
  };

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const isFormValid = useMemo(() => {
    if (!orderId) return false;
    if (!selectedDate || !time) return false;

    if (useDifferentAddress || !currentUser?.shippingAddress) {
      return (
        Boolean(addressForm.fullName) &&
        Boolean(addressForm.address) &&
        Boolean(addressForm.city) &&
        Boolean(addressForm.zip)
      );
    }
    return true;
  }, [orderId, selectedDate, time, useDifferentAddress, addressForm, currentUser]);

  if (!currentUser) {
    return (
      <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-2xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-800 mb-4">Schedule a Pickup</h2>
        <p className="text-gray-600 mb-6">You must be logged in to schedule a pickup.</p>
        <button
          onClick={() => setView("login")}
          className="bg-blue-600 text-white py-3 px-8 rounded-lg font-semibold hover:bg-blue-700"
        >
          Login
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 sm:p-8 rounded-xl shadow-xl max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">
        Schedule Container Pickup
      </h2>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Calendar */}
        <div className="space-y-6">
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">
              Select a Date
            </label>

            <div className="bg-gray-50 p-4 rounded-lg border">
              <div className="flex justify-between items-center mb-4">
                <button type="button" onClick={() => changeMonth(-1)} className="p-2 hover:bg-gray-200 rounded-full">
                  ‹
                </button>
                <span className="font-semibold text-lg text-gray-800">
                  {currentDate.toLocaleString("default", { month: "long", year: "numeric" })}
                </span>
                <button type="button" onClick={() => changeMonth(1)} className="p-2 hover:bg-gray-200 rounded-full">
                  ›
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center">
                {weekDays.map((d) => (
                  <div key={d} className="text-xs font-medium text-gray-500 uppercase">{d}</div>
                ))}

                {calendarDays.map((day, i) => {
                  if (!day) return <div key={i} />;
                  const isPast = day < today;
                  const isSelected = selectedDate?.getTime() === day.getTime();

                  let cls = "h-9 w-9 flex items-center justify-center rounded-full text-sm transition";
                  if (isPast) cls += " text-gray-300 cursor-not-allowed";
                  else {
                    cls += " cursor-pointer hover:bg-blue-100";
                    if (isSelected) cls += " bg-blue-500 text-white font-bold";
                  }

                  return (
                    <button
                      key={day.toISOString()}
                      type="button"
                      disabled={isPast}
                      className={cls}
                      onClick={() => handleDateSelect(day)}
                    >
                      {day.getDate()}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Time Slot</label>
            <select
              value={time}
              onChange={(e) => setTime(e.target.value)}
              required
              className="w-full mt-1 px-3 py-2 border rounded-md"
            >
              <option value="">Select a time</option>
              <option value="9:00 AM - 12:00 PM">9:00 AM - 12:00 PM</option>
              <option value="12:00 PM - 3:00 PM">12:00 PM - 3:00 PM</option>
              <option value="3:00 PM - 6:00 PM">3:00 PM - 6:00 PM</option>
            </select>
          </div>
        </div>

        {/* Address */}
        <div className="space-y-4">
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">Pickup Address</label>

            {currentUser?.shippingAddress && (
              <div className="bg-gray-50 p-4 border rounded-lg mb-4 space-y-3">
                <label className="flex items-start">
                  <input type="radio" checked={!useDifferentAddress} onChange={() => setUseDifferentAddress(false)} className="mt-1" />
                  <span className="ml-3 text-sm">
                    <strong>Use saved address</strong>
                    <div className="text-gray-600 mt-1">
                      <p>{currentUser.shippingAddress.fullName}</p>
                      <p>{currentUser.shippingAddress.address}</p>
                      <p>{currentUser.shippingAddress.city}, {currentUser.shippingAddress.zip}</p>
                    </div>
                  </span>
                </label>

                <label className="flex items-start">
                  <input type="radio" checked={useDifferentAddress} onChange={() => setUseDifferentAddress(true)} className="mt-1" />
                  <span className="ml-3 text-sm font-medium text-gray-900">Use a different address</span>
                </label>
              </div>
            )}

            {(useDifferentAddress || !currentUser?.shippingAddress) && (
              <div className="p-4 border rounded-lg space-y-3">
                <input
                  type="text"
                  name="fullName"
                  placeholder="Full Name"
                  required
                  value={addressForm.fullName}
                  onChange={handleAddressInputChange}
                  className="w-full px-3 py-2 border rounded"
                />
                <input
                  type="text"
                  name="address"
                  placeholder="Street Address"
                  required
                  value={addressForm.address}
                  onChange={handleAddressInputChange}
                  className="w-full px-3 py-2 border rounded"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    name="city"
                    placeholder="City"
                    required
                    value={addressForm.city}
                    onChange={handleAddressInputChange}
                    className="px-3 py-2 border rounded"
                  />
                  <input
                    type="text"
                    name="zip"
                    placeholder="ZIP Code"
                    required
                    value={addressForm.zip}
                    onChange={handleAddressInputChange}
                    className="px-3 py-2 border rounded"
                  />
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={!isFormValid}
            className="w-full bg-green-600 text-white py-3 rounded-lg font-bold disabled:opacity-50"
          >
            Confirm Pickup
          </button>
        </div>
      </form>
    </div>
  );
};

export default SchedulePickupForm;

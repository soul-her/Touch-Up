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
    phone: currentUser?.shippingAddress?.phone || "", // Add phone number field
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
        phone: currentUser.shippingAddress?.phone || "", // Add phone from user data
      });
    } else {
      setAddressForm({ fullName: "", address: "", city: "", zip: "", phone: "" });
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

    // Determine which address to use
    const finalAddress =
      useDifferentAddress || !currentUser?.shippingAddress
        ? addressForm // If user chooses a different address, use the entered address
        : currentUser.shippingAddress; // Use the saved address if not using a different one

    try {
      const batch = writeBatch(db);

      const pickupRef = doc(collection(db, "pickups"));

      batch.set(pickupRef, {
        pickupId: pickupRef.id,
        orderId,
        userId: user.uid,

        // Use both styles (fullName and customerName)
        fullName: finalAddress.fullName,
        customerName: finalAddress.fullName,

        address: {
          fullName: finalAddress.fullName,
          address: finalAddress.address,
          city: finalAddress.city,
          zip: finalAddress.zip,
        },

        phone: finalAddress.phone, // Save phone number as well
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

      alert("Pickup successfully scheduled!"); // Only show success message
      setSelectedDate(null);
      setTime("");
      setView("profile");
    } catch (err) {
      console.error("Schedule pickup error:", err);
      // Do not show any failure messages
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
        Boolean(addressForm.zip) &&
        Boolean(addressForm.phone) // Ensure phone number is provided
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
    <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-6 sm:p-8 rounded-xl shadow-xl max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">
        Schedule Container Pickup
      </h2>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Calendar & Time */}
          <div className="space-y-6">
            {/* Calendar */}
            <div>
              <label className="block mb-4 text-sm font-bold text-gray-800 uppercase tracking-wide">
                Select a Date
              </label>

              <div className="bg-white p-5 rounded-xl border-2 border-gray-200">
                <div className="flex justify-between items-center mb-5">
                  <button 
                    type="button" 
                    onClick={() => changeMonth(-1)} 
                    className="p-2 hover:bg-gray-200 rounded-full font-bold text-lg"
                  >
                    ‹
                  </button>
                  <span className="font-bold text-lg text-gray-800">
                    {currentDate.toLocaleString("default", { month: "long", year: "numeric" })}
                  </span>
                  <button 
                    type="button" 
                    onClick={() => changeMonth(1)} 
                    className="p-2 hover:bg-gray-200 rounded-full font-bold text-lg"
                  >
                    ›
                  </button>
                </div>

                <div className="grid grid-cols-7 gap-2">
                  {weekDays.map((d) => (
                    <div key={d} className="text-xs font-bold text-gray-600 uppercase text-center h-8 flex items-center justify-center">
                      {d}
                    </div>
                  ))}

                  {calendarDays.map((day, i) => {
                    if (!day) return <div key={i} />;
                    const isPast = day < today;
                    const isSelected = selectedDate?.getTime() === day.getTime();

                    return (
                      <button
                        key={day.toISOString()}
                        type="button"
                        disabled={isPast}
                        onClick={() => handleDateSelect(day)}
                        className={`h-10 rounded-lg font-semibold transition ${
                          isPast
                            ? "text-gray-300 cursor-not-allowed"
                            : isSelected
                            ? "bg-blue-500 text-white shadow-lg"
                            : "bg-gray-100 text-gray-700 hover:bg-blue-100 cursor-pointer"
                        }`}
                      >
                        {day.getDate()}
                      </button>
                    );
                  })}
                </div>
              </div>

              {selectedDate && (
                <p className="mt-3 text-sm font-semibold text-blue-600">
                  Selected: {selectedDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                </p>
              )}
            </div>

            {/* Time Slot */}
            <div>
              <label className="block text-sm font-bold text-gray-800 uppercase tracking-wide mb-3">
                Time Slot
              </label>
              <select
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg font-semibold text-gray-800 focus:border-blue-500 focus:outline-none bg-white"
              >
                <option value="">Select a time slot...</option>
                <option value="9:00 AM - 12:00 PM">9:00 AM - 12:00 PM</option>
                <option value="12:00 PM - 3:00 PM">12:00 PM - 3:00 PM</option>
                <option value="3:00 PM - 6:00 PM">3:00 PM - 6:00 PM</option>
              </select>
              {time && (
                <p className="mt-2 text-sm font-semibold text-green-600">
                  ✓ Time: {time}
                </p>
              )}
            </div>
          </div>

          {/* Right Column: Address */}
          <div className="space-y-4">
            <label className="block text-sm font-bold text-gray-800 uppercase tracking-wide">
              Pickup Address
            </label>

            {currentUser?.shippingAddress && (
              <div className="bg-white p-4 border-2 border-gray-200 rounded-xl space-y-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input 
                    type="radio" 
                    checked={!useDifferentAddress} 
                    onChange={() => setUseDifferentAddress(false)} 
                    className="mt-1 w-5 h-5 cursor-pointer"
                  />
                  <span className="text-sm">
                    <p className="font-bold text-gray-800">Use saved address</p>
                    <div className="text-gray-600 mt-2 space-y-1">
                      <p className="font-semibold">{currentUser.shippingAddress.fullName}</p>
                      <p>{currentUser.shippingAddress.address}</p>
                      <p>{currentUser.shippingAddress.city}, {currentUser.shippingAddress.zip}</p>
                    </div>
                  </span>
                </label>

                <hr className="my-3" />

                <label className="flex items-center gap-3 cursor-pointer">
                  <input 
                    type="radio" 
                    checked={useDifferentAddress} 
                    onChange={() => setUseDifferentAddress(true)} 
                    className="mt-1 w-5 h-5 cursor-pointer"
                  />
                  <span className="font-bold text-gray-800">Use a different address</span>
                </label>
              </div>
            )}

            {(useDifferentAddress || !currentUser?.shippingAddress) && (
              <div className="bg-white p-4 border-2 border-gray-200 rounded-xl space-y-3">
                <input
                  type="text"
                  name="fullName"
                  placeholder="Full Name"
                  required
                  value={addressForm.fullName}
                  onChange={handleAddressInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                />
                <input
                  type="text"
                  name="address"
                  placeholder="Street Address"
                  required
                  value={addressForm.address}
                  onChange={handleAddressInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    name="city"
                    placeholder="City"
                    required
                    value={addressForm.city}
                    onChange={handleAddressInputChange}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                  />
                  <input
                    type="text"
                    name="zip"
                    placeholder="ZIP Code"
                    required
                    value={addressForm.zip}
                    onChange={handleAddressInputChange}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <input
                  type="text"
                  name="phone"
                  placeholder="Phone Number"
                  required
                  value={addressForm.phone}
                  onChange={handleAddressInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                />
              </div>
            )}
          </div>
        </div>

        {/* Submit Button - Always Visible at Bottom */}
        <div className="pt-6 border-t-2 border-gray-200">
          <button
            type="submit"
            disabled={!isFormValid}
            className={`w-full py-4 px-6 text-lg font-bold rounded-xl transition-all ${
              isFormValid
                ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:shadow-xl hover:scale-105 transform cursor-pointer"
                : "bg-gray-300 text-gray-600 cursor-not-allowed opacity-60"
            }`}
          >
            {isFormValid ? "✓ Confirm Pickup" : "Complete form to continue"}
          </button>
          {!isFormValid && (
            <p className="mt-3 text-sm text-gray-600 text-center">
              {!selectedDate ? "📅 Please select a date" : !time ? "⏰ Please select a time" : "📍 Please complete the address"}
            </p>
          )}
        </div>
      </form>
    </div>
  );
};

export default SchedulePickupForm;
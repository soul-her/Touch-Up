import React, { useState, useEffect, useCallback, memo } from "react";
import { db } from "../firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
  setDoc,
} from "firebase/firestore";
import { useCart } from "./context/CartContext";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import ReviewSurvey from "./ReviewSurvey";

const STORE_LOCATION = { lat: 9.3079, lng: 123.3081 };

delete (L.Icon.Default as any).prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Form Field component
type FieldProps = {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  maxLength?: number;
  required?: boolean;
  type?: string;
};

const Field = memo(function Field({
  label,
  value,
  onChange,
  placeholder,
  maxLength,
  required,
  type = "text",
}: FieldProps) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-900">
        {label} {required ? <span className="text-red-500">*</span> : null}
      </label>
      <input
        type={type}
        className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-400 shadow-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
      />
    </div>
  );
});

// Location Picker for map
type LocationPickerProps = {
  lat: number;
  lng: number;
  onPick: (lat: number, lng: number) => void;
};

const LocationPicker = memo(function LocationPicker({
  lat,
  lng,
  onPick,
}: LocationPickerProps) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });

  return <Marker position={[lat, lng]} />;
});

// Map Section for displaying the map
type MapSectionProps = {
  lat: number;
  lng: number;
  onPick: (lat: number, lng: number) => void;
  distanceKm: number;
  totalPrice: number;
  shippingCost: number;
};

const MapSection = memo(function MapSection({
  lat,
  lng,
  onPick,
  distanceKm,
  totalPrice,
  shippingCost,
}: MapSectionProps) {
  return (
    <div className="mt-2">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-gray-900">Pin your location</p>
          <p className="text-sm text-gray-600">
            Click on the map to set your delivery point.
          </p>
        </div>

        <div className="text-right">
          <p className="text-xs text-gray-500">Estimated distance</p>
          <p className="text-sm font-bold text-gray-900">
            {distanceKm.toFixed(2)} km
          </p>
        </div>
      </div>

      <div className="mt-3 rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
        <MapContainer
          center={[lat, lng]}
          zoom={13}
          style={{ height: "320px", width: "100%" }}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <LocationPicker lat={lat} lng={lng} onPick={onPick} />
        </MapContainer>
      </div>

      <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
          <p className="text-xs text-gray-500">Items total</p>
          <p className="text-sm font-bold text-gray-900">
            ₱{totalPrice.toFixed(2)}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
          <p className="text-xs text-gray-500">Shipping fee</p>
          <p className="text-sm font-bold text-gray-900">
            ₱{shippingCost.toFixed(2)}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
          <p className="text-xs text-gray-500">Total</p>
          <p className="text-sm font-extrabold text-gray-900">
            ₱{(totalPrice + shippingCost).toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  );
});

const CheckoutView: React.FC<{ currentUser: any; setView?: (view: string) => void }> = ({ currentUser, setView }) => {
  const { cartItems, clearCart } = useCart();
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [orderId, setOrderId] = useState<string>("");
  const [isPlacing, setIsPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [customerNameForReview, setCustomerNameForReview] = useState("");
  const [phone, setPhone] = useState("");
  const [street, setStreet] = useState("");
  const [barangay, setBarangay] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [postalCode, setPostalCode] = useState("");

  const [lat, setLat] = useState(9.3079);
  const [lng, setLng] = useState(123.3054);
  const [distanceKm, setDistanceKm] = useState(0);
  const [shippingCost, setShippingCost] = useState(0);

  const calculateDistance = useCallback((lat2: number, lng2: number) => {
    const R = 6371;
    const dLat = ((lat2 - STORE_LOCATION.lat) * Math.PI) / 180;
    const dLng = ((lng2 - STORE_LOCATION.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(STORE_LOCATION.lat * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    setDistanceKm(distance);
    setShippingCost(Math.round(distance * 12));
  }, []);

  const handlePickLocation = useCallback((newLat: number, newLng: number) => {
    setLat(newLat);
    setLng(newLng);
    calculateDistance(newLat, newLng);
  }, [calculateDistance]);

  useEffect(() => {
    const loadUserInfo = async () => {
      if (!currentUser) return;
      try {
        const userRef = doc(db, "users", currentUser.uid);
        const snap = await getDoc(userRef);
        if (snap.exists()) {
          const u = snap.data();
          setName(u.name || "");
          setCustomerNameForReview(u.displayName || u.name || currentUser.email || "Valued Customer");
          setPhone(u.phone || "");
          const address = u.address;
          setStreet(address.street || "");
          setBarangay(address.barangay || "");
          setCity(address.city || "");
          setProvince(address.province || "");
          setPostalCode(address.postalCode || "");
          if (address.lat && address.lng) {
            setLat(address.lat);
            setLng(address.lng);
            calculateDistance(address.lat, address.lng);
          }
        } else {
          setCustomerNameForReview(currentUser.email || "Valued Customer");
        }
      } catch {
        console.log("Error loading user");
        setCustomerNameForReview(currentUser.email || "Valued Customer");
      }
    };
    loadUserInfo();
  }, [currentUser, calculateDistance]);

  const isValidPhone = (num: string) => /^09\d{9}$/.test(num);

  const totalPrice = cartItems.reduce(
    (sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1),
    0
  );

  const handlePlaceOrder = async () => {
    try {
      if (!currentUser) throw new Error("No user logged in");
      if (!cartItems.length) throw new Error("Your cart is empty.");
      if (!name || !street || !city || !province) throw new Error("Please complete your delivery information.");
      if (!isValidPhone(phone)) throw new Error("Invalid phone number. Use 11 digits and start with 09 (e.g., 09xxxxxxxxx).");

      setIsPlacing(true);
      setError(null);

      const fullAddress = { street, barangay, city, province, postalCode, lat, lng };

      await setDoc(doc(db, "users", currentUser.uid), { name, phone, address: fullAddress }, { merge: true });

      const totalItems = cartItems.reduce(
        (sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1),
        0
      );

      const now = new Date();
      const orderDate = now.toLocaleDateString();
      const orderTime = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

      const orderData = {
        userId: currentUser.uid,
        customerName: name,
        phone,
        address: fullAddress,
        items: cartItems,
        total: totalItems + shippingCost,
        shippingCost,
        distanceKm,
        status: "Placed",
        date: orderDate,
        time: orderTime,
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, "orders"), orderData);

      clearCart();
      setOrderId(docRef.id);
      setOrderPlaced(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsPlacing(false);
    }
  };

  if (orderPlaced) {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="w-full max-w-md bg-white/95 backdrop-blur rounded-2xl shadow-xl p-8 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <span className="text-green-600 text-3xl">✓</span>
            </div>
            <h1 className="mt-4 text-2xl sm:text-3xl font-bold text-gray-900">Order Confirmed!</h1>
            <p className="mt-3 text-gray-700 text-sm">
              Thank you for your order. We've received your delivery request and will process it shortly.
            </p>
            <p className="mt-2 text-xs text-gray-500">
              Order ID: <span className="font-mono text-gray-600">{orderId.slice(0, 8)}</span>
            </p>

            <div className="mt-7 space-y-3">
              <button
                onClick={() => setShowReviewModal(true)}
                className="w-full bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 transition shadow-md"
              >
                Leave a Review
              </button>
              <button
                onClick={() => setView ? setView("products") : window.location.reload()}
                className="w-full bg-gray-200 text-gray-900 font-semibold py-3 rounded-xl hover:bg-gray-300 transition"
              >
                Continue Shopping
              </button>
            </div>

            <p className="mt-4 text-xs text-gray-500">
              You'll receive updates via SMS or email
            </p>
          </div>
        </div>

        {showReviewModal && (
          <ReviewSurvey
            orderId={orderId}
            userId={currentUser.uid}
            customerName={customerNameForReview}
            onClose={() => setShowReviewModal(false)}
            onComplete={() => setShowReviewModal(false)}
          />
        )}
      </>
    );
  }

  return (
    <div className="min-h-screen px-4 py-10">
      <div className="mx-auto max-w-3xl">
        <div className="text-center mb-8">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Checkout</h2>
          <p className="mt-2 text-white/80">Enter your delivery details and pin your location on the map.</p>
        </div>

        <div className="bg-white/95 backdrop-blur rounded-2xl shadow-xl overflow-hidden">
          <div className="p-6 sm:p-8 border-b border-gray-100">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Delivery Information</h3>
                <p className="mt-1 text-sm text-gray-600">
                  Fields marked with <span className="text-red-500">*</span> are required.
                </p>
              </div>

              <div className="text-right">
                <p className="text-sm text-gray-500">Order total</p>
                <p className="text-lg font-extrabold text-gray-900">₱{(totalPrice + shippingCost).toFixed(2)}</p>
              </div>
            </div>

            {error && <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700 text-sm">{error}</div>}
          </div>

          <div className="p-6 sm:p-8 grid grid-cols-1 gap-5">
            <Field label="Full Name" value={name} onChange={setName} placeholder="Juan Dela Cruz" required />
            <Field label="Phone Number" value={phone} onChange={setPhone} placeholder="09xxxxxxxxx" maxLength={11} required />
            <Field label="Street / House No." value={street} onChange={setStreet} placeholder="House no., Street name" required />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field label="Barangay" value={barangay} onChange={setBarangay} placeholder="Barangay" />
              <Field label="Postal Code" value={postalCode} onChange={setPostalCode} placeholder="e.g., 6200" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field label="City / Municipality" value={city} onChange={setCity} placeholder="Dumaguete City" required />
              <Field label="Province" value={province} onChange={setProvince} placeholder="Negros Oriental" required />
            </div>

            <MapSection lat={lat} lng={lng} onPick={handlePickLocation} distanceKm={distanceKm} totalPrice={totalPrice} shippingCost={shippingCost} />

            <button
              onClick={handlePlaceOrder}
              disabled={isPlacing}
              className="mt-2 w-full rounded-xl bg-blue-600 text-white font-semibold py-4 shadow-md hover:bg-blue-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isPlacing ? "Placing order..." : "Place Order"}
            </button>

            <p className="text-xs text-gray-500 text-center">By placing an order, you confirm that your delivery details are correct.</p>
          </div>
        </div>

        <p className="mt-6 text-center text-white/70 text-sm">
          Tip: If shipping looks high, move the pin closer to your exact location for a better estimate.
        </p>
      </div>
    </div>
  );
};

export default CheckoutView;

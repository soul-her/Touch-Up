import React, { useState, useEffect } from "react";
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
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface CheckoutViewProps {
  currentUser: any;
  setView?: (view: string) => void;
}

// Fix default icon issue in Leaflet
delete (L.Icon.Default as any).prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const CheckoutView: React.FC<CheckoutViewProps> = ({ currentUser, setView }) => {
  const { cartItems, clearCart } = useCart();
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [isPlacing, setIsPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");

  const [street, setStreet] = useState("");
  const [barangay, setBarangay] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [savedAddress, setSavedAddress] = useState<any>(null);

  const [lat, setLat] = useState(14.5995);
  const [lng, setLng] = useState(120.9842);
  const [distanceKm, setDistanceKm] = useState(0);
  const [shippingCost, setShippingCost] = useState(0);

  const storeLocation = { lat: 14.5995, lng: 120.9842 }; // Manila

  // Fetch user info
  useEffect(() => {
    const fetchUserInfo = async () => {
      if (!currentUser) return;
      try {
        const userRef = doc(db, "users", currentUser.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data();
          setName(userData.name || "");
          if (userData.address) {
            const addr = userData.address;
            setSavedAddress(addr);
            setStreet(addr.street || "");
            setBarangay(addr.barangay || "");
            setCity(addr.city || "");
            setProvince(addr.province || "");
            setPostalCode(addr.postalCode || "");
            if (addr.lat && addr.lng) {
              setLat(addr.lat);
              setLng(addr.lng);
              calculateDistance(addr.lat, addr.lng);
            }
          }
        }
      } catch (err) {
        console.error("Error loading user info:", err);
      }
    };
    fetchUserInfo();
  }, [currentUser]);

  // 📍 Handle map click to set location
  const LocationPicker = () => {
    useMapEvents({
      click(e) {
        setLat(e.latlng.lat);
        setLng(e.latlng.lng);
        calculateDistance(e.latlng.lat, e.latlng.lng);
      },
    });
    return <Marker position={[lat, lng]} />;
  };

  // 🧮 Calculate distance using Haversine formula
  const calculateDistance = (lat2: number, lng2: number) => {
    const R = 6371; // km
    const dLat = ((lat2 - storeLocation.lat) * Math.PI) / 180;
    const dLng = ((lng2 - storeLocation.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((storeLocation.lat * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    setDistanceKm(distance);
    setShippingCost(Math.round(distance * 12));
  };

  // 💾 Place order
  const handlePlaceOrder = async () => {
    try {
      if (!currentUser) throw new Error("No user logged in");
      if (!cartItems.length) throw new Error("Cart is empty");
      if (!name || !street || !city || !province)
        throw new Error("Please complete your address");

      setIsPlacing(true);
      setError(null);

      const fullAddress = { street, barangay, city, province, postalCode, lat, lng };

      const userRef = doc(db, "users", currentUser.uid);
      await setDoc(
        userRef,
        { name, address: fullAddress, email: currentUser.email },
        { merge: true }
      );

      const totalItems = cartItems.reduce(
        (sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1),
        0
      );

      const orderData = {
        userId: currentUser.uid,
        name,
        address: fullAddress,
        email: currentUser.email,
        items: cartItems,
        total: totalItems + shippingCost,
        shippingCost,
        distanceKm,
        status: "Placed",
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, "orders"), orderData);
      clearCart();
      setOrderPlaced(true);
    } catch (error: any) {
      console.error("❌ Error placing order:", error);
      setError(error.message || "Failed to place order. Please try again.");
    } finally {
      setIsPlacing(false);
    }
  };

  const totalPrice = cartItems.reduce(
    (sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1),
    0
  );

  if (orderPlaced) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-green-50 px-6">
        <div className="bg-white shadow-lg rounded-2xl p-10 max-w-md text-center border border-green-100">
          <h1 className="text-3xl font-bold text-green-600 mb-4">
            ✅ Order Placed Successfully!
          </h1>
          <p className="text-gray-600 mb-8">
            Thank you for your purchase! We’ll process your order shortly.
          </p>
          <button
            onClick={() => (setView ? setView("products") : window.location.reload())}
            className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition"
          >
            Go Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-blue-50 to-white px-4 py-12">
      <div className="w-full max-w-2xl bg-white shadow-xl rounded-2xl p-8 border border-gray-200">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">Checkout</h2>

        {savedAddress && (
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-4">
            <h3 className="font-semibold text-blue-700 mb-2">Saved Address:</h3>
            <p className="text-gray-700">
              {savedAddress.street}, {savedAddress.barangay}, {savedAddress.city},{" "}
              {savedAddress.province}, {savedAddress.postalCode}
            </p>
          </div>
        )}

        <div className="mb-6">
          <label className="block font-medium text-gray-700 mb-1">Full Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your full name"
            className="w-full border rounded-lg p-2 mb-4"
          />

          <label className="block font-medium text-gray-700 mb-1">Street</label>
          <input
            type="text"
            value={street}
            onChange={(e) => setStreet(e.target.value)}
            placeholder="Street, Building No."
            className="w-full border rounded-lg p-2 mb-3"
          />

          <label className="block font-medium text-gray-700 mb-1">Barangay</label>
          <input
            type="text"
            value={barangay}
            onChange={(e) => setBarangay(e.target.value)}
            placeholder="Barangay"
            className="w-full border rounded-lg p-2 mb-3"
          />

          <label className="block font-medium text-gray-700 mb-1">City / Municipality</label>
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="City or Municipality"
            className="w-full border rounded-lg p-2 mb-3"
          />

          <label className="block font-medium text-gray-700 mb-1">Province</label>
          <input
            type="text"
            value={province}
            onChange={(e) => setProvince(e.target.value)}
            placeholder="Province"
            className="w-full border rounded-lg p-2 mb-3"
          />

          <label className="block font-medium text-gray-700 mb-1">Postal Code</label>
          <input
            type="text"
            value={postalCode}
            onChange={(e) => setPostalCode(e.target.value)}
            placeholder="Postal Code"
            className="w-full border rounded-lg p-2"
          />
        </div>

        {/* 🗺️ Leaflet Map Picker */}
        <div className="mb-6">
          <h3 className="font-semibold text-gray-700 mb-2">
            Select your delivery location on the map:
          </h3>
          <MapContainer
            center={[lat, lng]}
            zoom={13}
            style={{ height: "300px", width: "100%", borderRadius: "10px" }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <LocationPicker />
          </MapContainer>

          {distanceKm > 0 && (
            <p className="text-sm text-gray-600 mt-2">
              📍 Distance: {distanceKm.toFixed(2)} km — Shipping: ₱{shippingCost}
            </p>
          )}
        </div>

        {/* 🛒 Cart Summary */}
        <div className="divide-y divide-gray-200 mb-6">
          {cartItems.map((item) => (
            <div key={item.id} className="flex justify-between items-center py-3">
              <div>
                <p className="font-semibold text-gray-800">{item.name}</p>
                <p className="text-sm text-gray-500">
                  ₱{item.price} × {item.quantity}
                </p>
              </div>
              <p className="font-medium text-gray-700">
                ₱{(item.price * item.quantity).toFixed(2)}
              </p>
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center border-t pt-4">
          <p className="text-xl font-semibold text-gray-800">Total</p>
          <p className="text-2xl font-bold text-blue-600">
            ₱{(totalPrice + shippingCost).toFixed(2)}
          </p>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-100 p-3 rounded-md mt-4">{error}</p>
        )}

        <button
          onClick={handlePlaceOrder}
          disabled={isPlacing}
          className={`mt-8 w-full py-3 text-lg font-semibold rounded-xl shadow-md transition ${
            isPlacing
              ? "bg-blue-300 text-white cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 text-white"
          }`}
        >
          {isPlacing ? "Processing..." : "Place Order"}
        </button>
      </div>
    </div>
  );
};

export default CheckoutView;

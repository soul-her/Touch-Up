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
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface CheckoutViewProps {
  currentUser: any;
  setView?: (view: string) => void;
}

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
  const [phone, setPhone] = useState("");
  const [street, setStreet] = useState("");
  const [barangay, setBarangay] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [savedAddress, setSavedAddress] = useState<any>(null);

  // ⭐ DEFAULT DUMAGUETE LOCATION
  const [lat, setLat] = useState(9.3079);
  const [lng, setLng] = useState(123.3054);

  const [distanceKm, setDistanceKm] = useState(0);
  const [shippingCost, setShippingCost] = useState(0);

  // Store location in Dumaguete
  const storeLocation = { lat: 9.3079, lng: 123.3081 };

  // Load existing user info
  useEffect(() => {
    const loadUser = async () => {
      if (!currentUser) return;

      try {
        const userRef = doc(db, "users", currentUser.uid);
        const snap = await getDoc(userRef);

        if (snap.exists()) {
          const u = snap.data();
          setName(u.name || "");
          setPhone(u.phone || "");

          if (u.address) {
            const a = u.address;
            setSavedAddress(a);
            setStreet(a.street || "");
            setBarangay(a.barangay || "");
            setCity(a.city || "");
            setProvince(a.province || "");
            setPostalCode(a.postalCode || "");

            if (a.lat && a.lng) {
              setLat(a.lat);
              setLng(a.lng);
              calculateDistance(a.lat, a.lng);
            }
          }
        }
      } catch {
        console.log("Error loading user");
      }
    };

    loadUser();
  }, [currentUser]);

  // Map click handler
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

  // Distance (Haversine formula)
  const calculateDistance = (lat2: number, lng2: number) => {
    const R = 6371;
    const dLat = ((lat2 - storeLocation.lat) * Math.PI) / 180;
    const dLng = ((lng2 - storeLocation.lng) * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(storeLocation.lat * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLng / 2) ** 2;

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const distance = R * c;
    setDistanceKm(distance);
    setShippingCost(Math.round(distance * 12));
  };

  // PH number validation
  const isValidPhone = (num: string) => /^09\d{9}$/.test(num);

  // Place order
  const handlePlaceOrder = async () => {
    try {
      if (!currentUser) throw new Error("No user logged in");
      if (!cartItems.length) throw new Error("Cart is empty");

      if (!name || !street || !city || !province)
        throw new Error("Please complete your address");

      if (!isValidPhone(phone))
        throw new Error("Invalid phone format. Must be 11 digits and start with 09");

      setIsPlacing(true);
      setError(null);

      const fullAddress = {
        street,
        barangay,
        city,
        province,
        postalCode,
        lat,
        lng,
      };

      await setDoc(
        doc(db, "users", currentUser.uid),
        { name, phone, address: fullAddress },
        { merge: true }
      );

      const totalItems = cartItems.reduce(
        (sum, item) =>
          sum +
          (Number(item.price) || 0) * (Number(item.quantity) || 1),
        0
      );

      const now = new Date();
      const orderDate = now.toLocaleDateString();
      const orderTime = now.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });

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

      await addDoc(collection(db, "orders"), orderData);

      clearCart();
      setOrderPlaced(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsPlacing(false);
    }
  };

  const totalPrice = cartItems.reduce(
    (sum, item) =>
      sum +
      (Number(item.price) || 0) * (Number(item.quantity) || 1),
    0
  );

  if (orderPlaced) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-3xl font-bold text-green-600">
          Order Placed Successfully!
        </h1>
        <button
          onClick={() =>
            setView ? setView("products") : window.location.reload()
          }
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Checkout</h2>

      {error && <p className="text-red-600 mb-2">{error}</p>}

      <div className="mb-6">
        <label>Full Name</label>
        <input
          className="w-full border p-2 rounded"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <label className="mt-4 block">Phone Number</label>
        <input
          className="w-full border p-2 rounded"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="09xxxxxxxxx"
          maxLength={11}
        />

        <label className="mt-4 block">Street</label>
        <input
          className="w-full border p-2 rounded"
          value={street}
          onChange={(e) => setStreet(e.target.value)}
        />

        <label className="mt-4 block">Barangay</label>
        <input
          className="w-full border p-2 rounded"
          value={barangay}
          onChange={(e) => setBarangay(e.target.value)}
        />

        <label className="mt-4 block">City</label>
        <input
          className="w-full border p-2 rounded"
          value={city}
          onChange={(e) => setCity(e.target.value)}
        />

        <label className="mt-4 block">Province</label>
        <input
          className="w-full border p-2 rounded"
          value={province}
          onChange={(e) => setProvince(e.target.value)}
        />

        <label className="mt-4 block">Postal Code</label>
        <input
          className="w-full border p-2 rounded"
          value={postalCode}
          onChange={(e) => setPostalCode(e.target.value)}
        />
      </div>

      {/* ⭐ MAP DEFAULTS TO DUMAGUETE */}
      <MapContainer
        center={[lat, lng]}
        zoom={13}
        style={{ height: "300px", width: "100%" }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <LocationPicker />
      </MapContainer>

      <p className="mt-2 text-gray-600">
        Distance: {distanceKm.toFixed(2)} km — Shipping: ₱{shippingCost}
      </p>

      <button
        onClick={handlePlaceOrder}
        disabled={isPlacing}
        className="w-full mt-6 bg-blue-600 text-white py-3 rounded-lg"
      >
        {isPlacing ? "Placing Order..." : "Place Order"}
      </button>
    </div>
  );
};

export default CheckoutView;

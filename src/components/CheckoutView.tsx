import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, addDoc, serverTimestamp, doc, getDoc, setDoc } from "firebase/firestore";
import { useCart } from "./context/CartContext";

const CheckoutView: React.FC<{ currentUser: any; setView?: (view: string) => void }> = ({
  currentUser,
  setView,
}) => {
  const { cartItems, clearCart } = useCart();
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [isPlacing, setIsPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");

  // 🧠 Load saved user info (name + address)
  useEffect(() => {
    const fetchUserInfo = async () => {
      if (!currentUser) return;
      try {
        const userRef = doc(db, "users", currentUser.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data();
          setName(userData.name || "");
          setAddress(userData.address || "");
        }
      } catch (err) {
        console.error("Error loading user info:", err);
      }
    };
    fetchUserInfo();
  }, [currentUser]);

  const handlePlaceOrder = async () => {
    try {
      if (!currentUser) throw new Error("No user logged in");
      if (!cartItems.length) throw new Error("Cart is empty");
      if (!name || !address) throw new Error("Please fill in your name and address");

      setIsPlacing(true);
      setError(null);

      // ✅ Save name and address for future checkouts
      const userRef = doc(db, "users", currentUser.uid);
      await setDoc(userRef, { name, address, email: currentUser.email }, { merge: true });

      // 🧩 Safely construct order data
      const orderData = {
        userId: currentUser.uid,
        name,
        address,
        email: currentUser.email,
        items: cartItems.map((item) => ({
          id: item.id || "no-id",
          name: item.name || "Unnamed Product",
          price: Number(item.price) || 0,
          quantity: Number(item.quantity) || 1,
        })),
        total: cartItems.reduce(
          (sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1),
          0
        ),
        status: "Placed",
        createdAt: serverTimestamp(),
      };

      console.log("🧾 Sending order to Firestore:", JSON.stringify(orderData, null, 2));

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

  // ✅ Success message
  if (orderPlaced) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-green-50 to-white px-6">
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

  // 🛒 Checkout form
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-blue-50 to-white px-4 py-12">
      <div className="w-full max-w-2xl bg-white shadow-xl rounded-2xl p-8 border border-gray-200">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">Checkout</h2>

        {cartItems.length === 0 ? (
          <p className="text-gray-600 text-center">
            🛒 Your cart is empty. Add some items before checking out.
          </p>
        ) : (
          <>
            {/* 🧍 User Info */}
            <div className="mb-6">
              <label className="block font-medium text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full border rounded-lg p-2 mb-3"
              />

              <label className="block font-medium text-gray-700 mb-1">Address</label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Enter your delivery address"
                className="w-full border rounded-lg p-2 h-24"
              />
            </div>

            {/* 🧺 Cart Items */}
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

            {/* 💰 Total */}
            <div className="flex justify-between items-center border-t pt-4">
              <p className="text-xl font-semibold text-gray-800">Total</p>
              <p className="text-2xl font-bold text-blue-600">
                ₱{totalPrice.toFixed(2)}
              </p>
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-100 p-3 rounded-md mt-4">
                {error}
              </p>
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
          </>
        )}
      </div>
    </div>
  );
};

export default CheckoutView;

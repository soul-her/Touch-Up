import React, { useState } from "react";
import { db } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useCart } from "./context/CartContext";

const CheckoutView: React.FC<{ currentUser: any; setView?: (view: string) => void }> = ({
  currentUser,
  setView,
}) => {
  const { cartItems, clearCart } = useCart();
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [isPlacing, setIsPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePlaceOrder = async () => {
    try {
      if (!currentUser) throw new Error("No user logged in");
      setIsPlacing(true);
      setError(null);

      const orderData = {
        userId: currentUser.uid,
        email: currentUser.email,
        items: cartItems.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
        total: cartItems.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        ),
        status: "pending",
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, "orders"), orderData);
      clearCart();
      setOrderPlaced(true);
    } catch (error) {
      console.error("Error placing order:", error);
      setError("Failed to place order. Please try again.");
    } finally {
      setIsPlacing(false);
    }
  };

  const totalPrice = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  // ✅ Success message screen
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

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-blue-50 to-white px-4 py-12">
      <div className="w-full max-w-2xl bg-white shadow-xl rounded-2xl p-8 border border-gray-200">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">
          Checkout
        </h2>

        {cartItems.length === 0 ? (
          <p className="text-gray-600 text-center">
            🛒 Your cart is empty. Add some items before checking out.
          </p>
        ) : (
          <>
            <div className="divide-y divide-gray-200 mb-6">
              {cartItems.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between items-center py-3"
                >
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

import React, { useState } from "react";
import { useCart } from "./context/CartContext";
import { db } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

interface CheckoutViewProps {
  setView: (view: string) => void;
  currentUser: { uid: string; email?: string } | null;
}

const CheckoutView: React.FC<CheckoutViewProps> = ({ setView, currentUser }) => {
  const { cartItems, getCartTotal, clearCart } = useCart();
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subtotal = getCartTotal();
  const tax = subtotal * 0.08;
  const total = subtotal + tax;

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser) {
      setError("You must be logged in to place an order.");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      await addDoc(collection(db, "orders"), {
        userId: currentUser.uid,
        email: currentUser.email || "",
        items: cartItems,
        total,
        paymentMethod: "Cash on Delivery",
        status: "Pending",
        createdAt: serverTimestamp(),
      });

      clearCart();
      setOrderPlaced(true);
    } catch (err) {
      console.error("Error saving order:", err);
      setError("Failed to place order. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (orderPlaced) {
    return (
      <div className="text-center py-20">
        <h1 className="text-3xl font-bold mb-4 text-green-600">
          Order Placed Successfully!
        </h1>
        <p className="text-gray-600 mb-6">
          Thank you! Please prepare the exact amount for Cash on Delivery.
        </p>
        <button
          onClick={() => setView("products")}
          className="bg-blue-500 text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-600 transition"
        >
          Back to Products
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-xl">
      <h1 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-3">Checkout</h1>
      <form onSubmit={handlePlaceOrder} className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-2">Payment Method</h2>
          <p className="bg-gray-100 p-3 rounded-md text-gray-700">
            💵 Cash on Delivery — Please prepare the exact amount.
          </p>
        </div>

        {error && <p className="text-sm text-red-600 bg-red-100 p-3 rounded-md">{error}</p>}

        <button
          type="submit"
          disabled={isProcessing}
          className="w-full bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 transition disabled:bg-blue-300"
        >
          {isProcessing ? "Placing Order..." : `Place Order - $${total.toFixed(2)}`}
        </button>
      </form>
    </div>
  );
};

export default CheckoutView;

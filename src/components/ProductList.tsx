import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import { useCart } from "./context/CartContext";
import SchedulePickupForm from "./SchedulePickupForm";
import type { DBUser, ShippingAddress, View } from "../types";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  image?: string;
}

interface ProductListProps {
  currentUser: DBUser | null;
  setView: (view: View) => void;
  onSchedule: (details: {
    date: string;
    time: string;
    address: ShippingAddress;
  }) => void;
}

const ProductList: React.FC<ProductListProps> = ({
  currentUser,
  setView,
  onSchedule,
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const { addToCart } = useCart();

  // 🔹 Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      const querySnapshot = await getDocs(collection(db, "products"));
      const productList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Product[];
      setProducts(productList);
    };
    fetchProducts();
  }, []);

  // 🔹 Add to cart
  const handleAddToCart = (product: Product) => {
    if (product.stock <= 0) {
      alert("❌ This product is out of stock!");
      return;
    }

    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image || "",
      quantity: 1,
    });

    alert(`🛒 Added "${product.name}" to cart!`);
  };

  return (
    <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl shadow-lg max-w-7xl mx-auto">
      {/* 🔹 Hero Section */}
      <section className="relative text-center text-white p-12 md:p-20 rounded-2xl mb-16 overflow-hidden">
        <div
          className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1530539943805-ce9242b6a22f?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center"
          aria-hidden="true"
        ></div>
        <div
          className="absolute inset-0 bg-blue-900/60 rounded-2xl"
          aria-hidden="true"
        ></div>
        <div className="relative z-10">
          <h1 className="text-4xl md:text-6xl font-extrabold mb-4">
            Pure Water Delivered
          </h1>
          <p className="text-lg md:text-xl text-blue-100 max-w-2xl mx-auto">
            Seamless water delivery for a healthy and hydrated life.
          </p>
        </div>
      </section>

      {/* 🔹 Product Grid */}
      <h2 className="text-3xl font-bold mb-10 text-gray-800 text-center">
        Our Products
      </h2>

      {products.length === 0 ? (
        <p className="text-center text-gray-500">No products available yet.</p>
      ) : (
        <div className="flex justify-center">
          {/* 🧭 Responsive Manual Spacing */}
          <div
            className="
              grid 
              grid-cols-1 sm:grid-cols-2 md:grid-cols-3 
              gap-10 
              place-items-center 
              justify-center 
              max-w-6xl 
              px-6
            "
            style={{
              justifyContent: "center",
              paddingLeft: window.innerWidth >= 1024 ? "300px" : "0px", // 👈 dynamic spacing
              transition: "padding 0.3s ease-in-out",
            }}
          >
            {products.map((product) => (
              <div
                key={product.id}
                className="bg-white/60 backdrop-blur-lg rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 p-4 flex flex-col justify-between border border-gray-200 w-72 text-center"
              >
                {product.image ? (
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-48 object-cover rounded-xl mb-3"
                  />
                ) : (
                  <div className="w-full h-48 bg-gray-200 rounded-xl flex items-center justify-center text-gray-400">
                    No Image
                  </div>
                )}

                <div className="flex-grow">
                  <h3 className="text-lg font-semibold mb-1">{product.name}</h3>
                  <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                    {product.description || "No description available."}
                  </p>
                  <p className="text-blue-700 font-bold mb-1">
                    ₱{product.price}
                  </p>
                  <p
                    className={`text-sm ${
                      product.stock > 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {product.stock > 0
                      ? `${product.stock} in stock`
                      : "Out of stock"}
                  </p>
                </div>

                <div className="mt-4 space-y-2">
                  <button
                    onClick={() => handleAddToCart(product)}
                    disabled={product.stock <= 0}
                    className={`w-full py-2 rounded-lg text-white font-medium transition ${
                      product.stock <= 0
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-700"
                    }`}
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 🔹 Transparent Schedule Pickup Form */}
      <section className="mt-20">
        <div className="bg-white/40 backdrop-blur-md p-6 rounded-2xl shadow-lg max-w-2xl mx-auto border border-white/50">
          <SchedulePickupForm
            onSchedule={onSchedule}
            currentUser={currentUser}
            setView={setView}
          />
        </div>
      </section>
    </div>
  );
};

export default ProductList;

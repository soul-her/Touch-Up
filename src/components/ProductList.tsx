import React, { useEffect, useMemo, useState } from "react";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import { useCart } from "./context/CartContext";
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
  onSchedule: (details: { date: string; time: string; address: ShippingAddress }) => void;
}

function formatPHP(price: number) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 2,
  }).format(price);
}

function stockLabel(stock: number) {
  if (stock <= 0) return "Out of stock";
  if (stock <= 5) return `Low stock • ${stock}`;
  return `In stock • ${stock}`;
}

function stockBadgeClass(stock: number) {
  if (stock <= 0) return "bg-red-500/15 text-red-200 border-red-500/25";
  if (stock <= 5) return "bg-amber-500/15 text-amber-200 border-amber-500/25";
  return "bg-emerald-500/15 text-emerald-200 border-emerald-500/25";
}

const ProductList: React.FC<ProductListProps> = ({ currentUser, setView, onSchedule }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState("");
  const [toast, setToast] = useState<string>("");
  const [toastType, setToastType] = useState<"ok" | "bad">("ok");

  const { addToCart } = useCart();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setErrMsg("");

        const snap = await getDocs(collection(db, "products"));
        const productList = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Product[];

        productList.sort((a, b) => {
          const aOut = (a.stock ?? 0) <= 0 ? 1 : 0;
          const bOut = (b.stock ?? 0) <= 0 ? 1 : 0;
          if (aOut !== bOut) return aOut - bOut;
          return (a.price ?? 0) - (b.price ?? 0);
        });

        setProducts(productList);
      } catch (e: any) {
        console.error("Fetch products error:", e);
        setErrMsg(e?.message || "Failed to load products.");
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const showToast = (msg: string, type: "ok" | "bad" = "ok") => {
    setToastType(type);
    setToast(msg);
    window.setTimeout(() => setToast(""), 1600);
  };

  const handleAddToCart = (product: Product) => {
    if ((product.stock ?? 0) <= 0) {
      showToast("Out of stock", "bad");
      return;
    }

    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image || "",
      quantity: 1,
    });

    showToast(`Added • ${product.name}`, "ok");
  };

  const gridCols = useMemo(() => {
    if (products.length <= 1) return "grid-cols-1";
    if (products.length === 2) return "grid-cols-1 sm:grid-cols-2";
    return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";
  }, [products.length]);

  return (
    <div className="max-w-7xl mx-auto px-5 sm:px-6 pb-16 text-white">
      {/* Toast */}
      {toast ? (
        <div
          className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl shadow-lg text-sm border backdrop-blur ${
            toastType === "ok"
              ? "bg-emerald-500/80 text-white border-emerald-400/20"
              : "bg-red-500/80 text-white border-red-400/20"
          }`}
          role="status"
          aria-live="polite"
        >
          {toast}
        </div>
      ) : null}

      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl mt-6 mb-10 border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_30px_80px_-50px_rgba(0,0,0,0.85)]">
        <div
          className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1530539943805-ce9242b6a22f?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-35"
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950/80 via-blue-950/55 to-slate-950/70" />

        <div className="relative px-7 py-10 md:px-12 md:py-14">
          <p className="inline-flex items-center gap-2 text-xs font-semibold tracking-wide bg-white/10 border border-white/15 px-3 py-1 rounded-full">
            TOUCH UP • WATER DELIVERY
          </p>

          <h1 className="mt-4 text-3xl md:text-5xl font-extrabold tracking-tight">
            Pure Water Delivered
          </h1>

          <p className="mt-3 text-white/70 max-w-2xl">
            Order water or containers in seconds. We deliver fast — you stay hydrated.
          </p>

          <div className="mt-6 flex flex-wrap gap-2.5">
            {["Fast delivery", "Quality checked", "Easy pickup scheduling"].map((t) => (
              <span
                key={t}
                className="bg-white/10 border border-white/15 rounded-xl px-4 py-2 text-sm text-white/80"
              >
                {t}
              </span>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#products"
              className="px-5 py-2.5 rounded-xl font-semibold bg-white text-slate-900 hover:bg-white/90 transition"
            >
              Browse products
            </a>
            <a
              href="#schedule"
              className="px-5 py-2.5 rounded-xl font-semibold bg-white/10 border border-white/15 hover:bg-white/15 transition"
            >
              Schedule pickup
            </a>
          </div>
        </div>
      </section>

      {/* Products header */}
      <div id="products" className="text-center mb-7">
        <h2 className="text-3xl font-extrabold tracking-tight">Our Products</h2>
        <p className="text-sm text-white/60 mt-2">
          Tap <span className="font-semibold text-white">Add to Cart</span>. Checkout when you’re ready.
        </p>
      </div>

      {/* Loading / Error / Empty */}
      {loading ? (
        <div className="py-10 flex flex-col items-center gap-3 text-white/70">
          <div className="w-10 h-10 rounded-full border-4 border-white/20 border-t-white/70 animate-spin" />
          Loading products…
        </div>
      ) : errMsg ? (
        <div className="text-center text-red-200 py-10 border border-red-500/20 bg-red-500/10 rounded-2xl">
          <p className="font-semibold">Failed to load products</p>
          <p className="text-sm mt-1">{errMsg}</p>
        </div>
      ) : products.length === 0 ? (
        <p className="text-center text-white/60 py-10">No products available yet.</p>
      ) : (
        <div className="flex justify-center">
          <div className={`grid ${gridCols} gap-6 md:gap-8`}>
            {products.map((product) => {
              const out = product.stock <= 0;

              return (
                <div
                  key={product.id}
                  className="w-[330px] overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_20px_60px_-35px_rgba(0,0,0,0.8)] hover:bg-white/7 transition"
                >
                  {/* Image */}
                  <div className="relative overflow-hidden">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-56 object-cover transition-transform duration-300 hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-56 bg-white/5 flex items-center justify-center text-white/40">
                        No Image
                      </div>
                    )}

                    {/* Stock badge */}
                    <span
                      className={`absolute top-3 right-3 text-xs font-semibold px-2.5 py-1 rounded-full border ${stockBadgeClass(
                        product.stock
                      )}`}
                    >
                      {stockLabel(product.stock)}
                    </span>

                    {/* Gradient overlay for readability */}
                    <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-slate-950/70 to-transparent" />
                  </div>

                  {/* Body */}
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-lg font-bold text-white leading-snug">
                        {product.name}
                      </h3>
                      <span className="text-base font-extrabold text-white whitespace-nowrap">
                        {formatPHP(product.price)}
                      </span>
                    </div>

                    <p className="text-white/70 text-sm mt-1 line-clamp-2">
                      {product.description || "No description available."}
                    </p>

                    <div className="mt-5 flex items-center gap-3">
                      <button
                        onClick={() => handleAddToCart(product)}
                        disabled={out}
                        className={`flex-1 py-2.5 rounded-xl text-white font-semibold transition border shadow-sm ${
                          out
                            ? "bg-white/10 border-white/10 opacity-60 cursor-not-allowed"
                            : "bg-blue-500/80 border-blue-400/20 hover:bg-blue-500"
                        }`}
                      >
                        {out ? "Out of stock" : "Add to Cart"}
                      </button>

                      <button
                        onClick={() => setView("cart")}
                        className="px-4 py-2.5 rounded-xl font-semibold border border-white/15 text-white/90 hover:bg-white/10 transition"
                        title="Go to cart"
                      >
                        View Cart
                      </button>
                    </div>

                    <p className="mt-3 text-xs text-white/55">
                      {out ? "Restocking soon." : "Delivered to your doorstep."}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* CTA */}
      <div className="mt-10">
        <button
          onClick={() => setView("profile")}
          className="w-full rounded-2xl bg-blue-500/80 hover:bg-blue-500 border border-blue-400/20 text-white py-3 font-semibold transition shadow-[0_18px_50px_-30px_rgba(0,0,0,0.8)]"
        >
          Go to My Orders to Schedule Pickup
        </button>
      </div>
    </div>
  );
};

export default ProductList;

import React, { useEffect, useMemo, useState } from "react";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import { useCart } from "./context/CartContext";
import CustomerReviewsSummary from "./CustomerReviewsSummary";
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
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white pb-20">
      {/* Toast */}
      {toast ? (
        <div
          className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-xl shadow-lg text-sm border backdrop-blur font-medium ${
            toastType === "ok"
              ? "bg-emerald-500/90 text-white border-emerald-400/30"
              : "bg-red-500/90 text-white border-red-400/30"
          }`}
          role="status"
          aria-live="polite"
        >
          {toast}
        </div>
      ) : null}

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-24 px-5 sm:px-6">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl opacity-30 animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl opacity-30 animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <div className="relative max-w-6xl mx-auto">
          {/* Main Hero */}
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 text-xs font-bold tracking-widest bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent mb-6 uppercase">
              ✨ Premium Water Delivery Service
            </div>

            <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6 leading-tight">
              Stay <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-400 bg-clip-text text-transparent">Hydrated</span>
              <br />
              Every Day
            </h1>

            <p className="text-base md:text-xl text-white/70 max-w-3xl mx-auto mb-10 leading-relaxed">
              Fresh, pure water delivered directly to your doorstep. Fast shipping, premium quality, and hassle-free scheduling. Your hydration is our priority.
            </p>

            <div className="flex flex-wrap justify-center gap-3 sm:gap-4 mb-16">
              <a
                href="#products"
                className="px-6 sm:px-8 py-2.5 sm:py-3.5 text-sm sm:text-base bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold rounded-xl hover:shadow-[0_20px_50px_-20px_rgba(59,130,246,0.5)] transition-all hover:scale-105 transform"
              >
                Shop Now
              </a>
              <button
                onClick={() => setView("profile")}
                className="px-6 sm:px-8 py-2.5 sm:py-3.5 text-sm sm:text-base bg-white/10 border border-white/20 text-white font-bold rounded-xl hover:bg-white/15 transition-all"
              >
                Schedule Pickup
              </button>
            </div>

            {/* Benefits Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 max-w-4xl mx-auto">
              {[
                { icon: "🚚", label: "Fast Delivery", desc: "24-48 hour delivery nationwide" },
                { icon: "✓", label: "Quality Assured", desc: "Premium filtered water" },
                { icon: "📅", label: "Easy Scheduling", desc: "Book pickups instantly online" },
              ].map((benefit, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition"
                >
                  <div className="text-3xl mb-3">{benefit.icon}</div>
                  <p className="font-bold text-white text-sm">{benefit.label}</p>
                  <p className="text-xs text-white/60 mt-2">{benefit.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section className="relative py-20 px-5 sm:px-6">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div id="products" className="text-center mb-16">
            <div className="inline-block mb-4 px-4 py-2 bg-blue-500/20 border border-blue-500/30 rounded-full">
              <span className="text-blue-300 text-sm font-bold">OUR COLLECTION</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
              Premium Water Products
            </h2>
            <p className="text-white/60 text-lg max-w-2xl mx-auto">
              Choose from our selection of pure, filtered water delivered to your home or office
            </p>
          </div>

          {/* Loading / Error / Empty */}
          {loading ? (
            <div className="py-20 flex flex-col items-center gap-4 text-white/70">
              <div className="w-12 h-12 rounded-full border-4 border-white/20 border-t-white/70 animate-spin" />
              <p className="text-lg">Loading products…</p>
            </div>
          ) : errMsg ? (
            <div className="text-center text-red-200 py-16 border border-red-500/20 bg-red-500/10 rounded-2xl">
              <p className="font-semibold text-lg">Failed to load products</p>
              <p className="text-sm mt-2 text-red-200/80">{errMsg}</p>
            </div>
          ) : products.length === 0 ? (
            <p className="text-center text-white/60 py-20 text-lg">No products available yet.</p>
          ) : (
            <div className="flex justify-center">
              <div className={`grid ${gridCols} gap-6 md:gap-8 w-full`}>
                {products.map((product) => {
                  const out = product.stock <= 0;

                  return (
                    <div
                      key={product.id}
                      className="group overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl shadow-[0_20px_60px_-35px_rgba(0,0,0,0.8)] hover:border-white/30 hover:bg-white/10 transition-all duration-300 hover:shadow-[0_25px_70px_-30px_rgba(59,130,246,0.3)]"
                    >
                      {/* Image Container */}
                      <div className="relative overflow-hidden h-56 bg-gradient-to-b from-white/10 to-transparent">
                        {product.image ? (
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center text-white/40 group-hover:text-white/60 transition">
                            <span className="text-5xl">💧</span>
                          </div>
                        )}

                        {/* Stock badge */}
                        <span
                          className={`absolute top-3 right-3 text-xs font-bold px-3 py-1.5 rounded-full border backdrop-blur ${stockBadgeClass(
                            product.stock
                          )}`}
                        >
                          {stockLabel(product.stock)}
                        </span>

                        {/* Overlay gradient */}
                        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-950/80 to-transparent" />
                      </div>

                      {/* Body */}
                      <div className="p-5 space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="text-lg font-bold text-white leading-snug">
                            {product.name}
                          </h3>
                          <span className="text-base font-extrabold text-cyan-400 whitespace-nowrap">
                            {formatPHP(product.price)}
                          </span>
                        </div>

                        <p className="text-white/70 text-sm line-clamp-2 leading-relaxed">
                          {product.description || "Pure, filtered water for your daily hydration needs."}
                        </p>

                        <div className="pt-2 space-y-3">
                          <button
                            onClick={() => handleAddToCart(product)}
                            disabled={out}
                            className={`w-full py-2.5 rounded-lg text-white font-bold transition-all duration-200 border ${
                              out
                                ? "bg-white/5 border-white/10 opacity-50 cursor-not-allowed"
                                : "bg-gradient-to-r from-blue-500 to-cyan-500 border-cyan-400/30 hover:shadow-[0_10px_30px_-15px_rgba(59,130,246,0.5)] hover:scale-105 transform"
                            }`}
                          >
                            {out ? "Out of stock" : "Add to Cart"}
                          </button>

                          <button
                            onClick={() => setView("cart")}
                            className="w-full px-4 py-2 rounded-lg font-semibold border border-white/15 text-white/90 hover:bg-white/10 hover:border-white/30 transition-all"
                            title="Go to cart"
                          >
                            View Cart
                          </button>
                        </div>

                        <p className="text-xs text-white/50 text-center pt-1">
                          {out ? "Coming soon" : "👍 Free delivery available"}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-16 px-5 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-3xl md:text-4xl font-black mb-4">Ready to Order?</h3>
          <p className="text-white/60 text-lg mb-8">
            View your orders and schedule a pickup time that works for you
          </p>
          <button
            onClick={() => setView("profile")}
            className="inline-flex px-10 py-3.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold rounded-xl hover:shadow-[0_20px_50px_-20px_rgba(59,130,246,0.5)] transition-all hover:scale-105 transform"
          >
            Go to My Orders
          </button>
        </div>
      </section>

      {/* Reviews Summary */}
      <section className="px-5 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <CustomerReviewsSummary />
        </div>
      </section>
    </div>
  );
};

export default ProductList;

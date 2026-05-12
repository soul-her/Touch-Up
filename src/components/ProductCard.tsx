import React, { useMemo, useState } from "react";
import { useCart } from "../components/context/CartContext";
import type { Product } from "../types";
import { iconMap } from "../components/icons/iconMap";

interface ProductCardProps {
  product: Product;
}

function formatPHP(price: number) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 2,
  }).format(price);
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart } = useCart();

  const [isAdded, setIsAdded] = useState(false);
  const [isBusy, setIsBusy] = useState(false);

  const IconComponent = useMemo(
    () => iconMap[product.iconName] || iconMap["DefaultIcon"],
    [product.iconName]
  );

  const badge = useMemo(() => {
    if (product.productType === "service") {
      return {
        text: "Service",
        className:
          "bg-emerald-500/15 text-emerald-200 border-emerald-500/25",
      };
    }
    if (typeof product.stock === "number") {
      if (product.stock <= 0)
        return {
          text: "Out of stock",
          className: "bg-red-500/15 text-red-200 border-red-500/25",
        };
      if (product.stock <= 5)
        return {
          text: `Low stock (${product.stock})`,
          className: "bg-amber-500/15 text-amber-200 border-amber-500/25",
        };
      return {
        text: `In stock (${product.stock})`,
        className: "bg-sky-500/15 text-sky-200 border-sky-500/25",
      };
    }
    return {
      text: "Available",
      className: "bg-white/10 text-white/80 border-white/15",
    };
  }, [product.productType, product.stock]);

  const iconBgClass = useMemo(() => {
    const byName: Record<string, string> = {
      "Water Refill": "bg-sky-500/15 border-sky-400/20",
      "New Gallon": "bg-white/10 border-white/15",
      "Empty Container Pickup": "bg-emerald-500/15 border-emerald-400/20",
    };
    return (
      byName[product.name] ||
      (product.productType === "service"
        ? "bg-emerald-500/15 border-emerald-400/20"
        : "bg-white/10 border-white/15")
    );
  }, [product.name, product.productType]);

  const canAddToCart =
    product.productType !== "service" &&
    (typeof product.stock !== "number" || product.stock > 0);

  const handleAddToCart = async () => {
    if (!canAddToCart || isBusy) return;

    try {
      setIsBusy(true);
      addToCart(product);
      setIsAdded(true);
      window.setTimeout(() => setIsAdded(false), 1200);
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_20px_60px_-35px_rgba(0,0,0,0.8)] transition-all transform hover:scale-105 hover:-translate-y-1 hover:bg-white/7 hover:shadow-[0_25px_75px_-25px_rgba(0,0,0,1)]">
      {/* subtle glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 -right-24 h-48 w-48 rounded-full bg-blue-500/15 blur-3xl opacity-0 transition group-hover:opacity-100"
      />

      <div className="p-5 flex flex-col h-full">
        {/* Top row */}
        <div className="flex items-start justify-between gap-3">
          <div
            className={`flex h-14 w-14 items-center justify-center rounded-2xl border transition-transform transform group-hover:scale-110 group-hover:rotate-6 ${iconBgClass}`}
          >
            <IconComponent />
          </div>

          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${badge.className}`}
            title={badge.text}
          >
            {badge.text}
          </span>
        </div>

        {/* Name */}
        <h3 className="mt-4 text-lg font-bold text-white leading-snug line-clamp-2">
          {product.name}
        </h3>

        {/* Description */}
        <p className="mt-2 text-sm text-white/70 leading-relaxed line-clamp-3 min-h-[3.75rem]">
          {product.description}
        </p>

        {/* Price + action */}
        <div className="mt-auto pt-5 border-t border-white/10">
          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-col">
              <span className="text-xs text-white/60">Price</span>
              <span className="text-lg font-extrabold text-white">
                {formatPHP(product.price)}
              </span>
            </div>

            {product.productType === "service" ? (
              <span className="px-4 py-2 rounded-xl font-semibold text-white bg-emerald-500/80 border border-emerald-400/20 select-none">
                Schedule below
              </span>
            ) : (
              <button
                onClick={handleAddToCart}
                disabled={!canAddToCart || isBusy}
                className={`px-4 py-2 rounded-xl font-semibold text-white transition transform hover:scale-105 shadow-sm border ${
                  !canAddToCart
                    ? "bg-white/10 border-white/10 opacity-60 cursor-not-allowed"
                    : isAdded
                    ? "bg-emerald-500/80 border-emerald-400/20 hover:bg-emerald-500"
                    : "bg-blue-500/80 border-blue-400/20 hover:bg-blue-500"
                }`}
                aria-label={`Add ${product.name} to cart`}
              >
                {typeof product.stock === "number" && product.stock <= 0
                  ? "Out of stock"
                  : isBusy
                  ? "Adding…"
                  : isAdded
                  ? "Added!"
                  : "Add"}
              </button>
            )}
          </div>

          {product.productType === "service" ? (
            <p className="mt-3 text-xs text-white/55">
              This is a service item — choose your schedule in the form below.
            </p>
          ) : (
            <p className="mt-3 text-xs text-white/55">
              Delivered to your doorstep.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;

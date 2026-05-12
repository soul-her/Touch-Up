import React, { useEffect, useMemo, useState } from "react";
import { collection, query, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase";
import { Star } from "lucide-react";

interface Review {
  id: string;
  orderId: string;
  userId: string;
  customerName?: string;
  rating: number;
  comment: string;
  categories?: {
    productQuality?: number;
    deliverySpeed?: number;
    driverBehavior?: number;
    overallExperience?: number;
  };
  createdAt: any;
}

const ManagerReviews: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [error, setError] = useState<string>("");
  const [sortBy, setSortBy] = useState<"newest" | "highest" | "lowest">("newest");

  // Fetch reviews
  useEffect(() => {
    const q = query(collection(db, "reviews"));

    const unsub = onSnapshot(
      q,
      (snap) => {
        const fetchedReviews = snap.docs
          .map((d) => ({
            id: d.id,
            ...(d.data() as Review),
          }))
          .sort((a, b) => {
            const aTime = a.createdAt?.toMillis?.() || 0;
            const bTime = b.createdAt?.toMillis?.() || 0;
            return bTime - aTime;
          });
        setReviews(fetchedReviews);
      },
      (err) => {
        console.error(err);
        setError("Failed to load reviews.");
      }
    );

    return () => unsub();
  }, []);

  // Analytics calculations
  const analytics = useMemo(() => {
    if (reviews.length === 0)
      return {
        totalReviews: 0,
        averageRating: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        categoryAverages: {
          productQuality: 0,
          deliverySpeed: 0,
          driverBehavior: 0,
        },
      };

    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let totalRating = 0;
    let productQualitySum = 0;
    let deliverySpeedSum = 0;
    let driverBehaviorSum = 0;
    let categoryCount = 0;

    reviews.forEach((review) => {
      totalRating += review.rating;
      ratingDistribution[review.rating as keyof typeof ratingDistribution]++;

      if (review.categories?.productQuality) {
        productQualitySum += review.categories.productQuality;
        categoryCount++;
      }
      if (review.categories?.deliverySpeed) {
        deliverySpeedSum += review.categories.deliverySpeed;
        categoryCount++;
      }
      if (review.categories?.driverBehavior) {
        driverBehaviorSum += review.categories.driverBehavior;
        categoryCount++;
      }
    });

    return {
      totalReviews: reviews.length,
      averageRating: (totalRating / reviews.length).toFixed(1),
      ratingDistribution,
      categoryAverages: {
        productQuality: categoryCount > 0 ? (productQualitySum / reviews.length).toFixed(1) : 0,
        deliverySpeed: categoryCount > 0 ? (deliverySpeedSum / reviews.length).toFixed(1) : 0,
        driverBehavior: categoryCount > 0 ? (driverBehaviorSum / reviews.length).toFixed(1) : 0,
      },
    };
  }, [reviews]);

  // Sort reviews
  const sortedReviews = useMemo(() => {
    const arr = [...reviews];
    if (sortBy === "highest") {
      return arr.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === "lowest") {
      return arr.sort((a, b) => a.rating - b.rating);
    }
    // newest is default, already sorted
    return arr;
  }, [reviews, sortBy]);

  const RatingBar = ({ rating, count }: { rating: number; count: number }) => {
    const percentage = (count / analytics.totalReviews) * 100;
    return (
      <div className="flex items-center gap-3">
        <span className="w-12 text-sm font-semibold text-white/70">{rating} star</span>
        <div className="flex-1 h-6 bg-white/10 rounded-full overflow-hidden border border-white/20">
          <div
            className="h-full bg-gradient-to-r from-yellow-400 to-yellow-500 transition-all duration-300"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className="w-12 text-right text-sm text-white/60">{count}</span>
      </div>
    );
  };

  const StarRating = ({ rating }: { rating: number }) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={16}
          className={`transition ${
            star <= rating
              ? "fill-yellow-400 text-yellow-400"
              : "text-gray-400"
          }`}
        />
      ))}
    </div>
  );

  return (
    <section className="text-white">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight">Customer Feedback</h2>
          <p className="text-sm text-white/60 mt-1">
            Track ratings and reviews from your customers
          </p>
        </div>

        <span className="text-xs px-4 py-2 rounded-full bg-white/10 border border-white/20 text-white/90 font-semibold">
          {analytics.totalReviews} {analytics.totalReviews === 1 ? "review" : "reviews"}
        </span>
      </div>

      {/* Error message */}
      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200 mb-6">
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {/* Total Reviews */}
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow hover:bg-white/10 transition">
          <p className="text-sm text-white/70 font-medium">Total Reviews</p>
          <p className="text-4xl font-extrabold text-white mt-3">
            {analytics.totalReviews}
          </p>
          <p className="text-xs text-white/50 mt-2">Feedback collected</p>
        </div>

        {/* Average Rating */}
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow hover:bg-white/10 transition">
          <p className="text-sm text-white/70 font-medium">Average Rating</p>
          <div className="flex items-end gap-2 mt-3">
            <p className="text-4xl font-extrabold text-yellow-400">
              {analytics.averageRating}
            </p>
            <p className="text-sm text-white/50 mb-1">/ 5</p>
          </div>
          <div className="mt-3">
            <StarRating rating={Math.round(Number(analytics.averageRating))} />
          </div>
        </div>

        {/* Product Quality */}
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow hover:bg-white/10 transition">
          <p className="text-sm text-white/70 font-medium">Product Quality</p>
          <div className="flex items-end gap-2 mt-3">
            <p className="text-4xl font-extrabold text-blue-400">
              {analytics.categoryAverages.productQuality}
            </p>
            <p className="text-sm text-white/50 mb-1">/ 5</p>
          </div>
          <p className="text-xs text-white/50 mt-2">Quality rating</p>
        </div>

        {/* Delivery Speed */}
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow hover:bg-white/10 transition">
          <p className="text-sm text-white/70 font-medium">Delivery Speed</p>
          <div className="flex items-end gap-2 mt-3">
            <p className="text-4xl font-extrabold text-green-400">
              {analytics.categoryAverages.deliverySpeed}
            </p>
            <p className="text-sm text-white/50 mb-1">/ 5</p>
          </div>
          <p className="text-xs text-white/50 mt-2">Speed rating</p>
        </div>
      </div>

      {/* Rating Distribution Chart */}
      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 shadow mb-8">
        <h3 className="text-xl font-bold text-white mb-8">Rating Breakdown</h3>
        <div className="space-y-5">
          {[5, 4, 3, 2, 1].map((rating) => (
            <RatingBar
              key={rating}
              rating={rating}
              count={analytics.ratingDistribution[rating as keyof typeof analytics.ratingDistribution]}
            />
          ))}
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 shadow mb-8">
        <h3 className="text-xl font-bold text-white mb-6">Detailed Ratings</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="p-6 rounded-xl bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 transition">
            <p className="text-sm text-blue-200 font-medium mb-3">Product Quality</p>
            <div className="flex items-end gap-2">
              <p className="text-3xl font-bold text-blue-400">
                {analytics.categoryAverages.productQuality}
              </p>
              <p className="text-xs text-blue-300/70 mb-1">/ 5</p>
            </div>
            <p className="text-xs text-blue-200/60 mt-3">How customers rate product quality</p>
          </div>
          <div className="p-6 rounded-xl bg-green-500/10 border border-green-500/20 hover:bg-green-500/20 transition">
            <p className="text-sm text-green-200 font-medium mb-3">Delivery Speed</p>
            <div className="flex items-end gap-2">
              <p className="text-3xl font-bold text-green-400">
                {analytics.categoryAverages.deliverySpeed}
              </p>
              <p className="text-xs text-green-300/70 mb-1">/ 5</p>
            </div>
            <p className="text-xs text-green-200/60 mt-3">How fast orders arrive</p>
          </div>
          <div className="p-6 rounded-xl bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/20 transition">
            <p className="text-sm text-purple-200 font-medium mb-3">Driver Service</p>
            <div className="flex items-end gap-2">
              <p className="text-3xl font-bold text-purple-400">
                {analytics.categoryAverages.driverBehavior || "N/A"}
              </p>
              <p className="text-xs text-purple-300/70 mb-1">/ 5</p>
            </div>
            <p className="text-xs text-purple-200/60 mt-3">Driver professionalism rating</p>
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 shadow">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white">Recent Reviews</h3>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm hover:bg-white/20 transition font-medium"
          >
            <option value="newest">Newest First</option>
            <option value="highest">Highest Rated</option>
            <option value="lowest">Lowest Rated</option>
          </select>
        </div>

        {sortedReviews.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-white/60">No reviews yet. Customers will see a review form after checkout.</p>
          </div>
        ) : (
          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
            {sortedReviews.map((review) => (
              <div
                key={review.id}
                className="p-5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <p className="font-semibold text-white">
                      {review.customerName || "Anonymous"}
                    </p>
                    <p className="text-xs text-white/50 mt-1">
                      Order: {review.orderId.slice(0, 12)}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="mb-2">
                      <StarRating rating={review.rating} />
                    </div>
                    <p className="text-sm font-bold text-yellow-400">
                      {review.rating}/5
                    </p>
                  </div>
                </div>

                <p className="text-sm text-white/90 line-clamp-3 leading-relaxed mb-3">
                  "{review.comment}"
                </p>

                {review.categories && (
                  <div className="pt-3 border-t border-white/10 grid grid-cols-3 gap-2 text-xs">
                    {review.categories.productQuality && (
                      <div className="text-blue-300 bg-blue-500/10 rounded px-2 py-1">
                        Quality: <strong>{review.categories.productQuality}★</strong>
                      </div>
                    )}
                    {review.categories.deliverySpeed && (
                      <div className="text-green-300 bg-green-500/10 rounded px-2 py-1">
                        Speed: <strong>{review.categories.deliverySpeed}★</strong>
                      </div>
                    )}
                    {review.categories.driverBehavior && (
                      <div className="text-purple-300 bg-purple-500/10 rounded px-2 py-1">
                        Driver: <strong>{review.categories.driverBehavior}★</strong>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default ManagerReviews;

import React, { useEffect, useMemo, useState } from "react";
import { collection, query, onSnapshot, doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { Star, Phone, MapPin, Clock } from "lucide-react";
import ReviewSurvey from "./ReviewSurvey";
import { useAuth } from "./context/AuthContext";

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

type FilterType = "all" | "month" | "date";

const CustomerReviewsSummary: React.FC = () => {
  const { currentUser } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [customerNameForReview, setCustomerNameForReview] = useState<string>("");
  const [nameLoaded, setNameLoaded] = useState(false);

  // Fetch customer name from Firestore
  useEffect(() => {
    setNameLoaded(false);
    
    const fetchCustomerName = async () => {
      try {
        if (!currentUser) {
          console.log("No current user");
         
          return;
        }

        const userDocRef = doc(db, "users", currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          console.log("User data from Firestore:", userData);
          const finalName = userData?.displayName || userData?.name || currentUser.email || "Valued Customer";
          console.log("Final name set:", finalName);
          setCustomerNameForReview(finalName);
        } else {
          console.log("User doc does not exist");
          setCustomerNameForReview(currentUser?.email || "Valued Customer");
        }
      } catch (error) {
        console.error("Error fetching customer name:", error);
        setCustomerNameForReview(currentUser?.email || "Valued Customer");
      } finally {
        console.log("Setting nameLoaded to true");
        setNameLoaded(true);
      }
    };

    fetchCustomerName();
  }, [currentUser]);

  // Fetch reviews
  useEffect(() => {
    const q = query(collection(db, "reviews"));

    const unsub = onSnapshot(
      q,
      (snap) => {
        const fetchedReviews = snap.docs
          .map((d) => {
            const docData = d.data();
            return {
              id: d.id,
              orderId: docData.orderId,
              userId: docData.userId,
              customerName: docData.customerName,
              rating: docData.rating,
              comment: docData.comment,
              categories: docData.categories,
              createdAt: docData.createdAt,
            } as Review;
          })
          .sort((a, b) => {
            const aTime = a.createdAt?.toMillis?.() || 0;
            const bTime = b.createdAt?.toMillis?.() || 0;
            return bTime - aTime;
          });
        setReviews(fetchedReviews);
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  // Analytics calculations for all reviews
  const analytics = useMemo(() => {
    if (reviews.length === 0)
      return {
        totalReviews: 0,
        averageRating: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      };

    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let totalRating = 0;

    reviews.forEach((review) => {
      totalRating += review.rating;
      ratingDistribution[review.rating as keyof typeof ratingDistribution]++;
    });

    return {
      totalReviews: reviews.length,
      averageRating: (totalRating / reviews.length).toFixed(1),
      ratingDistribution,
    };
  }, [reviews]);

  // Filter reviews based on selected criteria
  const filteredReviews = useMemo(() => {
    if (filterType === "all") {
      return reviews.slice(0, 5);
    }

    return reviews.filter((review) => {
      const reviewDate = new Date(review.createdAt?.toMillis?.() || 0);
      const reviewMonth = `${reviewDate.getFullYear()}-${String(reviewDate.getMonth() + 1).padStart(2, "0")}`;
      const reviewDay = reviewDate.toISOString().split("T")[0];

      if (filterType === "month" && selectedMonth) {
        return reviewMonth === selectedMonth;
      }
      if (filterType === "date" && selectedDate) {
        return reviewDay === selectedDate;
      }

      return true;
    }).slice(0, 5);
  }, [reviews, filterType, selectedMonth, selectedDate]);

  // Analytics calculations for filtered reviews (updates based on filter)
  const filteredAnalytics = useMemo(() => {
    if (filteredReviews.length === 0)
      return {
        totalReviews: 0,
        averageRating: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      };

    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let totalRating = 0;

    filteredReviews.forEach((review) => {
      totalRating += review.rating;
      ratingDistribution[review.rating as keyof typeof ratingDistribution]++;
    });

    return {
      totalReviews: filteredReviews.length,
      averageRating: (totalRating / filteredReviews.length).toFixed(1),
      ratingDistribution,
    };
  }, [filteredReviews]);

  // Get available months from reviews
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    reviews.forEach((review) => {
      const reviewDate = new Date(review.createdAt?.toMillis?.() || 0);
      const month = `${reviewDate.getFullYear()}-${String(reviewDate.getMonth() + 1).padStart(2, "0")}`;
      months.add(month);
    });
    return Array.from(months).sort().reverse();
  }, [reviews]);

  // Get available dates from reviews
  const availableDates = useMemo(() => {
    const dates = new Set<string>();
    reviews.forEach((review) => {
      const reviewDate = new Date(review.createdAt?.toMillis?.() || 0);
      const date = reviewDate.toISOString().split("T")[0];
      dates.add(date);
    });
    return Array.from(dates).sort().reverse();
  }, [reviews]);

  const formatDate = (iso: string) => {
    const date = new Date(iso + "T00:00:00");
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const formatMonth = (month: string) => {
    const [year, monthNum] = month.split("-");
    const date = new Date(parseInt(year), parseInt(monthNum) - 1);
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  };

  const formatReviewTime = (timestamp: any) => {
    const date = new Date(timestamp?.toMillis?.() || 0);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  const RatingBar = ({ rating, count }: { rating: number; count: number }) => {
    const percentage = analytics.totalReviews > 0 ? (count / analytics.totalReviews) * 100 : 0;
    return (
      <div className="flex items-center gap-3">
        <span className="w-10 text-xs font-semibold text-white/70">{rating}★</span>
        <div className="flex-1 h-4 bg-white/10 rounded-full overflow-hidden border border-white/20">
          <div
            className="h-full bg-gradient-to-r from-yellow-400 to-yellow-500 transition-all duration-300"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className="w-12 text-right text-xs text-white/60 font-semibold">{percentage.toFixed(1)}%</span>
      </div>
    );
  };

  const StarRating = ({ rating }: { rating: number }) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={14}
          className={`transition ${
            star <= rating
              ? "fill-yellow-400 text-yellow-400"
              : "text-gray-400"
          }`}
        />
      ))}
    </div>
  );

  if (loading || analytics.totalReviews === 0) {
    return null;
  }

  return (
    <div className="mt-8 space-y-6">
      {/* Seller/Contact Information */}
      <div className="rounded-xl border border-white/10 bg-gradient-to-br from-blue-600/20 to-cyan-600/20 backdrop-blur-xl p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-blue-500/20 p-2.5 flex-shrink-0">
              <Phone size={18} className="text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-blue-200 font-medium">Contact Us</p>
              <p className="text-sm font-semibold text-white">09287625327</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-cyan-500/20 p-2.5 flex-shrink-0">
              <MapPin size={18} className="text-cyan-400" />
            </div>
            <div>
              <p className="text-xs text-cyan-200 font-medium">Water Station</p>
              <p className="text-sm font-semibold text-white">Premium Water Supply Hub</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Controls with Feedback Button - Side by Side Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: Filter Controls */}
        <div className="lg:col-span-1 rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl p-4 h-fit">
          <h4 className="text-sm font-bold text-white mb-2">Filter Feedback</h4>
          <div className="flex flex-wrap gap-2 mb-2">
            <button
              onClick={() => {
                setFilterType("all");
                setSelectedMonth("");
                setSelectedDate("");
              }}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition transform hover:scale-105 ${
                filterType === "all"
                  ? "bg-white/20 border border-white/40 text-white shadow-lg"
                  : "bg-white/10 border border-white/20 text-white/70 hover:bg-white/15"
              }`}
            >
              All Time
            </button>
            <button
              onClick={() => {
                setFilterType("month");
                setSelectedDate("");
                if (!selectedMonth && availableMonths.length > 0) {
                  setSelectedMonth(availableMonths[0]);
                }
              }}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition transform hover:scale-105 ${
                filterType === "month"
                  ? "bg-white/20 border border-white/40 text-white shadow-lg"
                  : "bg-white/10 border border-white/20 text-white/70 hover:bg-white/15"
              }`}
            >
              By Month
            </button>
            <button
              onClick={() => {
                setFilterType("date");
                setSelectedMonth("");
                if (!selectedDate && availableDates.length > 0) {
                  setSelectedDate(availableDates[0]);
                }
              }}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition transform hover:scale-105 ${
                filterType === "date"
                  ? "bg-white/20 border border-white/40 text-white shadow-lg"
                  : "bg-white/10 border border-white/20 text-white/70 hover:bg-white/15"
              }`}
            >
              By Date
            </button>
          </div>

          {/* Month Filter */}
          {filterType === "month" && availableMonths.length > 0 && (
            <div className="mt-2">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-400 transition"
              >
                {availableMonths.map((month) => (
                  <option key={month} value={month} className="bg-gray-900">
                    {formatMonth(month)}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Date Filter */}
          {filterType === "date" && availableDates.length > 0 && (
            <div className="mt-2">
              <select
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-400 transition"
              >
                {availableDates.map((date) => (
                  <option key={date} value={date} className="bg-gray-900">
                    {formatDate(date)}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Right: Leave Feedback Button and Stats */}
        <div className="lg:col-span-2 space-y-4">
          {/* Leave Feedback Button */}
          <div className="flex justify-center">
            <button
              onClick={() => setShowFeedbackModal(true)}
              disabled={!nameLoaded}
              className={`${
                nameLoaded
                  ? "bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 cursor-pointer"
                  : "bg-gray-500/50 cursor-not-allowed opacity-50"
              } text-white font-semibold py-2 px-6 rounded-lg transition text-sm whitespace-nowrap`}
            >
              {nameLoaded ? "Leave Feedback" : "Loading..."}
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-3">
            {/* Average Rating */}
            <div className="rounded-xl bg-yellow-500/10 border border-yellow-500/20 p-4 transition-all hover:bg-yellow-500/20 hover:border-yellow-500/40">
              <p className="text-xs text-yellow-200 font-medium mb-2">Average Rating</p>
              <div className="flex items-end gap-2">
                <p className="text-2xl font-bold text-yellow-400">
                  {filteredAnalytics.averageRating}
                </p>
                <p className="text-xs text-yellow-300/70 mb-0.5">/ 5</p>
              </div>
            </div>

            {/* Total Reviews */}
            <div className="rounded-xl bg-blue-500/10 border border-blue-500/20 p-4 transition-all hover:bg-blue-500/20 hover:border-blue-500/40">
              <p className="text-xs text-blue-200 font-medium mb-2">Total Reviews</p>
              <p className="text-2xl font-bold text-blue-400">
                {filteredAnalytics.totalReviews}
              </p>
            </div>
          </div>

          {/* Rating Breakdown */}
          <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl p-5 transition-all hover:bg-white/10 hover:border-white/20">
            <h4 className="text-sm font-bold text-white mb-4 text-center">Rating Breakdown</h4>
            <div className="space-y-3">
              {[5, 4, 3, 2, 1].map((rating) => (
                <RatingBar
                  key={rating}
                  rating={rating}
                  count={filteredAnalytics.ratingDistribution[rating as keyof typeof filteredAnalytics.ratingDistribution]}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Comments */}
      {filteredReviews.length > 0 && (
        <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl p-5">
          <h4 className="text-sm font-bold text-white mb-4">Recent Feedback</h4>
          <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
            {filteredReviews.map((review) => (
              <div
                key={review.id}
                className="p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition transform hover:scale-102"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1">
                    <p className="font-semibold text-white/90 text-sm">
                      {review.customerName || "Anonymous"}
                    </p>
                    <div className="flex items-center gap-1 text-xs text-white/50 mt-1">
                      <Clock size={12} />
                      <span>{formatReviewTime(review.createdAt)}</span>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <StarRating rating={review.rating} />
                  </div>
                </div>
                <p className="text-xs text-white/80 leading-relaxed line-clamp-3">
                  "{review.comment}"
                </p>
              </div>
            ))}
          </div>
          {filteredReviews.length === 0 && (
            <p className="text-xs text-white/50 text-center py-6">No feedback found for the selected period.</p>
          )}
        </div>
      )}

      {/* Seller Feedback Modal */}
      {showFeedbackModal && (
        <ReviewSurvey
          orderId="seller_feedback"
          userId={currentUser?.uid || "anonymous"}
          customerName={customerNameForReview}
          onClose={() => setShowFeedbackModal(false)}
          onComplete={() => setShowFeedbackModal(false)}
        />
      )}
    </div>
  );
};

export default CustomerReviewsSummary;

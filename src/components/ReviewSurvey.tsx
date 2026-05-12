import React, { useState } from "react";
import { Star, X } from "lucide-react";
import { db } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

interface ReviewSurveyProps {
  orderId: string;
  userId: string;
  customerName: string;
  onClose: () => void;
  onComplete: () => void;
}

const ReviewSurvey: React.FC<ReviewSurveyProps> = ({
  orderId,
  userId,
  customerName,
  onClose,
  onComplete,
}) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [displayName, setDisplayName] = useState<string>(customerName);
  const [overallRating, setOverallRating] = useState<number>(0);
  const [productQuality, setProductQuality] = useState<number>(0);
  const [deliverySpeed, setDeliverySpeed] = useState<number>(0);
  const [driverBehavior, setDriverBehavior] = useState<number>(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (overallRating === 0) {
      setError("Please select an overall rating");
      return;
    }
    if (!comment.trim()) {
      setError("Please share your feedback/comments");
      return;
    }
    if (!displayName || displayName.trim() === "") {
      setError("Please enter your name");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const reviewData = {
        orderId,
        userId,
        customerName: displayName.trim(),
        rating: overallRating,
        comment: comment.trim(),
        categories: {
          productQuality: productQuality || undefined,
          deliverySpeed: deliverySpeed || undefined,
          driverBehavior: driverBehavior || undefined,
          overallExperience: overallRating,
        },
        createdAt: serverTimestamp(),
      };

      console.log("Submitting review with customerName:", displayName.trim());
      await addDoc(collection(db, "reviews"), reviewData);
      setSubmitted(true);
      setTimeout(() => {
        onComplete();
      }, 1500);
    } catch (err: any) {
      console.error("Review submission error:", err);
      setError(err.message || "Failed to submit review. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const RatingStars = ({
    rating,
    setRating,
    label,
    description,
  }: {
    rating: number;
    setRating: (r: number) => void;
    label: string;
    description?: string;
  }) => (
    <div className="mb-6">
      <div className="flex items-baseline justify-between mb-2">
        <label className="block text-sm font-semibold text-gray-900">
          {label}
        </label>
        {rating > 0 && <span className="text-xs text-gray-500">{rating}/5</span>}
      </div>
      {description && (
        <p className="text-xs text-gray-600 mb-3">{description}</p>
      )}
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => setRating(star)}
            className="transition transform hover:scale-110 focus:outline-none"
            type="button"
          >
            <Star
              size={32}
              className={`transition ${
                star <= rating
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-gray-300"
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );

  if (submitted) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center px-4 z-50">
        <div className="bg-white rounded-2xl p-8 text-center max-w-sm animate-scale-in">
          <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
            <span className="text-green-600 text-3xl">✓</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Review Submitted!
          </h2>
          <p className="text-gray-600">
            Thank you for sharing your feedback. Your review helps us improve!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center px-4 py-8 z-50">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 sm:px-8 py-6 text-white flex items-start justify-between">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold">How was your experience?</h2>
            <p className="mt-1 text-blue-100 text-sm">
              {customerName && <span className="font-semibold">{customerName}</span>} • Your honest feedback helps us serve you better
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition p-1 flex-shrink-0"
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8">
          {/* Progress indicator */}
          <div className="mb-8 flex gap-2">
            <div
              className={`h-1.5 flex-1 rounded-full transition ${
                step === 1 ? "bg-blue-600" : "bg-gray-300"
              }`}
            />
            <div
              className={`h-1.5 flex-1 rounded-full transition ${
                step === 2 ? "bg-blue-600" : "bg-gray-300"
              }`}
            />
          </div>

          {/* Step 1: Overall Rating */}
          {step === 1 && (
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Overall Experience
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                Start by rating your entire experience with us
              </p>

              {/* Name Input */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Your Name (as it will appear in feedback)
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-sm text-gray-900"
                />
              </div>

              <RatingStars
                rating={overallRating}
                setRating={setOverallRating}
                label="How satisfied are you overall?"
                description="Let us know how well we served you"
              />

              <div className="mt-8 flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 border border-gray-300 text-gray-900 font-semibold py-3 rounded-xl hover:bg-gray-50 transition"
                >
                  Skip for Now
                </button>
                <button
                  onClick={() => setStep(2)}
                  disabled={overallRating === 0}
                  className="flex-1 bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next Step
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Detailed Ratings & Comments */}
          {step === 2 && (
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Tell us more details
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                Your specific feedback helps us improve
              </p>

              <RatingStars
                rating={productQuality}
                setRating={setProductQuality}
                label="Product Quality"
                description="How satisfied were you with the product?"
              />

              <RatingStars
                rating={deliverySpeed}
                setRating={setDeliverySpeed}
                label="Delivery Speed"
                description="How quickly did we deliver your order?"
              />

              <RatingStars
                rating={driverBehavior}
                setRating={setDriverBehavior}
                label="Driver Professionalism"
                description="How professional was our delivery driver?"
              />

              {/* Comments */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Your Feedback <span className="text-red-500">*</span>
                </label>
                <p className="text-xs text-gray-600 mb-3">
                  Share any additional thoughts, suggestions, or concerns
                </p>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="What could we improve? What did you love? Tell us anything!"
                  maxLength={500}
                  rows={5}
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition resize-none"
                />
                <p className="mt-2 text-xs text-gray-500">
                  {comment.length}/500 characters
                </p>
              </div>

              {/* Error */}
              {error && (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700 text-sm">
                  <p className="font-semibold mb-1">Oops!</p>
                  <p>{error}</p>
                </div>
              )}

              {/* Buttons */}
              <div className="mt-8 flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  disabled={isSubmitting}
                  className="flex-1 border border-gray-300 text-gray-900 font-semibold py-3 rounded-xl hover:bg-gray-50 transition disabled:opacity-50"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !comment.trim()}
                  className="flex-1 bg-green-600 text-white font-semibold py-3 rounded-xl hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Submitting..." : "Submit Review"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReviewSurvey;

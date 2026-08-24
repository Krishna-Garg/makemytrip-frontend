import { useState } from "react";
import { createReview } from "@/api";
import StarRating from "./StarRating";
import { Loader2, ImageIcon } from "lucide-react";

interface Props {
  targetId: string;
  targetType: "FLIGHT" | "HOTEL";
  userId: string;
  userFullName: string;
  onSuccess: (review: any) => void;
}

export default function AddReview({
  targetId,
  targetType,
  userId,
  userFullName,
  onSuccess,
}: Props) {
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      setError("Please select a star rating.");
      return;
    }
    if (!reviewText.trim()) {
      setError("Please write a review.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const review = await createReview(
        targetId,
        targetType,
        userId,
        userFullName,
        rating,
        reviewText,
        photoUrl || null,
      );
      onSuccess(review);
      setRating(0);
      setReviewText("");
      setPhotoUrl("");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Could not submit review.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-semibold">Write a Review</h3>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Your Rating
        </label>
        <StarRating value={rating} onChange={setRating} size="lg" />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Review
        </label>
        <textarea
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
          rows={4}
          placeholder="Share your experience..."
          className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
          <ImageIcon className="w-4 h-4" /> Photo URL{" "}
          <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <input
          type="url"
          value={photoUrl}
          onChange={(e) => setPhotoUrl(e.target.value)}
          placeholder="https://..."
          className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="flex items-center justify-center gap-2 w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60 text-sm font-medium"
      >
        {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
        {submitting ? "Submitting..." : "Submit Review"}
      </button>
    </form>
  );
}

// components/Reviews/ReviewList.tsx
// Drop this anywhere you have a targetId (hotel or flight page).
// It fetches, sorts, and renders reviews + the AddReview form.

import { useEffect, useState } from "react";
import { getReviews } from "@/api";
import { useSelector } from "react-redux";
import ReviewCard from "./ReviewCard";
import AddReview from "./AddReview";
import { Star } from "lucide-react";

interface Props {
  targetId: string;
  targetType: "FLIGHT" | "HOTEL";
}

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "highest", label: "Highest Rated" },
  { value: "lowest", label: "Lowest Rated" },
  { value: "helpful", label: "Most Helpful" },
];

export default function ReviewList({ targetId, targetType }: Props) {
  const user = useSelector((state: any) => state.user.user);
  const [reviews, setReviews] = useState<any[]>([]);
  const [sort, setSort] = useState("newest");
  const [loading, setLoading] = useState(true);

  const fetchReviews = async (s: string) => {
    setLoading(true);
    const data = await getReviews(targetId, s);
    setReviews(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchReviews(sort);
  }, [targetId, sort]);

  const avgRating = reviews.length
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(
        1,
      )
    : null;

  const handleNewReview = (review: any) => {
    setReviews((prev) => [review, ...prev]);
  };

  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold">Guest Reviews</h2>
          {avgRating && (
            <div className="flex items-center gap-1 mt-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="font-semibold">{avgRating}</span>
              <span className="text-sm text-gray-500">
                ({reviews.length} reviews)
              </span>
            </div>
          )}
        </div>

        {/* Sort */}
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="text-sm border rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {/* Add review form — only if logged in */}
      {user ? (
        <div className="border rounded-xl p-4 bg-gray-50">
          <AddReview
            targetId={targetId}
            targetType={targetType}
            userId={user.id || user._id}
            userFullName={`${user.firstName} ${user.lastName}`}
            onSuccess={handleNewReview}
          />
        </div>
      ) : (
        <p className="text-sm text-gray-500 border rounded-xl p-4 bg-gray-50">
          <span className="font-medium">Log in</span> to write a review.
        </p>
      )}

      {/* Review list */}
      {loading ? (
        <p className="text-sm text-gray-400">Loading reviews...</p>
      ) : reviews.length === 0 ? (
        <p className="text-sm text-gray-400">No reviews yet. Be the first!</p>
      ) : (
        <div className="space-y-4">
          {reviews.map((review: any) => (
            <ReviewCard
              key={review._id}
              review={review}
              currentUserId={user?.id || user?._id}
              currentUserFullName={
                user ? `${user.firstName} ${user.lastName}` : undefined
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

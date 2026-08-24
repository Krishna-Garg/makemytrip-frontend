import { useState } from "react";
import {
  ThumbsUp,
  Flag,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react";
import { addReviewReply, markReviewHelpful, flagReview } from "@/api";
import StarRating from "./StarRating";

const FLAG_REASONS = [
  "Spam or fake review",
  "Offensive language",
  "Irrelevant content",
  "Other",
];

interface Props {
  review: any;
  currentUserId?: string;
  currentUserFullName?: string;
}

export default function ReviewCard({
  review,
  currentUserId,
  currentUserFullName,
}: Props) {
  const [localReview, setLocalReview] = useState(review);
  const [showReplies, setShowReplies] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);
  const [showFlagMenu, setShowFlagMenu] = useState(false);
  const [flagging, setFlagging] = useState(false);
  const [flagged, setFlagged] = useState(false);

  const formatDate = (str: string) =>
    new Date(str).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  const handleHelpful = async () => {
    const updated = await markReviewHelpful(localReview._id || localReview.id);
    if (updated) setLocalReview(updated);
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !currentUserId) return;
    setSubmittingReply(true);
    try {
      const updated = await addReviewReply(
        localReview._id || localReview.id,
        currentUserId,
        currentUserFullName || "User",
        replyText,
      );
      if (updated) {
        setLocalReview(updated);
        setReplyText("");
      }
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleFlag = async (reason: string) => {
    setFlagging(true);
    setShowFlagMenu(false);
    try {
      await flagReview(localReview._id || localReview.id, reason);
      setFlagged(true);
    } finally {
      setFlagging(false);
    }
  };

  return (
    <div className="border rounded-xl p-4 bg-white space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-sm">
              {localReview.userFullName?.[0] || "U"}
            </div>
            <span className="font-medium text-sm">
              {localReview.userFullName}
            </span>
          </div>
          <StarRating value={localReview.rating} size="sm" />
        </div>
        <span className="text-xs text-gray-400">
          {formatDate(localReview.createdAt)}
        </span>
      </div>

      {/* Body */}
      <p className="text-sm text-gray-700">{localReview.reviewText}</p>

      {/* Photo */}
      {localReview.photoUrl && (
        <img
          src={localReview.photoUrl}
          alt="Review photo"
          className="rounded-lg max-h-48 object-cover w-full"
          onError={(e) => (e.currentTarget.style.display = "none")}
        />
      )}

      {/* Actions */}
      <div className="flex items-center gap-4 text-xs text-gray-500">
        <button
          onClick={handleHelpful}
          className="flex items-center gap-1 hover:text-blue-600 transition-colors"
        >
          <ThumbsUp className="w-3.5 h-3.5" />
          Helpful ({localReview.helpfulCount})
        </button>

        <button
          onClick={() => setShowReplies((v) => !v)}
          className="flex items-center gap-1 hover:text-blue-600 transition-colors"
        >
          <MessageCircle className="w-3.5 h-3.5" />
          {localReview.replies?.length || 0} Replies
          {showReplies ? (
            <ChevronUp className="w-3 h-3" />
          ) : (
            <ChevronDown className="w-3 h-3" />
          )}
        </button>

        {flagged ? (
          <span className="text-orange-500 flex items-center gap-1">
            <Flag className="w-3.5 h-3.5" /> Flagged
          </span>
        ) : (
          <div className="relative">
            <button
              onClick={() => setShowFlagMenu((v) => !v)}
              className="flex items-center gap-1 hover:text-red-500 transition-colors"
              disabled={flagging}
            >
              <Flag className="w-3.5 h-3.5" />
              {flagging ? <Loader2 className="w-3 h-3 animate-spin" /> : "Flag"}
            </button>
            {showFlagMenu && (
              <div className="absolute left-0 top-5 bg-white border rounded-lg shadow-lg z-10 w-48 py-1">
                {FLAG_REASONS.map((r) => (
                  <button
                    key={r}
                    onClick={() => handleFlag(r)}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50"
                  >
                    {r}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Replies */}
      {showReplies && (
        <div className="ml-4 border-l-2 border-gray-100 pl-4 space-y-3">
          {localReview.replies?.map((reply: any, idx: number) => (
            <div key={idx} className="text-sm">
              <div className="flex items-center gap-2 mb-0.5">
                <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-semibold text-xs">
                  {reply.userFullName?.[0] || "U"}
                </div>
                <span className="font-medium text-xs">
                  {reply.userFullName}
                </span>
                <span className="text-xs text-gray-400">
                  {formatDate(reply.createdAt)}
                </span>
              </div>
              <p className="text-gray-600 text-xs ml-8">{reply.text}</p>
            </div>
          ))}

          {/* Reply input — only shown if logged in */}
          {currentUserId && (
            <form onSubmit={handleReply} className="flex gap-2 mt-2">
              <input
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write a reply..."
                className="flex-1 px-3 py-1.5 border rounded-lg text-xs focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={submittingReply || !replyText.trim()}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs disabled:opacity-60 hover:bg-blue-700 transition-colors"
              >
                {submittingReply ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  "Reply"
                )}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

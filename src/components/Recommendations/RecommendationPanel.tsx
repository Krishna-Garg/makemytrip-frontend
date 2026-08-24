// components/Recommendations/RecommendationPanel.tsx
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useSelector } from "react-redux";
import {
  Plane, Building2, ThumbsUp, ThumbsDown,
  RefreshCw, Info, Sparkles,
} from "lucide-react";
import {
  getRecommendations,
  refreshRecommendations,
  sendRecommendationFeedback,
} from "@/api";

interface Recommendation {
  type: string;
  targetId: string;
  title: string;
  subtitle: string;
  reason: string;
  tag: string;
}

const TAG_COLORS: Record<string, string> = {
  "TRENDING":             "bg-red-100 text-red-600",
  "POPULAR":              "bg-orange-100 text-orange-600",
  "BASED ON YOUR HISTORY":"bg-blue-100 text-blue-600",
  "YOU MIGHT LIKE":       "bg-purple-100 text-purple-600",
  "TRAVELERS LIKE YOU":   "bg-green-100 text-green-600",
};

interface Props {
  /** compact = 2-col card strip for homepage, full = 4-col for profile */
  variant?: "compact" | "full";
}

export default function RecommendationPanel({ variant = "compact" }: Props) {
  const user = useSelector((state: any) => state.user.user);
  const router = useRouter();
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [feedback, setFeedback] = useState<Record<string, string>>({});
  const [tooltip, setTooltip] = useState<string | null>(null);

  const userId = user?.id || user?._id || null;

  const fetchRecs = async () => {
    setLoading(true);
    const data = await getRecommendations(userId);
    setRecs(data || []);
    setLoading(false);
  };

  const handleRefresh = async () => {
    if (!userId) return;
    setRefreshing(true);
    const data = await refreshRecommendations(userId);
    setRecs(data || []);
    setRefreshing(false);
  };

  const handleFeedback = async (rec: Recommendation, type: "HELPFUL" | "IRRELEVANT") => {
    setFeedback((prev) => ({ ...prev, [rec.targetId]: type }));
    if (userId) {
      await sendRecommendationFeedback(userId, rec.targetId, rec.type, type);
    }
    if (type === "IRRELEVANT") {
      setRecs((prev) => prev.filter((r) => r.targetId !== rec.targetId));
    }
  };

  const handleCardClick = (rec: Recommendation) => {
    if (rec.type === "FLIGHT") router.push(`/book-flight/${rec.targetId}`);
    else router.push(`/book-hotel/${rec.targetId}`);
  };

  useEffect(() => { fetchRecs(); }, [userId]);

  if (loading) return (
    <div className="w-full py-6 flex items-center justify-center gap-2 text-gray-400 text-sm">
      <RefreshCw className="w-4 h-4 animate-spin" />
      Loading recommendations...
    </div>
  );

  if (recs.length === 0) return null;

  const gridClass = variant === "full"
    ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
    : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3";

  return (
    <div className="w-full space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-yellow-500" />
          <h2 className={`font-bold ${variant === "full" ? "text-2xl" : "text-lg text-white"}`}>
            Recommended for You
          </h2>
        </div>
        {userId && (
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
              variant === "full"
                ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
                : "bg-white/20 text-white hover:bg-white/30"
            }`}
          >
            <RefreshCw className={`w-3 h-3 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        )}
      </div>

      {/* Cards */}
      <div className={gridClass}>
        {recs.map((rec) => {
          const fb = feedback[rec.targetId];
          return (
            <div
              key={rec.targetId}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group"
            >
              {/* Color strip by type */}
              <div className={`h-1.5 w-full ${rec.type === "FLIGHT" ? "bg-blue-500" : "bg-green-500"}`} />

              <div className="p-4 space-y-3">
                {/* Tag + icon */}
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${TAG_COLORS[rec.tag] || "bg-gray-100 text-gray-600"}`}>
                    {rec.tag}
                  </span>
                  <div className={`p-1.5 rounded-lg ${rec.type === "FLIGHT" ? "bg-blue-50" : "bg-green-50"}`}>
                    {rec.type === "FLIGHT"
                      ? <Plane className="w-4 h-4 text-blue-500" />
                      : <Building2 className="w-4 h-4 text-green-500" />}
                  </div>
                </div>

                {/* Title + subtitle */}
                <div
                  className="cursor-pointer"
                  onClick={() => handleCardClick(rec)}
                >
                  <p className="font-semibold text-sm text-gray-900 group-hover:text-blue-600 transition-colors leading-tight">
                    {rec.title}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{rec.subtitle}</p>
                </div>

                {/* Why tooltip */}
                <div className="relative">
                  <button
                    onMouseEnter={() => setTooltip(rec.targetId)}
                    onMouseLeave={() => setTooltip(null)}
                    className="flex items-center gap-1 text-xs text-gray-400 hover:text-blue-500 transition-colors"
                  >
                    <Info className="w-3 h-3" />
                    Why this?
                  </button>
                  {tooltip === rec.targetId && (
                    <div className="absolute bottom-6 left-0 z-20 w-52 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-xl">
                      {rec.reason}
                      <div className="absolute bottom-[-4px] left-4 w-2 h-2 bg-gray-900 rotate-45" />
                    </div>
                  )}
                </div>

                {/* Feedback row */}
                {fb ? (
                  <p className="text-xs text-gray-400 italic">
                    {fb === "HELPFUL" ? "👍 Thanks for the feedback!" : "Got it — won't show again"}
                  </p>
                ) : (
                  <div className="flex items-center gap-2 pt-1 border-t border-gray-50">
                    <span className="text-xs text-gray-400 flex-1">Helpful?</span>
                    <button
                      onClick={() => handleFeedback(rec, "HELPFUL")}
                      className="p-1 rounded hover:bg-green-50 text-gray-400 hover:text-green-600 transition-colors"
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleFeedback(rec, "IRRELEVANT")}
                      className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <ThumbsDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

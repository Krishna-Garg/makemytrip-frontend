// components/Admin/FlaggedReviewsTab.tsx
import { useEffect, useState } from "react";
import { getFlaggedReviews, deleteReview, unflagReview } from "@/api";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Flag, Trash2, CheckCircle } from "lucide-react";
import Loader from "../Loader";

const TYPE_COLORS: Record<string, string> = {
  SPAM: "bg-red-100 text-red-700",
  OFFENSIVE: "bg-orange-100 text-orange-700",
  IRRELEVANT: "bg-gray-100 text-gray-600",
  OTHER: "bg-yellow-100 text-yellow-700",
};

export default function FlaggedReviewsTab() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  const fetchReviews = async () => {
    setLoading(true);
    const data = await getFlaggedReviews();
    setReviews(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchReviews(); }, []);

  const handleDelete = async (reviewId: string) => {
    setActing(reviewId);
    try {
      await deleteReview(reviewId);
      setReviews((prev) => prev.filter((r) => (r._id || r.id) !== reviewId));
    } catch { alert("Failed to delete review."); }
    setActing(null);
  };

  const handleUnflag = async (reviewId: string) => {
    setActing(reviewId);
    try {
      await unflagReview(reviewId);
      setReviews((prev) => prev.filter((r) => (r._id || r.id) !== reviewId));
    } catch { alert("Failed to unflag review."); }
    setActing(null);
  };

  if (loading) return <Loader />;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Flag className="w-5 h-5 text-red-500" />
        <h3 className="font-semibold">Flagged Reviews ({reviews.length})</h3>
      </div>

      {reviews.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">
          No flagged reviews. All content looks clean ✓
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Author</TableHead>
              <TableHead>Target</TableHead>
              <TableHead>Review</TableHead>
              <TableHead>Flag Reason</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reviews.map((r: any) => {
              const rid = r._id || r.id;
              const isActing = acting === rid;
              return (
                <TableRow key={rid}>
                  <TableCell>
                    <div className="font-medium text-sm">{r.userFullName}</div>
                    <div className="text-xs text-muted-foreground">{r.userId}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {r.targetType}
                    </Badge>
                    <div className="text-xs text-muted-foreground mt-0.5 truncate max-w-24">
                      {r.targetId}
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm max-w-48 line-clamp-2">{r.reviewText}</p>
                  </TableCell>
                  <TableCell>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      TYPE_COLORS[r.flagReason?.split(" ")[0]?.toUpperCase()] || TYPE_COLORS.OTHER
                    }`}>
                      {r.flagReason || "No reason given"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex text-yellow-400 text-xs">
                      {"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isActing}
                        onClick={() => handleUnflag(rid)}
                        className="text-green-600 border-green-200 hover:bg-green-50"
                      >
                        <CheckCircle className="w-3.5 h-3.5 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isActing}
                        onClick={() => handleDelete(rid)}
                        className="text-red-600 border-red-200 hover:bg-red-50"
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { getAllRefunds, updateRefundStatus } from "@/api";
import Loader from "../Loader";

const STATUS_FLOW: Record<string, string> = {
  PENDING: "PROCESSED",
  PROCESSED: "COMPLETED",
};

const statusVariant = (status: string) => {
  switch (status) {
    case "COMPLETED":
      return "default";
    case "PROCESSED":
      return "secondary";
    case "REJECTED":
      return "destructive";
    default:
      return "outline";
  }
};

const RefundsTab = () => {
  const [refunds, setRefunds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingKey, setUpdatingKey] = useState<string | null>(null);

  const fetchRefunds = async () => {
    setLoading(true);
    const data = await getAllRefunds();
    setRefunds(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchRefunds();
  }, []);

  const handleAdvance = async (
    userId: string,
    bookingId: string,
    currentStatus: string,
  ) => {
    const nextStatus = STATUS_FLOW[currentStatus];
    if (!nextStatus) return;
    const key = `${userId}=${bookingId}`;
    setUpdatingKey(key);
    try {
      await updateRefundStatus(userId, bookingId, nextStatus);
      await fetchRefunds();
    } catch (err) {
      console.log(err);
    } finally {
      setUpdatingKey(null);
    }
  };

  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">Cancellations & Refunds</h3>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>BookingId</TableHead>
            <TableHead>Reason</TableHead>
            <TableHead>Refund Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {refunds.length > 0 ? (
            refunds.map((entry: any, idx: number) => {
              const b = entry.booking;
              const key = `${entry.userId}-${b.bookingId}`;
              const canAdvance = STATUS_FLOW[b.refundStatus];

              return (
                <TableRow key={idx}>
                  <TableCell>
                    <div className="font-medium">{entry.userName}</div>
                    <div className="text-xs text-muted-foreground">
                      {entry.userEmail}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {b.bookingId}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {b.cancellationReason}
                  </TableCell>
                  <TableCell className="font-medium">
                    ₹ {b.refundAmount?.toLocaleString("en-IN")}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(b.refundStatus)}>
                      {b.refundStatus}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {canAdvance ? (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={updatingKey === key}
                        onClick={() =>
                          handleAdvance(
                            entry.userId,
                            b.bookingId,
                            b.refundStatus,
                          )
                        }
                      >
                        {updatingKey === key
                          ? "Updating..."
                          : `Mark as ${STATUS_FLOW[b.refundStatus]}`}
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        No action needed
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })
          ) : (
            <TableRow>
              <TableCell
                colSpan={6}
                className="text-center text-muted-foreground"
              >
                No cancellationsyet.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default RefundsTab;

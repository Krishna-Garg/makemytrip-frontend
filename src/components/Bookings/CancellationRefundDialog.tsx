"use client";
import { useEffect, useState } from "react";
import {
  X,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Loader2,
  IndianRupee,
} from "lucide-react";
import { getCancellationReasons, cancelBooking } from "@/api";

type Booking = {
  type: string;
  bookingId: string;
  date: string;
  quantity: number;
  totalPrice: number;
  bookingStatus?: string;
  cancellationReason?: string;
  cancelledAt?: string;
  refundAmount?: number;
  refundStatus?: string;
  refundEta?: string;
  refundRequestedAt?: string;
  refundCompletedAt?: string;
};

type Reason = { value: string; label: string };

interface Props {
  booking: Booking;
  userId: string;
  open: boolean;
  onClose: () => void;
  onCancelled: (updatedBooking: Booking) => void;
}

export default function CancellationRefundDialog({
  booking,
  userId,
  open,
  onClose,
  onCancelled,
}: Props) {
  const [reasons, setReasons] = useState<Reason[]>([]);
  const [selectedReason, setSelectedReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const isAlreadyCancelled = booking.bookingStatus === "CANCELLED";

  useEffect(() => {
    if (open && !isAlreadyCancelled) {
      getCancellationReasons().then(setReasons);
    }
  }, [open, isAlreadyCancelled]);

  if (!open) return null;

  const handleConfirmCancel = async () => {
    if (!selectedReason) {
      setError("Please select a reason for cancellation.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const updated = await cancelBooking(
        userId,
        booking.bookingId,
        selectedReason,
      );
      onCancelled(updated);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Could not cancel this booking. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>

        {isAlreadyCancelled ? (
          <RefundStatusView booking={booking} />
        ) : (
          <CancelFlowView
            booking={booking}
            reasons={reasons}
            selectedReason={selectedReason}
            setSelectedReason={setSelectedReason}
            error={error}
            submitting={submitting}
            onConfirm={handleConfirmCancel}
            onClose={onClose}
          />
        )}
      </div>
    </div>
  );
}

function CancelFlowView({
  booking,
  reasons,
  selectedReason,
  setSelectedReason,
  error,
  submitting,
  onConfirm,
  onClose,
}: any) {
  return (
    <>
      <div className="flex items-center space-x-2 mb-4">
        <div className="bg-red-100 p-2 rounded-lg">
          <AlertTriangle className="w-5 h-5 text-red-600" />
        </div>
        <h2 className="text-xl font-bold">Cancel Booking</h2>
      </div>

      <p className="text-sm text-gray-600 mb-4">
        You're about to cancel booking{" "}
        <span className="font-medium">{booking.bookingId}</span>. Your refund
        amount will be calculated automatically based on our cancellation
        policy, depending on how close it is to departure.
      </p>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Reason for cancellation
        </label>
        <select
          value={selectedReason}
          onChange={(e) => setSelectedReason(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white"
        >
          <option value="">Select a reason</option>
          {reasons.map((r: Reason) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

      <div className="flex space-x-3">
        <button
          onClick={onConfirm}
          disabled={submitting}
          className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center space-x-2 disabled:opacity-60"
        >
          {submitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <span>Confirm Cancellation</span>
          )}
        </button>
        <button
          onClick={onClose}
          disabled={submitting}
          className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Go Back
        </button>
      </div>
    </>
  );
}

function RefundStatusView({ booking }: { booking: Booking }) {
  const steps = [
    { key: "PENDING", label: "Refund Requested" },
    { key: "PROCESSED", label: "Refund Processed" },
    { key: "COMPLETED", label: "Refund Completed" },
  ];

  const currentIndex = steps.findIndex((s) => s.key === booking.refundStatus);
  const isRejected = booking.refundStatus === "REJECTED";

  return (
    <>
      <div className="flex items-center space-x-2 mb-4">
        <div className="bg-gray-100 p-2 rounded-lg">
          <Clock className="w-5 h-5 text-gray-600" />
        </div>
        <h2 className="text-xl font-bold">Refund Status</h2>
      </div>

      <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500">Booking ID</span>
          <span className="font-medium">{booking.bookingId}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Cancelled on</span>
          <span className="font-medium">
            {booking.cancelledAt
              ? new Date(booking.cancelledAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })
              : "-"}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Reason</span>
          <span className="font-medium">{booking.cancellationReason}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-500">Refund amount</span>
          <span className="font-semibold flex items-center">
            <IndianRupee className="w-3 h-3" />
            {booking.refundAmount?.toLocaleString("en-IN")}
          </span>
        </div>
        {booking.refundEta && (
          <div className="flex justify-between">
            <span className="text-gray-500">Expected timeline</span>
            <span className="font-medium">{booking.refundEta}</span>
          </div>
        )}
      </div>

      {isRejected ? (
        <div className="flex items-center space-x-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
          <AlertTriangle className="w-4 h-4" />
          <span>
            This cancellation was not eligible for a refund under our policy.
          </span>
        </div>
      ) : (
        <div className="space-y-4">
          {steps.map((step, i) => {
            const reached = i <= currentIndex;
            const isCurrent = i === currentIndex;
            return (
              <div key={step.key} className="flex items-start space-x-3">
                <div className="flex flex-col items-center">
                  {reached ? (
                    <CheckCircle2
                      className={`w-5 h-5 ${
                        isCurrent ? "text-amber-500" : "text-green-600"
                      }`}
                    />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                  )}
                  {i < steps.length - 1 && (
                    <div
                      className={`w-px h-6 ${
                        i < currentIndex ? "bg-green-600" : "bg-gray-300"
                      }`}
                    />
                  )}
                </div>
                <div>
                  <p
                    className={`text-sm font-medium ${
                      reached ? "text-gray-900" : "text-gray-400"
                    }`}
                  >
                    {step.label}
                  </p>
                  {isCurrent && (
                    <p className="text-xs text-gray-500">In progress</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

// components/Pricing/PriceFreezeButton.tsx
import { useState, useEffect } from "react";
import { Lock, Timer } from "lucide-react";
import { freezePrice } from "@/api";

interface Props {
  flightId: string;
  userId: string;
  currentPrice: number;
  tier: string;
  onFrozen: (frozenPrice: number) => void;
}

export default function PriceFreezeButton({ flightId, userId, currentPrice, tier, onFrozen }: Props) {
  const [freeze, setFreeze] = useState<any | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(false);

  const freezeMinutes = tier === "PLATINUM" ? 120 : 30;

  useEffect(() => {
    if (!freeze) return;
    const expiry = new Date(freeze.expiresAt).getTime();
    const tick = setInterval(() => {
      const left = Math.max(0, Math.floor((expiry - Date.now()) / 1000));
      setTimeLeft(left);
      if (left === 0) clearInterval(tick);
    }, 1000);
    return () => clearInterval(tick);
  }, [freeze]);

  const handleFreeze = async () => {
    if (!userId) { alert("Please log in to freeze a price."); return; }
    setLoading(true);
    try {
      const data = await freezePrice(flightId, userId);
      setFreeze(data);
      setTimeLeft(freezeMinutes * 60);
      onFrozen(data.frozenPrice);
    } catch {
      alert("Could not freeze price. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  if (freeze && timeLeft > 0) {
    return (
      <div className="w-full border-2 border-blue-500 rounded-lg p-3 bg-blue-50 text-center">
        <div className="flex items-center justify-center gap-2 text-blue-700 font-semibold text-sm mb-1">
          <Lock className="w-4 h-4" />
          Price Locked at ₹{freeze.frozenPrice.toLocaleString("en-IN")}
        </div>
        <div className="flex items-center justify-center gap-1 text-xs text-blue-500">
          <Timer className="w-3 h-3" />
          Expires in {formatTime(timeLeft)}
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={handleFreeze}
      disabled={loading}
      className="w-full border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-60"
    >
      <Lock className="w-4 h-4" />
      {loading ? "Freezing..." : `Freeze Price for ${freezeMinutes} min`}
      {tier !== "BASIC" && (
        <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">{tier}</span>
      )}
    </button>
  );
}

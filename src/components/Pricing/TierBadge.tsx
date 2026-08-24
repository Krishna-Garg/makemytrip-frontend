// components/Pricing/TierBadge.tsx
interface Props {
  tier: string;
  discount: string;
  nextTier: string;
}

const TIER_COLORS: Record<string, string> = {
  BASIC:    "bg-gray-100 text-gray-600 border-gray-200",
  SILVER:   "bg-gray-200 text-gray-700 border-gray-300",
  GOLD:     "bg-yellow-100 text-yellow-700 border-yellow-300",
  PLATINUM: "bg-blue-100 text-blue-700 border-blue-300",
};

export default function TierBadge({ tier, discount, nextTier }: Props) {
  return (
    <div className={`border rounded-lg px-3 py-2 text-xs ${TIER_COLORS[tier] || TIER_COLORS.BASIC}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="font-semibold">{tier} Member</span>
        {discount !== "0%" && (
          <span className="font-bold text-green-600">{discount} off</span>
        )}
      </div>
      <p className="text-gray-500">{nextTier}</p>
    </div>
  );
}

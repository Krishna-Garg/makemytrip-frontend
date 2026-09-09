// components/Pricing/PriceGraph.tsx
import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { getPriceHistory } from "@/api";
import { TrendingUp } from "lucide-react";

interface Props {
  flightId: string;
}

export default function PriceGraph({ flightId }: Props) {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPriceHistory(flightId).then((data) => {
      setHistory(data || []);
      setLoading(false);
    });
  }, [flightId]);

  if (loading) return <p className="text-sm text-gray-400">Loading price history...</p>;
  if (history.length === 0) return (
    <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-100 rounded-xl text-sm">
      <TrendingUp className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
      <div>
        <p className="font-medium text-blue-700">Price tracking just started</p>
        <p className="text-blue-500 text-xs mt-0.5">
          History builds automatically every hour. Check back soon to see price trends for this flight.
        </p>
      </div>
    </div>
  );


  const chartData = history.map((s) => ({
    time: new Date(s.timestamp).toLocaleString("en-IN", {
      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
    }),
    price: s.effectivePrice,
    base: s.basePrice,
  }));

  const min = Math.min(...chartData.map((d) => d.price));
  const max = Math.max(...chartData.map((d) => d.price));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-blue-600" />
          Price History
        </h3>
        <div className="flex gap-4 text-xs text-gray-500">
          <span>Low: <span className="text-green-600 font-medium">₹{min.toLocaleString()}</span></span>
          <span>High: <span className="text-red-600 font-medium">₹{max.toLocaleString()}</span></span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={160}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="time"
            tick={{ fontSize: 10, fill: "#9ca3af" }}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 10, fill: "#9ca3af" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `₹${(v / 1000).toFixed(1)}k`}
          />
          <Tooltip
            formatter={(value: any) => [`₹${Number(value).toLocaleString("en-IN")}`, "Price"]}
            labelStyle={{ fontSize: 11 }}
            contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}
          />
          <Line
            type="monotone"
            dataKey="price"
            stroke="#2563eb"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>

      <p className="text-xs text-gray-400">
        Price updates hourly based on seat demand. Lower price = more seats available.
      </p>
    </div>
  );
}

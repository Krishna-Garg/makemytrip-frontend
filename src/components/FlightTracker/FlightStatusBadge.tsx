import { Clock, CheckCircle, AlertTriangle, PlaneTakeoff } from "lucide-react";

const CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  ON_TIME: { label: "On Time", color: "bg-green-500", icon: CheckCircle },
  DELAYED: { label: "Delayed", color: "bg-red-500", icon: AlertTriangle },
  BOARDING: { label: "Boarding", color: "bg-blue-500", icon: PlaneTakeoff },
  DEPARTED: { label: "Departed", color: "bg-gray-500", icon: Clock },
};

export default function FlightStatusBadge({
  status,
  delayMinutes = 0,
  size = "sm",
}: {
  status: string;
  delayMinutes?: number;
  size?: "sm" | "md";
}) {
  const cfg = CONFIG[status] || CONFIG.ON_TIME;
  const Icon = cfg.icon;
  const text =
    status === "DELAYED" && delayMinutes > 0
      ? `Delayed ${delayMinutes}m`
      : cfg.label;
  const padding = size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm";
  return (
    <span
      className={`${cfg.color} text-white rounded-full font-medium flex items-center gap-1 ${padding}`}
    >
      <Icon className="w-3 h-3" />
      {text}
    </span>
  );
}

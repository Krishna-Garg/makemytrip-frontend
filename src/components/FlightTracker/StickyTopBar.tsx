import { useState, useEffect } from "react";
import { Bell, Plane, ChevronDown, ChevronUp, X, Search } from "lucide-react";
import {
  getFlightStatus,
  getMyNotifications,
  markNotificationRead,
} from "@/api";
import { useSelector } from "react-redux";
import FlightStatusBadge from "./FlightStatusBadge";

export default function StickyTopBar() {
  const user = useSelector((state: any) => state.user.user);
  const [trackedFlights, setTrackedFlights] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [searchId, setSearchId] = useState("");
  const [statusOpen, setStatusOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [searching, setSearching] = useState(false);

  // Poll tracked flights every 60s
  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("trackedFlights") || "[]");
    if (stored.length === 0) return;
    const refresh = async () => {
      const updated = await Promise.all(
        stored.map((id: string) => getFlightStatus(id).catch(() => null)),
      );
      setTrackedFlights(updated.filter(Boolean));
    };
    refresh();
    const interval = setInterval(refresh, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleSearch = async () => {
    if (!searchId.trim()) return;
    setSearching(true);
    try {
      const f = await getFlightStatus(searchId.trim());
      if (f) {
        setTrackedFlights((prev) => {
          const exists = prev.find((p) => (p._id || p.id) === (f._id || f.id));
          if (exists) return prev;
          const next = [...prev, f];
          localStorage.setItem(
            "trackedFlights",
            JSON.stringify(next.map((x) => x._id || x.id)),
          );
          return next;
        });
        setSearchId("");
      }
    } catch {
      alert("Flight not found");
    }
    setSearching(false);
  };

  const removeTracked = (id: string) => {
    setTrackedFlights((prev) => {
      const next = prev.filter((f) => (f._id || f.id) !== id);
      localStorage.setItem(
        "trackedFlights",
        JSON.stringify(next.map((x) => x._id || x.id)),
      );
      return next;
    });
  };

  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div className="sticky top-0 z-50 w-full bg-gray-900 text-white shadow-md">
      <div className="max-w-7xl mx-auto flex items-stretch divide-x divide-gray-700">
        {/* Panel 1: Airplane Status */}
        <div className="flex-1 relative">
          <button
            onClick={() => {
              setStatusOpen((v) => !v);
              setNotifOpen(false);
            }}
            className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-gray-800 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Plane className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-medium">Flight Status</span>
              {trackedFlights.length > 0 && (
                <span className="bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                  {trackedFlights.length}
                </span>
              )}
            </div>
            {statusOpen ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>

          {statusOpen && (
            <div className="absolute top-full left-0 w-96 bg-white text-gray-900 shadow-xl rounded-b-xl z-50 border border-gray-100">
              {/* Search box */}
              <div className="p-3 border-b flex gap-2">
                <input
                  value={searchId}
                  onChange={(e) => setSearchId(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  placeholder="Enter Flight ID to track..."
                  className="flex-1 text-sm border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleSearch}
                  disabled={searching}
                  className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-blue-700"
                >
                  <Search className="w-4 h-4" />
                </button>
              </div>

              {/* Tracked list */}
              {trackedFlights.length === 0 ? (
                <p className="text-sm text-gray-400 p-4 text-center">
                  No flights tracked yet.
                </p>
              ) : (
                <div className="divide-y max-h-72 overflow-y-auto">
                  {trackedFlights.map((f) => {
                    const fid = f._id || f.id;
                    return (
                      <div
                        key={fid}
                        className="p-3 flex items-start justify-between"
                      >
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-sm">
                              {f.flightName}
                            </span>
                            <FlightStatusBadge
                              status={f.status}
                              delayMinutes={f.delayMinutes}
                            />
                          </div>
                          <p className="text-xs text-gray-500">
                            {f.from} → {f.to}
                          </p>
                          {f.status === "DELAYED" && f.statusReason && (
                            <p className="text-xs text-red-500 mt-0.5">
                              Reason: {f.statusReason}
                            </p>
                          )}
                          {f.status === "BOARDING" && (
                            <p className="text-xs text-blue-500 mt-0.5">
                              Boarding now — Gate closes {f.boardingMinutes}min
                              before departure
                            </p>
                          )}
                          {f.estimatedDeparture && f.status === "DELAYED" && (
                            <p className="text-xs text-gray-600 mt-0.5">
                              New departure:{" "}
                              {new Date(
                                f.estimatedDeparture,
                              ).toLocaleTimeString("en-IN", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => removeTracked(fid)}
                          className="text-gray-400 hover:text-red-500"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Panel 2: Notifications Bell */}
        <div className="relative">
          <button
            onClick={() => {
              setNotifOpen((v) => !v);
              setStatusOpen(false);
            }}
            className="h-full flex items-center gap-2 px-4 py-2.5 hover:bg-gray-800 transition-colors"
          >
            <Bell className="w-4 h-4 text-yellow-400" />
            <span className="text-sm font-medium">Notifications</span>
            {unread > 0 && (
              <span className="bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                {unread}
              </span>
            )}
            {notifOpen ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>

          {notifOpen && (
            <div className="absolute top-full right-0 w-80 bg-white text-gray-900 shadow-xl rounded-b-xl z-50 border border-gray-100">
              <div className="p-3 border-b flex justify-between items-center">
                <span className="font-semibold text-sm">Notifications</span>
                {unread > 0 && (
                  <button
                    className="text-xs text-blue-600 hover:underline"
                    onClick={() =>
                      setNotifications((n) =>
                        n.map((x) => ({ ...x, read: true })),
                      )
                    }
                  >
                    Mark all read
                  </button>
                )}
              </div>
              {notifications.length === 0 ? (
                <p className="text-sm text-gray-400 p-4 text-center">
                  No notifications yet.
                </p>
              ) : (
                <div className="divide-y max-h-72 overflow-y-auto">
                  {notifications.map((n, i) => (
                    <div
                      key={i}
                      className={`p-3 text-sm ${n.read ? "opacity-60" : "bg-blue-50"}`}
                    >
                      <p className="font-medium">{n.flightName}</p>
                      <p className="text-gray-600 text-xs mt-0.5">
                        {n.message}
                      </p>
                      <p className="text-gray-400 text-xs mt-1">
                        {new Date(n.createdAt).toLocaleString("en-IN")}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Panel 3: Placeholder for Feature2 */}
        <div className="flex-1 flex items-center justify-center px-4 py-2.5 text-gray-500 text-sm">
          <span>More Features Coming Soon</span>
        </div>
      </div>
    </div>
  );
}

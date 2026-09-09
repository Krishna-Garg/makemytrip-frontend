"use client";
import { useState, useEffect, useCallback } from "react";
import { Bell, Plane, ChevronDown, ChevronUp, X, Search, CheckCheck } from "lucide-react";
import { getFlightStatus, getMyNotifications, markAllNotificationsRead, markOneNotificationRead } from "@/api";
import { useSelector } from "react-redux";
import FlightStatusBadge from "./FlightStatusBadge";

export default function StickyTopBar() {
  const user = useSelector((state: any) => state.user.user);
  const userId = user?.id || user?._id || null;

  const [trackedFlights, setTrackedFlights] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [searchId, setSearchId] = useState("");
  const [statusOpen, setStatusOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [searching, setSearching] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Poll tracked flight statuses every 60s
  const refreshTracked = useCallback(async () => {
    const stored = JSON.parse(localStorage.getItem("trackedFlights") || "[]");
    if (stored.length === 0) { setTrackedFlights([]); return; }
    const updated = await Promise.all(
      stored.map((id: string) => getFlightStatus(id).catch(() => null))
    );
    setTrackedFlights(updated.filter(Boolean));
  }, []);

  // Poll notifications every 30s if logged in
  const refreshNotifications = useCallback(async () => {
    if (!userId) return;
    const data = await getMyNotifications(userId);
    setNotifications(data || []);
  }, [userId]);

  useEffect(() => {
    refreshTracked();
    refreshNotifications();
    const t1 = setInterval(refreshTracked, 60000);
    const t2 = setInterval(refreshNotifications, 30000);
    return () => { clearInterval(t1); clearInterval(t2); };
  }, [refreshTracked, refreshNotifications]);

  const handleSearch = async () => {
    if (!searchId.trim()) return;
    setSearching(true);
    try {
      const f = await getFlightStatus(searchId.trim());
      if (f) {
        setTrackedFlights((prev) => {
          const fid = f._id || f.id;
          if (prev.find((p) => (p._id || p.id) === fid)) return prev;
          const next = [...prev, f];
          localStorage.setItem("trackedFlights", JSON.stringify(next.map((x) => x._id || x.id)));
          return next;
        });
        setSearchId("");
      }
    } catch { alert("Flight not found"); }
    setSearching(false);
  };

  const removeTracked = (id: string) => {
    setTrackedFlights((prev) => {
      const next = prev.filter((f) => (f._id || f.id) !== id);
      localStorage.setItem("trackedFlights", JSON.stringify(next.map((x) => x._id || x.id)));
      return next;
    });
  };

  const handleMarkAllRead = async () => {
    if (!userId) return;
    await markAllNotificationsRead(userId);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleMarkOneRead = async (notifId: string) => {
    await markOneNotificationRead(notifId);
    setNotifications((prev) => prev.map((n) => n.id === notifId ? { ...n, read: true } : n));
  };

  const formatTime = (ts: string) => {
    try {
      return new Date(ts).toLocaleString("en-IN", {
        day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
      });
    } catch { return ts; }
  };

  const typeColor: Record<string, string> = {
    DELAY: "border-l-red-500",
    BOARDING: "border-l-blue-500",
    DEPARTED: "border-l-gray-400",
    STATUS_CHANGE: "border-l-yellow-400",
  };

  return (
    <div className="sticky top-0 z-50 w-full bg-gray-900 text-white shadow-md">
      <div className="max-w-7xl mx-auto flex items-stretch divide-x divide-gray-700">

        {/* Panel 1: Flight Status Tracker */}
        <div className="flex-1 relative">
          <button
            onClick={() => { setStatusOpen((v) => !v); setNotifOpen(false); }}
            className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-gray-800 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Plane className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-medium">Flight Tracker</span>
              {trackedFlights.length > 0 && (
                <span className="bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                  {trackedFlights.length}
                </span>
              )}
            </div>
            {statusOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {statusOpen && (
            <div className="absolute top-full left-0 w-96 bg-white text-gray-900 shadow-xl rounded-b-xl z-50 border border-gray-100">
              {/* Search */}
              <div className="p-3 border-b flex gap-2">
                <input
                  value={searchId}
                  onChange={(e) => setSearchId(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  placeholder="Enter Flight ID to track..."
                  className="flex-1 text-sm border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button onClick={handleSearch} disabled={searching}
                  className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-blue-700">
                  <Search className="w-4 h-4" />
                </button>
              </div>

              {trackedFlights.length === 0 ? (
                <p className="text-sm text-gray-400 p-4 text-center">
                  No flights tracked. Enter a Flight ID above.
                </p>
              ) : (
                <div className="divide-y max-h-72 overflow-y-auto">
                  {trackedFlights.map((f) => {
                    const fid = f._id || f.id;
                    return (
                      <div key={fid} className="p-3 flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-sm">{f.flightName}</span>
                            <FlightStatusBadge status={f.status || "ON_TIME"} delayMinutes={f.delayMinutes} />
                          </div>
                          <p className="text-xs text-gray-500">{f.from} → {f.to}</p>
                          {f.statusReason && (
                            <p className="text-xs text-red-500 mt-0.5">Reason: {f.statusReason}</p>
                          )}
                          {f.status === "BOARDING" && (
                            <p className="text-xs text-blue-500 mt-0.5">
                              Boarding open — closes {f.boardingMinutes}min before departure
                            </p>
                          )}
                          {f.estimatedDeparture && f.status === "DELAYED" && (
                            <p className="text-xs text-gray-500 mt-0.5">
                              New departure: {formatTime(f.estimatedDeparture)}
                            </p>
                          )}
                        </div>
                        <button onClick={() => removeTracked(fid)}
                          className="text-gray-400 hover:text-red-500 ml-2 mt-0.5">
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
            onClick={() => { setNotifOpen((v) => !v); setStatusOpen(false); }}
            className="h-full flex items-center gap-2 px-4 py-2.5 hover:bg-gray-800 transition-colors"
          >
            <Bell className="w-4 h-4 text-yellow-400" />
            <span className="text-sm font-medium">Notifications</span>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
            {notifOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {notifOpen && (
            <div className="absolute top-full right-0 w-80 bg-white text-gray-900 shadow-xl rounded-b-xl z-50 border border-gray-100">
              <div className="p-3 border-b flex justify-between items-center">
                <span className="font-semibold text-sm">
                  Notifications {unreadCount > 0 && <span className="text-red-500">({unreadCount} new)</span>}
                </span>
                {unreadCount > 0 && (
                  <button onClick={handleMarkAllRead}
                    className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                    <CheckCheck className="w-3 h-3" /> Mark all read
                  </button>
                )}
              </div>

              {!userId ? (
                <p className="text-sm text-gray-400 p-4 text-center">Log in to see notifications.</p>
              ) : notifications.length === 0 ? (
                <p className="text-sm text-gray-400 p-4 text-center">No notifications yet.</p>
              ) : (
                <div className="divide-y max-h-80 overflow-y-auto">
                  {notifications.map((n: any) => (
                    <div
                      key={n.id}
                      onClick={() => !n.read && handleMarkOneRead(n.id)}
                      className={`p-3 border-l-4 cursor-pointer transition-colors ${
                        typeColor[n.type] || "border-l-gray-300"
                      } ${n.read ? "bg-white opacity-70" : "bg-blue-50"}`}
                    >
                      <p className="text-sm font-medium">{n.flightName}</p>
                      <p className="text-xs text-gray-600 mt-0.5">{n.message}</p>
                      <p className="text-xs text-gray-400 mt-1">{formatTime(n.createdAt)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Panel 3: Placeholder */}
        <div className="flex-1 flex items-center justify-center px-4 py-2.5 text-gray-500 text-sm">
          More Features Coming Soon
        </div>
      </div>
    </div>
  );
}

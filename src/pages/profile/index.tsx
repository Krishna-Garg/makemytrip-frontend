import React, { useState, useEffect } from "react";
import {
  User, Phone, Mail, Edit2, MapPin, Calendar, CreditCard,
  X, Check, LogOut, Plane, Building2, XCircle, CheckCircle2, Clock,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/router";
import { clearUser, setUser } from "@/store";
import { editprofile, getMyBookings, getFlightStatus } from "@/api";
import CancellationRefundDialog from "@/components/Bookings/CancellationRefundDialog";
import FlightStatusBadge from "@/components/FlightTracker/FlightStatusBadge";
import RecommendationPanel from "@/components/Recommendations/RecommendationPanel";

const index = () => {
  const dispatch = useDispatch();
  const user = useSelector((state: any) => state.user.user);
  const router = useRouter();

  const logout = () => { dispatch(clearUser()); router.push("/"); };

  const [isEditing, setIsEditing] = useState(false);
  const [userData, setUserData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    phoneNumber: user?.phoneNumber || "",
  });
  const [bookings, setBookings] = useState<any[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [activeBooking, setActiveBooking] = useState<any | null>(null);
  const [trackedFlights, setTrackedFlights] = useState<any[]>([]);
  const [editForm, setEditForm] = useState({ ...userData });

  const fetchBookings = async () => {
    if (!user?.id) return;
    setLoadingBookings(true);
    const data = await getMyBookings(user.id);
    setBookings(data || []);
    setLoadingBookings(false);
  };

  useEffect(() => { fetchBookings(); }, [user?.id]);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("trackedFlights") || "[]");
    if (stored.length === 0) return;
    Promise.all(stored.map((id: string) => getFlightStatus(id).catch(() => null)))
      .then((results) => setTrackedFlights(results.filter(Boolean)));
  }, []);

  const handleSave = async () => {
    try {
      const data = await editprofile(user?.id, userData.firstName, userData.lastName, userData.email, userData.phoneNumber);
      dispatch(setUser(data));
      setIsEditing(false);
    } catch { setUserData(editForm); setIsEditing(false); }
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });

  const handleEditFormChange = (field: any, value: any) =>
    setUserData((prev) => ({ ...prev, [field]: value }));

  const handleCancelled = (updatedBooking: any) => {
    setBookings((prev) => prev.map((b) =>
      b.bookingId === updatedBooking.bookingId && b.date === updatedBooking.date ? updatedBooking : b
    ));
    setActiveBooking(updatedBooking);
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-8 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

          {/* Profile */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold">Profile</h2>
                {!isEditing && (
                  <button onClick={() => setIsEditing(true)} className="text-red-600 flex items-center space-x-1 hover:text-red-700">
                    <Edit2 className="w-4 h-4" /><span>Edit</span>
                  </button>
                )}
              </div>
              {isEditing ? (
                <div className="space-y-4">
                  {[
                    { label: "First Name", field: "firstName", type: "text" },
                    { label: "Last Name", field: "lastName", type: "text" },
                    { label: "Email", field: "email", type: "email" },
                    { label: "Phone Number", field: "phoneNumber", type: "tel" },
                  ].map(({ label, field, type }) => (
                    <div key={field}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                      <input type={type} value={(userData as any)[field]}
                        onChange={(e) => handleEditFormChange(field, e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500" />
                    </div>
                  ))}
                  <div className="flex space-x-3">
                    <button onClick={handleSave}
                      className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center space-x-2">
                      <Check className="w-4 h-4" /><span>Save</span>
                    </button>
                    <button onClick={() => { setIsEditing(false); setEditForm({ ...user }); }}
                      className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2">
                      <X className="w-4 h-4" /><span>Cancel</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center space-x-3">
                    <User className="w-5 h-5 text-gray-500" />
                    <p className="font-medium">{user?.firstName} {user?.lastName}</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Mail className="w-5 h-5 text-gray-500" /><p>{user?.email}</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Phone className="w-5 h-5 text-gray-500" /><p>{user?.phoneNumber}</p>
                  </div>
                  <button className="w-full mt-4 flex items-center justify-center space-x-2 text-red-600 hover:text-red-700" onClick={logout}>
                    <LogOut className="w-4 h-4" /><span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Bookings */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-6">My Bookings</h2>
              {loadingBookings ? (
                <p className="text-gray-500 text-sm">Loading Bookings...</p>
              ) : bookings.length === 0 ? (
                <p className="text-gray-500 text-sm">No bookings yet.</p>
              ) : (
                <div className="space-y-4">
                  {bookings.map((booking: any, idx: number) => {
                    const isCancelled = booking.bookingStatus === "CANCELLED";
                    return (
                      <div key={idx} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            {booking?.type === "Flight" ? (
                              <div className="bg-blue-100 p-2 rounded-lg">
                                <Plane className="w-6 h-6 text-blue-600" />
                              </div>
                            ) : (
                              <div className="bg-green-100 p-2 rounded-lg">
                                <Building2 className="w-6 h-6 text-green-600" />
                              </div>
                            )}
                            <div>
                              <h3 className="font-semibold">{booking?.type}</h3>
                              <p className="text-sm text-gray-500">Booking ID: {booking?.bookingId}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">₹ {booking?.totalPrice.toLocaleString("en-IN")}</p>
                            <p className={`text-sm ${isCancelled ? "text-red-500" : "text-gray-500"}`}>
                              {isCancelled ? "Cancelled" : "Confirmed"}
                            </p>
                          </div>
                        </div>

                        {/* Seat / Room info */}
                        {booking?.selectedSeats?.length > 0 && (
                          <div className="mb-2 flex flex-wrap gap-1">
                            {booking.selectedSeats.map((s: string) => (
                              <span key={s} className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                                Seat {s}
                              </span>
                            ))}
                          </div>
                        )}
                        {booking?.selectedRoomType && (
                          <div className="mb-2">
                            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">
                              {booking.selectedRoomType} Room
                            </span>
                          </div>
                        )}

                        <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-gray-600">
                          <div className="flex flex-wrap gap-4">
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-4 h-4" /><span>{formatDate(booking?.date)}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <CreditCard className="w-4 h-4" /><span>Paid</span>
                            </div>
                          </div>
                          {booking.refundStatus === "COMPLETED" ? (
                            <span className="flex items-center space-x-1 text-sm font-medium text-green-600">
                              <CheckCircle2 className="w-4 h-4" /><span>Refund Completed</span>
                            </span>
                          ) : isCancelled ? (
                            <button onClick={() => setActiveBooking(booking)}
                              className="flex items-center space-x-1 text-sm font-medium text-gray-600 hover:text-gray-800">
                              <Clock className="w-4 h-4" /><span>Track Refund</span>
                            </button>
                          ) : (
                            <button onClick={() => setActiveBooking(booking)}
                              className="flex items-center space-x-1 text-sm font-medium text-red-600 hover:text-red-700">
                              <XCircle className="w-4 h-4" /><span>Cancel Booking</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tracked Flights */}
        {trackedFlights.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-6">Tracked Flights</h2>
            <div className="space-y-4">
              {trackedFlights.map((f: any) => (
                <div key={f._id || f.id} className="border rounded-lg p-4 flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <Plane className="w-5 h-5 text-blue-600" />
                      <span className="font-semibold">{f.flightName}</span>
                      <FlightStatusBadge status={f.status || "ON_TIME"} delayMinutes={f.delayMinutes} size="sm" />
                    </div>
                    <p className="text-sm text-gray-500">{f.from} → {f.to}</p>
                    {f.statusReason && <p className="text-xs text-red-500 mt-1">{f.statusReason}</p>}
                    {f.status === "DELAYED" && f.estimatedDeparture && (
                      <p className="text-xs text-gray-500 mt-1">
                        New departure: {new Date(f.estimatedDeparture).toLocaleString("en-IN")}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      const stored = JSON.parse(localStorage.getItem("trackedFlights") || "[]");
                      const updated = stored.filter((sid: string) => sid !== (f._id || f.id));
                      localStorage.setItem("trackedFlights", JSON.stringify(updated));
                      setTrackedFlights((prev) => prev.filter((x) => (x._id || x.id) !== (f._id || f.id)));
                    }}
                    className="text-gray-400 hover:text-red-500 text-xs"
                  >
                    Untrack
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
	<div className="bg-white rounded-xl shadow-lg p-6">
		<RecommendationPanel variant="full" />
	</div>
      </div>

      {activeBooking && (
        <CancellationRefundDialog
          booking={activeBooking} userId={user?.id}
          open={!!activeBooking} onClose={() => setActiveBooking(null)}
          onCancelled={handleCancelled}
        />
      )}
    </div>
  );
};

export default index;

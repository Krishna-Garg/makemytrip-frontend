import { useRouter } from "next/router";
import {
  Plane, Luggage, Clock, Calendar, MapPin,
  Gift, CreditCard, AlertCircle, ArrowRight,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  getflight, gethotel, handleflightbooking,
  getEffectivePrice, getUserTier, freezePrice, getPriceHistory,
} from "@/api";
import { useDispatch, useSelector } from "react-redux";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, Ticket } from "lucide-react";
import SignupDialog from "@/components/SignupDialog";
import Loader from "@/components/Loader";
import { setUser } from "@/store";
import ReviewList from "@/components/Reviews/ReviewList";
import PriceGraph from "@/components/Pricing/PriceGraph";
import PriceFreezeButton from "@/components/Pricing/PriceFreezeButton";
import TierBadge from "@/components/Pricing/TierBadge";
import SeatMap from "@/components/Seats/SeatMap";

interface Flight {
  _id: string; id: string; flightName: string; from: string; to: string;
  departureTime: string; arrivalTime: string; price: number; availableSeats: number;
}
interface Hotel {
  _id: string; id: string; hotelName: string; location: string;
  pricePerNight: number; availableRooms: number; amenities: string;
}

const TAX_RATE = 0.18;
const SERVICE_FEE = 249;

const BookFlightPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const [flight, setFlight] = useState<Flight | null>(null);
  const [relatedHotels, setRelatedHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [open, setOpen] = useState(false);
  const [policyOpen, setPolicyOpen] = useState(false);
  const [pricing, setPricing] = useState<any>(null);
  const [tierInfo, setTierInfo] = useState<any>(null);
  const [finalPrice, setFinalPrice] = useState<number>(0);
  const [selectedSeats, setSelectedSeats] = useState<any[]>([]);
  const [seatsConfirmed, setSeatsConfirmed] = useState(false);

  const user = useSelector((state: any) => state.user.user);
  const dispatch = useDispatch();

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      try {
        const flights: Flight[] = await getflight();
        const found = flights.find((f) => f._id === id || f.id === id) || null;
        setFlight(found);
        const hotels: Hotel[] = await gethotel();
        setRelatedHotels(hotels.slice(0, 3));
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchData();
  }, [id]);

  useEffect(() => {
    if (!id || !flight) return;
    const fetchPricing = async () => {
      const userId = user?.id || user?._id || null;
      const [priceData, tierData] = await Promise.all([
        getEffectivePrice(String(id), userId),
        userId ? getUserTier(userId) : Promise.resolve({
          tier: "BASIC", discount: "0%", freezeMinutes: 30,
          nextTier: "3 qualifying bookings for SILVER",
        }),
      ]);
      if (priceData) { setPricing(priceData); setFinalPrice(priceData.finalPrice); }
      setTierInfo(tierData);
    };
    fetchPricing();
  }, [id, flight, user]);

  if (loading) return <Loader />;
  if (!flight) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-500">No flight found for this ID.</p>
    </div>
  );

  const handleTrackFlight = () => {
    const flightId = flight._id || flight.id;
    const stored = JSON.parse(localStorage.getItem("trackedFlights") || "[]");
    if (!stored.includes(flightId)) {
      localStorage.setItem("trackedFlights", JSON.stringify([...stored, flightId]));
    }
    alert(`Now tracking ${flight.flightName}. Check the status bar at the top.`);
  };

  // Use seat prices if seats selected, otherwise dynamic price
  const unitPrice = selectedSeats.length > 0
    ? selectedSeats.reduce((sum, s) => sum + s.price, 0) / selectedSeats.length
    : (finalPrice || flight.price);
  const baseFare = unitPrice * quantity;
  const taxes = Math.round(baseFare * TAX_RATE);
  const serviceFee = SERVICE_FEE * quantity;
  const grandTotal = baseFare + taxes + serviceFee;

  const formatDate = (d: string) => new Date(d).toLocaleString("en-US", {
    year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
  const formatDuration = (dep: string, arr: string) => {
    const diff = new Date(arr).getTime() - new Date(dep).getTime();
    return `${Math.floor(diff / 3600000)}h ${Math.floor((diff % 3600000) / 60000)}m`;
  };

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = await handleflightbooking(
        user?.id, flight._id || flight.id, quantity, grandTotal,
        selectedSeats.map((s) => s.seatNumber)
      );
      dispatch(setUser({ ...user, bookings: [...(user.bookings || []), data] }));
      setOpen(false);
      router.push("/profile");
    } catch (error) { console.log(error); }
  };

  const BookingContent = () => (
    <DialogContent className="sm:max-w-[600px] bg-white">
      <DialogHeader>
        <DialogTitle className="text-2xl font-bold flex items-center">
          <Plane className="w-6 h-6 mr-2" />Flight Booking Details
        </DialogTitle>
      </DialogHeader>
      <div className="grid gap-6 mt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="flex items-center"><Plane className="w-4 h-4 mr-2" />Flight</Label>
            <Input value={flight.flightName} readOnly />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center"><MapPin className="w-4 h-4 mr-2" />From</Label>
            <Input value={flight.from} readOnly />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center"><MapPin className="w-4 h-4 mr-2" />To</Label>
            <Input value={flight.to} readOnly />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center"><Calendar className="w-4 h-4 mr-2" />Departure</Label>
            <Input value={formatDate(flight.departureTime)} readOnly />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center"><Clock className="w-4 h-4 mr-2" />Arrival</Label>
            <Input value={formatDate(flight.arrivalTime)} readOnly />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center"><Ticket className="w-4 h-4 mr-2" />Seats</Label>
            <Input value={selectedSeats.length > 0
              ? selectedSeats.map((s) => s.seatNumber).join(", ")
              : `${quantity} seat(s) - no preference`} readOnly />
          </div>
        </div>
        <div className="bg-gray-100 rounded-lg p-4 space-y-2 text-sm">
          <h3 className="font-bold flex items-center mb-2">
            <CreditCard className="w-4 h-4 mr-2" />Fare Summary
          </h3>
          {selectedSeats.length > 0 && (
            <div className="flex justify-between text-blue-600 text-xs">
              <span>Selected seats: {selectedSeats.map((s) => `${s.seatNumber}(${s.seatClass})`).join(", ")}</span>
            </div>
          )}
          {pricing?.multiplier > 1 && (
            <div className="flex justify-between text-orange-600 text-xs">
              <span>Demand surcharge</span><span>×{pricing.multiplier}</span>
            </div>
          )}
          {tierInfo?.discount !== "0%" && (
            <div className="flex justify-between text-green-600 text-xs">
              <span>{tierInfo?.tier} discount</span><span>-{tierInfo?.discount}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-600">Base Fare</span><span>₹ {baseFare.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Taxes (18%)</span><span>₹ {taxes.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Service Fee</span><span>₹ {serviceFee.toLocaleString()}</span>
          </div>
          <div className="flex justify-between font-bold text-base border-t pt-2">
            <span>Total</span><span>₹ {grandTotal.toLocaleString()}</span>
          </div>
        </div>
        <Button onClick={handleBooking} className="w-full bg-red-600 hover:bg-red-700 text-white">
          Confirm Booking — ₹ {grandTotal.toLocaleString()}
        </Button>
      </div>
    </DialogContent>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center text-sm text-gray-500 gap-2">
          <span>Flights</span><ArrowRight className="w-4 h-4" />
          <span>{flight.from}</span><ArrowRight className="w-4 h-4" />
          <span>{flight.to}</span><ArrowRight className="w-4 h-4" />
          <span className="text-gray-700 font-medium">{flight.flightName}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left column */}
          <div className="lg:col-span-2 space-y-6">

            {/* Flight card */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold">{flight.flightName}</h1>
                <span className={`text-sm font-medium px-3 py-1 rounded-full ${
                  flight.availableSeats < 10 ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"
                }`}>{flight.availableSeats} seats left</span>
              </div>
              <div className="flex items-center justify-between py-4 border-y">
                <div>
                  <p className="text-3xl font-bold">{flight.from}</p>
                  <p className="text-gray-500 text-sm mt-1">{formatDate(flight.departureTime)}</p>
                </div>
                <div className="flex flex-col items-center text-gray-300 px-4">
                  <Plane className="w-6 h-6 rotate-90" />
                  <div className="w-20 h-px bg-gray-200 my-2" />
                  <span className="text-xs text-gray-400 font-medium">
                    {formatDuration(flight.departureTime, flight.arrivalTime)}
                  </span>
                  <span className="text-xs text-gray-400">Direct</span>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold">{flight.to}</p>
                  <p className="text-gray-500 text-sm mt-1">{formatDate(flight.arrivalTime)}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-6 mt-4 text-sm text-gray-600">
                <div className="flex items-center gap-2"><Luggage className="w-5 h-5 text-gray-400" /><span>Cabin: 7 Kgs</span></div>
                <div className="flex items-center gap-2"><Luggage className="w-5 h-5 text-gray-400" /><span>Check-in: 15 Kgs</span></div>
              </div>
            </div>

            {/* Seat Map */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-bold mb-4">Select Your Seats</h2>
              <SeatMap
                flightId={String(id)}
                maxSeats={quantity}
                onSeatsSelected={(seats) => {
                  setSelectedSeats(seats);
                  setSeatsConfirmed(seats.length > 0);
                }}
              />
            </div>

            {/* Cancellation policy */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold flex items-center">
                  <AlertCircle className="w-5 h-5 mr-2 text-orange-500" />
                  Cancellation & Refund Policy
                </h2>
                <button onClick={() => setPolicyOpen(true)} className="text-blue-600 text-sm font-medium hover:underline">
                  View Full Policy
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                {[
                  { dot: "bg-green-500", time: "> 7 days", refund: "100% refund" },
                  { dot: "bg-yellow-400", time: "1–7 days", refund: "75% refund" },
                  { dot: "bg-orange-400", time: "Within 24 hours", refund: "50% refund" },
                  { dot: "bg-red-500", time: "After departure", refund: "No refund" },
                ].map((row) => (
                  <div key={row.time} className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg">
                    <div className={`w-2.5 h-2.5 rounded-full ${row.dot} mt-0.5 shrink-0`} />
                    <div><div className="font-medium">{row.time}</div><div className="text-gray-500">{row.refund}</div></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Related hotels */}
            {relatedHotels.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold flex items-center">
                    <Gift className="w-5 h-5 mr-2 text-red-500" />Hotels at {flight.to}
                  </h2>
                  <span className="bg-red-100 text-red-600 text-xs px-3 py-1 rounded-full">Flyer Exclusive</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {relatedHotels.map((h) => (
                    <div key={h._id || h.id} onClick={() => router.push(`/book-hotel/${h._id || h.id}`)}
                      className="border rounded-xl overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
                      <div className="h-32 bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                        <MapPin className="w-8 h-8 text-blue-400" />
                      </div>
                      <div className="p-3">
                        <h3 className="font-semibold text-sm mb-1 truncate">{h.hotelName}</h3>
                        <div className="flex items-center text-xs text-gray-500 mb-2">
                          <MapPin className="w-3 h-3 mr-1" />{h.location}
                        </div>
                        <div className="font-bold text-sm">
                          ₹ {h.pricePerNight.toLocaleString()}<span className="text-gray-400 font-normal">/night</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Price graph */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <PriceGraph flightId={String(id)} />
            </div>

            {/* Reviews */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <ReviewList targetId={String(id)} targetType="FLIGHT" />
            </div>
          </div>

          {/* Right column */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-24 space-y-4">

              {pricing && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Current Price</span>
                    {pricing.multiplier > 1 && (
                      <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                        {pricing.multiplierReason}
                      </span>
                    )}
                  </div>
                  <div className="flex items-end gap-2">
                    <span className="text-3xl font-bold">₹{finalPrice.toLocaleString("en-IN")}</span>
                    {pricing.basePrice !== finalPrice && (
                      <span className="text-gray-400 line-through text-sm mb-1">
                        ₹{pricing.basePrice.toLocaleString("en-IN")}
                      </span>
                    )}
                  </div>
                  {pricing.hasFrozen && (
                    <div className="text-xs text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">
                      🔒 Frozen price: ₹{pricing.frozenPrice.toLocaleString("en-IN")}
                    </div>
                  )}
                </div>
              )}

              {tierInfo && <TierBadge tier={tierInfo.tier} discount={tierInfo.discount} nextTier={tierInfo.nextTier} />}

              {/* Selected seats summary */}
              {selectedSeats.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm">
                  <p className="font-medium text-green-700 mb-1">Seats Selected ✓</p>
                  <p className="text-green-600 text-xs">
                    {selectedSeats.map((s) => `${s.seatNumber} (${s.seatClass})`).join(", ")}
                  </p>
                </div>
              )}

              <h2 className="text-lg font-bold flex items-center">
                <CreditCard className="w-5 h-5 mr-2 text-gray-600" />Fare Summary
              </h2>

              <div className="flex items-center justify-between border rounded-lg px-3 py-2">
                <span className="text-sm text-gray-600">Seats</span>
                <div className="flex items-center gap-2">
                  <button onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-7 h-7 rounded-full border flex items-center justify-center text-gray-600 hover:bg-gray-50">−</button>
                  <span className="w-6 text-center font-semibold">{quantity}</span>
                  <button onClick={() => setQuantity((q) => Math.min(flight.availableSeats, q + 1))}
                    className="w-7 h-7 rounded-full border flex items-center justify-center text-gray-600 hover:bg-gray-50">+</button>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Base Fare</span><span>₹ {baseFare.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Taxes (18%)</span><span>₹ {taxes.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Service Fee</span><span>₹ {serviceFee.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold text-base border-t pt-2">
                  <span>Total</span><span>₹ {grandTotal.toLocaleString()}</span>
                </div>
              </div>

              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full bg-red-600 hover:bg-red-700 text-white">Book Now</Button>
                </DialogTrigger>
                {user ? <BookingContent /> : (
                  <DialogContent className="bg-white">
                    <DialogHeader><DialogTitle>Login Required</DialogTitle></DialogHeader>
                    <p className="text-sm text-gray-600 mb-4">Please log in to continue.</p>
                    <SignupDialog trigger={<Button className="w-full">Log In / Sign Up</Button>} />
                  </DialogContent>
                )}
              </Dialog>

              <button onClick={handleTrackFlight}
                className="w-full border border-blue-600 text-blue-600 py-2 rounded-lg hover:bg-blue-50 transition-colors text-sm font-medium">
                Track This Flight
              </button>

              {user && tierInfo && !pricing?.hasFrozen && (
                <PriceFreezeButton
                  flightId={String(id)} userId={user.id || user._id}
                  currentPrice={finalPrice} tier={tierInfo.tier}
                  onFrozen={(fp) => setFinalPrice(fp)}
                />
              )}

              <div className="bg-[#FFF8E7] p-4 rounded-xl">
                <h3 className="font-bold mb-3 flex items-center text-sm">
                  <Gift className="w-4 h-4 mr-2 text-yellow-600" />PROMO CODES
                </h3>
                <input type="text" placeholder="Enter promo code"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-red-500 mb-3" />
                {[
                  { code: "MMTSECURE", description: "₹299 instant discount" },
                  { code: "SPECIALUPI", description: "₹362 off on UPI payments" },
                ].map((offer) => (
                  <div key={offer.code} className="bg-white p-3 rounded-lg mb-2 shadow-sm">
                    <div className="flex items-start gap-3">
                      <input type="radio" name="promo" className="mt-1 h-4 w-4 text-red-600" />
                      <div>
                        <div className="font-semibold text-red-600 text-sm">{offer.code}</div>
                        <p className="text-xs text-gray-600 mt-0.5">{offer.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={policyOpen} onOpenChange={setPolicyOpen}>
        <DialogContent className="bg-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-500" />Cancellation & Refund Policy
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm mt-2">
            {[
              { dot: "bg-green-500", label: "> 7 days before departure", refund: "100%", eta: "3–5 business days" },
              { dot: "bg-yellow-400", label: "1–7 days before departure", refund: "75%", eta: "5–7 business days" },
              { dot: "bg-orange-400", label: "Within 24 hours", refund: "50%", eta: "7–10 business days" },
              { dot: "bg-red-500", label: "After departure / no-show", refund: "0%", eta: "N/A" },
            ].map((row) => (
              <div key={row.label} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className={`w-3 h-3 rounded-full ${row.dot} mt-0.5 shrink-0`} />
                <div>
                  <div className="font-semibold">{row.label}</div>
                  <div className="text-gray-500">{row.refund} refund · {row.eta}</div>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BookFlightPage;

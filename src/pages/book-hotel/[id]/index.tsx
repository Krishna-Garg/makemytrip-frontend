import { useRouter } from "next/router";
import {
  MapPin, CreditCard, Ticket, Home, AlertCircle,
  TrendingUp, Lock, Tag,
} from "lucide-react";
import { useEffect, useState } from "react";
import { gethotel, handlehotelbooking, getHotelEffectivePrice, getUserTier } from "@/api";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDispatch, useSelector } from "react-redux";
import SignupDialog from "@/components/SignupDialog";
import Loader from "@/components/Loader";
import { setUser } from "@/store";
import ReviewList from "@/components/Reviews/ReviewList";
import RoomSelector from "@/components/Seats/RoomSelector";
import TierBadge from "@/components/Pricing/TierBadge";

// Room type stock images — real photos keyed by type
const ROOM_IMAGES: Record<string, string> = {
  STANDARD: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=800&q=80",
  DELUXE:   "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80",
  SUITE:    "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=800&q=80",
};

const HOTEL_IMAGES = [
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80",
];

interface Hotel {
  _id: string; id: string; hotelName: string; location: string;
  pricePerNight: number; availableRooms: number; amenities: string;
}

const TAX_RATE = 0.12;

const BookHotelPage = () => {
  const [quantity, setQuantity] = useState(1);
  const router = useRouter();
  const { id } = router.query;
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [loading, setLoading] = useState(true);
  const user = useSelector((state: any) => state.user.user);
  const [open, setOpen] = useState(false);
  const dispatch = useDispatch();

  // Room selection
  const [selectedRoom, setSelectedRoom] = useState<any | null>(null);
  const [roomPrice, setRoomPrice] = useState<number>(0);

  // Dynamic pricing
  const [pricing, setPricing] = useState<any>(null);
  const [tierInfo, setTierInfo] = useState<any>(null);

  useEffect(() => {
    if (!id) return;
    const fetchHotel = async () => {
      try {
        const data: Hotel[] = await gethotel();
        const found = data.find((h) => h._id === id || h.id === id) || null;
        setHotel(found);
        if (found) setRoomPrice(found.pricePerNight);
      } catch (error) { console.error(error); }
      finally { setLoading(false); }
    };
    fetchHotel();
  }, [id]);

  useEffect(() => {
    if (!id || !hotel) return;
    const fetchPricing = async () => {
      const userId = user?.id || user?._id || null;
      const [priceData, tierData] = await Promise.all([
        getHotelEffectivePrice(String(id), userId),
        userId ? getUserTier(userId) : Promise.resolve({
          tier: "BASIC", discount: "0%", freezeMinutes: 30,
          nextTier: "3 qualifying bookings for SILVER",
        }),
      ]);
      if (priceData) {
        setPricing(priceData);
        // Apply dynamic price as base, room multiplier applied on top
        setRoomPrice(priceData.finalPrice);
      }
      setTierInfo(tierData);
    };
    fetchPricing();
  }, [id, hotel, user]);

  if (loading) return <Loader />;
  if (!hotel) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-500">No hotel found for this ID.</p>
    </div>
  );

  const effectiveBasePrice = pricing?.finalPrice || hotel.pricePerNight;
  const roomMultiplier = selectedRoom?.priceMultiplier || 1;
  const pricePerRoom = Math.round(effectiveBasePrice * roomMultiplier);
  const baseFare = pricePerRoom * quantity;
  const taxes = Math.round(baseFare * TAX_RATE);
  const grandTotal = baseFare + taxes;

  const amenityList = hotel.amenities
    ? hotel.amenities.split(",").map((a) => a.trim()).filter(Boolean)
    : [];

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = await handlehotelbooking(
        user?.id, hotel._id || hotel.id, quantity, grandTotal,
        selectedRoom?.type || null
      );
      dispatch(setUser({ ...user, bookings: [...(user.bookings || []), data] }));
      setOpen(false);
      setQuantity(1);
      router.push("/profile");
    } catch (error) { console.log(error); }
  };

  const HotelContent = () => (
    <DialogContent className="sm:max-w-[600px] bg-white">
      <DialogHeader>
        <DialogTitle className="text-2xl font-bold flex items-center">
          <Home className="w-6 h-6 mr-2" />Hotel Booking Details
        </DialogTitle>
      </DialogHeader>
      <div className="grid gap-6 mt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="flex items-center"><MapPin className="w-4 h-4 mr-2" />Hotel</Label>
            <Input value={hotel.hotelName} readOnly />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center"><MapPin className="w-4 h-4 mr-2" />Location</Label>
            <Input value={hotel.location} readOnly />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center"><Ticket className="w-4 h-4 mr-2" />Room Type</Label>
            <Input value={selectedRoom ? selectedRoom.type : "Standard"} readOnly />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center"><Ticket className="w-4 h-4 mr-2" />Price / Night</Label>
            <Input value={`₹ ${pricePerRoom.toLocaleString()}`} readOnly />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center"><Ticket className="w-4 h-4 mr-2" />Rooms</Label>
            <Input type="number" min="1" value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Math.min(parseInt(e.target.value) || 1, hotel.availableRooms)))} />
          </div>
        </div>

        <div className="bg-gray-100 rounded-lg p-4 space-y-2 text-sm">
          <h3 className="font-bold flex items-center mb-2">
            <CreditCard className="w-4 h-4 mr-2" />Fare Summary
          </h3>
          {pricing?.multiplier > 1 && (
            <div className="flex justify-between text-orange-600 text-xs">
              <span>Dynamic pricing ({pricing.multiplierReason})</span>
              <span>×{pricing.multiplier.toFixed(2)}</span>
            </div>
          )}
          {pricing?.isPeakSeason && (
            <div className="flex justify-between text-red-600 text-xs">
              <span>Peak season surcharge</span><span>+20%</span>
            </div>
          )}
          {selectedRoom && selectedRoom.priceMultiplier !== 1 && (
            <div className="flex justify-between text-blue-600 text-xs">
              <span>{selectedRoom.type} room upgrade</span>
              <span>×{selectedRoom.priceMultiplier}</span>
            </div>
          )}
          {tierInfo?.discount !== "0%" && (
            <div className="flex justify-between text-green-600 text-xs">
              <span>{tierInfo?.tier} member discount</span>
              <span>-{tierInfo?.discount}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-600">₹ {pricePerRoom.toLocaleString()} × {quantity} room{quantity > 1 ? "s" : ""}</span>
            <span>₹ {baseFare.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Taxes & GST (12%)</span>
            <span>₹ {taxes.toLocaleString()}</span>
          </div>
          <div className="flex justify-between font-bold text-base border-t pt-2 mt-1">
            <span>Total</span><span>₹ {grandTotal.toLocaleString()}</span>
          </div>
        </div>

        <Button onClick={handleBooking} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
          Confirm Booking — ₹ {grandTotal.toLocaleString()}
        </Button>
      </div>
    </DialogContent>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center text-sm text-gray-500 gap-2">
          <span>Hotels</span><span>›</span>
          <span>{hotel.location}</span><span>›</span>
          <span className="text-gray-700 font-medium">{hotel.hotelName}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left column */}
          <div className="lg:col-span-2 space-y-6">

            <div>
              <h1 className="text-2xl font-bold mb-1">{hotel.hotelName}</h1>
              <div className="flex items-center gap-1 text-gray-500 text-sm">
                <MapPin className="w-4 h-4" />{hotel.location}
              </div>
            </div>

            {/* Real hotel images */}
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <img src={HOTEL_IMAGES[0]} alt={hotel.hotelName}
                  className="w-full h-80 object-cover rounded-lg" />
              </div>
              <div className="space-y-4">
                <img src={HOTEL_IMAGES[1]} alt="Hotel room"
                  className="w-full h-[152px] object-cover rounded-lg" />
                <img src={HOTEL_IMAGES[2]} alt="Hotel amenity"
                  className="w-full h-[152px] object-cover rounded-lg" />
              </div>
            </div>

            {/* Room type images */}
            {selectedRoom && (
              <div className="bg-white rounded-xl shadow-sm p-4">
                <h3 className="font-semibold mb-3 text-sm">
                  {selectedRoom.type} Room Preview
                </h3>
                <img
                  src={ROOM_IMAGES[selectedRoom.type] || ROOM_IMAGES.STANDARD}
                  alt={selectedRoom.type + " room"}
                  className="w-full h-52 object-cover rounded-lg"
                />
                <p className="text-sm text-gray-500 mt-2">{selectedRoom.description}</p>
              </div>
            )}

            {/* Amenities */}
            {amenityList.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-4">Amenities</h2>
                <div className="flex flex-wrap gap-3">
                  {amenityList.map((a, i) => (
                    <span key={i} className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm">{a}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Room selector */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <RoomSelector
                hotelId={String(id)}
                basePrice={effectiveBasePrice}
                onRoomSelected={(room, price) => {
                  setSelectedRoom(room);
                  setRoomPrice(price);
                }}
              />
            </div>

            {/* Cancellation policy */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="w-5 h-5 text-orange-500" />
                <h2 className="text-lg font-semibold">Cancellation Policy</h2>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2 p-3 bg-green-50 rounded-lg">
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500 mt-0.5 shrink-0" />
                  <div>
                    <div className="font-medium">Standard cancellation</div>
                    <div className="text-gray-500">75% refund — processed in 5-7 business days</div>
                  </div>
                </div>
                <p className="text-xs text-gray-400 px-1">
                  Cancel any time from your profile dashboard. Refund credited to original payment method.
                </p>
              </div>
            </div>

            {/* Reviews */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <ReviewList targetId={String(id)} targetType="HOTEL" />
            </div>
          </div>

          {/* Right column */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-24 space-y-4">
              <h3 className="text-xl font-semibold">{hotel.hotelName}</h3>
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <MapPin className="w-4 h-4" />{hotel.location}
              </div>

              {/* Dynamic price display */}
              {pricing && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Price / night</span>
                    {pricing.multiplier > 1 && (
                      <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        {pricing.multiplierReason}
                      </span>
                    )}
                  </div>
                  <div className="flex items-end gap-2">
                    <span className="text-3xl font-bold">₹{pricePerRoom.toLocaleString("en-IN")}</span>
                    {pricing.basePrice !== pricePerRoom && (
                      <span className="text-gray-400 line-through text-sm mb-1">
                        ₹{hotel.pricePerNight.toLocaleString("en-IN")}
                      </span>
                    )}
                  </div>
                  {pricing.isPeakSeason && (
                    <div className="flex items-center gap-1 text-xs text-red-600">
                      <Tag className="w-3 h-3" />Peak season pricing active
                    </div>
                  )}
                </div>
              )}

              {/* Tier badge */}
              {tierInfo && (
                <TierBadge tier={tierInfo.tier} discount={tierInfo.discount} nextTier={tierInfo.nextTier} />
              )}

              {/* Selected room badge */}
              {selectedRoom && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
                  <p className="font-medium text-blue-700">{selectedRoom.type} Room Selected</p>
                  <p className="text-blue-500 text-xs mt-0.5">
                    {selectedRoom.priceMultiplier}x multiplier applied
                  </p>
                </div>
              )}

              {/* Quantity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rooms</label>
                <div className="flex items-center gap-3">
                  <button onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-9 h-9 rounded-full border flex items-center justify-center text-gray-600 hover:bg-gray-50 text-lg">−</button>
                  <span className="text-xl font-semibold w-8 text-center">{quantity}</span>
                  <button onClick={() => setQuantity((q) => Math.min(hotel.availableRooms, q + 1))}
                    className="w-9 h-9 rounded-full border flex items-center justify-center text-gray-600 hover:bg-gray-50 text-lg">+</button>
                  <span className="text-sm text-gray-400">of {hotel.availableRooms}</span>
                </div>
              </div>

              {/* Price breakdown */}
              <div className="space-y-2 text-sm border-t pt-4">
                <div className="flex justify-between text-gray-600">
                  <span>₹ {pricePerRoom.toLocaleString()} × {quantity} night{quantity > 1 ? "s" : ""}</span>
                  <span>₹ {baseFare.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Taxes & GST (12%)</span>
                  <span>₹ {taxes.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                  <span>Total</span>
                  <span>₹ {grandTotal.toLocaleString()}</span>
                </div>
              </div>

              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <button className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold">
                    BOOK THIS NOW
                  </button>
                </DialogTrigger>
                {user ? <HotelContent /> : (
                  <DialogContent className="bg-white">
                    <DialogHeader><DialogTitle>Login Required</DialogTitle></DialogHeader>
                    <p className="text-sm text-gray-600 mb-4">Please log in to continue.</p>
                    <SignupDialog trigger={<Button className="w-full">Log In / Sign Up</Button>} />
                  </DialogContent>
                )}
              </Dialog>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookHotelPage;

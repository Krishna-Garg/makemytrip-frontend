import { useRouter } from "next/router";
import { MapPin, CreditCard, Ticket, Home, Camera, Image, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { gethotel, handlehotelbooking } from "@/api";
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
  const [selectedRoom, setSelectedRoom] = useState<any | null>(null);
  const [roomPrice, setRoomPrice] = useState<number>(0);

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

  if (loading) return <Loader />;
  if (!hotel) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-500">No hotel found for this ID.</p>
    </div>
  );

  const baseFare = roomPrice * quantity;
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
            <Label className="flex items-center"><MapPin className="w-4 h-4 mr-2" />Hotel Name</Label>
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
            <Label className="flex items-center"><Ticket className="w-4 h-4 mr-2" />Price Per Night</Label>
            <Input value={`₹ ${roomPrice.toLocaleString()}`} readOnly />
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
          {selectedRoom && (
            <div className="flex justify-between text-blue-600 text-xs">
              <span>{selectedRoom.type} room ({selectedRoom.priceMultiplier}x multiplier)</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-600">₹ {roomPrice.toLocaleString()} × {quantity} room{quantity > 1 ? "s" : ""}</span>
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

            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2 relative bg-gradient-to-br from-blue-50 to-blue-100 h-80 rounded-lg flex items-center justify-center">
                <div className="text-center text-blue-300">
                  <Camera className="w-10 h-10 mx-auto mb-2" />
                  <span className="text-sm">Property photos coming soon</span>
                </div>
              </div>
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 h-[152px] rounded-lg flex items-center justify-center">
                  <Image className="w-8 h-8 text-gray-300" />
                </div>
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 h-[152px] rounded-lg flex items-center justify-center">
                  <Image className="w-8 h-8 text-gray-300" />
                </div>
              </div>
            </div>

            {amenityList.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-4">Amenities</h2>
                <div className="flex flex-wrap gap-3">
                  {amenityList.map((amenity, index) => (
                    <span key={index} className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm">
                      {amenity}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Room Selector */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <RoomSelector
                hotelId={String(id)}
                basePrice={hotel.pricePerNight}
                onRoomSelected={(room, price) => {
                  setSelectedRoom(room);
                  setRoomPrice(price);
                }}
              />
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="w-5 h-5 text-orange-500" />
                <h2 className="text-lg font-semibold">Cancellation Policy</h2>
              </div>
              <p className="text-sm text-gray-600">
                Hotel bookings are non-refundable after confirmation. Contact support within 2 hours for assistance.
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <ReviewList targetId={String(id)} targetType="HOTEL" />
            </div>
          </div>

          {/* Right column */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-semibold mb-1">{hotel.hotelName}</h3>
              <div className="flex items-center gap-1 text-sm text-gray-500 mb-4">
                <MapPin className="w-4 h-4" />{hotel.location}
              </div>

              {/* Selected room summary */}
              {selectedRoom && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
                  <p className="font-medium text-blue-700">{selectedRoom.type} Room Selected</p>
                  <p className="text-blue-500 text-xs mt-0.5">{selectedRoom.description}</p>
                </div>
              )}

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Rooms</label>
                <div className="flex items-center gap-3">
                  <button onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-9 h-9 rounded-full border flex items-center justify-center text-gray-600 hover:bg-gray-50 text-lg">−</button>
                  <span className="text-xl font-semibold w-8 text-center">{quantity}</span>
                  <button onClick={() => setQuantity((q) => Math.min(hotel.availableRooms, q + 1))}
                    className="w-9 h-9 rounded-full border flex items-center justify-center text-gray-600 hover:bg-gray-50 text-lg">+</button>
                  <span className="text-sm text-gray-400">of {hotel.availableRooms} available</span>
                </div>
              </div>

              <div className="space-y-2 text-sm mb-6 border-t pt-4">
                <div className="flex justify-between text-gray-600">
                  <span>₹ {roomPrice.toLocaleString()} × {quantity} night{quantity > 1 ? "s" : ""}</span>
                  <span>₹ {baseFare.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Taxes & GST (12%)</span><span>₹ {taxes.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                  <span>Total</span><span>₹ {grandTotal.toLocaleString()}</span>
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

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-lg mb-1">{hotel.location}</h3>
                  <p className="text-sm text-gray-500">Hotel location</p>
                </div>
                <button className="text-blue-500 text-sm hover:text-blue-600">See on Map</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookHotelPage;

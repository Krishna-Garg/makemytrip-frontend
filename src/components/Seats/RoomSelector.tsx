// components/Seats/RoomSelector.tsx
import { useEffect, useState } from "react";
import { getRoomTypes, savePreferences } from "@/api";
import { useSelector } from "react-redux";
import { Loader2, Check } from "lucide-react";

interface RoomType {
  type: string;
  colorHex: string;
  priceMultiplier: number;
  totalRooms: number;
  availableRooms: number;
  description: string;
  floorplanType: string;
}

interface Props {
  hotelId: string;
  basePrice: number;
  onRoomSelected: (room: RoomType, price: number) => void;
}

// SVG floorplan illustrations per room type
const FloorPlan = ({ type }: { type: string }) => {
  if (type === "STANDARD") return (
    <svg viewBox="0 0 120 80" className="w-full h-24 text-gray-400">
      <rect x="2" y="2" width="116" height="76" rx="3" fill="none" stroke="currentColor" strokeWidth="1.5"/>
      {/* Bed */}
      <rect x="8" y="8" width="50" height="30" rx="2" fill="#E5E7EB" stroke="currentColor" strokeWidth="1"/>
      <rect x="8" y="8" width="50" height="10" rx="2" fill="#D1D5DB"/>
      {/* Desk */}
      <rect x="70" y="8" width="40" height="20" rx="2" fill="#E5E7EB" stroke="currentColor" strokeWidth="1"/>
      {/* Wardrobe */}
      <rect x="70" y="35" width="40" height="25" rx="2" fill="#E5E7EB" stroke="currentColor" strokeWidth="1"/>
      <line x1="90" y1="35" x2="90" y2="60" stroke="currentColor" strokeWidth="1"/>
      {/* Bathroom */}
      <rect x="8" y="50" width="55" height="26" rx="2" fill="#F3F4F6" stroke="currentColor" strokeWidth="1"/>
      <text x="35" y="67" textAnchor="middle" fontSize="7" fill="#9CA3AF">Bathroom</text>
      {/* Door */}
      <path d="M58 2 Q68 2 68 12" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="2"/>
      <text x="35" y="25" textAnchor="middle" fontSize="7" fill="#6B7280">Queen Bed</text>
    </svg>
  );

  if (type === "DELUXE") return (
    <svg viewBox="0 0 140 90" className="w-full h-24 text-gray-400">
      <rect x="2" y="2" width="136" height="86" rx="3" fill="none" stroke="currentColor" strokeWidth="1.5"/>
      {/* King Bed */}
      <rect x="8" y="8" width="65" height="38" rx="2" fill="#EDE9FE" stroke="#8B5CF6" strokeWidth="1"/>
      <rect x="8" y="8" width="65" height="12" rx="2" fill="#DDD6FE"/>
      <text x="40" y="32" textAnchor="middle" fontSize="7" fill="#7C3AED">King Bed</text>
      {/* Sitting area */}
      <rect x="8" y="54" width="30" height="22" rx="2" fill="#EDE9FE" stroke="#8B5CF6" strokeWidth="1"/>
      <text x="23" y="68" textAnchor="middle" fontSize="6" fill="#7C3AED">Sofa</text>
      {/* Desk */}
      <rect x="82" y="8" width="48" height="22" rx="2" fill="#EDE9FE" stroke="#8B5CF6" strokeWidth="1"/>
      <text x="106" y="22" textAnchor="middle" fontSize="6" fill="#7C3AED">Desk</text>
      {/* Wardrobe */}
      <rect x="82" y="38" width="48" height="20" rx="2" fill="#EDE9FE" stroke="#8B5CF6" strokeWidth="1"/>
      <line x1="106" y1="38" x2="106" y2="58" stroke="#8B5CF6" strokeWidth="1"/>
      {/* Bathroom */}
      <rect x="46" y="54" width="84" height="32" rx="2" fill="#F5F3FF" stroke="#8B5CF6" strokeWidth="1"/>
      <text x="88" y="73" textAnchor="middle" fontSize="7" fill="#8B5CF6">En-suite Bathroom</text>
    </svg>
  );

  // SUITE
  return (
    <svg viewBox="0 0 160 100" className="w-full h-24 text-gray-400">
      <rect x="2" y="2" width="156" height="96" rx="3" fill="none" stroke="currentColor" strokeWidth="1.5"/>
      {/* Bedroom section */}
      <rect x="2" y="2" width="80" height="96" rx="0" fill="#EFF6FF" stroke="#3B82F6" strokeWidth="0.5"/>
      <text x="42" y="14" textAnchor="middle" fontSize="6" fill="#3B82F6" fontWeight="bold">BEDROOM</text>
      <rect x="8" y="18" width="68" height="40" rx="2" fill="#DBEAFE" stroke="#3B82F6" strokeWidth="1"/>
      <text x="42" y="42" textAnchor="middle" fontSize="7" fill="#1D4ED8">King Bed</text>
      <rect x="8" y="65" width="30" height="25" rx="2" fill="#DBEAFE" stroke="#3B82F6" strokeWidth="1"/>
      <text x="23" y="80" textAnchor="middle" fontSize="6" fill="#1D4ED8">Wardrobe</text>
      {/* Living section */}
      <text x="122" y="14" textAnchor="middle" fontSize="6" fill="#3B82F6" fontWeight="bold">LIVING AREA</text>
      <rect x="88" y="18" width="64" height="35" rx="2" fill="#DBEAFE" stroke="#3B82F6" strokeWidth="1"/>
      <text x="120" y="38" textAnchor="middle" fontSize="7" fill="#1D4ED8">L-Sofa</text>
      {/* Jacuzzi */}
      <rect x="88" y="60" width="35" height="30" rx="8" fill="#BFDBFE" stroke="#3B82F6" strokeWidth="1.5"/>
      <text x="105" y="78" textAnchor="middle" fontSize="6" fill="#1D4ED8">Jacuzzi</text>
      {/* Bathroom */}
      <rect x="130" y="60" width="26" height="30" rx="2" fill="#EFF6FF" stroke="#3B82F6" strokeWidth="1"/>
      <text x="143" y="77" textAnchor="middle" fontSize="5" fill="#3B82F6">Bath</text>
    </svg>
  );
};

export default function RoomSelector({ hotelId, basePrice, onRoomSelected }: Props) {
  const user = useSelector((state: any) => state.user.user);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [selected, setSelected] = useState<RoomType | null>(null);
  const [loading, setLoading] = useState(true);
  const [savePref, setSavePref] = useState(false);

  useEffect(() => {
    getRoomTypes(hotelId).then((data) => {
      setRoomTypes(data.roomTypes || []);
      // Pre-select based on saved preference
      if (user?.savedRoomPreference && data.roomTypes) {
        const pref = data.roomTypes.find((r: RoomType) => r.type === user.savedRoomPreference);
        if (pref) setSelected(pref);
      }
      setLoading(false);
    });
  }, [hotelId, user]);

  const handleSelect = async (room: RoomType) => {
    setSelected(room);
    const roomPrice = Math.round(basePrice * room.priceMultiplier);
    onRoomSelected(room, roomPrice);
    if (savePref && user) {
      await savePreferences(user.id || user._id, null, room.type);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-32">
      <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
    </div>
  );

  if (roomTypes.length === 0) return (
    <p className="text-sm text-gray-400">No room types configured for this hotel.</p>
  );

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-sm">Select Room Type</h3>

      <div className="grid grid-cols-1 gap-4">
        {roomTypes.map((room) => {
          const roomPrice = Math.round(basePrice * room.priceMultiplier);
          const isSelected = selected?.type === room.type;
          const isSoldOut = room.availableRooms === 0;

          return (
            <button
              key={room.type}
              onClick={() => !isSoldOut && handleSelect(room)}
              disabled={isSoldOut}
              className={`text-left border-2 rounded-xl p-4 transition-all ${
                isSelected
                  ? "border-blue-500 bg-blue-50"
                  : isSoldOut
                  ? "border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed"
                  : "border-gray-200 hover:border-gray-300 bg-white"
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: room.colorHex }}
                    />
                    <span className="font-semibold">{room.type}</span>
                    {isSelected && <Check className="w-4 h-4 text-blue-600" />}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{room.description}</p>
                </div>
                <div className="text-right shrink-0 ml-4">
                  <div className="font-bold text-lg">₹{roomPrice.toLocaleString("en-IN")}</div>
                  <div className="text-xs text-gray-400">per night</div>
                  <div className={`text-xs mt-1 ${room.availableRooms < 5 ? "text-red-500" : "text-green-600"}`}>
                    {isSoldOut ? "Sold out" : `${room.availableRooms} left`}
                  </div>
                </div>
              </div>

              {/* Floorplan */}
              <div className="border rounded-lg p-2 bg-white">
                <p className="text-xs text-gray-400 mb-1">Floor Plan</p>
                <FloorPlan type={room.floorplanType} />
              </div>
            </button>
          );
        })}
      </div>

      {user && selected && (
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
          <input
            type="checkbox"
            checked={savePref}
            onChange={(e) => setSavePref(e.target.checked)}
            className="rounded"
          />
          Save {selected.type.toLowerCase()} room preference for future bookings
        </label>
      )}
    </div>
  );
}

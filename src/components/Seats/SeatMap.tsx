import { useEffect, useState, useCallback } from "react";
import { getSeatMap, lockSeats, savePreferences } from "@/api";
import { useSelector } from "react-redux";
import { Loader2, Info } from "lucide-react";

interface Seat {
  seatNumber: string;
  seatClass: string;
  colorHex: string;
  price: number;
  status: string;
}

interface Props {
  flightId: string;
  maxSeats: number;
  onSeatsSelected: (seats: Seat[]) => void;
}

const CLASS_LABEL: Record<string, string> = {
  BUSINESS: "Business",
  PREMIUM: "Premium Economy",
  ECONOMY: "Economy",
};

// ── Plane + seats overlay ────────────────────────────────────────────────────
// The seat grid is rendered as SVG foreignObject elements overlaid
// directly on the fuselage body of each plane SVG.
// Layout: rows go left→right (front→back), cols A-C top, D-F bottom.

interface SeatGridProps {
  seatMap: Record<string, Seat>;
  rowNums: number[];
  selected: Seat[];
  toggleSeat: (s: Seat) => void;
  isPreferred: (s: Seat) => boolean;
  // SVG coordinate space positioning
  startX: number;   // x where row 1 starts
  startY: number;   // y where col A starts
  cellW: number;    // width per seat cell
  cellH: number;    // height per seat cell
  aisleGap: number; // extra y gap between C and D
}

function SeatCells({
  seatMap, rowNums, selected, toggleSeat, isPreferred,
  startX, startY, cellW, cellH, aisleGap,
}: SeatGridProps) {
  const COLS = ["A", "B", "C", "D", "E", "F"];

  return (
    <>
      {COLS.map((col, ci) => {
        const yOffset = ci < 3
          ? startY + ci * cellH
          : startY + 3 * cellH + aisleGap + (ci - 3) * cellH;

        return rowNums.map((rn, ri) => {
          const seatNum = `${rn}${col}`;
          const seat = seatMap[seatNum];
          if (!seat) return null;

          const x = startX + ri * cellW;
          const y = yOffset;
          const isSelected = !!selected.find((s) => s.seatNumber === seatNum);
          const isBooked = seat.status === "BOOKED" || seat.status === "LOCKED";
          const isPref = isPreferred(seat);

          const fill = isSelected
            ? "#22C55E"
            : isBooked
            ? "#D1D5DB"
            : seat.colorHex;

          const stroke = isSelected
            ? "#16A34A"
            : isPref && !isBooked
            ? "#60A5FA"
            : "rgba(0,0,0,0.15)";

          return (
            <g key={seatNum}
              onClick={() => !isBooked && toggleSeat(seat)}
              style={{ cursor: isBooked ? "not-allowed" : "pointer" }}>
              <rect
                x={x + 1} y={y + 1}
                width={cellW - 3} height={cellH - 3}
                rx="3"
                fill={fill}
                stroke={stroke}
                strokeWidth={isPref && !isBooked && !isSelected ? 1.5 : 0.8}
                opacity={isBooked ? 0.5 : 1}
              />
              <text
                x={x + cellW / 2} y={y + cellH / 2 + 3}
                textAnchor="middle"
                fontSize="7"
                fontWeight="600"
                fill={isBooked ? "#9CA3AF" : "white"}
                style={{ pointerEvents: "none", userSelect: "none" }}
              >
                {rn}
              </text>
            </g>
          );
        });
      })}

      {/* Aisle label */}
      <text
        x={startX - 6}
        y={startY + 3 * cellH + aisleGap / 2 + 3}
        textAnchor="end"
        fontSize="6"
        fill="#9CA3AF"
        fontStyle="italic"
      >aisle</text>
    </>
  );
}

// ── Per-model plane SVGs with embedded seat grid ─────────────────────────────

interface PlaneProps {
  seatMap: Record<string, Seat>;
  rowNums: number[];
  selected: Seat[];
  toggleSeat: (s: Seat) => void;
  isPreferred: (s: Seat) => boolean;
}

function AirAsiaPlane({ seatMap, rowNums, selected, toggleSeat, isPreferred }: PlaneProps) {
  // 40 seats: 7 rows × 6 cols (rows 1-7 but backend may vary)
  // SVG canvas 700×160, fuselage center Y=80
  const W = 700; const H = 160;
  const cellW = 28; const cellH = 18; const aisleGap = 8;
  const startX = 90; const startY = 20;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ minWidth: 480 }}>
      {/* Fuselage body */}
      <ellipse cx={W/2} cy={H/2} rx={W/2 - 20} ry={H/2 - 18} fill="#F9FAFB" stroke="#E5E7EB" strokeWidth="1.5"/>
      {/* Nose cone */}
      <ellipse cx={W - 28} cy={H/2} rx={38} ry={H/2 - 30} fill="#F3F4F6" stroke="#E5E7EB" strokeWidth="1"/>
      {/* Tail */}
      <ellipse cx={28} cy={H/2} rx={28} ry={H/2 - 38} fill="#F3F4F6" stroke="#E5E7EB" strokeWidth="1"/>
      {/* Wing top */}
      <path d={`M${W*0.45} ${H/2} L${W*0.52} 4 L${W*0.65} 4 L${W*0.58} ${H/2} Z`} fill="#E5E7EB" stroke="#D1D5DB" strokeWidth="1"/>
      {/* Wing bottom */}
      <path d={`M${W*0.45} ${H/2} L${W*0.52} ${H-4} L${W*0.65} ${H-4} L${W*0.58} ${H/2} Z`} fill="#E5E7EB" stroke="#D1D5DB" strokeWidth="1"/>
      {/* Tail fin top */}
      <path d={`M${W*0.09} ${H/2} L${W*0.12} 30 L${W*0.18} 30 L${W*0.15} ${H/2} Z`} fill="#E5E7EB" stroke="#D1D5DB" strokeWidth="1"/>
      {/* Tail fin bottom */}
      <path d={`M${W*0.09} ${H/2} L${W*0.12} ${H-30} L${W*0.18} ${H-30} L${W*0.15} ${H/2} Z`} fill="#E5E7EB" stroke="#D1D5DB" strokeWidth="1"/>

      {/* Col labels */}
      {["A","B","C","D","E","F"].map((col, ci) => {
        const y = ci < 3
          ? startY + ci * cellH + cellH/2 + 3
          : startY + 3 * cellH + aisleGap + (ci-3) * cellH + cellH/2 + 3;
        return <text key={col} x={startX - 10} y={y} textAnchor="end" fontSize="8" fontWeight="700" fill="#6B7280">{col}</text>;
      })}

      {/* Row number headers */}
      {rowNums.map((rn, ri) => (
        <text key={rn} x={startX + ri * cellW + cellW/2} y={startY - 5} textAnchor="middle" fontSize="7" fill="#9CA3AF">{rn}</text>
      ))}

      {/* ← FRONT label */}
      <text x={startX - 8} y={H - 6} textAnchor="start" fontSize="7" fill="#9CA3AF">← FRONT</text>

      {/* Seat cells overlaid on fuselage */}
      <SeatCells
        seatMap={seatMap} rowNums={rowNums} selected={selected}
        toggleSeat={toggleSeat} isPreferred={isPreferred}
        startX={startX} startY={startY}
        cellW={cellW} cellH={cellH} aisleGap={aisleGap}
      />

      {/* Model label */}
      <text x={W/2} y={H - 6} textAnchor="middle" fontSize="7" fill="#9CA3AF" fontWeight="500">AIR ASIA · 40 SEATS</text>
    </svg>
  );
}

function InterTravelsPlane({ seatMap, rowNums, selected, toggleSeat, isPreferred }: PlaneProps) {
  const W = 820; const H = 160;
  const cellW = 26; const cellH = 18; const aisleGap = 8;
  const startX = 95; const startY = 20;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ minWidth: 600 }}>
      <ellipse cx={W/2} cy={H/2} rx={W/2 - 18} ry={H/2 - 18} fill="#F5F3FF" stroke="#EDE9FE" strokeWidth="1.5"/>
      <ellipse cx={W - 26} cy={H/2} rx={38} ry={H/2 - 30} fill="#FAF5FF" stroke="#EDE9FE" strokeWidth="1"/>
      <ellipse cx={26} cy={H/2} rx={26} ry={H/2 - 38} fill="#FAF5FF" stroke="#EDE9FE" strokeWidth="1"/>
      <path d={`M${W*0.44} ${H/2} L${W*0.52} 2 L${W*0.66} 2 L${W*0.57} ${H/2} Z`} fill="#DDD6FE" stroke="#C4B5FD" strokeWidth="1"/>
      <path d={`M${W*0.44} ${H/2} L${W*0.52} ${H-2} L${W*0.66} ${H-2} L${W*0.57} ${H/2} Z`} fill="#DDD6FE" stroke="#C4B5FD" strokeWidth="1"/>
      <path d={`M${W*0.08} ${H/2} L${W*0.11} 28 L${W*0.17} 28 L${W*0.14} ${H/2} Z`} fill="#DDD6FE" stroke="#C4B5FD" strokeWidth="1"/>
      <path d={`M${W*0.08} ${H/2} L${W*0.11} ${H-28} L${W*0.17} ${H-28} L${W*0.14} ${H/2} Z`} fill="#DDD6FE" stroke="#C4B5FD" strokeWidth="1"/>

      {["A","B","C","D","E","F"].map((col, ci) => {
        const y = ci < 3
          ? startY + ci * cellH + cellH/2 + 3
          : startY + 3 * cellH + aisleGap + (ci-3) * cellH + cellH/2 + 3;
        return <text key={col} x={startX - 10} y={y} textAnchor="end" fontSize="8" fontWeight="700" fill="#7C3AED">{col}</text>;
      })}
      {rowNums.map((rn, ri) => (
        <text key={rn} x={startX + ri * cellW + cellW/2} y={startY - 5} textAnchor="middle" fontSize="7" fill="#A78BFA">{rn}</text>
      ))}

      <text x={startX - 8} y={H - 6} textAnchor="start" fontSize="7" fill="#A78BFA">← FRONT</text>

      <SeatCells
        seatMap={seatMap} rowNums={rowNums} selected={selected}
        toggleSeat={toggleSeat} isPreferred={isPreferred}
        startX={startX} startY={startY}
        cellW={cellW} cellH={cellH} aisleGap={aisleGap}
      />

      <text x={W/2} y={H - 6} textAnchor="middle" fontSize="7" fill="#A78BFA" fontWeight="500">INTER TRAVELS · 60 SEATS</text>
    </svg>
  );
}

function WorldGuidePlane({ seatMap, rowNums, selected, toggleSeat, isPreferred }: PlaneProps) {
  const W = 600; const H = 150;
  const cellW = 28; const cellH = 18; const aisleGap = 8;
  const startX = 88; const startY = 18;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ minWidth: 420 }}>
      <ellipse cx={W/2} cy={H/2} rx={W/2 - 18} ry={H/2 - 20} fill="#EFF6FF" stroke="#DBEAFE" strokeWidth="1.5"/>
      <ellipse cx={W - 24} cy={H/2} rx={34} ry={H/2 - 32} fill="#F0F9FF" stroke="#DBEAFE" strokeWidth="1"/>
      <ellipse cx={24} cy={H/2} rx={24} ry={H/2 - 40} fill="#F0F9FF" stroke="#DBEAFE" strokeWidth="1"/>
      {/* Swept wings */}
      <path d={`M${W*0.46} ${H/2} L${W*0.56} 3 L${W*0.68} 3 L${W*0.60} ${H/2} Z`} fill="#BFDBFE" stroke="#93C5FD" strokeWidth="1"/>
      <path d={`M${W*0.46} ${H/2} L${W*0.56} ${H-3} L${W*0.68} ${H-3} L${W*0.60} ${H/2} Z`} fill="#BFDBFE" stroke="#93C5FD" strokeWidth="1"/>
      <path d={`M${W*0.09} ${H/2} L${W*0.12} 26 L${W*0.18} 26 L${W*0.15} ${H/2} Z`} fill="#BFDBFE" stroke="#93C5FD" strokeWidth="1"/>
      <path d={`M${W*0.09} ${H/2} L${W*0.12} ${H-26} L${W*0.18} ${H-26} L${W*0.15} ${H/2} Z`} fill="#BFDBFE" stroke="#93C5FD" strokeWidth="1"/>

      {["A","B","C","D","E","F"].map((col, ci) => {
        const y = ci < 3
          ? startY + ci * cellH + cellH/2 + 3
          : startY + 3 * cellH + aisleGap + (ci-3) * cellH + cellH/2 + 3;
        return <text key={col} x={startX - 10} y={y} textAnchor="end" fontSize="8" fontWeight="700" fill="#1D4ED8">{col}</text>;
      })}
      {rowNums.map((rn, ri) => (
        <text key={rn} x={startX + ri * cellW + cellW/2} y={startY - 5} textAnchor="middle" fontSize="7" fill="#60A5FA">{rn}</text>
      ))}

      <text x={startX - 8} y={H - 5} textAnchor="start" fontSize="7" fill="#60A5FA">← FRONT</text>

      <SeatCells
        seatMap={seatMap} rowNums={rowNums} selected={selected}
        toggleSeat={toggleSeat} isPreferred={isPreferred}
        startX={startX} startY={startY}
        cellW={cellW} cellH={cellH} aisleGap={aisleGap}
      />

      <text x={W/2} y={H - 5} textAnchor="middle" fontSize="7" fill="#60A5FA" fontWeight="500">WORLD GUIDE · 30 SEATS · NO ECONOMY</text>
    </svg>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function SeatMap({ flightId, maxSeats, onSeatsSelected }: Props) {
  const user = useSelector((state: any) => state.user.user);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [selected, setSelected] = useState<Seat[]>([]);
  const [loading, setLoading] = useState(true);
  const [locking, setLocking] = useState(false);
  const [aircraftModel, setAircraftModel] = useState<string | null>(null);
  const [savePref, setSavePref] = useState(false);
  const [prefType, setPrefType] = useState("WINDOW");

  const fetchSeats = useCallback(async () => {
    try {
      const data = await getSeatMap(flightId);
      setSeats(data.seats || []);
      setAircraftModel(data.aircraftModel || null);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [flightId]);

  useEffect(() => {
    fetchSeats();
    const interval = setInterval(fetchSeats, 30000);
    return () => clearInterval(interval);
  }, [fetchSeats]);

  useEffect(() => {
    if (user?.savedSeatPreference) setPrefType(user.savedSeatPreference);
  }, [user]);
  useEffect(() => {
    if (selected.length > maxSeats) {
        setSelected((prev) => prev.slice(0, maxSeats));
    }
  }, [maxSeats]);


  const isPreferred = (seat: Seat) => {
    const col = seat.seatNumber.slice(-1);
    if (prefType === "WINDOW") return col === "A" || col === "F";
    if (prefType === "AISLE")  return col === "C" || col === "D";
    if (prefType === "MIDDLE") return col === "B" || col === "E";
    return false;
  };

  const toggleSeat = (seat: Seat) => {
    if (seat.status !== "AVAILABLE") return;
    setSelected((prev) => {
      const exists = prev.find((s) => s.seatNumber === seat.seatNumber);
      if (exists) return prev.filter((s) => s.seatNumber !== seat.seatNumber);
      if (prev.length >= maxSeats) return prev;
      return [...prev, seat];
    });
  };

  const handleConfirm = async () => {
    if (selected.length === 0) return;
    if (!user) { alert("Please log in to select seats."); return; }
    setLocking(true);
    try {
      await lockSeats(flightId, selected.map((s) => s.seatNumber), user.id || user._id);
      if (savePref && prefType) await savePreferences(user.id || user._id, prefType, null);
      onSeatsSelected(selected);
    } catch (err: any) {
      alert(err?.response?.data?.message || "Could not lock seats. Please try again.");
      await fetchSeats();
      setSelected([]);
    } finally { setLocking(false); }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-40">
      <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
    </div>
  );

  if (!aircraftModel || seats.length === 0) return (
    <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
      <Info className="w-5 h-5 shrink-0" />
      Seat map not configured for this flight yet. You can still book without seat selection.
    </div>
  );

  const seatMapLookup: Record<string, Seat> = {};
  seats.forEach((s) => { seatMapLookup[s.seatNumber] = s; });

  const rowNums = [...new Set(seats.map((s) => parseInt(s.seatNumber)))]
    .sort((a, b) => a - b);

  const totalSelected = selected.reduce((sum, s) => sum + s.price, 0);
  const uniqueClasses = [...new Map(seats.map((s) => [s.seatClass, s])).values()];

  const planeProps: PlaneProps = {
    seatMap: seatMapLookup, rowNums, selected, toggleSeat, isPreferred,
  };

  return (
    <div className="space-y-4">

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs items-center">
        {uniqueClasses.map((s) => (
          <div key={s.seatClass} className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: s.colorHex }} />
            <span className="text-gray-600">{CLASS_LABEL[s.seatClass] || s.seatClass}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded-sm bg-green-500" />
          <span className="text-gray-600">Selected</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded-sm bg-gray-200" />
          <span className="text-gray-600">Booked</span>
        </div>
      </div>

      {/* Seat preference */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-xs text-gray-500 font-medium">Preference:</span>
        {["WINDOW", "AISLE", "MIDDLE"].map((p) => (
          <button key={p} onClick={() => setPrefType(p)}
            className={`px-3 py-1 rounded-full border text-xs font-medium transition-colors ${
              prefType === p
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
            }`}>
            {p}
          </button>
        ))}
      </div>

      {/* Plane with seats overlaid — scrollable on small screens */}
      <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white p-2">
        {aircraftModel === "AIR_ASIA" && <AirAsiaPlane {...planeProps} />}
        {aircraftModel === "INTER_TRAVELS" && <InterTravelsPlane {...planeProps} />}
        {aircraftModel === "WORLD_GUIDE" && <WorldGuidePlane {...planeProps} />}
      </div>

      {/* Selection summary */}
      {selected.length > 0 && (
        <div className="border rounded-xl p-4 bg-green-50 space-y-3">
          <div className="flex justify-between items-center text-sm">
            <span className="font-medium">
              Selected: {selected.map((s) => s.seatNumber).join(", ")}
            </span>
            <span className="font-bold">₹{totalSelected.toLocaleString("en-IN")}</span>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input type="checkbox" checked={savePref}
              onChange={(e) => setSavePref(e.target.checked)} className="rounded" />
            Save {prefType.toLowerCase()} seat as my default preference
          </label>
          <button onClick={handleConfirm} disabled={locking}
            className="w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition-colors text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-60">
            {locking && <Loader2 className="w-4 h-4 animate-spin" />}
            {locking
              ? "Locking seats..."
              : `Confirm ${selected.length} seat${selected.length > 1 ? "s" : ""} — ₹${totalSelected.toLocaleString("en-IN")}`}
          </button>
        </div>
      )}
    </div>
  );
}

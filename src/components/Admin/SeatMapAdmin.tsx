// components/Admin/SeatMapAdmin.tsx
// Add this as a section inside FlightStatusTab or as a new tab in admin/index.tsx

import { useState, useEffect } from "react";
import { getflight, generateSeatMap } from "@/api";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

const MODELS = [
  { value: "AIR_ASIA",       label: "Air Asia (40 seats)" },
  { value: "INTER_TRAVELS",  label: "InterTravels (60 seats)" },
  { value: "WORLD_GUIDE",    label: "World Guide (30 seats, no economy)" },
];

export default function SeatMapAdmin() {
  const [flights, setFlights] = useState<any[]>([]);
  const [generating, setGenerating] = useState<string | null>(null);
  const [modelMap, setModelMap] = useState<Record<string, string>>({});

  useEffect(() => {
    getflight().then((data) =>
      setFlights((data || []).filter((f: any) => !f.isTemplate))
    );
  }, []);

  const handleGenerate = async (flightId: string) => {
    const model = modelMap[flightId];
    if (!model) { alert("Please select an aircraft model first."); return; }
    setGenerating(flightId);
    try {
      await generateSeatMap(flightId, model);
      const updated = await getflight();
      setFlights((updated || []).filter((f: any) => !f.isTemplate));
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to generate seat map.");
    } finally {
      setGenerating(null);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Seat Map Assignment</h3>
      <p className="text-sm text-muted-foreground">
        Assign an aircraft model to each flight to generate its seat map.
        Once generated, users can select seats on the booking page.
      </p>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Flight</TableHead>
            <TableHead>Route</TableHead>
            <TableHead>Current Model</TableHead>
            <TableHead>Assign Model</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {flights.map((f: any) => {
            const fid = f._id || f.id;
            return (
              <TableRow key={fid}>
                <TableCell className="font-medium">{f.flightName}</TableCell>
                <TableCell className="text-muted-foreground text-xs">
                  {f.from} → {f.to}
                </TableCell>
                <TableCell>
                  {f.aircraftModel ? (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                      {f.aircraftModel} ({f.seats?.length || 0} seats)
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400">Not configured</span>
                  )}
                </TableCell>
                <TableCell>
                  <select
                    value={modelMap[fid] || ""}
                    onChange={(e) =>
                      setModelMap((prev) => ({ ...prev, [fid]: e.target.value }))
                    }
                    className="text-sm border rounded-lg px-2 py-1.5 bg-white"
                  >
                    <option value="">Select model...</option>
                    {MODELS.map((m) => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                </TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    disabled={generating === fid || !modelMap[fid]}
                    onClick={() => handleGenerate(fid)}
                  >
                    {generating === fid ? "Generating..." : f.aircraftModel ? "Regenerate" : "Generate"}
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

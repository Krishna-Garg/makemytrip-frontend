import { useState, useEffect } from "react";
import { getflight, adminUpdateFlightStatus } from "@/api";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import FlightStatusBadge from "@/components/FlightTracker/FlightStatusBadge";

const STATUS_OPTIONS = ["ON_TIME", "DELAYED", "BOARDING", "DEPARTED"];

export default function FlightStatusTab() {
  const [flights, setFlights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any | null>(null);
  const [status, setStatus] = useState("ON_TIME");
  const [reason, setReason] = useState("");
  const [delay, setDelay] = useState(0);
  const [updating, setUpdating] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    getflight().then((d) => {
      setFlights((d || []).filter((f: any) => !f.isTemplate));
      setLoading(false);
    });
  }, []);

  const handleSelect = (f: any) => {
    setSelected(f);
    setStatus(f.status || "ON_TIME");
    setDelay(f.delayMinutes || 0);
    setReason(f.statusReason || "");
    setSuccess(false);
  };

  const handleUpdate = async () => {
    if (!selected) return;
    setUpdating(true);
    try {
      await adminUpdateFlightStatus(
        selected._id || selected.id, status, reason, null, delay,
      );
      const updated = await getflight();
      setFlights((updated || []).filter((f: any) => !f.isTemplate));
      // Reflect updated status on selected
      const refreshed = (updated || []).find(
        (f: any) => (f._id || f.id) === (selected._id || selected.id)
      );
      if (refreshed) setSelected(refreshed);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <p className="text-sm text-muted-foreground">Loading flights...</p>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

      {/* Flight list */}
      <div>
        <h3 className="font-semibold mb-3">Active Flights</h3>
        {flights.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No active flights. Create a recurring template in the Flights tab first.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Flight</TableHead>
                <TableHead>Route</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {flights.map((f: any) => {
                const fid = f._id || f.id;
                const isSelected = (selected?._id || selected?.id) === fid;
                return (
                  <TableRow
                    key={fid}
                    className={isSelected ? "bg-muted/40" : ""}
                  >
                    <TableCell className="font-medium">{f.flightName}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {f.from} → {f.to}
                    </TableCell>
                    <TableCell>
                      <FlightStatusBadge
                        status={f.status || "ON_TIME"}
                        delayMinutes={f.delayMinutes}
                      />
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant={isSelected ? "default" : "outline"}
                        onClick={() => handleSelect(f)}>
                        {isSelected ? "Editing" : "Edit"}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Status editor */}
      {selected ? (
        <div className="border rounded-xl p-5 space-y-4 bg-muted/10">
          <div>
            <h4 className="font-semibold text-base">{selected.flightName}</h4>
            <p className="text-sm text-muted-foreground">
              {selected.from} → {selected.to} ·{" "}
              {selected.departureTime
                ? new Date(selected.departureTime).toLocaleString("en-IN", {
                    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                  })
                : "No departure set"}
            </p>
          </div>

          <div>
            <Label>Status</Label>
            <select value={status} onChange={(e) => setStatus(e.target.value)}
              className="w-full mt-1 border rounded-lg px-3 py-2 text-sm bg-white">
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s.replace("_", " ")}</option>
              ))}
            </select>
          </div>

          {status === "DELAYED" && (
            <div>
              <Label>Delay (minutes)</Label>
              <Input type="number" value={delay} min={1}
                onChange={(e) => setDelay(Number(e.target.value))} />
            </div>
          )}

          <div>
            <Label>Reason / Note</Label>
            <Input value={reason} onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Weather conditions, Technical issue, Air traffic" />
          </div>

          <Button onClick={handleUpdate} disabled={updating} className="w-full">
            {updating ? "Updating..." : success ? "✓ Updated!" : "Update Status"}
          </Button>

          {selected.statusHistory?.length > 0 && (
            <div className="pt-2 border-t">
              <p className="text-xs font-medium text-muted-foreground mb-2">Recent history</p>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {[...selected.statusHistory].reverse().slice(0, 5).map((h: any, i: number) => (
                  <div key={i} className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="font-medium">{h.status?.replace("_", " ")}</span>
                    <span>{h.reason || "—"}</span>
                    <span>{h.updatedBy}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="border rounded-xl p-5 flex items-center justify-center text-muted-foreground text-sm bg-muted/10">
          Select a flight from the list to update its status.
        </div>
      )}
    </div>
  );
}

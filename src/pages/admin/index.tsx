"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import UserList from "@/components/Admin/UserList";
import RefundsTab from "@/components/Admin/RefundsTab";
import FlightStatusTab from "@/components/Admin/FlightStatusTab";
import SeatMapAdmin from "@/components/Admin/SeatMapAdmin";
import HotelList from "@/components/Hotel/Hotel";
import {
  addhotel, edithotel, getuserbyemail, createFlightTemplate, getflight,
} from "@/api";

const DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
const AIRCRAFT_MODELS = [
  { value: "AIR_ASIA",      label: "Air Asia (40 seats — Business + Premium + Economy)" },
  { value: "INTER_TRAVELS", label: "InterTravels (60 seats — Business + Premium + Economy)" },
  { value: "WORLD_GUIDE",   label: "World Guide (30 seats — Business + Premium only)" },
];

// ── Recurring Flight Template Form ──────────────────────────────────────────
function RecurringFlightForm() {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  const [tpl, setTpl] = useState({
    flightName: "",
    from: "",
    to: "",
    baseTime: "",
    arrivalOffset: 2,   // hours after departure for arrival
    price: 0,
    availableSeats: 0,
    boardingMinutes: 45,
    recurringDays: [] as string[],
    aircraftModel: "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);

  useEffect(() => {
    getflight().then((data) => {
      setTemplates((data || []).filter((f: any) => f.isTemplate));
      setLoadingTemplates(false);
    });
  }, []);

  const toggleDay = (day: string) => {
    setTpl((t) => ({
      ...t,
      recurringDays: t.recurringDays.includes(day)
        ? t.recurringDays.filter((d) => d !== day)
        : [...t.recurringDays, day],
    }));
  };

  const handleSave = async () => {
    if (!tpl.flightName || !tpl.from || !tpl.to || !tpl.baseTime || tpl.recurringDays.length === 0) {
      alert("Please fill in all required fields and select at least one recurring day.");
      return;
    }

    // Build today's departureTime from baseTime so backend has a valid LocalDateTime to parse
    const [hours, minutes] = tpl.baseTime.split(":").map(Number);
    const dep = new Date();
    dep.setHours(hours, minutes, 0, 0);
    const arr = new Date(dep.getTime() + tpl.arrivalOffset * 60 * 60 * 1000);

    const toLocal = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}T${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;

    setSaving(true);
    try {
      await createFlightTemplate({
        flightName: tpl.flightName,
        from: tpl.from,
        to: tpl.to,
        baseTime: tpl.baseTime,
        departureTime: toLocal(dep),
        arrivalTime: toLocal(arr),
        price: tpl.price,
        availableSeats: tpl.availableSeats,
        boardingMinutes: tpl.boardingMinutes,
        recurringDays: tpl.recurringDays,
        aircraftModel: tpl.aircraftModel || null,
        isTemplate: true,
      });
      setSaved(true);
      // Refresh template list
      const updated = await getflight();
      setTemplates((updated || []).filter((f: any) => f.isTemplate));
      setTpl({
        flightName: "", from: "", to: "", baseTime: "", arrivalOffset: 2,
        price: 0, availableSeats: 0, boardingMinutes: 45, recurringDays: [], aircraftModel: "",
      });
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      alert("Failed to save template. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Form */}
      <div className="border rounded-xl p-6 bg-muted/20 space-y-5">
        <h3 className="font-semibold text-base">Create Recurring Flight Template</h3>
        <p className="text-sm text-muted-foreground">
          Templates auto-generate individual flight records for the next 4 weeks every midnight.
          Departure time is set to today + base time automatically.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Flight Name *</Label>
            <Input value={tpl.flightName} placeholder="e.g. AI101"
              onChange={(e) => setTpl({ ...tpl, flightName: e.target.value })} />
          </div>
          <div>
            <Label>Aircraft Model</Label>
            <select value={tpl.aircraftModel}
              onChange={(e) => setTpl({ ...tpl, aircraftModel: e.target.value })}
              className="w-full mt-1 border rounded-lg px-3 py-2 text-sm bg-white">
              <option value="">Not assigned (flight held until set)</option>
              {AIRCRAFT_MODELS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
            {!tpl.aircraftModel && (
              <p className="text-xs text-amber-600 mt-1">
                Without a model, generated flights will show as grey until configured.
              </p>
            )}
          </div>
          <div>
            <Label>From *</Label>
            <Input value={tpl.from} placeholder="e.g. BLR"
              onChange={(e) => setTpl({ ...tpl, from: e.target.value })} />
          </div>
          <div>
            <Label>To *</Label>
            <Input value={tpl.to} placeholder="e.g. DEL"
              onChange={(e) => setTpl({ ...tpl, to: e.target.value })} />
          </div>
          <div>
            <Label>Base Departure Time * (HH:MM)</Label>
            <Input type="time" value={tpl.baseTime}
              onChange={(e) => setTpl({ ...tpl, baseTime: e.target.value })} />
            <p className="text-xs text-muted-foreground mt-1">
              Today is {today}. First departure will be set to today at this time.
            </p>
          </div>
          <div>
            <Label>Flight Duration (hours)</Label>
            <Input type="number" min={1} max={24} value={tpl.arrivalOffset}
              onChange={(e) => setTpl({ ...tpl, arrivalOffset: Number(e.target.value) })} />
          </div>
          <div>
            <Label>Price (₹) *</Label>
            <Input type="number" value={tpl.price}
              onChange={(e) => setTpl({ ...tpl, price: Number(e.target.value) })} />
          </div>
          <div>
            <Label>Available Seats *</Label>
            <Input type="number" value={tpl.availableSeats}
              onChange={(e) => setTpl({ ...tpl, availableSeats: Number(e.target.value) })} />
          </div>
          <div>
            <Label>Boarding Opens (mins before departure)</Label>
            <Input type="number" value={tpl.boardingMinutes}
              onChange={(e) => setTpl({ ...tpl, boardingMinutes: Number(e.target.value) })} />
          </div>
        </div>

        <div>
          <Label className="mb-2 block">Recurring Days *</Label>
          <div className="flex gap-2 flex-wrap">
            {DAYS.map((d) => (
              <button key={d} type="button" onClick={() => toggleDay(d)}
                className={`px-3 py-1.5 rounded-full text-xs border font-medium transition-colors ${
                  tpl.recurringDays.includes(d)
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
                }`}>
                {d}
              </button>
            ))}
          </div>
        </div>

        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving ? "Saving Template..." : saved ? "✓ Template Saved!" : "Save Recurring Template"}
        </Button>
      </div>

      {/* Existing templates list */}
      <div>
        <h3 className="font-semibold text-base mb-3">Existing Templates</h3>
        {loadingTemplates ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : templates.length === 0 ? (
          <p className="text-sm text-muted-foreground">No templates yet. Create one above.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Flight</TableHead>
                <TableHead>Route</TableHead>
                <TableHead>Base Time</TableHead>
                <TableHead>Days</TableHead>
                <TableHead>Aircraft</TableHead>
                <TableHead>Price</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates.map((t: any) => (
                <TableRow key={t._id || t.id}>
                  <TableCell className="font-medium">{t.flightName}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{t.from} → {t.to}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{t.baseTime || "—"}</TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {(t.recurringDays || []).map((d: string) => (
                        <span key={d} className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">{d}</span>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    {t.aircraftModel ? (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{t.aircraftModel}</span>
                    ) : (
                      <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Not set</span>
                    )}
                  </TableCell>
                  <TableCell>₹{t.price?.toLocaleString("en-IN")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}

// ── User Search ──────────────────────────────────────────────────────────────
interface User {
  _id: string; firstName: string; lastName: string;
  email: string; role: string; phoneNumber: string;
}

function UserSearch() {
  const [email, setEmail] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState("");
  const [searching, setSearching] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearching(true); setError(""); setUser(null);
    try {
      const data = await getuserbyemail(email);
      if (!data) setError("User not found with that email!");
      else setUser(data);
    } catch { setError("No user found with that email."); }
    finally { setSearching(false); }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="flex-1">
          <Label htmlFor="email" className="sr-only">Email</Label>
          <Input id="email" type="email" placeholder="Search user by email"
            value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <Button type="submit" disabled={searching}>
          {searching ? "Searching" : "Search"}
        </Button>
      </form>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {user && (
        <div className="border rounded-lg p-4 bg-muted/30">
          <h3 className="font-semibold mb-3">User Details</h3>
          <div className="grid grid-cols-2 gap-y-2 text-sm">
            <span className="text-muted-foreground">Name</span>
            <span className="font-medium">{user.firstName} {user.lastName}</span>
            <span className="text-muted-foreground">Email</span>
            <span className="font-medium">{user.email}</span>
            <span className="text-muted-foreground">Role</span>
            <span className="font-medium">{user.role}</span>
            <span className="text-muted-foreground">Phone</span>
            <span className="font-medium">{user.phoneNumber || "-"}</span>
          </div>
        </div>
      )}
      <Separator />
      <UserList />
    </div>
  );
}

// ── Add/Edit Hotel ───────────────────────────────────────────────────────────
interface Hotel {
  id?: string; hotelName: string; location: string;
  pricePerNight: number; availableRooms: number; amenities: string;
}

function AddEditHotel({ hotel }: { hotel: Hotel | null }) {
  const [formData, setFormData] = useState<Hotel>({
    hotelName: "", location: "", pricePerNight: 0, availableRooms: 0, amenities: "",
  });

  useEffect(() => {
    setFormData(hotel || { hotelName: "", location: "", pricePerNight: 0, availableRooms: 0, amenities: "" });
  }, [hotel]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (hotel) {
      await edithotel(hotel.id, formData.hotelName, formData.location,
        formData.pricePerNight, formData.availableRooms, formData.amenities);
      return;
    }
    await addhotel(formData.hotelName, formData.location,
      formData.pricePerNight, formData.availableRooms, formData.amenities);
    setFormData({ hotelName: "", location: "", pricePerNight: 0, availableRooms: 0, amenities: "" });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-semibold mb-2">{hotel ? "Edit Hotel" : "Add New Hotel"}</h3>
      <div><Label htmlFor="hotelName">Hotel Name</Label>
        <Input id="hotelName" name="hotelName" value={formData.hotelName} onChange={handleChange} required /></div>
      <div><Label htmlFor="location">Location</Label>
        <Input id="location" name="location" value={formData.location} onChange={handleChange} required /></div>
      <div><Label htmlFor="pricePerNight">Price Per Night</Label>
        <Input id="pricePerNight" name="pricePerNight" type="number" value={formData.pricePerNight} onChange={handleChange} required /></div>
      <div><Label htmlFor="availableRooms">Available Rooms</Label>
        <Input id="availableRooms" name="availableRooms" type="number" value={formData.availableRooms} onChange={handleChange} required /></div>
      <div><Label htmlFor="amenities">Amenities</Label>
        <Textarea id="amenities" name="amenities" value={formData.amenities} onChange={handleChange} required /></div>
      <Button type="submit">{hotel ? "Update Hotel" : "Add Hotel"}</Button>
    </form>
  );
}

// ── Dashboard ────────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("flights");
  const [selectedHotel, setSelectedHotel] = useState(null);

  return (
    <div className="container mx-auto p-4 md:p-8 bg-background max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Manage flights, hotels, users, refunds, and seat maps in one place.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="flights">Flights</TabsTrigger>
          <TabsTrigger value="hotels">Hotels</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="refunds">Refunds</TabsTrigger>
          <TabsTrigger value="status">Status</TabsTrigger>
          <TabsTrigger value="seatmaps">Seat Maps</TabsTrigger>
        </TabsList>

        {/* FLIGHTS — recurring template only */}
        <TabsContent value="flights">
          <Card>
            <CardHeader>
              <CardTitle>Recurring Flight Templates</CardTitle>
              <CardDescription>
                Create route templates. Flights are auto-generated daily for the next 4 weeks.
                Assign an aircraft model to activate seat selection for that route.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RecurringFlightForm />
            </CardContent>
          </Card>
        </TabsContent>

        {/* HOTELS */}
        <TabsContent value="hotels">
          <Card>
            <CardHeader>
              <CardTitle>Manage Hotels</CardTitle>
              <CardDescription>Add, edit, or remove hotels from the system.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <HotelList onSelect={setSelectedHotel} />
                <AddEditHotel hotel={selectedHotel} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* USERS */}
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>Search for a specific user, or browse everyone registered.</CardDescription>
            </CardHeader>
            <CardContent><UserSearch /></CardContent>
          </Card>
        </TabsContent>

        {/* REFUNDS */}
        <TabsContent value="refunds">
          <Card>
            <CardHeader>
              <CardTitle>Cancellations & Refunds</CardTitle>
              <CardDescription>Review cancelled bookings and advance refunds through processing.</CardDescription>
            </CardHeader>
            <CardContent><RefundsTab /></CardContent>
          </Card>
        </TabsContent>

        {/* STATUS */}
        <TabsContent value="status">
          <Card>
            <CardHeader>
              <CardTitle>Live Flight Status</CardTitle>
              <CardDescription>
                Update live status, delays, and reasons for active flights.
              </CardDescription>
            </CardHeader>
            <CardContent><FlightStatusTab /></CardContent>
          </Card>
        </TabsContent>

        {/* SEAT MAPS */}
        <TabsContent value="seatmaps">
          <Card>
            <CardHeader>
              <CardTitle>Aircraft Seat Maps</CardTitle>
              <CardDescription>
                Assign aircraft models to flights and generate seat maps.
                Flights without a model show as unavailable to users.
              </CardDescription>
            </CardHeader>
            <CardContent><SeatMapAdmin /></CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

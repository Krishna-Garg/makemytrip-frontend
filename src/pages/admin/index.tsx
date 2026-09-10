"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useRouter } from "next/router";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ImagePlus, Trash2, ChevronDown, ChevronUp, RefreshCw, Plane } from "lucide-react";
import UserList from "@/components/Admin/UserList";
import RefundsTab from "@/components/Admin/RefundsTab";
import FlightStatusTab from "@/components/Admin/FlightStatusTab";
import SeatMapAdmin from "@/components/Admin/SeatMapAdmin";
import FlaggedReviewsTab from "@/components/Admin/FlaggedReviewsTab";
import HotelList from "@/components/Hotel/Hotel";
import {
  addhotel, edithotel, getuserbyemail, createFlightTemplate, getflight,
  getGeneratedFlights, regenerateFlights, getAllTemplates
} from "@/api";

const DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
const AIRCRAFT_MODELS = [
  { value: "AIR_ASIA",      label: "Air Asia (40 seats)" },
  { value: "INTER_TRAVELS", label: "InterTravels (60 seats)" },
  { value: "WORLD_GUIDE",   label: "World Guide (30 seats, no economy)" },
];

const STATUS_COLORS: Record<string, string> = {
  ON_TIME:  "bg-green-100 text-green-700",
  DELAYED:  "bg-red-100 text-red-700",
  BOARDING: "bg-blue-100 text-blue-700",
  DEPARTED: "bg-gray-100 text-gray-600",
};

const todayStr = new Date().toISOString().slice(0, 10);

// ── Generated flights viewer (per template) ───────────────────────────────────
function GeneratedFlightsList({ templateId, flightName }: { templateId: string; flightName: string }) {
  const [flights, setFlights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);

  const fetchFlights = async () => {
    setLoading(true);
    const data = await getGeneratedFlights(templateId);
    setFlights(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchFlights(); }, [templateId]);

  const handleRegenerate = async () => {
    setRegenerating(true);
    await regenerateFlights(templateId);
    await fetchFlights();
    setRegenerating(false);
  };

  const formatDep = (dt: string) => {
    try {
      return new Date(dt).toLocaleString("en-IN", {
        day: "numeric", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      });
    } catch { return dt; }
  };

  if (loading) return <p className="text-xs text-muted-foreground py-2">Loading generated flights...</p>;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">
          {flights.length} flight{flights.length !== 1 ? "s" : ""} generated from this template
        </p>
        <button
          onClick={handleRegenerate}
          disabled={regenerating}
          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 disabled:opacity-60"
        >
          <RefreshCw className={`w-3 h-3 ${regenerating ? "animate-spin" : ""}`} />
          {regenerating ? "Regenerating..." : "Regenerate Now"}
        </button>
      </div>

      {flights.length === 0 ? (
        <p className="text-xs text-muted-foreground italic">
          No flights generated yet. Click "Regenerate Now" to create flights for the next 4 weeks.
        </p>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="text-xs">Departure</TableHead>
                <TableHead className="text-xs">Arrival</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs">Seats Left</TableHead>
                <TableHead className="text-xs">Aircraft</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {flights.map((f: any) => (
                <TableRow key={f._id || f.id}>
                  <TableCell className="text-xs">{formatDep(f.departureTime)}</TableCell>
                  <TableCell className="text-xs">{formatDep(f.arrivalTime)}</TableCell>
                  <TableCell>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[f.status] || "bg-gray-100 text-gray-600"}`}>
                      {f.status?.replace("_", " ") || "ON TIME"}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs">{f.availableSeats}</TableCell>
                  <TableCell>
                    {f.aircraftModel
                      ? <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">{f.aircraftModel}</span>
                      : <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">No model</span>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

// ── Recurring Flight Template Form ────────────────────────────────────────────
function RecurringFlightForm() {
  const [tpl, setTpl] = useState({
    flightName: "", from: "", to: "", baseTime: "", arrivalOffset: 2,
    price: 0, availableSeats: 0, boardingMinutes: 45,
    recurringDays: [] as string[], aircraftModel: "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [templates, setTemplates] = useState<any[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null);

  const fetchTemplates = async () => {
    setLoadingTemplates(true);
    try {
      const data = await getAllTemplates();
      setTemplates(Array.isArray(data) ? data : []);
    } catch { setTemplates([]); }
    setLoadingTemplates(false);
  };

  useEffect(() => { fetchTemplates(); }, []);

  const toggleDay = (day: string) => {
    setTpl((t) => ({
      ...t,
      recurringDays: t.recurringDays.includes(day)
        ? t.recurringDays.filter((d) => d !== day)
        : [...t.recurringDays, day],
    }));
  };

  const handleSave = async () => {
    setError("");
    if (!tpl.flightName || !tpl.from || !tpl.to || !tpl.baseTime) {
      setError("Please fill in all required fields."); return;
    }
    if (tpl.recurringDays.length === 0) {
      setError("Select at least one recurring day."); return;
    }
    if (tpl.price <= 0 || tpl.availableSeats <= 0) {
      setError("Price and seats must be greater than 0."); return;
    }

    const [hours, minutes] = tpl.baseTime.split(":").map(Number);
    const dep = new Date();
    dep.setHours(hours, minutes, 0, 0);
    if (dep < new Date()) dep.setDate(dep.getDate() + 1);
    const arr = new Date(dep.getTime() + tpl.arrivalOffset * 60 * 60 * 1000);

    const toLocal = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}T${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;

    setSaving(true);
    try {
      const result = await createFlightTemplate({
        flightName: tpl.flightName, from: tpl.from, to: tpl.to,
        baseTime: tpl.baseTime, departureTime: toLocal(dep), arrivalTime: toLocal(arr),
        price: tpl.price, availableSeats: tpl.availableSeats,
        boardingMinutes: tpl.boardingMinutes, recurringDays: tpl.recurringDays,
        aircraftModel: tpl.aircraftModel || null, isTemplate: true,
      });
      setSaved(true);
      await fetchTemplates();
      // Auto-expand the newly created template
      if (result?.template?._id || result?.template?.id) {
        setExpandedTemplate(result.template._id || result.template.id);
      }
      setTpl({ flightName: "", from: "", to: "", baseTime: "", arrivalOffset: 2,
        price: 0, availableSeats: 0, boardingMinutes: 45, recurringDays: [], aircraftModel: "" });
      setTimeout(() => setSaved(false), 3000);
    } catch { setError("Failed to save template. Please try again."); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-8">
      {/* Form */}
      <div className="border rounded-xl p-6 bg-muted/20 space-y-5">
        <div>
          <h3 className="font-semibold text-base">Create Recurring Flight Template</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Flights auto-generate for the next 4 weeks immediately on save, then refresh every midnight.
            Today is <strong>{todayStr}</strong> — past-date flights are never created.
          </p>
        </div>

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
              <option value="">Not assigned — flight held until model set</option>
              {AIRCRAFT_MODELS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
            {!tpl.aircraftModel && (
              <p className="text-xs text-amber-600 mt-1">⚠ Flights without a model show grey to users.</p>
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
            <Label>Departure Time * (daily)</Label>
            <Input type="time" value={tpl.baseTime}
              onChange={(e) => setTpl({ ...tpl, baseTime: e.target.value })} />
            <p className="text-xs text-muted-foreground mt-1">
              If already passed today, first flight starts tomorrow.
            </p>
          </div>
          <div>
            <Label>Flight Duration (hours)</Label>
            <Input type="number" min={1} max={24} value={tpl.arrivalOffset}
              onChange={(e) => setTpl({ ...tpl, arrivalOffset: Number(e.target.value) })} />
          </div>
          <div>
            <Label>Price per seat (₹) *</Label>
            <Input type="number" min={1} value={tpl.price}
              onChange={(e) => setTpl({ ...tpl, price: Number(e.target.value) })} />
          </div>
          <div>
            <Label>Total Seats *</Label>
            <Input type="number" min={1} value={tpl.availableSeats}
              onChange={(e) => setTpl({ ...tpl, availableSeats: Number(e.target.value) })} />
          </div>
          <div>
            <Label>Boarding Opens (mins before departure)</Label>
            <Input type="number" min={15} value={tpl.boardingMinutes}
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
                }`}>{d}</button>
            ))}
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving ? "Saving & Generating Flights..." : saved ? "✓ Template Saved!" : "Save & Generate Flights"}
        </Button>
      </div>

      {/* Templates list with expandable generated flights */}
      <div>
        <h3 className="font-semibold text-base mb-3">
          Active Templates ({templates.length})
        </h3>
        {loadingTemplates ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : templates.length === 0 ? (
          <p className="text-sm text-muted-foreground">No templates yet. Create one above.</p>
        ) : (
          <div className="space-y-3">
            {templates.map((t: any) => {
              const tid = t._id || t.id;
              const isExpanded = expandedTemplate === tid;
              return (
                <div key={tid} className="border rounded-xl overflow-hidden">
                  {/* Template header row */}
                  <div
                    className="flex items-center justify-between p-4 bg-white cursor-pointer hover:bg-muted/20 transition-colors"
                    onClick={() => setExpandedTemplate(isExpanded ? null : tid)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-100 p-2 rounded-lg">
                        <Plane className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">{t.flightName}</span>
                          <span className="text-muted-foreground text-xs">{t.from} → {t.to}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-xs text-muted-foreground">Daily at {t.baseTime}</span>
                          <div className="flex gap-1">
                            {(t.recurringDays || []).map((d: string) => (
                              <span key={d} className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">{d}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-sm font-semibold">₹{t.price?.toLocaleString("en-IN")}</div>
                        <div className="text-xs text-muted-foreground">{t.availableSeats} seats</div>
                      </div>
                      {t.aircraftModel
                        ? <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{t.aircraftModel}</span>
                        : <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">No model</span>}
                      {isExpanded
                        ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
                        : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                    </div>
                  </div>

                  {/* Expandable: generated flights */}
                  {isExpanded && (
                    <div className="border-t bg-muted/10 p-4">
                      <GeneratedFlightsList templateId={tid} flightName={t.flightName} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Add/Edit Hotel ────────────────────────────────────────────────────────────
interface Hotel {
  id?: string; hotelName: string; location: string;
  pricePerNight: number; availableRooms: number;
  amenities: string; imageUrls?: string[];
}

function AddEditHotel({ hotel }: { hotel: Hotel | null }) {
  const [formData, setFormData] = useState<Hotel>({
    hotelName: "", location: "", pricePerNight: 0,
    availableRooms: 0, amenities: "", imageUrls: [],
  });
  const [newImageUrl, setNewImageUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setFormData(hotel ? { ...hotel, imageUrls: hotel.imageUrls || [] }
      : { hotelName: "", location: "", pricePerNight: 0, availableRooms: 0, amenities: "", imageUrls: [] });
    setNewImageUrl("");
  }, [hotel]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const addImageUrl = () => {
    if (!newImageUrl.trim()) return;
    try { new URL(newImageUrl); } catch { alert("Please enter a valid URL."); return; }
    setFormData((prev) => ({ ...prev, imageUrls: [...(prev.imageUrls || []), newImageUrl.trim()] }));
    setNewImageUrl("");
  };

  const removeImageUrl = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      imageUrls: (prev.imageUrls || []).filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (hotel) {
        await edithotel(hotel.id, formData.hotelName, formData.location,
          formData.pricePerNight, formData.availableRooms, formData.amenities, formData.imageUrls || []);
      } else {
        await addhotel(formData.hotelName, formData.location,
          formData.pricePerNight, formData.availableRooms, formData.amenities, formData.imageUrls || []);
        setFormData({ hotelName: "", location: "", pricePerNight: 0,
          availableRooms: 0, amenities: "", imageUrls: [] });
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally { setSaving(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-semibold mb-2">{hotel ? "Edit Hotel" : "Add New Hotel"}</h3>
      <div><Label>Hotel Name *</Label>
        <Input name="hotelName" value={formData.hotelName} onChange={handleChange} required /></div>
      <div><Label>Location *</Label>
        <Input name="location" value={formData.location} onChange={handleChange} required /></div>
      <div><Label>Price Per Night (₹) *</Label>
        <Input name="pricePerNight" type="number" value={formData.pricePerNight} onChange={handleChange} required /></div>
      <div><Label>Available Rooms *</Label>
        <Input name="availableRooms" type="number" value={formData.availableRooms} onChange={handleChange} required /></div>
      <div><Label>Amenities (comma separated)</Label>
        <Textarea name="amenities" value={formData.amenities} onChange={handleChange}
          placeholder="Wi-Fi, Pool, Spa, Restaurant" /></div>

      <div className="space-y-3">
        <Label className="flex items-center gap-2">
          <ImagePlus className="w-4 h-4" />Hotel Images (URLs)
        </Label>
        {(formData.imageUrls || []).length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {(formData.imageUrls || []).map((url, index) => (
              <div key={index} className="relative group">
                <img src={url} alt={`Hotel image ${index + 1}`}
                  className="w-full h-20 object-cover rounded-lg border"
                  onError={(e) => (e.currentTarget.style.display = "none")} />
                <button type="button" onClick={() => removeImageUrl(index)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Trash2 className="w-3 h-3" />
                </button>
                <span className="absolute bottom-1 left-1 bg-black/50 text-white text-xs px-1 rounded">
                  {index === 0 ? "Main" : `#${index + 1}`}
                </span>
              </div>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <Input value={newImageUrl} onChange={(e) => setNewImageUrl(e.target.value)}
            placeholder="https://images.unsplash.com/..."
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addImageUrl())} />
          <Button type="button" variant="outline" onClick={addImageUrl}>Add</Button>
        </div>
        <p className="text-xs text-muted-foreground">First image is the main photo.</p>
      </div>

      <Button type="submit" disabled={saving} className="w-full">
        {saving ? "Saving..." : saved ? "✓ Saved!" : hotel ? "Update Hotel" : "Add Hotel"}
      </Button>
    </form>
  );
}

// ── User Search ───────────────────────────────────────────────────────────────
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
    e.preventDefault(); setSearching(true); setError(""); setUser(null);
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
        <Button type="submit" disabled={searching}>{searching ? "Searching..." : "Search"}</Button>
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

// ── Dashboard ─────────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("flights");
  const [selectedHotel, setSelectedHotel] = useState(null);
  const user = useSelector((state: any) => state.user.user);
  const router = useRouter();

  useEffect(() => {
    if (!user || user.role !== "ADMIN") router.replace("/");
  }, [user, router]);

  if (!user || user.role !== "ADMIN") return null;

  return (
    <div className="container mx-auto p-4 md:p-8 bg-background max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Manage flights, hotels, users, refunds, seat maps, and content moderation.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="flights">Flights</TabsTrigger>
          <TabsTrigger value="hotels">Hotels</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="refunds">Refunds</TabsTrigger>
          <TabsTrigger value="status">Status</TabsTrigger>
          <TabsTrigger value="seatmaps">Seat Maps</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
        </TabsList>

        <TabsContent value="flights">
          <Card>
            <CardHeader>
              <CardTitle>Recurring Flight Templates</CardTitle>
              <CardDescription>
                Create route templates. Click any template to see its generated flights.
              </CardDescription>
            </CardHeader>
            <CardContent><RecurringFlightForm /></CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hotels">
          <Card>
            <CardHeader>
              <CardTitle>Manage Hotels</CardTitle>
              <CardDescription>Add, edit, or remove hotels. Upload image URLs for each property.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <HotelList onSelect={setSelectedHotel} />
                <AddEditHotel hotel={selectedHotel} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>Search for a specific user or browse all registered users.</CardDescription>
            </CardHeader>
            <CardContent><UserSearch /></CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="refunds">
          <Card>
            <CardHeader>
              <CardTitle>Cancellations & Refunds</CardTitle>
              <CardDescription>Review and advance refund statuses for cancelled bookings.</CardDescription>
            </CardHeader>
            <CardContent><RefundsTab /></CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="status">
          <Card>
            <CardHeader>
              <CardTitle>Live Flight Status</CardTitle>
              <CardDescription>Update live status, delays, and reasons for active flights.</CardDescription>
            </CardHeader>
            <CardContent><FlightStatusTab /></CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seatmaps">
          <Card>
            <CardHeader>
              <CardTitle>Aircraft Seat Maps</CardTitle>
              <CardDescription>Assign aircraft models to flights and generate seat maps.</CardDescription>
            </CardHeader>
            <CardContent><SeatMapAdmin /></CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reviews">
          <Card>
            <CardHeader>
              <CardTitle>Content Moderation</CardTitle>
              <CardDescription>Review flagged content. Approve or delete as appropriate.</CardDescription>
            </CardHeader>
            <CardContent><FlaggedReviewsTab /></CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

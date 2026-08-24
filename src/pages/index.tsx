// pages/index.tsx
import { getflight, gethotel } from "@/api";
import RecommendationPanel from "@/components/Recommendations/RecommendationPanel";
import Loader from "@/components/Loader";
import { SearchSelect } from "@/components/SearchSelect";
import SignupDialog from "@/components/SignupDialog";
import { Button } from "@/components/ui/button";
import {
  Bus,
  Calendar,
  Car,
  CreditCard,
  HomeIcon,
  Hotel,
  MapPin,
  Plane,
  QrCode,
  Shield,
  Train,
  Umbrella,
  Users,
} from "lucide-react";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";

export default function Home() {
  const [bookingtype, setbookingtype] = useState("flights");
  const [from, setfrom] = useState("");
  const [to, setto] = useState("");
  const [date, setdate] = useState("");
  const [travelers, settravelers] = useState(1);
  const [searchresults, setsearchresult] = useState<any[]>([]);
  const [hotel, sethotel] = useState<any[]>([]);
  const [loading, setloading] = useState(true);
  const [flight, setflight] = useState<any[]>([]);
  const user = useSelector((state: any) => state.user.user);
  const router = useRouter();

  const offers = [
    {
      title: "Domestic Flights",
      description: "Get up to 20% off on domestic flights",
      imageUrl:
        "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=800",
    },
    {
      title: "International Hotels",
      description: "Book luxury hotels worldwide",
      imageUrl:
        "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800",
    },
    {
      title: "Holiday Packages",
      description: "Exclusive deals on holiday packages",
      imageUrl:
        "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800",
    },
  ];

  const collections = [
    {
      title: "Stays in & Around Delhi",
      imageUrl:
        "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800",
      tag: "TOP 8",
    },
    {
      title: "Stays in & Around Mumbai",
      imageUrl:
        "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=800",
      tag: "TOP 8",
    },
    {
      title: "Stays in & Around Bangalore",
      imageUrl:
        "https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=800",
      tag: "TOP 9",
    },
    {
      title: "Beach Destinations",
      imageUrl:
        "https://images.unsplash.com/photo-1520454974749-611b7248ffdb?auto=format&fit=crop&w=800",
      tag: "TOP 11",
    },
  ];

  const wonders = [
    {
      title: "Shimla's Best Kept Secret",
      imageUrl:
        "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=800",
    },
    {
      title: "Tamil Nadu's Charming Hill Town",
      imageUrl:
        "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=800",
    },
    {
      title: "Quaint Little Hill Station in Gujarat",
      imageUrl:
        "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=800",
    },
    {
      title: "A pleasant summer retreat",
      imageUrl:
        "https://images.unsplash.com/photo-1593181629936-11c609b8db9b?auto=format&fit=crop&w=800",
    },
  ];

  useEffect(() => {
    const fetchdata = async () => {
      try {
        const data = await gethotel();
        sethotel(Array.isArray(data) ? data : []);
        const flightdata = await getflight();
        setflight(Array.isArray(flightdata) ? flightdata : []);
      } catch (error) {
        console.error(error);
        sethotel([]);
        setflight([]);
      } finally {
        setloading(false);
      }
    };
    fetchdata();
  }, [user]);

  // ── FIX: separate city options per booking type ──────────────────────────
  const flightCityOptions = useMemo(() => {
    const cities = new Set<string>();
    flight.forEach((f) => {
      cities.add(f.from);
      cities.add(f.to);
    });
    return Array.from(cities).map((c) => ({ value: c, label: c }));
  }, [flight]);

  const hotelCityOptions = useMemo(() => {
    const cities = new Set<string>();
    hotel.forEach((h) => {
      cities.add(h.location);
    });
    return Array.from(cities).map((c) => ({ value: c, label: c }));
  }, [hotel]);

  const cityOptions =
    bookingtype === "flights" ? flightCityOptions : hotelCityOptions;
  // ─────────────────────────────────────────────────────────────────────────

  // Reset search fields when switching booking type
  const handleBookingTypeChange = (type: string) => {
    setbookingtype(type);
    setfrom("");
    setto("");
    setsearchresult([]);
  };

  if (loading) return <Loader />;

  const handlesearch = () => {
    if (bookingtype === "flights") {
      const results = flight.filter(
        (f) =>
          f.from.toLowerCase() === from.toLowerCase() &&
          f.to.toLowerCase() === to.toLowerCase(),
      );
      setsearchresult(results);
    } else {
      const results = hotel.filter(
        (h) => h.location.toLowerCase() === to.toLowerCase(),
      );
      setsearchresult(results);
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handlebooknow = (id: any) => {
    if (bookingtype === "flights") router.push(`/book-flight/${id}`);
    else router.push(`/book-hotel/${id}`);
  };

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage:
          'url("https://images.unsplash.com/photo-1464037866556-6812c9d1c72e?ixlib=rb-4.0.3&auto=format&fit=crop&w=2940&q=80")',
      }}
    >
      <main className="container mx-auto px-4 py-6">
        {/* Nav */}
	    <div className="max-w-5xl mx-auto mb-6">
		    <RecommendationPanel variant="compact" />
	    </div>
        <nav className="bg-white rounded-xl shadow-lg mx-auto max-w-5xl mb-6 p-4 overflow-x-auto">
          <div className="flex justify-between items-center min-w-max space-x-8">
            <NavItem
              icon={<Plane />}
              text="Flights"
              active={bookingtype === "flights"}
              onClick={() => handleBookingTypeChange("flights")}
            />
            <NavItem
              icon={<Hotel />}
              text="Hotels"
              active={bookingtype === "hotels"}
              onClick={() => handleBookingTypeChange("hotels")}
            />
            <NavItem icon={<HomeIcon />} text="Homestays" />
            <NavItem icon={<Umbrella />} text="Holiday" />
            <NavItem icon={<Train />} text="Trains" />
            <NavItem icon={<Bus />} text="Buses" />
            <NavItem icon={<Car />} text="Cabs" />
            <NavItem icon={<CreditCard />} text="Forex" />
            <NavItem icon={<Shield />} text="Insurance" />
          </div>
        </nav>

        {/* Search box */}
        <div className="bg-white rounded-xl shadow-lg mx-auto max-w-5xl p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {bookingtype === "flights" && (
              <div className="col-span-1">
                <SearchSelect
                  options={cityOptions}
                  placeholder="From"
                  value={from}
                  onChange={setfrom}
                  icon={<MapPin className="text-gray-400" />}
                  subtitle="Enter city or airport"
                />
              </div>
            )}

            <div className="col-span-1">
              <SearchSelect
                options={cityOptions}
                placeholder={bookingtype === "flights" ? "To" : "City"}
                value={to}
                onChange={setto}
                icon={<MapPin className="text-gray-400" />}
                subtitle={
                  bookingtype === "flights"
                    ? "Enter city or airport"
                    : "Enter city"
                }
              />
            </div>

            <div className="col-span-1">
              <SearchInput
                icon={<Calendar className="text-gray-400" />}
                placeholder="Date"
                value={date}
                onChange={(e: any) => setdate(e.target.value)}
                subtitle="Select date"
                type="date"
              />
            </div>

            <div className="col-span-1">
              <SearchInput
                icon={<Users className="text-gray-400" />}
                placeholder="Travelers"
                value={travelers}
                onChange={(e: any) => settravelers(Number(e.target.value))}
                subtitle="Add travelers"
                type="number"
              />
            </div>

            <div className="col-span-1 flex items-center">
              <Button
                onClick={handlesearch}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white h-full min-h-[60px] rounded-lg font-semibold"
              >
                Search
              </Button>
            </div>
          </div>
        </div>

        {/* Search results */}
        {searchresults.length > 0 && (
          <div className="mx-auto max-w-5xl mt-6">
            <h2 className="text-xl font-semibold mb-4 text-white">
              Search Results
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {searchresults.map((result) => (
                <div
                  key={result._id || result.id}
                  className="bg-white rounded-lg shadow p-4 border border-gray-200"
                >
                  {bookingtype === "flights" ? (
                    <>
                      <p className="font-semibold text-lg">
                        {result.flightName}
                      </p>
                      <h3 className="font-semibold text-lg">
                        {result.from} → {result.to}
                      </h3>
                      <p className="text-gray-600 text-sm">
                        Departs: {formatDate(result.departureTime)}
                      </p>
                      <p className="text-gray-600 text-sm">
                        Arrives: {formatDate(result.arrivalTime)}
                      </p>
                      <p className="text-lg font-bold mt-2">₹{result.price}</p>
                      <Button
                        className="w-full mt-4"
                        onClick={() => handlebooknow(result._id || result.id)}
                      >
                        Book Now
                      </Button>
                    </>
                  ) : (
                    <>
                      <h3 className="font-semibold text-lg">
                        {result.hotelName}
                      </h3>
                      <p className="text-gray-600">City: {result.location}</p>
                      <p className="text-lg font-bold mt-2">
                        ₹{result.pricePerNight} per night
                      </p>
                      <Button
                        className="w-full mt-4"
                        onClick={() => handlebooknow(result._id || result.id)}
                      >
                        Book Now
                      </Button>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="max-w-7xl mx-auto px-4">
          <section className="my-16">
            <h2 className="text-2xl font-bold mb-8 text-white">Best Offers</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {offers.map((offer, index) => (
                <OfferCard key={index} {...offer} />
              ))}
            </div>
          </section>

          <section className="my-16">
            <h2 className="text-2xl font-bold mb-8 text-white">
              Handpicked Collections for You
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {collections.map((c, i) => (
                <CollectionCard key={i} {...c} />
              ))}
            </div>
          </section>

          <section className="my-16">
            <h2 className="text-2xl font-bold mb-8 text-white">
              Unlock Lesser-Known Wonders of India
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {wonders.map((w, i) => (
                <WonderCard key={i} {...w} />
              ))}
            </div>
          </section>

          <DownloadApp />
        </div>
      </main>
    </div>
  );
}

// ── Sub-components (unchanged visually) ─────────────────────────────────────

const OfferCard = ({ title, description, imageUrl }: any) => (
  <div className="bg-white rounded-lg shadow-md overflow-hidden">
    <img src={imageUrl} alt={title} className="w-full h-48 object-cover" />
    <div className="p-4">
      <h3 className="font-semibold text-lg mb-2">{title}</h3>
      <p className="text-gray-600 text-sm">{description}</p>
      <button className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
        Book Now
      </button>
    </div>
  </div>
);

const CollectionCard = ({ title, imageUrl, tag }: any) => (
  <div className="relative group cursor-pointer overflow-hidden rounded-lg">
    <img
      src={imageUrl}
      alt={title}
      className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-110"
    />
    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/70">
      <div className="absolute top-4 left-4">
        <span className="bg-white text-black text-sm font-semibold px-2 py-1 rounded">
          {tag}
        </span>
      </div>
      <div className="absolute bottom-4 left-4 right-4">
        <h3 className="text-white text-lg font-semibold">{title}</h3>
      </div>
    </div>
  </div>
);

const WonderCard = ({ title, imageUrl }: any) => (
  <div className="relative group cursor-pointer overflow-hidden rounded-lg">
    <img
      src={imageUrl}
      alt={title}
      className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-110"
    />
    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/70">
      <div className="absolute bottom-4 left-4 right-4">
        <h3 className="text-white text-lg font-semibold">{title}</h3>
      </div>
    </div>
  </div>
);

const DownloadApp = () => (
  <div className="bg-white p-6 rounded-lg shadow-md max-w-7xl mx-auto my-12">
    <div className="flex flex-col md:flex-row items-center justify-between">
      <div className="mb-6 md:mb-0">
        <h3 className="text-xl font-bold mb-2">Download App Now!</h3>
        <p className="text-gray-600 mb-4">
          Get India's #1 travel super app with best deals on flights
        </p>
        <div className="flex space-x-4">
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg"
            alt="App Store"
            className="h-10"
          />
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg"
            alt="Play Store"
            className="h-10"
          />
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <QrCode className="w-24 h-24" />
        <p className="text-sm text-gray-600">
          Scan QR code to download the app
        </p>
      </div>
    </div>
  </div>
);

function NavItem({ icon, text, active = false, onClick }: any) {
  return (
    <button
      className={`flex flex-col items-center p-2 rounded-lg transition-colors ${active ? "text-blue-500" : "text-gray-600 hover:text-blue-500"}`}
      onClick={onClick}
    >
      {icon}
      <span className="text-sm mt-1 whitespace-nowrap">{text}</span>
    </button>
  );
}

function SearchInput({
  icon,
  placeholder,
  value,
  onChange,
  subtitle,
  type = "text",
}: any) {
  return (
    <div className="border rounded-lg p-3 hover:border-blue-500 cursor-pointer h-full">
      <div className="flex items-center space-x-2">
        {icon}
        <div className="flex-1 min-w-0">
          <div className="text-sm text-gray-500 truncate">{placeholder}</div>
          <input
            type={type}
            value={value}
            onChange={onChange}
            className="font-semibold w-full bg-transparent outline-none"
            placeholder={placeholder}
          />
          <div className="text-xs text-gray-400 truncate">{subtitle}</div>
        </div>
      </div>
    </div>
  );
}

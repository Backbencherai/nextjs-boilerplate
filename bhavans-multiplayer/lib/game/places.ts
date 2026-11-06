/* Real places you can search and jump to in Explore. Landmarks are added from landmarks.ts. */
import { LANDMARKS } from "./landmarks";

export interface Place {
  id: string;
  name: string;
  country: string;
  lat: number;
  lon: number;
  kind: "city" | "landmark" | "search" | "adventure";
  tags?: Activity[];
  icon: string;
}

const C = (name: string, country: string, lat: number, lon: number): Place => ({ id: "c:" + name.toLowerCase().replace(/[^a-z]+/g, "-"), name, country, lat, lon, kind: "city", icon: "🏙️" });

export const CITIES: Place[] = [
  C("New Delhi", "India", 28.6139, 77.209),
  C("Mumbai", "India", 18.94, 72.835),
  C("Agra", "India", 27.1767, 78.0081),
  C("Jaipur", "India", 26.9239, 75.8267),
  C("Bengaluru", "India", 12.9716, 77.5946),
  C("Kolkata", "India", 22.5726, 88.3639),
  C("Chennai", "India", 13.0827, 80.2707),
  C("Hyderabad", "India", 17.385, 78.4867),
  C("Varanasi", "India", 25.3109, 83.0107),
  C("Amritsar", "India", 31.62, 74.8765),
  C("Nagpur", "India", 21.1458, 79.0882),
  C("Pune", "India", 18.5204, 73.8567),
  C("Ahmedabad", "India", 23.0225, 72.5714),
  C("Udaipur", "India", 24.5854, 73.7125),
  C("London", "United Kingdom", 51.5007, -0.1246),
  C("Paris", "France", 48.8566, 2.3522),
  C("Rome", "Italy", 41.9028, 12.4964),
  C("Venice", "Italy", 45.4408, 12.3155),
  C("Barcelona", "Spain", 41.4036, 2.1744),
  C("Madrid", "Spain", 40.4168, -3.7038),
  C("Berlin", "Germany", 52.5163, 13.3777),
  C("Amsterdam", "Netherlands", 52.3731, 4.8922),
  C("Prague", "Czechia", 50.0865, 14.4114),
  C("Vienna", "Austria", 48.2082, 16.3738),
  C("Istanbul", "Turkey", 41.0086, 28.9802),
  C("Athens", "Greece", 37.9715, 23.7257),
  C("Moscow", "Russia", 55.7539, 37.6208),
  C("Dubai", "United Arab Emirates", 25.1972, 55.2744),
  C("Mecca", "Saudi Arabia", 21.4225, 39.8262),
  C("Cairo", "Egypt", 30.0444, 31.2357),
  C("Cape Town", "South Africa", -33.9249, 18.4241),
  C("Nairobi", "Kenya", -1.2864, 36.8172),
  C("Lagos", "Nigeria", 6.4541, 3.3947),
  C("Marrakesh", "Morocco", 31.6258, -7.9892),
  C("New York", "United States", 40.758, -73.9855),
  C("San Francisco", "United States", 37.7955, -122.3937),
  C("Los Angeles", "United States", 34.1016, -118.3267),
  C("Las Vegas", "United States", 36.1147, -115.1728),
  C("Chicago", "United States", 41.8826, -87.6233),
  C("Washington DC", "United States", 38.8895, -77.0353),
  C("Miami", "United States", 25.7907, -80.13),
  C("Toronto", "Canada", 43.6426, -79.3871),
  C("Vancouver", "Canada", 49.2827, -123.1207),
  C("Mexico City", "Mexico", 19.4326, -99.1332),
  C("Rio de Janeiro", "Brazil", -22.9711, -43.1822),
  C("São Paulo", "Brazil", -23.5614, -46.6559),
  C("Buenos Aires", "Argentina", -34.6037, -58.3816),
  C("Lima", "Peru", -12.0464, -77.0428),
  C("Tokyo", "Japan", 35.6595, 139.7005),
  C("Kyoto", "Japan", 35.0116, 135.7681),
  C("Seoul", "South Korea", 37.5665, 126.978),
  C("Beijing", "China", 39.9042, 116.4074),
  C("Shanghai", "China", 31.2397, 121.4998),
  C("Hong Kong", "China", 22.2934, 114.1713),
  C("Singapore", "Singapore", 1.2834, 103.8607),
  C("Bangkok", "Thailand", 13.7563, 100.5018),
  C("Kuala Lumpur", "Malaysia", 3.1579, 101.7116),
  C("Jakarta", "Indonesia", -6.1754, 106.8272),
  C("Bali (Ubud)", "Indonesia", -8.5069, 115.2625),
  C("Kathmandu", "Nepal", 27.7172, 85.324),
  C("Dhaka", "Bangladesh", 23.8103, 90.4125),
  C("Colombo", "Sri Lanka", 6.9271, 79.8612),
  C("Karachi", "Pakistan", 24.8607, 67.0011),
  C("Sydney", "Australia", -33.8568, 151.2153),
  C("Melbourne", "Australia", -37.8136, 144.9631),
  C("Auckland", "New Zealand", -36.8485, 174.7633),
];

export type Activity = "ski" | "trek" | "beach" | "jetski" | "boat" | "cruise" | "camp" | "shop";
const A = (name: string, country: string, lat: number, lon: number, icon: string, tags: Activity[]): Place => ({ id: "a:" + name.toLowerCase().replace(/[^a-z]+/g, "-"), name, country, lat, lon, kind: "adventure", icon, tags });

/** Mountains, slopes, beaches, seas and forests. Real places, streamed in real 3D. */
export const ADVENTURES: Place[] = [
  A("Gulmarg ski slopes", "India", 34.0484, 74.3805, "🎿", ["ski", "shop"]),
  A("Auli ski resort", "India", 30.5287, 79.5672, "🎿", ["ski", "trek"]),
  A("Zermatt & the Matterhorn", "Switzerland", 45.9763, 7.6586, "🏔️", ["ski", "trek", "shop"]),
  A("Chamonix, Mont Blanc", "France", 45.9237, 6.8694, "🏔️", ["ski", "trek", "shop"]),
  A("Whistler Blackcomb", "Canada", 50.1163, -122.9574, "🎿", ["ski", "shop"]),
  A("Aspen Snowmass", "United States", 39.2084, -106.9490, "🎿", ["ski", "shop"]),
  A("Niseko", "Japan", 42.8048, 140.6874, "🎿", ["ski"]),
  A("Everest Base Camp trek", "Nepal", 28.0026, 86.8528, "🥾", ["trek", "camp"]),
  A("Kedarkantha trek", "India", 31.0225, 78.1716, "🥾", ["trek", "camp"]),
  A("Triund, Dharamshala", "India", 32.2588, 76.3533, "🥾", ["trek", "camp"]),
  A("Valley of Flowers", "India", 30.7280, 79.6050, "🌸", ["trek"]),
  A("Inca Trail", "Peru", -13.2264, -72.4963, "🥾", ["trek", "camp"]),
  A("Yosemite Valley", "United States", 37.7456, -119.5936, "🌲", ["trek", "camp"]),
  A("Redwood forest, Monte Rio (Bohemian Grove area)", "United States", 38.4655, -123.0122, "🌲", ["trek", "camp"]),
  A("Banff & Lake Louise", "Canada", 51.4254, -116.1773, "🏞️", ["trek", "boat", "camp"]),
  A("Baga Beach, Goa", "India", 15.5553, 73.7517, "🏖️", ["beach", "jetski", "boat", "shop"]),
  A("Radhanagar Beach, Andaman", "India", 11.9846, 92.9500, "🏖️", ["beach", "boat"]),
  A("Kovalam, Kerala", "India", 8.4004, 76.9787, "🏖️", ["beach", "boat"]),
  A("Maldives, Malé atoll", "Maldives", 4.1755, 73.5093, "🏝️", ["beach", "jetski", "boat"]),
  A("Bondi Beach", "Australia", -33.8908, 151.2743, "🏄", ["beach", "shop"]),
  A("Waikiki, Honolulu", "United States", 21.2767, -157.8275, "🏄", ["beach", "jetski", "boat", "shop"]),
  A("Copacabana", "Brazil", -22.9711, -43.1825, "🏖️", ["beach", "shop"]),
  A("Santorini (Oia)", "Greece", 36.4618, 25.3753, "⛵", ["beach", "boat", "cruise"]),
  A("Dubai Marina", "United Arab Emirates", 25.0805, 55.1403, "🛥️", ["jetski", "boat", "cruise", "shop"]),
  A("Phi Phi Islands", "Thailand", 7.7407, 98.7784, "🏝️", ["beach", "boat"]),
  A("Miami cruise port", "United States", 25.7781, -80.1794, "🚢", ["cruise", "jetski", "boat"]),
  A("Barcelona cruise port", "Spain", 41.3685, 2.1776, "🚢", ["cruise", "beach"]),
  A("Mumbai Marine Drive", "India", 18.9440, 72.8231, "🌊", ["boat", "cruise", "shop"]),
  A("Dal Lake, Srinagar", "India", 34.1106, 74.8683, "🛶", ["boat"]),
];

export const PLACES: Place[] = [...ADVENTURES, ...LANDMARKS.map((l) => ({ id: "lm:" + l.id, name: l.name, country: l.country, lat: l.lat, lon: l.lon, kind: "landmark" as const, icon: l.icon })), ...CITIES];

export function searchPlaces(q: string, max = 8): Place[] {
  const s = q.trim().toLowerCase();
  if (!s) return [];
  return PLACES.filter((p) => p.name.toLowerCase().includes(s) || p.country.toLowerCase().includes(s))
    .sort((a, b) => Number(b.name.toLowerCase().startsWith(s)) - Number(a.name.toLowerCase().startsWith(s)))
    .slice(0, max);
}

/** Transport inside a city. Speeds are game-scaled so big real cities stay fun to cross. */
export const MODES = {
  walk: { icon: "🚶", name: "Walk", speed: 4, perKm: 0 },
  run: { icon: "🏃", name: "Run", speed: 8, perKm: 0 },
  cab: { icon: "🚕", name: "Cab", speed: 24, perKm: 3 },
  bus: { icon: "🚌", name: "Bus", speed: 15, perKm: 1 },
  metro: { icon: "🚇", name: "Metro", speed: 0, perKm: 1.5 },
  ski: { icon: "⛷️", name: "Ski", speed: 13, perKm: 2 },
  jetski: { icon: "🚤", name: "Jet ski", speed: 22, perKm: 6 },
  boat: { icon: "🛥️", name: "Boat", speed: 12, perKm: 4 },
  cruise: { icon: "🚢", name: "Cruise", speed: 0, perKm: 0.4 },
} as const;
export type Mode = keyof typeof MODES;

/* Real-world festivals and holidays by country (2026–2027 dates). Drives notifications, vacation ideas and city decorations. */
export type Deco = "diyas" | "colors" | "christmas" | "lanterns" | "fireworks" | "pumpkins" | "carnival" | "crescent" | "flags" | "blossom" | "water" | "beer" | "skulls" | "bonfire";

export interface Festival {
  id: string;
  name: string;
  icon: string;
  start: string; // YYYY-MM-DD (local date)
  days: number;
  countries: string[] | "all"; // country names as used in the game
  deco: Deco[];
  blurb: string;
  city?: string; // the best place to celebrate (a PLACES id)
}

const SOUTH_ASIA = ["India", "Nepal"];
const CHRISTIAN = ["United States", "United Kingdom", "France", "Italy", "Spain", "Germany", "Brazil", "Mexico", "Canada", "Australia", "Argentina", "Peru", "Netherlands", "Austria", "Czechia", "Greece", "Russia", "South Africa", "Kenya", "Nigeria", "New Zealand", "Philippines", "Poland", "Ireland", "Portugal", "Belgium", "Switzerland", "Sweden", "Norway", "Denmark", "Finland", "Colombia", "Chile", "Ukraine"];
const MUSLIM = ["Saudi Arabia", "United Arab Emirates", "Egypt", "Turkey", "Pakistan", "Bangladesh", "Indonesia", "Malaysia", "Morocco", "Jordan", "Iran", "Iraq", "Qatar", "Kuwait", "Oman", "Algeria", "Tunisia", "Nigeria", "India"];
const CHINESE = ["China", "Singapore", "Malaysia", "Taiwan", "Vietnam", "South Korea", "Indonesia", "Thailand"];

export const FESTIVALS: Festival[] = [
  { id: "diwali-26", name: "Diwali", icon: "🪔", start: "2026-11-07", days: 5, countries: [...SOUTH_ASIA, "Singapore", "Malaysia", "Sri Lanka", "Fiji", "Mauritius"], deco: ["diyas", "fireworks", "lanterns"], blurb: "The festival of lights: diyas on every step, rangoli, sweets and fireworks.", city: "c:jaipur" },
  { id: "bonfire-26", name: "Bonfire Night", icon: "🎆", start: "2026-11-05", days: 2, countries: ["United Kingdom"], deco: ["fireworks", "bonfire"], blurb: "Fireworks and bonfires across Britain.", city: "c:london" },
  { id: "chhath-26", name: "Chhath Puja", icon: "🌅", start: "2026-11-14", days: 3, countries: ["India", "Nepal"], deco: ["diyas"], blurb: "Prayers to the sun at riverbanks at dawn and dusk.", city: "c:varanasi" },
  { id: "thanks-26", name: "Thanksgiving", icon: "🦃", start: "2026-11-26", days: 1, countries: ["United States"], deco: ["flags", "pumpkins"], blurb: "Parades, family dinners and the giant balloon parade.", city: "c:new-york" },
  { id: "dubai-sf-26", name: "Dubai Shopping Festival", icon: "🛍️", start: "2026-12-15", days: 30, countries: ["United Arab Emirates"], deco: ["fireworks", "lanterns"], blurb: "Nightly fireworks and drone shows over the city.", city: "c:dubai" },
  { id: "xmas-26", name: "Christmas", icon: "🎄", start: "2026-12-20", days: 7, countries: CHRISTIAN, deco: ["christmas"], blurb: "Christmas trees, markets, carols and snow.", city: "c:vienna" },
  { id: "ny-27", name: "New Year's Eve", icon: "🎆", start: "2026-12-31", days: 2, countries: "all", deco: ["fireworks", "lanterns"], blurb: "Midnight fireworks in every city on Earth.", city: "c:sydney" },
  { id: "pongal-27", name: "Pongal & Makar Sankranti", icon: "🪁", start: "2027-01-14", days: 3, countries: ["India"], deco: ["flags"], blurb: "Kite-flying skies and harvest feasts.", city: "c:ahmedabad" },
  { id: "rday-27", name: "Republic Day", icon: "🇮🇳", start: "2027-01-26", days: 1, countries: ["India"], deco: ["flags", "fireworks"], blurb: "The grand parade on Kartavya Path in New Delhi.", city: "c:new-delhi" },
  { id: "carnival-27", name: "Rio Carnival", icon: "🎭", start: "2027-02-05", days: 6, countries: ["Brazil"], deco: ["carnival", "fireworks"], blurb: "Samba parades and street parties all night.", city: "c:rio-de-janeiro" },
  { id: "cny-27", name: "Chinese New Year", icon: "🧧", start: "2027-02-06", days: 7, countries: CHINESE, deco: ["lanterns", "fireworks"], blurb: "Red lanterns, dragon dances and firecrackers.", city: "c:hong-kong" },
  { id: "venice-27", name: "Venice Carnival", icon: "🎭", start: "2027-02-13", days: 10, countries: ["Italy"], deco: ["carnival", "lanterns"], blurb: "Masks, gowns and gondolas.", city: "c:venice" },
  { id: "ramadan-27", name: "Ramadan nights", icon: "🌙", start: "2027-02-08", days: 29, countries: MUSLIM, deco: ["crescent", "lanterns"], blurb: "Lanterns and evening iftar feasts.", city: "c:istanbul" },
  { id: "eid-27", name: "Eid al-Fitr", icon: "🌙", start: "2027-03-09", days: 3, countries: MUSLIM, deco: ["crescent", "lanterns", "fireworks"], blurb: "Prayers, new clothes, sweets and family visits.", city: "c:dubai" },
  { id: "holi-27", name: "Holi", icon: "🎨", start: "2027-03-22", days: 2, countries: ["India", "Nepal"], deco: ["colors"], blurb: "The festival of colours: throw gulal and dance!", city: "c:varanasi" },
  { id: "hanami-27", name: "Hanami (cherry blossoms)", icon: "🌸", start: "2027-03-25", days: 20, countries: ["Japan", "South Korea"], deco: ["blossom", "lanterns"], blurb: "Picnics under pink cherry trees.", city: "c:kyoto" },
  { id: "songkran-27", name: "Songkran", icon: "💦", start: "2027-04-13", days: 3, countries: ["Thailand", "Laos", "Myanmar", "Cambodia"], deco: ["water"], blurb: "The world's biggest water fight.", city: "c:bangkok" },
  { id: "eidadha-27", name: "Eid al-Adha", icon: "🐑", start: "2027-05-16", days: 3, countries: MUSLIM, deco: ["crescent", "lanterns"], blurb: "Prayers and sharing feasts.", city: "c:cairo" },
  { id: "july4-27", name: "Independence Day (USA)", icon: "🎆", start: "2027-07-04", days: 1, countries: ["United States"], deco: ["flags", "fireworks"], blurb: "Fireworks over every city.", city: "c:washington-dc" },
  { id: "bastille-27", name: "Bastille Day", icon: "🇫🇷", start: "2027-07-14", days: 1, countries: ["France"], deco: ["flags", "fireworks"], blurb: "Fireworks at the Eiffel Tower.", city: "lm:eiffel" },
  { id: "iday-27", name: "Independence Day (India)", icon: "🇮🇳", start: "2027-08-15", days: 1, countries: ["India"], deco: ["flags", "fireworks"], blurb: "Kites and tricolours everywhere.", city: "c:new-delhi" },
  { id: "ganesh-27", name: "Ganesh Chaturthi", icon: "🐘", start: "2027-09-04", days: 10, countries: ["India"], deco: ["diyas", "flags", "fireworks"], blurb: "Giant Ganesha idols and processions to the sea.", city: "c:mumbai" },
  { id: "okto-27", name: "Oktoberfest", icon: "🍺", start: "2027-09-18", days: 16, countries: ["Germany"], deco: ["beer", "flags"], blurb: "Tents, music and pretzels in Munich.", city: "c:berlin" },
  { id: "navratri-27", name: "Navratri & Durga Puja", icon: "🪷", start: "2027-09-30", days: 10, countries: ["India", "Bangladesh", "Nepal"], deco: ["diyas", "lanterns"], blurb: "Garba dances and beautiful pandals.", city: "c:kolkata" },
  { id: "halloween-27", name: "Halloween", icon: "🎃", start: "2027-10-31", days: 1, countries: ["United States", "Canada", "United Kingdom", "Ireland"], deco: ["pumpkins"], blurb: "Costumes, pumpkins and trick-or-treat.", city: "c:new-york" },
  { id: "diwali-27", name: "Diwali", icon: "🪔", start: "2027-10-28", days: 5, countries: [...SOUTH_ASIA, "Singapore", "Malaysia", "Sri Lanka", "Fiji", "Mauritius"], deco: ["diyas", "fireworks", "lanterns"], blurb: "The festival of lights.", city: "c:jaipur" },
  { id: "muertos-26", name: "Día de Muertos", icon: "💀", start: "2026-11-01", days: 2, countries: ["Mexico"], deco: ["skulls", "lanterns"], blurb: "Marigolds, sugar skulls and candle-lit altars.", city: "c:mexico-city" },
  { id: "winter-26", name: "Winter holidays", icon: "⛷️", start: "2026-12-19", days: 21, countries: "all", deco: [], blurb: "School's out: the season for ski trips and snowball fights.", city: "a:zermatt-the-matterhorn" },
];

const d = (s: string) => Date.parse(s + "T00:00:00Z");
const DAY = 86_400_000;

/** Festivals happening now in a country (by local date). */
export function festivalsNow(country: string, now = Date.now()): Festival[] {
  return FESTIVALS.filter((f) => (f.countries === "all" || f.countries.includes(country)) && now >= d(f.start) - DAY / 2 && now < d(f.start) + f.days * DAY + DAY / 2);
}
/** Upcoming festivals anywhere (for vacation ideas), soonest first. */
export function upcomingFestivals(now = Date.now(), withinDays = 60): (Festival & { inDays: number })[] {
  return FESTIVALS.map((f) => ({ ...f, inDays: Math.ceil((d(f.start) - now) / DAY) }))
    .filter((f) => f.inDays > -f.days && f.inDays <= withinDays)
    .sort((a, b) => a.inDays - b.inDays);
}
export const decoOf = (fs: Festival[]) => new Set(fs.flatMap((f) => f.deco));

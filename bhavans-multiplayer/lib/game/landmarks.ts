/* Real places you can fly to. Famous wonders and lesser-known gems. */
export interface Landmark {
  id: string;
  name: string;
  country: string;
  lat: number;
  lon: number;
  icon: string;
  fact: string;
  famous: boolean;
}

export const LANDMARKS: Landmark[] = [
  { id: "taj", name: "Taj Mahal", country: "India", lat: 27.175, lon: 78.042, icon: "🕌", fact: "Built in white marble by about 20,000 workers between 1632 and 1653.", famous: true },
  { id: "eiffel", name: "Eiffel Tower", country: "France", lat: 48.858, lon: 2.294, icon: "🗼", fact: "It grows about 15 cm taller in summer as the iron expands in the heat.", famous: true },
  { id: "wall", name: "Great Wall", country: "China", lat: 40.432, lon: 116.57, icon: "🧱", fact: "Its walls and branches together stretch more than 21,000 km.", famous: true },
  { id: "liberty", name: "Statue of Liberty", country: "United States", lat: 40.689, lon: -74.045, icon: "🗽", fact: "A gift from France in 1886. Her copper skin turned green with age.", famous: true },
  { id: "pyramids", name: "Pyramids of Giza", country: "Egypt", lat: 29.979, lon: 31.134, icon: "🔺", fact: "The Great Pyramid was the tallest human-made structure for over 3,800 years.", famous: true },
  { id: "colosseum", name: "Colosseum", country: "Italy", lat: 41.89, lon: 12.492, icon: "🏟️", fact: "It could hold about 50,000 spectators.", famous: true },
  { id: "christ", name: "Christ the Redeemer", country: "Brazil", lat: -22.952, lon: -43.21, icon: "⛰️", fact: "Stands 30 m tall on top of Corcovado mountain above Rio.", famous: true },
  { id: "machu", name: "Machu Picchu", country: "Peru", lat: -13.163, lon: -72.545, icon: "🏔️", fact: "An Inca citadel built without mortar. Its stones fit perfectly.", famous: true },
  { id: "opera", name: "Sydney Opera House", country: "Australia", lat: -33.857, lon: 151.215, icon: "🎭", fact: "Its roof is covered with over a million tiles.", famous: true },
  { id: "fuji", name: "Mount Fuji", country: "Japan", lat: 35.361, lon: 138.727, icon: "🗻", fact: "Japan's highest mountain at 3,776 m, and an active volcano.", famous: true },
  { id: "petra", name: "Petra", country: "Jordan", lat: 30.328, lon: 35.444, icon: "🏜️", fact: "A city carved straight into rose-coloured sandstone cliffs.", famous: true },
  { id: "chichen", name: "Chichén Itzá", country: "Mexico", lat: 20.684, lon: -88.568, icon: "🛕", fact: "Clap at the pyramid's base and the echo sounds like a bird's chirp.", famous: true },
  { id: "bigben", name: "Big Ben", country: "United Kingdom", lat: 51.501, lon: -0.125, icon: "🕰️", fact: "Big Ben is actually the name of the bell, not the tower.", famous: true },
  { id: "burj", name: "Burj Khalifa", country: "United Arab Emirates", lat: 25.197, lon: 55.274, icon: "🏙️", fact: "At 828 m, it's the tallest building in the world.", famous: true },
  { id: "angkor", name: "Angkor Wat", country: "Cambodia", lat: 13.412, lon: 103.867, icon: "🛕", fact: "The largest religious monument on Earth.", famous: true },
  { id: "kremlin", name: "Saint Basil's Cathedral", country: "Russia", lat: 55.752, lon: 37.623, icon: "⛪", fact: "Its colourful domes were painted their bright colours in the 1600s.", famous: true },
  { id: "sagrada", name: "Sagrada Família", country: "Spain", lat: 41.404, lon: 2.174, icon: "⛪", fact: "Under construction since 1882!", famous: true },
  { id: "niagara", name: "Niagara Falls", country: "Canada", lat: 43.08, lon: -79.074, icon: "💦", fact: "About 2,800 cubic metres of water fall every second.", famous: true },
  { id: "kilimanjaro", name: "Mount Kilimanjaro", country: "Tanzania", lat: -3.067, lon: 37.355, icon: "🏔️", fact: "Africa's highest peak, with snow near the equator.", famous: true },
  { id: "acropolis", name: "Acropolis", country: "Greece", lat: 37.971, lon: 23.726, icon: "🏛️", fact: "The Parthenon was finished in 438 BC.", famous: true },
  { id: "gateway", name: "Gateway of India", country: "India", lat: 18.922, lon: 72.835, icon: "🏛️", fact: "Built in 1924 on Mumbai's waterfront.", famous: true },
  { id: "qutub", name: "Qutub Minar", country: "India", lat: 28.524, lon: 77.185, icon: "🗼", fact: "A 73 m brick minaret begun in 1199.", famous: true },
  { id: "golden", name: "Golden Temple", country: "India", lat: 31.62, lon: 74.877, icon: "🛕", fact: "Its free kitchen feeds up to 100,000 people a day.", famous: true },
  { id: "zero", name: "Zero Mile Stone", country: "India", lat: 21.149, lon: 79.081, icon: "🪨", fact: "Nagpur's marker from British survey days, near the geographic centre of India.", famous: false },
  { id: "deekshabhoomi", name: "Deekshabhoomi", country: "India", lat: 21.128, lon: 79.067, icon: "☸️", fact: "A great stupa in Nagpur, built where Dr. B. R. Ambedkar embraced Buddhism in 1956.", famous: false },
  { id: "hampi", name: "Hampi", country: "India", lat: 15.335, lon: 76.46, icon: "🪨", fact: "Ruins of the Vijayanagara capital, scattered among giant boulders.", famous: false },
  { id: "loktak", name: "Loktak Lake", country: "India", lat: 24.55, lon: 93.8, icon: "🏞️", fact: "Home to the world's only floating national park.", famous: false },
  { id: "hallstatt", name: "Hallstatt", country: "Austria", lat: 47.562, lon: 13.649, icon: "🏘️", fact: "A lakeside village with one of the oldest salt mines in the world.", famous: false },
  { id: "socotra", name: "Socotra Island", country: "Yemen", lat: 12.464, lon: 53.824, icon: "🌳", fact: "Home of the umbrella-shaped dragon's blood trees.", famous: false },
  { id: "salar", name: "Salar de Uyuni", country: "Bolivia", lat: -20.134, lon: -67.489, icon: "🪞", fact: "The world's largest salt flat. It becomes a giant mirror after rain.", famous: false },
  { id: "zhangjiajie", name: "Zhangjiajie", country: "China", lat: 29.32, lon: 110.43, icon: "🏞️", fact: "Towering sandstone pillars rise out of the misty forest.", famous: false },
  { id: "plitvice", name: "Plitvice Lakes", country: "Croatia", lat: 44.865, lon: 15.582, icon: "🏞️", fact: "Sixteen terraced lakes joined by waterfalls.", famous: false },
  { id: "chefchaouen", name: "Chefchaouen", country: "Morocco", lat: 35.171, lon: -5.27, icon: "💙", fact: "Known as the Blue Pearl. Almost the whole town is painted blue.", famous: false },
  { id: "bagan", name: "Bagan", country: "Myanmar", lat: 21.172, lon: 94.86, icon: "🛕", fact: "Over 2,000 ancient temples dot the plain.", famous: false },
  { id: "tsingy", name: "Tsingy de Bemaraha", country: "Madagascar", lat: -18.67, lon: 44.73, icon: "🗡️", fact: "A forest of razor-sharp limestone needles.", famous: false },
  { id: "geysir", name: "Strokkur Geyser", country: "Iceland", lat: 64.313, lon: -20.3, icon: "♨️", fact: "Erupts every 5–10 minutes, shooting water up to 30 m.", famous: false },
  { id: "moai", name: "Moai of Rapa Nui", country: "Chile", lat: -27.125, lon: -109.277, icon: "🗿", fact: "Nearly 1,000 giant stone heads stand on this remote island.", famous: false },
  { id: "uluru", name: "Uluru", country: "Australia", lat: -25.344, lon: 131.036, icon: "🪨", fact: "This sandstone monolith changes colour at sunset.", famous: false },
  { id: "kyoto", name: "Fushimi Inari", country: "Japan", lat: 34.967, lon: 135.773, icon: "⛩️", fact: "Thousands of red torii gates wind up a mountain.", famous: false },
  { id: "victoria", name: "Victoria Falls", country: "Zambia", lat: -17.925, lon: 25.857, icon: "💦", fact: "Locally called 'The Smoke that Thunders'.", famous: true },
];
export const LM_BY_ID = new Map(LANDMARKS.map((l) => [l.id, l]));

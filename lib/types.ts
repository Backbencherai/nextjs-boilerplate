export type PlayerId = "adarsh" | "devanshi";
export const PLAYERS: PlayerId[] = ["adarsh", "devanshi"];

export const PLAYER_META: Record<
  PlayerId,
  { name: string; short: string; color: string; soft: string; accent: string; chart: string }
> = {
  adarsh: { name: "Adarsh", short: "A", color: "#3fa9ff", soft: "#bfe3ff", accent: "#1d5f99", chart: "#2b8fe0" },
  devanshi: { name: "Devanshi", short: "D", color: "#ff7eb3", soft: "#ffd3e5", accent: "#a33a6b", chart: "#e45c98" },
};

export const partnerOf = (p: PlayerId): PlayerId => (p === "adarsh" ? "devanshi" : "adarsh");

export type ActivityKind =
  | "study"
  | "workout"
  | "meditation"
  | "meal"
  | "water"
  | "sleep"
  | "mood"
  | "steps"
  | "coin"
  | "secret"
  | "cheer"
  | "note"
  | "quest";

export type MealQuality = "healthy" | "balanced" | "treat";

export interface Activity {
  id: string;
  player: PlayerId;
  kind: ActivityKind;
  /** ISO timestamp of when the activity happened (end of a session) */
  at: string;
  /** duration in minutes for timed activities */
  minutes?: number;
  data: Record<string, unknown>;
  xp: number;
}

export const KIND_META: Record<ActivityKind, { label: string; icon: string; color: string }> = {
  study: { label: "Study", icon: "📚", color: "#ffb23f" },
  workout: { label: "Workout", icon: "🏋️", color: "#ff6a3d" },
  meditation: { label: "Meditation", icon: "🧘", color: "#9b8cff" },
  meal: { label: "Meal", icon: "🥗", color: "#7ed957" },
  water: { label: "Water", icon: "💧", color: "#4cc9f0" },
  sleep: { label: "Sleep", icon: "🌙", color: "#6c7bff" },
  mood: { label: "Mood", icon: "✨", color: "#ffd166" },
  steps: { label: "Steps", icon: "👟", color: "#06d6a0" },
  coin: { label: "World coin", icon: "🪙", color: "#ffcf40" },
  secret: { label: "Secret found", icon: "🗝️", color: "#e0aaff" },
  cheer: { label: "Cheer", icon: "💛", color: "#ff9f1c" },
  note: { label: "Bottle note", icon: "🍾", color: "#90e0ef" },
  quest: { label: "Quest reward", icon: "📜", color: "#f4a261" },
};

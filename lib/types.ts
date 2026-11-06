export type PlayerId = "adarsh" | "devanshi";
export const PLAYERS: PlayerId[] = ["adarsh", "devanshi"];

export const PLAYER_META: Record<
  PlayerId,
  { name: string; short: string; color: string; soft: string; accent: string; chart: string }
> = {
  adarsh: { name: "Adarsh", short: "A", color: "#2b5a9b", soft: "#9abeef", accent: "#1f4372", chart: "#2b5a9b" },
  devanshi: { name: "Dewanshi", short: "D", color: "#c0342a", soft: "#eda6a0", accent: "#8f2219", chart: "#c0342a" },
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

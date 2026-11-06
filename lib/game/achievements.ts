import type { PlayerStats, SharedStats, Universe } from "./stats";

export type Tier = "bronze" | "silver" | "gold" | "platinum";
export type TrophyShape = "medal" | "cup" | "star" | "crystal" | "book" | "dumbbell" | "drop" | "moon" | "heart" | "key";

interface Base {
  id: string;
  name: string;
  desc: string;
  icon: string;
  tier: Tier;
  shape: TrophyShape;
}
type Solo = Base & { scope: "solo"; progress: (s: PlayerStats, u: Universe) => [number, number] };
type Shared = Base & { scope: "shared"; progress: (s: SharedStats, u: Universe) => [number, number] };
export type AchievementDef = (Solo | Shared) & { test: (s: PlayerStats | SharedStats, u: Universe) => boolean };

function solo(b: Base, progress: Solo["progress"]): AchievementDef {
  return {
    ...b,
    scope: "solo",
    progress,
    test: (s: PlayerStats | SharedStats, u: Universe) => {
      const [c, t] = progress(s as PlayerStats, u);
      return c >= t;
    },
  } as AchievementDef;
}
function shared(b: Base, progress: Shared["progress"]): AchievementDef {
  return {
    ...b,
    scope: "shared",
    progress,
    test: (s: PlayerStats | SharedStats, u: Universe) => {
      const [c, t] = progress(s as SharedStats, u);
      return c >= t;
    },
  } as AchievementDef;
}

const h = (min: number) => min / 60;

export const ACHIEVEMENTS: AchievementDef[] = [
  solo({ id: "first-step", name: "First Step", desc: "Log your very first real-life activity.", icon: "👣", tier: "bronze", shape: "medal" }, (s) => [s.activeDays.size, 1]),

  solo({ id: "scholar-1", name: "Scholar I", desc: "Study for 5 hours in total.", icon: "📚", tier: "bronze", shape: "book" }, (s) => [h(s.studyMin), 5]),
  solo({ id: "scholar-2", name: "Scholar II", desc: "Study for 25 hours in total.", icon: "📚", tier: "silver", shape: "book" }, (s) => [h(s.studyMin), 25]),
  solo({ id: "scholar-3", name: "Scholar III", desc: "Study for 100 hours in total.", icon: "🎓", tier: "gold", shape: "book" }, (s) => [h(s.studyMin), 100]),
  solo({ id: "deep-focus", name: "Deep Focus", desc: "Finish a single study session of 90+ minutes.", icon: "🎯", tier: "silver", shape: "crystal" }, (s) => [s.maxStudy?.value ?? 0, 90]),

  solo({ id: "iron-1", name: "Iron I", desc: "Work out for 3 hours in total.", icon: "🏋️", tier: "bronze", shape: "dumbbell" }, (s) => [h(s.workoutMin), 3]),
  solo({ id: "iron-2", name: "Iron II", desc: "Work out for 15 hours in total.", icon: "🏋️", tier: "silver", shape: "dumbbell" }, (s) => [h(s.workoutMin), 15]),
  solo({ id: "iron-3", name: "Iron III", desc: "Work out for 50 hours in total.", icon: "💪", tier: "gold", shape: "dumbbell" }, (s) => [h(s.workoutMin), 50]),

  solo({ id: "hydrated", name: "Hydrated", desc: "Drink 8 glasses of water in one day.", icon: "💧", tier: "bronze", shape: "drop" }, (s) => [s.maxWaterDay, 8]),
  solo({ id: "ocean", name: "Ocean", desc: "Drink 250 glasses of water in total.", icon: "🌊", tier: "gold", shape: "drop" }, (s) => [s.water, 250]),

  solo({ id: "green-plate", name: "Green Plate", desc: "Log 10 healthy meals.", icon: "🥗", tier: "bronze", shape: "cup" }, (s) => [s.healthyMeals, 10]),
  solo({ id: "chef", name: "Garden Chef", desc: "Log 75 healthy meals.", icon: "🥦", tier: "gold", shape: "cup" }, (s) => [s.healthyMeals, 75]),

  solo({ id: "dreamer", name: "Dreamer", desc: "Sleep 7+ hours on 7 nights.", icon: "🌙", tier: "silver", shape: "moon" }, (s) => [s.goodSleepNights, 7]),
  solo({ id: "still-water", name: "Still Water", desc: "Meditate for 60 minutes in total.", icon: "🧘", tier: "silver", shape: "crystal" }, (s) => [s.meditationMin, 60]),
  solo({ id: "ten-k", name: "Ten Thousand", desc: "Walk 10,000 steps in a day.", icon: "👟", tier: "silver", shape: "star" }, (s) => [s.maxStepsDay, 10000]),

  solo({ id: "streak-3", name: "Kindling", desc: "Stay active 3 days in a row.", icon: "🔥", tier: "bronze", shape: "star" }, (s) => [s.bestStreak, 3]),
  solo({ id: "streak-7", name: "Bonfire", desc: "Stay active 7 days in a row.", icon: "🔥", tier: "silver", shape: "star" }, (s) => [s.bestStreak, 7]),
  solo({ id: "streak-30", name: "Eternal Flame", desc: "Stay active 30 days in a row.", icon: "☄️", tier: "platinum", shape: "star" }, (s) => [s.bestStreak, 30]),

  solo({ id: "early-bird", name: "Early Bird", desc: "Log something real between 4 and 7 AM.", icon: "🌅", tier: "bronze", shape: "medal" }, (s) => [s.earlyBird ? 1 : 0, 1]),
  solo({ id: "night-owl", name: "Night Owl", desc: "Finish a study session after 11 PM.", icon: "🦉", tier: "bronze", shape: "medal" }, (s) => [s.nightOwl ? 1 : 0, 1]),

  solo({ id: "level-5", name: "Rising", desc: "Reach level 5.", icon: "⭐", tier: "silver", shape: "star" }, (s) => [s.level, 5]),
  solo({ id: "level-10", name: "Ascended", desc: "Reach level 10.", icon: "🌟", tier: "gold", shape: "star" }, (s) => [s.level, 10]),
  solo({ id: "level-20", name: "Mythic", desc: "Reach level 20.", icon: "👑", tier: "platinum", shape: "crystal" }, (s) => [s.level, 20]),

  solo({ id: "coin-25", name: "Treasure Hunter", desc: "Collect 25 coins in the world.", icon: "🪙", tier: "bronze", shape: "medal" }, (s) => [s.coins, 25]),
  solo({ id: "explorer", name: "Secret Keeper", desc: "Discover every hidden secret.", icon: "🗝️", tier: "gold", shape: "key" }, (s) => [s.secrets.size, 6]),
  solo({ id: "questor", name: "Questor", desc: "Complete 15 quests.", icon: "📜", tier: "silver", shape: "cup" }, (s) => [s.questsClaimed, 15]),
  solo({ id: "cheerleader", name: "Cheerleader", desc: "Cheer your partner on 20 times.", icon: "📣", tier: "bronze", shape: "heart" }, (s) => [s.cheersSent, 20]),

  // ——— Together ———
  shared({ id: "t-first-sync", name: "Same Page", desc: "Both of you were active on the same day.", icon: "🤝", tier: "bronze", shape: "heart" }, (s) => [s.syncDays.length, 1]),
  shared({ id: "t-sync-7", name: "In Sync", desc: "Both active 7 days in a row.", icon: "🔗", tier: "gold", shape: "heart" }, (s) => [s.bestSyncStreak, 7]),
  shared({ id: "t-sync-30", name: "Two Suns", desc: "Both active on 30 shared days.", icon: "☀️", tier: "platinum", shape: "star" }, (s) => [s.syncDays.length, 30]),
  shared({ id: "t-library", name: "Twin Library", desc: "Study 50 hours combined.", icon: "🏛️", tier: "silver", shape: "book" }, (s) => [h(s.studyMin), 50]),
  shared({ id: "t-forge", name: "The Forge", desc: "Work out 25 hours combined.", icon: "⚒️", tier: "silver", shape: "dumbbell" }, (s) => [h(s.workoutMin), 25]),
  shared({ id: "t-harvest", name: "Harvest", desc: "Log 100 healthy meals combined.", icon: "🧺", tier: "gold", shape: "cup" }, (s) => [s.healthyMeals, 100]),
  shared({ id: "t-cheers", name: "Echo", desc: "Exchange 30 cheers.", icon: "💞", tier: "silver", shape: "heart" }, (s) => [s.cheers, 30]),
  shared({ id: "t-bottles", name: "Message Keepers", desc: "Send 10 bottle notes between you.", icon: "🍾", tier: "bronze", shape: "drop" }, (s) => [s.notes, 10]),
  shared({ id: "t-level-5", name: "Twin Peaks", desc: "Both reach level 5.", icon: "🏔️", tier: "gold", shape: "crystal" }, (s) => [s.minLevel, 5]),
  shared({ id: "t-xp-10k", name: "Constellation", desc: "Earn 10,000 XP together.", icon: "✨", tier: "platinum", shape: "star" }, (s) => [s.xp, 10000]),
];

export const ACH_BY_ID = new Map(ACHIEVEMENTS.map((a) => [a.id, a]));

export const TIER_COLORS: Record<Tier, { base: string; glow: string; label: string }> = {
  bronze: { base: "#c7834a", glow: "#ffb37a", label: "Bronze" },
  silver: { base: "#c9d3de", glow: "#ffffff", label: "Silver" },
  gold: { base: "#ffc83d", glow: "#fff0a8", label: "Gold" },
  platinum: { base: "#b4f0ff", glow: "#e9fbff", label: "Platinum" },
};

export function progressOf(a: AchievementDef, u: Universe, who: "adarsh" | "devanshi" | "together"): [number, number] {
  if (a.scope === "shared") return a.progress(u.shared, u);
  if (who === "together") return [0, 1];
  return a.progress(u.players[who], u);
}

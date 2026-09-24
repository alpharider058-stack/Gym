// Victory/Conquest storage functions
import AsyncStorage from "@react-native-async-storage/async-storage";

// Types
export type WarriorProfile = {
  name: string;
  createdAt: number;
  onboarded: boolean;
  defaultReason: string;
  mantra?: string;
};

export type Victory = {
  id: string;
  title: string;
  description?: string;
  date: string;
  action?: string;
  obstacle?: string;
  lesson?: string;
  value: number;
};

export type Conquest = {
  id: string;
  title: string;
  description: string;
  date: string;
  requiredActions: {
    id: string;
    text: string;
    detail?: string;
    completed: boolean;
  }[];
  claimed?: boolean;
};

export type Triumph = {
  id: string;
  title: string;
  description: string;
  date: string;
};

export type Trophy = {
  id: string;
  name: string;
  description: string;
  icon: string;
};

export type DailyConquest = {
  id: string;
  title: string;
  description: string;
  date: string;
  requiredActions: Array<{
    id: string;
    text: string;
    detail?: string;
    completed: boolean;
  }>;
};

export type ConquestReward = {
  id: string;
  title: string;
  description: string;
  points: number;
};

export type ConquestRankInfo = {
  name: string;
  icon: string;
  color: string;
  pointsToNext: number;
};

export type ConquestSession = {
  id: string;
  type: string;
  startedAt: number;
  endedAt?: number;
  completed: boolean;
};

// Storage keys
const KEYS = {
  warriorProfile: "@warrior_profile",
  dailyConquest: "@daily_conquest",
  conquestStreak: "@conquest_streak",
  totalConquestsCompleted: "@total_conquests_completed",
  conquestPoints: "@conquest_points",
  conquestRank: "@conquest_rank",
  activeConquest: "@active_conquest",
  conquestsHistory: "@conquests_history",
  trophyCase: "@trophy_case",
  recentTriumphs: "@recent_triumphs",
};

// Warrior Profile
export async function getProfile(): Promise<WarriorProfile | null> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.warriorProfile);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function saveProfile(profile: WarriorProfile): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.warriorProfile, JSON.stringify(profile));
  } catch {
    // Error handling could be improved
  }
}

// Streak functions (simplified)
export async function getStreak(): Promise<{ current: number; best: number }> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.conquestStreak);
    return raw ? JSON.parse(raw) : { current: 0, best: 0 };
  } catch {
    return { current: 0, best: 0 };
  }
}

export async function saveStreak(streak: { current: number; best: number }): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.conquestStreak, JSON.stringify(streak));
  } catch {
    // Error handling
  }
}

// XP functions
export async function getXp(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem("@xp");
    return raw ? parseInt(raw, 10) : 0;
  } catch {
    return 0;
  }
}

export async function addXp(delta: number): Promise<void> {
  try {
    const current = await getXp();
    await AsyncStorage.setItem("@xp", String(current + delta));
  } catch {
    // Error handling
  }
}

export const getTotalXp = getXp;

// Ranking functions (simplified)
export type Rank = {
  name: string;
  minXp: number;
  color: string;
  icon: string;
};

export const RANKS: Rank[] = [
  { name: "Recluta", minXp: 0, color: "#8E8E93", icon: "⚔️" },
  { name: "Soldado", minXp: 100, color: "#30D158", icon: "🛡️" },
  { name: "Sargento", minXp: 250, color: "#0A84FF", icon: "⚡" },
  { name: "Teniente", minXp: 500, color: "#FF9F0A", icon: "🎯" },
  { name: "Capitán", minXp: 1000, color: "#BF5AF2", icon: "👑" },
  { name: "Comandante", minXp: 2000, color: "#FF375F", icon: "💥" },
  { name: "General", minXp: 4000, color: "#FFFFFF", icon: "🏆" },
  { name: "Leyenda", minXp: 8000, color: "#FFD700", icon: "👑" },
];

export function getRank(xp: number): { current: Rank; next: Rank | null; progress: number } {
  let currentRank = RANKS[0];
  let nextRank = RANKS[1] || null;

  for (let i = 0; i < RANKS.length; i++) {
    if (xp >= RANKS[i].minXp) {
      currentRank = RANKS[i];
      nextRank = RANKS[i + 1] || null;
    } else {
      break;
    }
  }

  const currentMinXp = currentRank.minXp;
  const nextMinXp = nextRank ? nextRank.minXp : currentMinXp + 1000;
  const progress = nextRank
    ? (xp - currentMinXp) / (nextMinXp - currentMinXp)
    : 1;

  return {
    current: currentRank,
    next: nextRank,
    progress: Math.min(1, Math.max(0, progress)),
  };
}

// Victory/Conquest functions
export async function getRecentVictories(): Promise<Victory[]> {
  try {
    const raw = await AsyncStorage.getItem("@recent_victories");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function getTotalVictories(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem("@total_victories");
    return raw ? parseInt(raw, 10) : 0;
  } catch {
    return 0;
  }
}

export async function getDominanceScore(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem("@dominance_score");
    return raw ? parseFloat(raw) : 0;
  } catch {
    return 0;
  }
}

export async function getChampionRank(): Promise<{ name: string; icon: string; color: string }> {
  try {
    const xp = await getXp();
    const rankInfo = getRank(xp);
    return {
      name: rankInfo.current.name,
      icon: rankInfo.current.icon,
      color: rankInfo.current.color,
    };
  } catch {
    return { name: "Recluta", icon: "⚔️", color: "#8E8E93" };
  }
}

export async function saveDailyAffirmation(affirmation: string): Promise<void> {
  try {
    await AsyncStorage.setItem("@daily_affirmation", affirmation);
  } catch {
    // Error handling
  }
}

export async function getDailyAffirmation(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem("@daily_affirmation");
  } catch {
    return null;
  }
}

// Conquest functions
export async function getActiveConquest(): Promise<Conquest | null> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.activeConquest);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function saveActiveConquest(conquest: Conquest | null): Promise<void> {
  try {
    if (conquest === null) {
      await AsyncStorage.removeItem(KEYS.activeConquest);
    } else {
      await AsyncStorage.setItem(KEYS.activeConquest, JSON.stringify(conquest));
    }
  } catch {
    // Error handling
  }
}

export async function saveConquest(conquest: Conquest): Promise<void> {
  try {
    const history = await getConquestsHistory();
    const updated = [conquest, ...history].slice(0, 50); // Keep last 50
    await AsyncStorage.setItem(KEYS.conquestsHistory, JSON.stringify(updated));

    // Also save as active if not claimed
    if (!conquest.claimed) {
      await saveActiveConquest(conquest);
    }
  } catch {
    // Error handling
  }
}

// Hall of Champions functions
export async function getConquests(): Promise<Conquest[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.conquestsHistory);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function getTotalConquests(): Promise<number> {
  try {
    const conquests = await getConquests();
    return conquests.length;
  } catch {
    return 0;
  }
}

export async function getChampionTitle(): Promise<string> {
  try {
    const xp = await getXp();
    const rankInfo = getRank(xp);
    return rankInfo.current.name;
  } catch {
    return "Iniciado";
  }
}

export async function getTrophyCase(): Promise<Trophy[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.trophyCase);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function getRecentTriumphs(): Promise<Triumph[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.recentTriumphs);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveTriumph(triumph: Triumph): Promise<void> {
  try {
    const triumphs = await getRecentTriumphs();
    const updated = [triumph, ...triumphs].slice(0, 20); // Keep last 20
    await AsyncStorage.setItem(KEYS.recentTriumphs, JSON.stringify(updated));
  } catch {
    // Error handling
  }
}

export async function getConquestsHistory(): Promise<Conquest[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.conquestsHistory);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// Daily Conquest System functions
export async function getDailyConquest(): Promise<DailyConquest | null> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.dailyConquest);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function getConquestStreak(): Promise<{ current: number; best: number }> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.conquestStreak);
    return raw ? JSON.parse(raw) : { current: 0, best: 0 };
  } catch {
    return { current: 0, best: 0 };
  }
}

export async function getTotalConquestsCompleted(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.totalConquestsCompleted);
    return raw ? parseInt(raw, 10) : 0;
  } catch {
    return 0;
  }
}

export async function getConquestPoints(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.conquestPoints);
    return raw ? parseInt(raw, 10) : 0;
  } catch {
    return 0;
  }
}

export async function getConquestRank(): Promise<ConquestRankInfo> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.conquestRank);
    return raw ? JSON.parse(raw) : {
      name: "Recluta",
      icon: "⚔️",
      color: "#8E8E93",
      pointsToNext: 100,
    };
  } catch {
    return {
      name: "Recluta",
      icon: "⚔️",
      color: "#8E8E93",
      pointsToNext: 100,
    };
  }
}

export async function saveConquestProgress(progress: {
  dailyConquest?: DailyConquest;
  conquestStreak?: { current: number; best: number };
  totalConquestsCompleted?: number;
  conquestPoints?: number;
  conquestRank?: ConquestRankInfo;
  activeConquest?: Conquest | null;
}): Promise<void> {
  try {
    if (progress.dailyConquest !== undefined) {
      await AsyncStorage.setItem(KEYS.dailyConquest, JSON.stringify(progress.dailyConquest));
    }
    if (progress.conquestStreak !== undefined) {
      await AsyncStorage.setItem(KEYS.conquestStreak, JSON.stringify(progress.conquestStreak));
    }
    if (progress.totalConquestsCompleted !== undefined) {
      await AsyncStorage.setItem(KEYS.totalConquestsCompleted, String(progress.totalConquestsCompleted));
    }
    if (progress.conquestPoints !== undefined) {
      await AsyncStorage.setItem(KEYS.conquestPoints, String(progress.conquestPoints));
    }
    if (progress.conquestRank !== undefined) {
      await AsyncStorage.setItem(KEYS.conquestRank, JSON.stringify(progress.conquestRank));
    }
    if (progress.activeConquest !== undefined) {
      await saveActiveConquest(progress.activeConquest);
    }
  } catch {
    // Error handling
  }
}

// Aliases for compatibility

// Achievement functions (simplified)
export type Achievement = {
  id: string;
  title: string;
  description: string;
  icon: string;
  tier: number;
  unlocked: boolean;
};

export function getAchievements(
  xp: number,
  streak: number,
  focusMin: number,
  missions: number
): Achievement[] {
  // Simplified achievement system
  const achievements: Achievement[] = [
    {
      id: "first_victory",
      title: "Primera Victoria",
      description: "Consigue tu primera victoria",
      icon: "🏆",
      tier: 1,
      unlocked: xp >= 10,
    },
    {
      id: "streak_3",
      title: "Racha de 3",
      description: "Mantén una racha de 3 días",
      icon: "🔥",
      tier: 1,
      unlocked: streak >= 3,
    },
    {
      id: "streak_7",
      title: "Racha de 7",
      description: "Mantén una racha de 7 días",
      icon: "🔥",
      tier: 2,
      unlocked: streak >= 7,
    },
    {
      id: "warrior",
      title: "Guerrero",
      description: "Alcanza 100 XP",
      icon: "⚔️",
      tier: 1,
      unlocked: xp >= 100,
    },
    {
      id: "champion",
      title: "Campeón",
      description: "Alcanza 500 XP",
      icon: "👑",
      tier: 2,
      unlocked: xp >= 500,
    },
    {
      id: "legend",
      title: "Leyenda",
      description: "Alcanza 2000 XP",
      icon: "🌟",
      tier: 3,
      unlocked: xp >= 2000,
    },
  ];

  return achievements.map(ach => ({
    ...ach,
    unlocked: ach.unlocked || false, // Ensure boolean
  }));
}

// Totals functions (simplified)
export type Totals = {
  totalFocusMinutes: number;
  totalSessions: number;
  totalConquests: number;
};

export async function getTotals(): Promise<Totals> {
  try {
    const raw = await AsyncStorage.getItem("@totals");
    return raw ? JSON.parse(raw) : {
      totalFocusMinutes: 0,
      totalSessions: 0,
      totalConquests: 0,
    };
  } catch {
    return {
      totalFocusMinutes: 0,
      totalSessions: 0,
      totalConquests: 0,
    };
  }
}

export async function saveTotals(totals: Totals): Promise<void> {
  try {
    await AsyncStorage.setItem("@totals", JSON.stringify(totals));
  } catch {
    // Error handling
  }
}
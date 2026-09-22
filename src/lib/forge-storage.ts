import AsyncStorage from "@react-native-async-storage/async-storage";

export type FocusSession = {
  id: string;
  date: string;
  type: "deep" | "standard" | "quick";
  minutes: number;
  cycles: number;
  distractions: number;
  task?: string;
  discomfort?: number;
  note?: string;
  xp?: number;
};

export type Mission = {
  id: string;
  text: string;
  category: "discipline" | "mindset" | "physical" | "mastery";
  difficulty: 1 | 2 | 3;
  xp: number;
  nonNegotiable: boolean;
};

export type DailyProgress = {
  date: string;
  missionIds: string[];
  completedIds: string[];
  focusMinutes: number;
  discomfortAvg: number;
  journalEntry?: string;
};

export type VictoryCard = {
  id: string;
  date: string;
  title: string;
  description: string;
  type: "streak" | "xp" | "focus" | "mission" | "mindset";
  value: number;
  icon: string;
};

export type WarriorProfile = {
  name: string;
  mantra: string;
  focusAmbition: string;
  startingLevel: string;
  createdAt: string;
};

const SESSION_KEY = "vertice-sessions";
const MISSION_KEY = "vertice-missions";
const PROGRESS_KEY = "vertice-daily-progress";
const PROFILE_KEY = "vertice-profile";
const VICTORY_KEY = "vertice-victories";

function dateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getWeekStart(date = new Date()) {
  const start = new Date(date);
  const day = start.getDay();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (day === 0 ? 6 : day - 1));
  return start;
}

export const DEFAULT_MISSIONS: Mission[] = [
  {
    id: "m1",
    text: "Levantarse sin posponer la alarma",
    category: "discipline",
    difficulty: 2,
    xp: 25,
    nonNegotiable: true,
  },
  {
    id: "m2",
    text: "45 minutos de enfoque profundo sin distracciones",
    category: "mastery",
    difficulty: 3,
    xp: 40,
    nonNegotiable: true,
  },
  {
    id: "m3",
    text: "30 minutos de entrenamiento físico",
    category: "physical",
    difficulty: 2,
    xp: 30,
    nonNegotiable: true,
  },
  {
    id: "m4",
    text: "Lectura de 20 páginas",
    category: "mastery",
    difficulty: 1,
    xp: 15,
    nonNegotiable: false,
  },
  {
    id: "m5",
    text: "Respirar 5 minutos de calma sin teléfono",
    category: "mindset",
    difficulty: 1,
    xp: 15,
    nonNegotiable: false,
  },
  {
    id: "m6",
    text: "No quejarse en todo el día",
    category: "mindset",
    difficulty: 3,
    xp: 50,
    nonNegotiable: false,
  },
  {
    id: "m7",
    text: "Ducha fría de 2 minutos",
    category: "physical",
    difficulty: 2,
    xp: 25,
    nonNegotiable: false,
  },
  {
    id: "m8",
    text: "Reflexión diaria escrita de 3 minutos",
    category: "mindset",
    difficulty: 1,
    xp: 15,
    nonNegotiable: true,
  },
];

export const STOIC_QUOTES = [
  "La disciplina es el puente entre metas y logros. — Jim Rohn",
  "No te importa lo que los demás piensen. El único juicio que cuenta es el tuyo.",
  "El dolor es temporal. La mediocridad dura para siempre.",
  "La gente no decide su futuro. Decide sus hábitos, y sus hábitos deciden su futuro.",
  "La fuerza no proviene de ganar. Tus luchas desarrollan tus fortalezas.",
  "Quien no domina sus impulsos será un esclavo de ellos por siempre.",
  "El éxito es la suma de pequeños esfuerzos repetidos cada día.",
  "El miedo es solo una señal de que hay algo que debes enfrentar.",
  "Tu cuerpo logra lo que tu mente le ordene.",
  "La constancia vence al talento cuando el talento no es constante.",
  "El momento más difícil es el que precede a tu mejor versión.",
  "Cada minuto que no inviertes, te lo quita alguien que sí lo hace.",
];

export const RANKS = [
  { level: 1, title: "Recluta del Fuego", xp: 0, icon: "◇" },
  { level: 2, title: "Cadete de Disciplina", xp: 500, icon: "◆" },
  { level: 3, title: "Guardia Mental", xp: 1500, icon: "⬢" },
  { level: 4, title: "Capitán del Enfoque", xp: 3500, icon: "⬣" },
  { level: 5, title: "Comandante de Voluntad", xp: 7000, icon: "⬟" },
  { level: 6, title: "Forjador de Hierro", xp: 12000, icon: "✦" },
  { level: 7, title: "Maestro del Silencio", xp: 20000, icon: "✧" },
  { level: 8, title: "Mente de Acero", xp: 32000, icon: "★" },
  { level: 9, title: "Leyenda Viviente", xp: 50000, icon: "✵" },
  { level: 10, title: "VÉRTICE", xp: 80000, icon: "⟐" },
];

export function getRank(xp: number) {
  let current = RANKS[0];
  let next = RANKS[1];
  for (let i = 0; i < RANKS.length; i++) {
    if (xp >= RANKS[i].xp) current = RANKS[i];
    if (RANKS[i].xp > xp) {
      next = RANKS[i];
      break;
    }
  }
  const progress =
    next && current ? (xp - current.xp) / (next.xp - current.xp) : 1;
  return {
    current,
    next,
    progress: Math.min(1, Math.max(0, progress)),
  };
}

export async function getMissions(): Promise<Mission[]> {
  const stored = await AsyncStorage.getItem(MISSION_KEY);
  if (stored) {
    try {
      return JSON.parse(stored) as Mission[];
    } catch {}
  }
  await AsyncStorage.setItem(MISSION_KEY, JSON.stringify(DEFAULT_MISSIONS));
  return DEFAULT_MISSIONS;
}

export async function saveMissions(missions: Mission[]) {
  await AsyncStorage.setItem(MISSION_KEY, JSON.stringify(missions));
}

export async function readSessions(): Promise<FocusSession[]> {
  const stored = await AsyncStorage.getItem(SESSION_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored) as FocusSession[];
  } catch {
    return [];
  }
}

export async function saveSession(session: FocusSession) {
  const sessions = await readSessions();
  const next = [session, ...sessions.filter((item) => item.id !== session.id)];
  await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(next));
  const progress = await getDailyProgress();
  progress.focusMinutes += session.minutes;
  await saveDailyProgress(progress);
  return next;
}

export async function getDailyProgress(
  date = new Date(),
): Promise<DailyProgress> {
  const key = dateKey(date);
  const all = await AsyncStorage.getItem(PROGRESS_KEY);
  const byDay: Record<string, DailyProgress> = all ? JSON.parse(all) : {};
  if (!byDay[key]) {
    const missions = await getMissions();
    byDay[key] = {
      date: key,
      missionIds: missions.map((m) => m.id),
      completedIds: [],
      focusMinutes: 0,
      discomfortAvg: 0,
    };
    await AsyncStorage.setItem(PROGRESS_KEY, JSON.stringify(byDay));
  }
  return byDay[key];
}

export async function saveDailyProgress(progress: DailyProgress) {
  const all = await AsyncStorage.getItem(PROGRESS_KEY);
  const byDay: Record<string, DailyProgress> = all ? JSON.parse(all) : {};
  byDay[progress.date] = progress;
  await AsyncStorage.setItem(PROGRESS_KEY, JSON.stringify(byDay));
}

export async function toggleMission(missionId: string, date = new Date()) {
  const progress = await getDailyProgress(date);
  if (progress.completedIds.includes(missionId)) {
    progress.completedIds = progress.completedIds.filter(
      (i) => i !== missionId,
    );
  } else {
    progress.completedIds.push(missionId);
  }
  await saveDailyProgress(progress);
  return progress;
}

export function getStreakDays(
  progressByDay: Record<string, DailyProgress>,
  today = new Date(),
) {
  let streak = 0;
  const cursor = new Date(today);
  while (true) {
    const key = dateKey(cursor);
    const day = progressByDay[key];
    if (!day) return streak;
    const missions = DEFAULT_MISSIONS.filter((m) => m.nonNegotiable);
    const done = missions.filter((m) => day.completedIds.includes(m.id)).length;
    const enough = done > 0 || day.focusMinutes >= 25;
    if (!enough) return streak;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
}

export async function readAllProgress() {
  const stored = await AsyncStorage.getItem(PROGRESS_KEY);
  if (!stored) return {};
  try {
    return JSON.parse(stored) as Record<string, DailyProgress>;
  } catch {
    return {};
  }
}

export async function getTotalXp() {
  const sessions = await readSessions();
  const progress = await readAllProgress();
  const missionXp = Object.values(progress).reduce((total, day) => {
    return (
      total +
      day.completedIds.reduce((sum, id) => {
        const m = DEFAULT_MISSIONS.find((mission) => mission.id === id);
        return sum + (m?.xp ?? 0);
      }, 0)
    );
  }, 0);
  const focusXp = sessions.reduce(
    (total, s) => total + (s.xp ?? Math.max(10, s.minutes)),
    0,
  );
  return missionXp + focusXp;
}

export function getAchievements(
  xp: number,
  streakDays: number,
  totalFocusMinutes: number,
  totalMissions: number,
) {
  return [
    {
      id: "first-blood",
      title: "Primer paso en la forja",
      description: "Completa tu primera misión",
      unlocked: totalMissions >= 1,
      icon: "◇",
      tier: 1,
    },
    {
      id: "focus-7",
      title: "7 horas de enfoque",
      description: "420 minutos de concentración profunda",
      unlocked: totalFocusMinutes >= 420,
      icon: "◆",
      tier: 2,
    },
    {
      id: "streak-3",
      title: "Racha de 3 días",
      description: "Disciplina sin excusas",
      unlocked: streakDays >= 3,
      icon: "⬢",
      tier: 2,
    },
    {
      id: "streak-7",
      title: "Semana innegociable",
      description: "7 días seguidos de victoria",
      unlocked: streakDays >= 7,
      icon: "✦",
      tier: 3,
    },
    {
      id: "missions-50",
      title: "50 misiones cumplidas",
      description: "Tu voluntad es tu arma",
      unlocked: totalMissions >= 50,
      icon: "★",
      tier: 3,
    },
    {
      id: "rank-3",
      title: "Guardia Mental",
      description: "Alcanza el rango 3",
      unlocked: xp >= RANKS[2].xp,
      icon: "⬢",
      tier: 3,
    },
    {
      id: "rank-6",
      title: "Forjador de Hierro",
      description: "Alcanza el rango 6",
      unlocked: xp >= RANKS[5].xp,
      icon: "✦",
      tier: 4,
    },
    {
      id: "rank-10",
      title: "VÉRTICE",
      description: "La cima no es un lugar, eres tú",
      unlocked: xp >= RANKS[9].xp,
      icon: "⟐",
      tier: 5,
    },
  ];
}

export async function getWeeklySummary(date = new Date()) {
  const sessions = await readSessions();
  const progress = await readAllProgress();
  const weekStart = getWeekStart(date);
  const days = Array.from({ length: 7 }, (_, index) => {
    const target = new Date(weekStart);
    target.setDate(target.getDate() + index);
    const key = dateKey(target);
    const day = progress[key];
    const sessionsDay = sessions.filter(
      (s) => dateKey(new Date(s.date)) === key,
    );
    return {
      date: key,
      missionsCompleted: day?.completedIds.length ?? 0,
      missionsTotal: day?.missionIds.length ?? DEFAULT_MISSIONS.length,
      focusMinutes: sessionsDay.reduce((t, s) => t + s.minutes, 0),
      active: !!(day && day.completedIds.length) || sessionsDay.length > 0,
    };
  });
  const totalFocus = sessions
    .filter((s) => new Date(s.date) >= weekStart)
    .reduce((t, s) => t + s.minutes, 0);
  const totalMissionsWeek = Object.values(progress)
    .filter((p) => new Date(p.date) >= weekStart)
    .reduce((t, p) => t + p.completedIds.length, 0);
  const activeDays = days.filter((d) => d.active).length;
  return { days, totalFocus, totalMissionsWeek, activeDays };
}

export async function getVictories() {
  const stored = await AsyncStorage.getItem(VICTORY_KEY);
  if (!stored) return [] as VictoryCard[];
  try {
    return JSON.parse(stored) as VictoryCard[];
  } catch {
    return [];
  }
}

export async function addVictory(victory: VictoryCard) {
  const list = await getVictories();
  const next = [victory, ...list];
  await AsyncStorage.setItem(VICTORY_KEY, JSON.stringify(next.slice(0, 50)));
  return next;
}

export function randomStoicQuote(seed?: string) {
  const index = seed
    ? seed.split("").reduce((a, c) => a + c.charCodeAt(0), 0) %
      STOIC_QUOTES.length
    : Math.floor(Math.random() * STOIC_QUOTES.length);
  return STOIC_QUOTES[index];
}

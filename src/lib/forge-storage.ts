import AsyncStorage from "@react-native-async-storage/async-storage";

export type WarriorProfile = {
  name: string;
  createdAt: number;
  onboarded: boolean;
  defaultReason: string;
  mantra?: string;
};

export type Settings = {
  notifEnabled: boolean;
  notifHour: number;
  notifMinute: number;
  usedQuoteIndices: number[];
  lastNotifDate: string | null;
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
  completed: boolean[];
  focusMinutes: number;
  discomfortAvg: number;
  journalEntry: string;
};

export type WeeklyDaySummary = {
  date: string;
  missionsCompleted: number;
  missionsTotal: number;
  focusMinutes: number;
  active: boolean;
};

export type WeeklySummary = {
  days: WeeklyDaySummary[];
  totalFocus: number;
  totalMissionsWeek: number;
  activeDays: number;
};

export type WeeklyChallenge = {
  weekStart: string;
  kind: "activeDays" | "focusMinutes";
  target: number;
};

export type StreakData = {
  current: number;
  best: number;
  lastActiveDate: string | null;
};

export type BlockSession = {
  id: string;
  durationMin: number;
  reason: string;
  startedAt: number;
  endedAt: number | null;
  completed: boolean;
  abandoned: boolean;
};

export type ActiveBlock = {
  id: string;
  durationMin: number;
  reason: string;
  startedAt: number;
  elapsedSeconds?: number;
  paused?: boolean;
};

export type FocusSession = {
  id: string;
  date: string;
  type: "deep" | "standard" | "quick";
  minutes: number;
  cycles: number;
  distractions: number;
  task?: string;
  xp: number;
};

export type Rank = {
  name: string;
  minXp: number;
  color: string;
  icon: string;
};

export type Achievement = {
  id: string;
  title: string;
  description: string;
  icon: string;
  tier: number;
  unlocked: boolean;
};

export type VictoryCard = {
  id: string;
  date: string;
  title: string;
  description: string;
  type: "streak" | "focus" | "mindset" | "mission" | "xp";
  value: number;
  icon: string;
  action?: string;
  obstacle?: string;
  lesson?: string;
};

export const RANKS: Rank[] = [
  { name: "Recluta", minXp: 0, color: "#636366", icon: "◇" },
  { name: "Fiel", minXp: 250, color: "#0A84FF", icon: "◆" },
  { name: "Indómito", minXp: 1000, color: "#30D158", icon: "◎" },
  { name: "Apex", minXp: 3000, color: "#BF5AF2", icon: "✦" },
  { name: "VÉRTICE", minXp: 8000, color: "#D4AF37", icon: "♛" },
];

export const DEFAULT_MISSIONS: Mission[] = [
  { id: "m1", text: "Me levanto sin posponer ni un segundo", category: "discipline", difficulty: 1, xp: 10, nonNegotiable: true },
  { id: "m2", text: "Cumplo 60 minutos de enfoque profundo", category: "mastery", difficulty: 2, xp: 25, nonNegotiable: true },
  { id: "m3", text: "Hoy no emito ni una sola queja", category: "mindset", difficulty: 1, xp: 15, nonNegotiable: true },
];

export const STOIC_QUOTES = [
  "No es que tengamos poco tiempo, sino que perdemos mucho.",
  "La felicidad de tu vida depende de la calidad de tus pensamientos.",
  "Si quieres mejorar, acepta que primero debes ser un principiante.",
  "La disciplina es la libertad.",
  "El obstáculo es el camino.",
  "No busques que los eventos sucedan como quieres, sino quiere que sucedan como suceden.",
];

export const NOTIFICATION_QUOTES: string[] = [
  "La mayoría se rinde. TÚ no.",
  "Hoy serás más duro que tus excusas.",
  "Tu ego no negocia con la comodidad.",
  "Gana la mañana, ganas la vida.",
  "Nadie va a hacerlo por ti. Nunca.",
  "El dolor de hoy es el estatus de mañana.",
  "La disciplina es tu única garantía.",
  "Los débiles descansan. TÚ avanzas.",
  "Cada minuto cuenta. Cada segundo.",
  "Tu mente se queja. Tu ego manda.",
  "No eres producto de tus circunstancias. Eres producto de tus decisiones.",
  "Si hoy no avanzas, retrocedes.",
  "La gente mira. TÚ EJECUTAS.",
  "Ganar no es opción. Es obligación.",
  "El mundo te golpea. Tú golpeas más fuerte.",
  "No existen días fáciles. Existen guerreros.",
  "Incomodidad es tu nueva comodidad.",
  "Tu racha no se rompe sola. TÚ la proteges.",
  "La motivación falla. La disciplina no.",
  "Vives como nadie. Logras como nadie.",
  "El sueño es para cobardes. Tu misión no espera.",
  "A nadie le importa tu cansancio. Solo tus resultados.",
  "Suerte no existe. Existe trabajo.",
  "Las víctimas lloran. Los líderes construyen.",
  "Tu adversario está descansando. Mientras tanto TÚ.",
  "No te compites contra ellos. Te compites contra el que eras ayer.",
  "La diferencia entre un perdedor y un ganador: uno renuncia. El otro no.",
  "Mañana es la mentira favorita de los flojos.",
  "Cada 'solo un día más' es mentira. No es uno más. Es tu futuro.",
  "La disciplina NO es dura. La mediocridad es dura. Tú eliges.",
  "Hazlo. O mira a otros que lo hacen.",
  "Nadie recuerda al que lo intentó. Recuerdan al que lo logró.",
  "Tu cuerpo se rinde primero. Tu mente segundo. Tu ego NUNCA.",
  "Eres imparable O eres excusa. Nada intermedio.",
  "Cada minuto que pierdes es un minuto que tu competencia gana.",
  "Ser normal es una decisión. Ser un monstruo también.",
  "El respeto no se pide. Se conquista cada día.",
  "Tus sueños no le temen a nada. Salvo a tu pereza.",
  "Tú no tienes ganas de hacerlo. Tu deber te obliga.",
  "Las personas mediocres hablan. Los imparables actúan.",
  "Si no te controlas a ti mismo, el mundo te controla a ti.",
  "No eres especial. Hasta que tus resultados lo digan.",
  "Hoy eliges entre el dolor del esfuerzo o el dolor del arrepentimiento.",
  "El mañana es el refugio de los que no tienen agallas.",
  "Cada misión que abandonas es una astilla que te deja débil.",
  "Cada misión que cumples es un ladrillo de tu imperio.",
  "El confort es la tumba de los grandes.",
  "Hoy te sientes cansado? Genial. El débil también. Ahora trabaja.",
  "Tu nombre no se construye en fiestas. Se construye a las 6AM cuando duermen.",
  "Cualquiera puede ser bueno. Nadie puede ser imparable. Salvo tú.",
  "La gente admira el resultado. Tú admiras el sacrificio.",
  "Nunca explicas. Nunca te quejes. Solo ejecutas.",
  "Tu oponente está en la cama. TÚ en pie.",
  "En 1 año querrás haber empezado hoy.",
  "No eres un soldado del destino. Eres su arquitecto.",
  "Hablar de disciplina no es disciplina. Hacerlo sí.",
  "Tu peor enemigo eres tú mismo. TÚ. Derrota tu versión perezosa.",
  "Tienes dos opciones: avanzar o ser un recuerdo.",
  "El talento falla. La constancia no.",
  "Tu familia no necesita un soñador. Necesita un TÚ hecho realidad.",
  "Lo extraordinario empieza cuando lo ordinario se termina.",
  "Siempre alguien tiene un plan B. El ganador ejecuta el plan A hasta morir.",
  "TÚ eres el ejemplo que todo el mundo quiso ser pero no tuvo agallas.",
  "Que el mundo sienta tu paso. No tu voz.",
  "Cada día es una batalla. Y las ganas todas o pierdes todas.",
  "La disciplina es libertad. La pereza es esclavitud.",
  "El que nace pobre no es fracaso. El que muere pobre sí.",
  "Tu mente es un campo. Siembra disciplina o crecen excusas.",
  "Solo dos opciones: hoy TÚ dominas el día, o el día te domina a TÍ.",
  "No buscas motivación. TÚ ERES LA MOTIVACIÓN.",
  "Los demás miran al reloj. Los imparables lo usan.",
  "El respeto dura más que el dinero. Gánatelo cada mañana.",
  "Tus palabras son humildes. Tus acciones son un terremoto.",
  "Deja de intentar. Empieza a CONSEGUIR.",
  "Nadie salvó a nadie esperando sentado. Levántate.",
  "El éxito no llega. Lo buscas y lo matas.",
  "Tu miedo es una señal: HAZLO.",
  "No eres un deseo. Eres una decisión.",
  "Cien personas empiezan. Diez persisten. UNO GANA. Ese eres tú.",
  "La incomodidad es tu billete a la cima. PAGALO.",
  "Tu mayor orgullo: cuando todos se van TÚ te quedas.",
  "Tu ego no sabe de 'difícil'. Solo sabe de 'HECHO'.",
  "Tus resultados te juzgan. Tus excusas se las guardas tú solo.",
  "No vas a ser mejor sin pagar el precio. Hoy pagas.",
  "Tienes un ejército? Bueno. Derrotarlo empieza por tu propia pereza.",
  "Quien espera se rinde. Quien ataca se adelanta.",
  "La mayoría nació para ser normal. Tú naciste para ser LEYENDA.",
  "No necesitas compañía. Necesitas agallas.",
  "Hoy tu cuerpo no quiere. TU SÍ. GANA TU EGO.",
  "El mundo pertenece a los que no paran por dolor.",
  "No lo hagas por halagos. Hazlo por el silencio de quienes te dudaron.",
  "Un hombre sin disciplina es un prisionero.",
  "Que el límite esté en tu cuerpo no significa que esté en tu mente.",
  "Las ovejas siguen el rebaño. Los lobos cazan.",
  "TÚ eres dueño de cada segundo. Cada uno.",
  "La vergüenza de no intentarlo es peor que el dolor de intentarlo.",
  "Siempre hay tiempo. El que dice que no lo busca excusas.",
  "Arrepentimiento es el peor dolor. Esfuerzo pasajero. Eliges.",
  "Tu mayor competidor es el que serías si no renunciaras.",
  "Nadie va a creer en ti primero. TÚ SÍ.",
  "El que aguanta más escribe la historia.",
  "Basta de soñar. Empieza a GOBERNAR.",
  "La gloria es cara. Págala HOY.",
  "Tu corazón late fuerte. Míralo. Utilízalo. No lo desperdicies.",
  "Ser un cobarde es gratis. Pero te cuesta la vida entera.",
  "Ser imparable cuesta hoy. Paga toda la eternidad.",
  "Tu herencia no es dinero. Es el ejemplo que dejas.",
  "Nunca negocia contigo mismo. Perderías siempre.",
  "Los demás descansan en su suerte. TÚ construyes tu destino.",
  "Los imposibles solo existen para los que no tienen ego.",
  "Tienes un hoy. UN HOY. Y es ÚNICO. Desperdíalo o conviértelo en leyenda.",
  "Tu silencio después del trabajo es más poderoso que cualquier discurso.",
  "No persigues la perfección. Persigues la ejecución ININTERRUMPIDA.",
  "Tú ganas antes de empezar. Porque ya no te rindes jamás.",
  "Cada paso pequeño hoy, un reino mañana.",
  "Todo el mundo quiere ser un monarca. Nadie quiere arar el campo.",
  "Ser normal es fácil. Ser TÚ es el mayor logro.",
  "VÉRTICE no es un lugar. Es quien TÚ te conviertes cada día que no paras.",
  "Aquí termina el sueño. Aquí empieza la conquista.",
  "No has nacido para perder. Has nacido para GOBERNARTE. Eso es hoy.",
  "Tu nombre. Tu destino. TUS REGLAS. Nadie más.",
  "Nadie puede pararte excepto tú mismo. Y hoy NO TE PARAS.",
  "El límite está donde TU mente lo pone. Muévelo más lejos.",
  "Hoy haces lo que otros no hacen, mañana tendrás lo que otros no tienen.",
  "La vida premia a los que no esperan. Premia a los que PERSIGUEN.",
  "Tú no eres una marca de la suerte. Eres una armadura.",
  "La victoria no tiene fecha. La tacha el calendario. Empieza YA.",
];

export const XP_PER_MINUTE_FOCUS = 1;

const KEYS = {
  profile: "vertice-profile",
  settings: "vertice-settings",
  progress: "vertice-progress-",
  dailyProgress: "vertice-daily-progress",
  streak: "vertice-streak",
  xp: "vertice-xp",
  totals: "vertice-totals",
  sessions: "vertice-block-sessions",
  active: "vertice-active-block",
  focusSessions: "vertice-focus-sessions",
  missions: "vertice-missions",
  victories: "vertice-victories",
  weeklyChallenge: "vertice-weekly-challenge",
};

export function getDateKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function parseDateKey(key: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return getDateKey(date) === key ? date : null;
}

function addDays(date: Date, count: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + count);
  return result;
}

function getWeekStart(date = new Date()): Date {
  const result = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  result.setDate(result.getDate() - ((result.getDay() + 6) % 7));
  return result;
}

function normalizeProgress(date: string, value: unknown): DailyProgress {
  const raw = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const completed = Array.isArray(raw.completed) ? raw.completed.map(Boolean) : [];
  const completedIds = Array.isArray(raw.completedIds)
    ? raw.completedIds.filter((id): id is string => typeof id === "string")
    : completed.flatMap((isDone, index) => isDone ? [DEFAULT_MISSIONS[index]?.id].filter((id): id is string => Boolean(id)) : []);
  const missionIds = Array.isArray(raw.missionIds)
    ? raw.missionIds.filter((id): id is string => typeof id === "string")
    : DEFAULT_MISSIONS.map((mission) => mission.id);
  const focusMinutes = Number(raw.focusMinutes);
  const discomfortAvg = Number(raw.discomfortAvg);
  return {
    date,
    missionIds,
    completedIds: [...new Set(completedIds)],
    completed: DEFAULT_MISSIONS.map((mission, index) =>
      completedIds.includes(mission.id) || Boolean(completed[index]),
    ),
    focusMinutes: Number.isFinite(focusMinutes) && focusMinutes > 0 ? focusMinutes : 0,
    discomfortAvg: Number.isFinite(discomfortAvg) ? Math.min(5, Math.max(0, discomfortAvg)) : 0,
    journalEntry: typeof raw.journalEntry === "string" ? raw.journalEntry : "",
  };
}

function progressHasActivity(progress: DailyProgress): boolean {
  return progress.completedIds.length > 0 || progress.focusMinutes > 0 || Boolean(progress.journalEntry) || progress.discomfortAvg > 0;
}

export async function getProfile(): Promise<WarriorProfile | null> {
  const raw = await AsyncStorage.getItem(KEYS.profile);
  if (!raw) return null;
  try {
    const profile = JSON.parse(raw) as WarriorProfile;
    return profile && typeof profile === "object" ? profile : null;
  } catch {
    return null;
  }
}

export async function saveProfile(profile: WarriorProfile): Promise<void> {
  await AsyncStorage.setItem(KEYS.profile, JSON.stringify(profile));
}

export async function clearEverything(): Promise<void> {
  const keys = await AsyncStorage.getAllKeys();
  await AsyncStorage.multiRemove(keys.filter((key) => key.startsWith("vertice-")));
}

export async function getSettings(): Promise<Settings> {
  const raw = await AsyncStorage.getItem(KEYS.settings);
  const defaults: Settings = { notifEnabled: false, notifHour: 6, notifMinute: 30, usedQuoteIndices: [], lastNotifDate: null };
  if (!raw) return defaults;
  try {
    const value = JSON.parse(raw) as Partial<Settings>;
    return {
      ...defaults,
      ...value,
      usedQuoteIndices: Array.isArray(value.usedQuoteIndices) ? value.usedQuoteIndices : [],
      lastNotifDate: typeof value.lastNotifDate === "string" ? value.lastNotifDate : null,
    };
  } catch {
    return defaults;
  }
}

export async function saveSettings(settings: Settings): Promise<void> {
  await AsyncStorage.setItem(KEYS.settings, JSON.stringify(settings));
}

export async function getNextQuote(): Promise<{ index: number; text: string }> {
  const settings = await getSettings();
  let available = NOTIFICATION_QUOTES.map((_, index) => index).filter((index) => !settings.usedQuoteIndices.includes(index));
  if (!available.length) {
    settings.usedQuoteIndices = [];
    available = NOTIFICATION_QUOTES.map((_, index) => index);
  }
  const index = available[Math.floor(Math.random() * available.length)] ?? 0;
  settings.usedQuoteIndices.push(index);
  await saveSettings(settings);
  return { index, text: NOTIFICATION_QUOTES[index] };
}

export function randomStoicQuote(): string {
  return STOIC_QUOTES[Math.floor(Math.random() * STOIC_QUOTES.length)] ?? STOIC_QUOTES[0];
}

export async function getMissions(): Promise<Mission[]> {
  const raw = await AsyncStorage.getItem(KEYS.missions);
  if (!raw) return DEFAULT_MISSIONS;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return DEFAULT_MISSIONS;
    const migrated = parsed.flatMap((value): Mission[] => {
      if (!value || typeof value !== "object") return [];
      const item = value as Record<string, unknown>;
      const text = typeof item.text === "string" ? item.text : item.label;
      if (typeof item.id !== "string" || typeof text !== "string") return [];
      const category = ["discipline", "mindset", "physical", "mastery"].includes(String(item.category))
        ? item.category as Mission["category"]
        : "mindset";
      const difficulty = [1, 2, 3].includes(Number(item.difficulty))
        ? Number(item.difficulty) as Mission["difficulty"]
        : 1;
      const xp = Number(item.xp);
      return [{
        id: item.id,
        text,
        category,
        difficulty,
        xp: Number.isFinite(xp) && xp > 0 ? Math.min(500, Math.round(xp)) : difficulty * 15,
        nonNegotiable: Boolean(item.nonNegotiable),
      }];
    });
    return migrated.length ? migrated : DEFAULT_MISSIONS;
  } catch {
    return DEFAULT_MISSIONS;
  }
}

export async function saveMissions(missions: Mission[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.missions, JSON.stringify(missions));
}

export async function readAllProgress(): Promise<Record<string, DailyProgress>> {
  const keys = await AsyncStorage.getAllKeys();
  const stored = new Map<string, unknown>();
  const progressKeys = keys.filter((key) => key.startsWith(KEYS.progress));
  const values = await AsyncStorage.multiGet(progressKeys);
  for (const [key, raw] of values) {
    if (!raw) continue;
    const date = key.slice(KEYS.progress.length);
    try {
      stored.set(date, JSON.parse(raw));
    } catch {}
  }
  const sharedRaw = await AsyncStorage.getItem(KEYS.dailyProgress);
  if (sharedRaw) {
    try {
      const shared = JSON.parse(sharedRaw) as Record<string, unknown>;
      for (const [date, progress] of Object.entries(shared)) {
        if (!stored.has(date)) stored.set(date, progress);
      }
    } catch {}
  }
  const result: Record<string, DailyProgress> = {};
  for (const [date, value] of stored) {
    if (parseDateKey(date)) result[date] = normalizeProgress(date, value);
  }
  return result;
}

export async function saveDailyProgress(progress: DailyProgress): Promise<void> {
  const normalized = normalizeProgress(progress.date, progress);
  await AsyncStorage.setItem(KEYS.progress + progress.date, JSON.stringify(normalized));
  const raw = await AsyncStorage.getItem(KEYS.dailyProgress);
  let all: Record<string, DailyProgress> = {};
  try {
    all = raw ? JSON.parse(raw) as Record<string, DailyProgress> : {};
  } catch {}
  all[progress.date] = normalized;
  await AsyncStorage.setItem(KEYS.dailyProgress, JSON.stringify(all));
}

export async function getTodayProgress(): Promise<boolean[]> {
  const all = await readAllProgress();
  return normalizeProgress(getDateKey(), all[getDateKey()]).completed;
}

export async function toggleMission(mission: string | number): Promise<{ completed: boolean; xpDelta: number }> {
  const missions = await getMissions();
  const selected = typeof mission === "number" ? missions[mission] : missions.find((item) => item.id === mission);
  if (!selected) return { completed: false, xpDelta: 0 };
  const date = getDateKey();
  const all = await readAllProgress();
  const current = normalizeProgress(date, all[date]);
  const wasComplete = current.completedIds.includes(selected.id);
  const completedIds = wasComplete
    ? current.completedIds.filter((id) => id !== selected.id)
    : [...current.completedIds, selected.id];
  const updated = normalizeProgress(date, {
    ...current,
    missionIds: [...new Set([...current.missionIds, selected.id])],
    completedIds,
  });
  await saveDailyProgress(updated);
  const xpDelta = wasComplete ? -selected.xp : selected.xp;
  if (xpDelta) await addXp(xpDelta);
  await updateStreakFromProgress(updated);
  return { completed: !wasComplete, xpDelta };
}

async function updateStreakFromProgress(progress: DailyProgress): Promise<void> {
  const streak = await getStreak();
  const active = progressHasActivity(progress);
  if (!active) return;
  const today = getDateKey();
  if (streak.lastActiveDate === today) return;
  const yesterday = getDateKey(addDays(new Date(), -1));
  streak.current = streak.lastActiveDate === yesterday ? streak.current + 1 : 1;
  streak.best = Math.max(streak.best, streak.current);
  streak.lastActiveDate = today;
  await saveStreak(streak);
}

export async function getStreak(): Promise<StreakData> {
  const raw = await AsyncStorage.getItem(KEYS.streak);
  const empty: StreakData = { current: 0, best: 0, lastActiveDate: null };
  if (!raw) return empty;
  try {
    const value = JSON.parse(raw) as Partial<StreakData>;
    const streak: StreakData = {
      current: Math.max(0, Number(value.current) || 0),
      best: Math.max(0, Number(value.best) || 0),
      lastActiveDate: typeof value.lastActiveDate === "string" ? value.lastActiveDate : null,
    };
    if (streak.lastActiveDate && streak.lastActiveDate !== getDateKey() && streak.lastActiveDate !== getDateKey(addDays(new Date(), -1))) streak.current = 0;
    return streak;
  } catch {
    return empty;
  }
}

export async function saveStreak(streak: StreakData): Promise<void> {
  await AsyncStorage.setItem(KEYS.streak, JSON.stringify(streak));
}

export async function resetStreak(): Promise<void> {
  const streak = await getStreak();
  await saveStreak({ ...streak, current: 0 });
}

export function getStreakDays(progress: Record<string, DailyProgress>): number {
  const activeDates = new Set(Object.entries(progress).filter(([, day]) => progressHasActivity(day)).map(([date]) => date));
  const today = getDateKey();
  let cursor = activeDates.has(today) ? new Date() : addDays(new Date(), -1);
  let count = 0;
  while (activeDates.has(getDateKey(cursor))) {
    count += 1;
    cursor = addDays(cursor, -1);
  }
  return count;
}

export async function getWeeklySummary(date = new Date()): Promise<WeeklySummary> {
  const byDay = await readAllProgress();
  const start = getWeekStart(date);
  const missions = await getMissions();
  const days = Array.from({ length: 7 }, (_, index) => {
    const key = getDateKey(addDays(start, index));
    const progress = byDay[key] ?? normalizeProgress(key, null);
    return {
      date: key,
      missionsCompleted: progress.completedIds.length,
      missionsTotal: missions.length,
      focusMinutes: progress.focusMinutes,
      active: progressHasActivity(progress),
    };
  });
  return {
    days,
    totalFocus: days.reduce((sum, day) => sum + day.focusMinutes, 0),
    totalMissionsWeek: days.reduce((sum, day) => sum + day.missionsCompleted, 0),
    activeDays: days.filter((day) => day.active).length,
  };
}

export async function getWeeklyChallenge(): Promise<WeeklyChallenge> {
  const weekStart = getDateKey(getWeekStart());
  const raw = await AsyncStorage.getItem(KEYS.weeklyChallenge);
  if (raw) {
    try {
      const challenge = JSON.parse(raw) as WeeklyChallenge;
      if (challenge.weekStart === weekStart && ["activeDays", "focusMinutes"].includes(challenge.kind) && Number.isFinite(challenge.target)) return challenge;
    } catch {}
  }
  const challenge: WeeklyChallenge = { weekStart, kind: "activeDays", target: 4 };
  await AsyncStorage.setItem(KEYS.weeklyChallenge, JSON.stringify(challenge));
  return challenge;
}

export async function saveWeeklyChallenge(challenge: WeeklyChallenge): Promise<void> {
  const target = Math.max(1, Math.min(challenge.kind === "activeDays" ? 7 : 600, Math.round(challenge.target)));
  await AsyncStorage.setItem(KEYS.weeklyChallenge, JSON.stringify({ ...challenge, target, weekStart: getDateKey(getWeekStart()) }));
}

export async function getWeeklyChallengeProgress(): Promise<{ challenge: WeeklyChallenge; progress: number }> {
  const [challenge, weekly] = await Promise.all([getWeeklyChallenge(), getWeeklySummary()]);
  return { challenge, progress: challenge.kind === "activeDays" ? weekly.activeDays : weekly.totalFocus };
}

export async function getVictories(): Promise<VictoryCard[]> {
  const raw = await AsyncStorage.getItem(KEYS.victories);
  if (!raw) return [];
  try {
    const value = JSON.parse(raw);
    return Array.isArray(value) ? value.filter((item) => item && typeof item.id === "string") : [];
  } catch {
    return [];
  }
}

export async function addVictory(victory: VictoryCard): Promise<void> {
  const list = await getVictories();
  if (list.some((item) => item.id === victory.id)) return;
  await AsyncStorage.setItem(KEYS.victories, JSON.stringify([victory, ...list].slice(0, 50)));
}

export async function addJournalVictory(input: { action: string; obstacle?: string; lesson?: string }): Promise<VictoryCard> {
  const victory: VictoryCard = {
    id: `journal_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    date: new Date().toISOString(),
    title: input.action.trim().slice(0, 100) || "Una victoria personal",
    description: "Una prueba de progreso que has elegido guardar.",
    type: "mindset",
    value: 1,
    icon: "★",
    action: input.action.trim().slice(0, 500),
    obstacle: input.obstacle?.trim().slice(0, 500) || undefined,
    lesson: input.lesson?.trim().slice(0, 500) || undefined,
  };
  await addVictory(victory);
  return victory;
}

export async function getRecentVictory(): Promise<VictoryCard | null> {
  return (await getVictories())[0] ?? null;
}

export async function getXp(): Promise<number> {
  const raw = await AsyncStorage.getItem(KEYS.xp);
  return raw ? Math.max(0, Number(raw) || 0) : 0;
}

export const getTotalXp = getXp;

export async function addXp(delta: number): Promise<void> {
  const xp = Math.max(0, (await getXp()) + delta);
  await AsyncStorage.setItem(KEYS.xp, String(xp));
}

export function getRank(xp: number): { current: Rank; next: Rank | null; progress: number } {
  let current = RANKS[0];
  let next: Rank | null = null;
  for (let index = 0; index < RANKS.length; index += 1) {
    if (xp >= RANKS[index].minXp) {
      current = RANKS[index];
      next = RANKS[index + 1] ?? null;
    }
  }
  return {
    current,
    next,
    progress: next ? Math.max(0, Math.min(1, (xp - current.minXp) / (next.minXp - current.minXp))) : 1,
  };
}

export function getAchievements(xp: number, streak: number, focusMin: number, missions: number): Achievement[] {
  return [
    { id: "a1", title: "Primer Paso", description: "Completar tu primera misión", icon: "🌱", tier: 1, unlocked: missions >= 1 },
    { id: "a2", title: "Firmeza", description: "Mantener racha de 3 días", icon: "⚓", tier: 1, unlocked: streak >= 3 },
    { id: "a3", title: "Enfoque Profundo", description: "Lograr 100 min de enfoque total", icon: "🎯", tier: 2, unlocked: focusMin >= 100 },
    { id: "a4", title: "Guerrero", description: "Alcanzar 1000 XP", icon: "⚔️", tier: 2, unlocked: xp >= 1000 },
    { id: "a5", title: "Imparable", description: "Racha de 30 días", icon: "🔥", tier: 3, unlocked: streak >= 30 },
    { id: "a6", title: "Dominador", description: "Alcanzar 5000 XP", icon: "👑", tier: 3, unlocked: xp >= 5000 },
  ];
}

export async function saveSession(session: FocusSession): Promise<void> {
  const raw = await AsyncStorage.getItem(KEYS.focusSessions);
  let sessions: FocusSession[] = [];
  try {
    const value = raw ? JSON.parse(raw) : [];
    if (Array.isArray(value)) sessions = value;
  } catch {}
  if (sessions.some((item) => item.id === session.id)) return;
  sessions = [session, ...sessions].slice(0, 100);
  await AsyncStorage.setItem(KEYS.focusSessions, JSON.stringify(sessions));
  await addXp(Math.max(0, session.xp));
  const date = getDateKey(new Date(session.date));
  const all = await readAllProgress();
  const current = normalizeProgress(date, all[date]);
  await saveDailyProgress({ ...current, focusMinutes: current.focusMinutes + Math.max(0, session.minutes) });
  const totals = await getTotals();
  await saveTotals({ totalSessions: totals.totalSessions + 1, totalFocusMinutes: totals.totalFocusMinutes + Math.max(0, session.minutes) });
  await updateStreakFromProgress({ ...current, focusMinutes: current.focusMinutes + Math.max(0, session.minutes) });
}

export async function getRecentSessions(): Promise<FocusSession[]> {
  const raw = await AsyncStorage.getItem(KEYS.focusSessions);
  try {
    const value = raw ? JSON.parse(raw) : [];
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

type Totals = { totalSessions: number; totalFocusMinutes: number };

export async function getTotals(): Promise<Totals> {
  const raw = await AsyncStorage.getItem(KEYS.totals);
  try {
    return raw ? JSON.parse(raw) as Totals : { totalSessions: 0, totalFocusMinutes: 0 };
  } catch {
    return { totalSessions: 0, totalFocusMinutes: 0 };
  }
}

export async function saveTotals(totals: Totals): Promise<void> {
  await AsyncStorage.setItem(KEYS.totals, JSON.stringify(totals));
}

export async function getBlockSessions(): Promise<BlockSession[]> {
  const raw = await AsyncStorage.getItem(KEYS.sessions);
  try {
    const value = raw ? JSON.parse(raw) : [];
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

export async function saveBlockSession(session: BlockSession): Promise<void> {
  const list = await getBlockSessions();
  const index = list.findIndex((item) => item.id === session.id);
  if (index >= 0) list[index] = session;
  else list.unshift(session);
  await AsyncStorage.setItem(KEYS.sessions, JSON.stringify(list.slice(0, 30)));
}

export async function getActiveBlock(): Promise<ActiveBlock | null> {
  const raw = await AsyncStorage.getItem(KEYS.active);
  try {
    return raw ? JSON.parse(raw) as ActiveBlock : null;
  } catch {
    return null;
  }
}

export async function saveActiveBlock(active: ActiveBlock | null): Promise<void> {
  if (!active) {
    await AsyncStorage.removeItem(KEYS.active);
    return;
  }
  await AsyncStorage.setItem(KEYS.active, JSON.stringify(active));
}

export async function completeActiveBlock(): Promise<{ xp: number }> {
  const active = await getActiveBlock();
  if (!active) return { xp: 0 };
  const endedAt = Date.now();
  await saveBlockSession({ ...active, endedAt, completed: true, abandoned: false });
  await saveActiveBlock(null);
  const xp = active.durationMin * XP_PER_MINUTE_FOCUS;
  await addXp(xp);
  const totals = await getTotals();
  await saveTotals({ totalSessions: totals.totalSessions + 1, totalFocusMinutes: totals.totalFocusMinutes + active.durationMin });
  const date = getDateKey(new Date(active.startedAt));
  const all = await readAllProgress();
  const current = normalizeProgress(date, all[date]);
  const updated = { ...current, focusMinutes: current.focusMinutes + active.durationMin };
  await saveDailyProgress(updated);
  await updateStreakFromProgress(updated);
  return { xp };
}

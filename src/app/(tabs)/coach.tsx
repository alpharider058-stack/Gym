import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, {
  Easing,
  FadeInDown,
  FadeInRight,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { LUXURY } from "@/constants/theme";
import {
  DEFAULT_MISSIONS,
  getRank,
  getStreakDays,
  getTotalXp,
  randomStoicQuote,
  readAllProgress,
  RANKS,
  STOIC_QUOTES,
  type WarriorProfile,
} from "@/lib/forge-storage";

const AREAS = [
  {
    id: "discipline",
    label: "Disciplina férrea",
    color: LUXURY.gold,
    icon: "◎",
    questions: [
      "¿Qué acción no negociable has dejado de hacer esta semana?",
      "¿A qué hora sales de tu cama sin excusas? Fíjalo en piedra.",
      "¿Qué 3 hábitos quieres que sean imborrables en 90 días?",
    ],
  },
  {
    id: "focus",
    label: "Enfoque profundo",
    color: LUXURY.neon,
    icon: "✦",
    questions: [
      "¿Qué tarea movería montañas hoy? Escribe solo una.",
      "¿Cuándo van a ser tus 90 minutos sin distracciones?",
      "¿Qué aplicación te roba voluntad y la cierras ahora?",
    ],
  },
  {
    id: "mindset",
    label: "Mentalidad ganadora",
    color: LUXURY.violet,
    icon: "◇",
    questions: [
      "¿Qué pensamiento derrotista has repetido esta semana?",
      "¿Qué está en tu control y qué no hoy? Sepáralo.",
      "¿Qué es lo peor que puede pasar si das el paso que estás evitando?",
    ],
  },
  {
    id: "ego",
    label: "Ego positivo",
    color: LUXURY.emerald,
    icon: "⟐",
    questions: [
      "Menciona 3 victorias pequeñas de los últimos 7 días.",
      "¿Por qué eres mejor hoy que hace un mes?",
      "¿Qué te hace inigualable? Escríbelo sin miedo.",
    ],
  },
];

const MISSION_CATEGORIES = [
  "Levantarse a una hora concreta",
  "Entrenar cuerpo o mente cada día",
  "Lectura diaria",
  "Frío (ducha, paseo, baño)",
  "Agradecimiento y reflexión",
  "Reducción de distracciones móviles",
  "Sin quejas ni excusas",
  "Plan de 3 prioridades cada mañana",
];

const REQUEST_TIMEOUT_MS = 12000;
const MAX_RETRIES = 2;

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  signal: AbortSignal,
) {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    const abortRequest = () => controller.abort();
    signal.addEventListener("abort", abortRequest, { once: true });
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeout);
      signal.removeEventListener("abort", abortRequest);
      return response;
    } catch (error) {
      clearTimeout(timeout);
      signal.removeEventListener("abort", abortRequest);
      if (signal.aborted || attempt === MAX_RETRIES) throw error;
    }
  }
  throw new Error("No se pudo conectar con el servidor");
}

function formatCoachPlan(value: unknown): string | null {
  if (typeof value === "string") return value.trim().slice(0, 12000) || null;
  if (!value || typeof value !== "object") return null;
  const weekdays = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
  const lines = Object.entries(value as Record<string, unknown>)
    .map(([key, day]) => {
      const index = Number(key);
      const label = Number.isInteger(index) && index >= 0 && index < 7 ? weekdays[index] : key;
      if (day === true) return `• ${label}: día de práctica`;
      if (day === false || day == null) return null;
      return `• ${label}: ${typeof day === "string" ? day : JSON.stringify(day)}`;
    })
    .filter((line): line is string => Boolean(line));
  return lines.length ? `# Plan semanal\n\n${lines.join("\n")}` : null;
}

function Option({
  value,
  selected,
  onPress,
  icon,
  color,
}: {
  value: string;
  selected: boolean;
  onPress: () => void;
  icon?: string;
  color?: string;
}) {
  const press = useSharedValue(1);
  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: press.value }],
  }));
  return (
    <Pressable
      style={({ pressed }) => [
        styles.option,
        selected &&
          color && {
            borderColor: `${color}55`,
            backgroundColor: `${color}18`,
          },
        pressed && { opacity: 0.88 },
      ]}
      onPress={onPress}
      onPressIn={() => {
        press.value = withTiming(0.97, { duration: 120 });
      }}
      onPressOut={() => {
        press.value = withTiming(1, {
          duration: 180,
          easing: Easing.out(Easing.cubic),
        });
      }}
    >
      <Animated.View
        style={[
          pressStyle,
          {
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          },
        ]}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          {icon ? (
            <View
              style={[
                styles.optionIcon,
                color && {
                  backgroundColor: `${color}22`,
                  borderColor: `${color}44`,
                },
              ]}
            >
              <Text style={[styles.optionIconText, color && { color }]}>
                {icon}
              </Text>
            </View>
          ) : null}
          <Text style={[styles.optionText, selected && color && { color }]}>
            {value}
          </Text>
        </View>
        <View
          style={[styles.radio, selected && color && { borderColor: color }]}
        >
          {selected ? (
            <View
              style={[
                styles.radioInner,
                color ? { backgroundColor: color } : {},
              ]}
            />
          ) : null}
        </View>
      </Animated.View>
    </Pressable>
  );
}

export default function CoachScreen() {
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<WarriorProfile | null>(null);
  const [areas, setAreas] = useState<string[]>([AREAS[0].id]);
  const [missionCount, setMissionCount] = useState("5");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([
    MISSION_CATEGORIES[0],
    MISSION_CATEGORIES[7],
  ]);
  const [intensity, setIntensity] = useState("Templado");
  const [weakness, setWeakness] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [plan, setPlan] = useState<string>("");
  const requestController = useRef<AbortController | null>(null);
  const [rankMeta, setRankMeta] = useState({ level: 1, xp: 0, streak: 0 });

  const progress = useSharedValue(0);
  const introQuote = useMemo(() => randomStoicQuote(), []);

  useEffect(() => {
    AsyncStorage.getItem("vertice-profile").then((raw) => {
      if (raw) setProfile(JSON.parse(raw));
    });
    Promise.all([getTotalXp(), readAllProgress()]).then(([xp, byDay]) => {
      const rank = getRank(xp);
      setRankMeta({
        level: RANKS.findIndex((item) => item.name === rank.current.name) + 1,
        xp,
        streak: getStreakDays(byDay),
      });
      progress.value = withTiming(rank.progress, { duration: 900 });
    });
  }, []);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${Math.min(100, progress.value * 100)}%`,
  }));

  useEffect(() => () => requestController.current?.abort(), []);

  const generateLocalPlan = () => {
    const selectedAreas = AREAS.filter((a) => areas.includes(a.id));
    const days = [
      "Lunes",
      "Martes",
      "Miércoles",
      "Jueves",
      "Viernes",
      "Sábado",
      "Domingo",
    ];
    const core = [
      ...DEFAULT_MISSIONS.filter((m) => m.nonNegotiable).slice(0, 3),
      ...DEFAULT_MISSIONS.filter(
        (m) =>
          !m.nonNegotiable &&
          MISSION_CATEGORIES.some((c) => m.text.includes(c)),
      ).slice(0, Number(missionCount) || 5),
    ].slice(0, Number(missionCount) || 5);
    const weekPlan = days
      .map((day, idx) => {
        const focus =
          selectedAreas[idx % selectedAreas.length] ?? selectedAreas[0];
        const question =
          focus?.questions[idx % focus.questions.length] ??
          "¿Qué paso pequeño, pero no negociable, doy hoy?";
        const intensityLine =
          intensity === "Forjado a fuego"
            ? "Maximiza incomodidad, mantén la técnica."
            : intensity === "Templado"
              ? "Empieza firme y remata con fuerza."
              : "Consistencia primero, intensidad después.";
        return (
          `### ${day} · ${focus?.label ?? "Disciplina"}` +
          `\n- ${question}` +
          `\n- Misiones hoy: ${core
            .slice(0, 5)
            .map((m) => m.text)
            .join(" / ")}` +
          `\n- ${intensityLine}`
        );
      })
      .join("\n\n");

    const final =
      `# Plan VÉRTICE generado\n\n` +
      `## Perfil\n` +
      `Guerrero: ${profile?.name ?? "No definido"} · Rango Nº ${rankMeta.level} · ${rankMeta.xp} XP · ${rankMeta.streak} días de racha\n` +
      `Mantra: ${profile?.mantra ?? STOIC_QUOTES[0]}\n\n` +
      `## Áreas seleccionadas\n` +
      selectedAreas.map((a) => `• ${a.label}`).join("\n") +
      `\n\n` +
      `## Semana de guerra\n\n` +
      weekPlan +
      `\n\n## Nota final\n` +
      `“${introQuote}”`;
    return final;
  };

  const generate = async () => {
    const endpoint =
      process.env.EXPO_PUBLIC_AI_PROXY_URL || "http://127.0.0.1:8787";
    setLoading(true);
    setMessage("");
    setPlan("");
    requestController.current?.abort();
    const controller = new AbortController();
    requestController.current = controller;
    try {
      const stored = await AsyncStorage.getItem("vertice-profile");
      const response = await fetchWithRetry(
        `${endpoint}/api/coach`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            profile: stored ? JSON.parse(stored) : {},
            kind: "vertice",
            areas,
            missionCategories: selectedCategories,
            missionCount: Number(missionCount) || 5,
            intensity,
            weakness,
            rank: rankMeta,
          }),
        },
        controller.signal,
      );
      const result = await response.json();
      if (!response.ok) {
        throw new Error(
          result.error ||
            `El servidor respondió con error (${response.status})`,
        );
      }
      const planText =
        formatCoachPlan(result.plan) ??
        formatCoachPlan(result.routine?.name) ??
        generateLocalPlan();
      setPlan(planText);
      await AsyncStorage.setItem("vertice-last-plan", planText);
      setMessage("Plan generado y guardado localmente.");
    } catch (error) {
      if (controller.signal.aborted) return;
      const fallback = generateLocalPlan();
      setPlan(fallback);
      setMessage(
        "Usamos el plan generado localmente: sin conexión al coach remoto.",
      );
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 110 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View entering={FadeInDown.duration(450)}>
        <Text style={styles.eyebrow}>COACH · VÉRTICE</Text>
        <Text style={styles.title}>Tu estrategia mental, semanal.</Text>
        <Text style={styles.subtitle}>
          Define áreas, intensidad y tu punto débil. El coach prepara tu plan de
          batalla.
        </Text>
      </Animated.View>

      <Animated.View
        entering={FadeInDown.delay(60).duration(450)}
        style={styles.profileCard}
      >
        <View style={{ flex: 1 }}>
          <Text style={styles.profileEyebrow}>GUERRERO</Text>
          <Text style={styles.profileName}>
            {profile?.name ?? "Sin nombre definido"}
          </Text>
          <Text style={styles.profileMantra}>
            {profile?.mantra ?? "Aún no tienes mantra."}
          </Text>
          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressFill, progressStyle]} />
          </View>
          <Text style={styles.profileHint}>
            Rango Nº {rankMeta.level} · {rankMeta.xp} XP · {rankMeta.streak}{" "}
            días racha
          </Text>
        </View>
        <View style={styles.profileBadge}>
          <Text style={styles.profileBadgeText}>V</Text>
        </View>
      </Animated.View>

      <Animated.View
        entering={FadeInDown.delay(120).duration(450)}
        style={styles.card}
      >
        <Text style={styles.label}>¿Qué pilares quieres dominar?</Text>
        <View style={styles.options}>
          {AREAS.map((area) => (
            <Option
              key={area.id}
              value={area.label}
              icon={area.icon}
              color={area.color}
              selected={areas.includes(area.id)}
              onPress={() =>
                setAreas((current) =>
                  current.includes(area.id)
                    ? current.filter((x) => x !== area.id)
                    : [...current, area.id],
                )
              }
            />
          ))}
        </View>
      </Animated.View>

      <Animated.View
        entering={FadeInDown.delay(180).duration(450)}
        style={styles.card}
      >
        <Text style={styles.label}>Categorías de misiones diarias</Text>
        <View style={styles.options}>
          {MISSION_CATEGORIES.map((m) => (
            <Option
              key={m}
              value={m}
              selected={selectedCategories.includes(m)}
              onPress={() =>
                setSelectedCategories((current) =>
                  current.includes(m)
                    ? current.filter((x) => x !== m)
                    : [...current, m],
                )
              }
            />
          ))}
        </View>
      </Animated.View>

      <Animated.View
        entering={FadeInDown.delay(240).duration(450)}
        style={styles.card}
      >
        <Text style={styles.label}>Número de misiones al día</Text>
        <View style={styles.row}>
          {["3", "5", "7", "9"].map((n) => (
            <Pressable
              key={n}
              style={[styles.pill, missionCount === n && styles.pillSelected]}
              onPress={() => setMissionCount(n)}
            >
              <Text
                style={[
                  styles.pillText,
                  missionCount === n && styles.pillTextSelected,
                ]}
              >
                {n}
              </Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.label}>Intensidad semanal</Text>
        <View style={styles.options}>
          {["Conservador", "Templado", "Forjado a fuego"].map((level) => (
            <Option
              key={level}
              value={level}
              selected={intensity === level}
              onPress={() => setIntensity(level)}
            />
          ))}
        </View>
        <Text style={styles.label}>¿Dónde te notas más flojo?</Text>
        <TextInput
          value={weakness}
          onChangeText={setWeakness}
          placeholder="Ej: me desconcentro al móvil, me quejo de todo…"
          placeholderTextColor={LUXURY.ash}
          selectionColor={LUXURY.gold}
          style={styles.input}
          multiline
        />
      </Animated.View>

      <Pressable
        style={({ pressed }) => [
          styles.button,
          (loading || !areas.length || !selectedCategories.length) &&
            styles.buttonDisabled,
          pressed && styles.pressed,
        ]}
        onPress={generate}
        disabled={loading || !areas.length || !selectedCategories.length}
      >
        {loading ? (
          <ActivityIndicator color={LUXURY.ink} />
        ) : (
          <Text style={styles.buttonText}>FORJAR MI PLAN SEMANAL →</Text>
        )}
      </Pressable>

      {message ? (
        <Animated.View
          entering={FadeInRight.duration(400)}
          style={styles.messageCard}
        >
          <Text style={styles.messageText}>{message}</Text>
        </Animated.View>
      ) : null}

      {plan ? (
        <Animated.View
          entering={FadeInDown.delay(80).duration(500)}
          style={styles.planCard}
        >
          <Text style={styles.planLabel}>TU PLAN VÉRTICE</Text>
          <ScrollView nestedScrollEnabled style={styles.planScroll}>
            {plan.split("\n").map((line, i) => {
              const isHeading = line.startsWith("#");
              const isSub = line.startsWith("##");
              return (
                <Text
                  key={i}
                  style={
                    isSub
                      ? styles.planSub
                      : isHeading
                        ? styles.planTitle
                        : styles.planLine
                  }
                >
                  {line.replace(/^#{1,3}\s*/, "")}
                </Text>
              );
            })}
          </ScrollView>
        </Animated.View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: LUXURY.ink },
  content: {
    paddingHorizontal: 20,
    maxWidth: 800,
    alignSelf: "center",
    width: "100%",
  },
  eyebrow: {
    color: LUXURY.gold,
    fontSize: 11,
    letterSpacing: 1.8,
    fontWeight: "800",
    marginBottom: 8,
  },
  title: {
    color: LUXURY.snow,
    fontSize: 28,
    fontWeight: "900",
    lineHeight: 34,
    marginBottom: 6,
  },
  subtitle: {
    color: LUXURY.mist,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
    backgroundColor: LUXURY.graphite,
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: `${LUXURY.gold}22`,
  },
  profileEyebrow: {
    color: LUXURY.ash,
    fontSize: 10,
    letterSpacing: 1.6,
    fontWeight: "800",
    marginBottom: 6,
  },
  profileName: {
    color: LUXURY.snow,
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 4,
  },
  profileMantra: {
    color: LUXURY.pearl,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "500",
    marginBottom: 10,
  },
  progressTrack: {
    height: 5,
    backgroundColor: LUXURY.charcoal,
    borderRadius: 4,
    marginBottom: 6,
  },
  progressFill: {
    height: "100%",
    backgroundColor: LUXURY.gold,
    borderRadius: 4,
  },
  profileHint: {
    color: LUXURY.ash,
    fontSize: 11,
    fontWeight: "600",
  },
  profileBadge: {
    width: 62,
    height: 62,
    borderRadius: 22,
    backgroundColor: LUXURY.obsidian,
    borderWidth: 1,
    borderColor: `${LUXURY.gold}44`,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: LUXURY.gold,
    shadowOpacity: 0.25,
    shadowRadius: 16,
  },
  profileBadgeText: {
    color: LUXURY.goldSoft,
    fontSize: 26,
    fontWeight: "900",
  },
  card: {
    backgroundColor: LUXURY.graphite,
    borderRadius: 22,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: LUXURY.charcoal,
  },
  label: {
    color: LUXURY.snow,
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 12,
    marginTop: 0,
  },
  options: { gap: 10 },
  option: {
    minHeight: 54,
    borderRadius: 16,
    paddingHorizontal: 14,
    backgroundColor: LUXURY.obsidian,
    borderWidth: 1,
    borderColor: LUXURY.charcoal,
    alignItems: "center",
    justifyContent: "center",
  },
  optionIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: LUXURY.charcoal,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  optionIconText: { fontSize: 12, fontWeight: "800" },
  optionText: {
    color: LUXURY.snow,
    fontSize: 14,
    fontWeight: "600",
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: LUXURY.stone,
    alignItems: "center",
    justifyContent: "center",
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: LUXURY.gold,
  },
  row: { flexDirection: "row", gap: 10, marginBottom: 18 },
  pill: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    backgroundColor: LUXURY.obsidian,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: LUXURY.charcoal,
  },
  pillSelected: {
    backgroundColor: `${LUXURY.gold}22`,
    borderColor: `${LUXURY.gold}55`,
  },
  pillText: { color: LUXURY.ash, fontSize: 14, fontWeight: "800" },
  pillTextSelected: { color: LUXURY.goldSoft },
  input: {
    minHeight: 78,
    borderRadius: 16,
    backgroundColor: LUXURY.obsidian,
    padding: 14,
    color: LUXURY.snow,
    fontSize: 14,
    borderWidth: 1,
    borderColor: LUXURY.charcoal,
    textAlignVertical: "top",
  },
  button: {
    minHeight: 56,
    borderRadius: 18,
    backgroundColor: LUXURY.gold,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
    marginBottom: 16,
    shadowColor: LUXURY.gold,
    shadowOpacity: 0.3,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
  },
  buttonDisabled: { opacity: 0.35 },
  buttonText: {
    color: LUXURY.ink,
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 1,
  },
  pressed: { opacity: 0.86, transform: [{ scale: 0.985 }] },
  messageCard: {
    backgroundColor: `${LUXURY.emerald}18`,
    borderWidth: 1,
    borderColor: `${LUXURY.emerald}44`,
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
  },
  messageText: {
    color: LUXURY.emerald,
    fontSize: 12,
    fontWeight: "700",
  },
  planCard: {
    backgroundColor: LUXURY.graphite,
    borderRadius: 24,
    padding: 18,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: `${LUXURY.neon}22`,
  },
  planLabel: {
    color: LUXURY.neonSoft,
    fontSize: 11,
    letterSpacing: 1.6,
    fontWeight: "800",
    marginBottom: 12,
  },
  planScroll: {
    maxHeight: 520,
    borderRadius: 14,
    backgroundColor: LUXURY.obsidian,
    padding: 16,
  },
  planTitle: {
    color: LUXURY.goldSoft,
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 8,
  },
  planSub: {
    color: LUXURY.snow,
    fontSize: 15,
    fontWeight: "800",
    marginTop: 12,
    marginBottom: 6,
  },
  planLine: {
    color: LUXURY.pearl,
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 2,
  },
});

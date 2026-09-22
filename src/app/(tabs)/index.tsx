import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  FadeInDown,
  FadeInRight,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { LUXURY, SHADOWS } from "@/constants/theme";
import {
  DEFAULT_MISSIONS,
  getRank,
  getStreakDays,
  getTotalXp,
  getWeeklySummary,
  randomStoicQuote,
  readAllProgress,
  readSessions,
  type WarriorProfile,
} from "@/lib/forge-storage";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [profile, setProfile] = useState<WarriorProfile | null>(null);
  const [streakDays, setStreakDays] = useState(0);
  const [xp, setXp] = useState(0);
  const [weekly, setWeekly] = useState<Awaited<ReturnType<typeof getWeeklySummary>>>({
    days: [],
    totalFocus: 0,
    totalMissionsWeek: 0,
    activeDays: 0,
  });
  const [todayMissions, setTodayMissions] = useState({ completed: 0, total: DEFAULT_MISSIONS.length });
  const [todayFocus, setTodayFocus] = useState(0);
  const [quote, setQuote] = useState("");
  const progress = useSharedValue(0);
  const streakGlow = useSharedValue(1);
  const pulse = useSharedValue(1);

  const rank = getRank(xp);

  const load = () =>
    Promise.all([
      AsyncStorage.getItem("vertice-profile"),
      readAllProgress(),
      readSessions(),
      getTotalXp(),
      getWeeklySummary(),
    ]).then(async ([profileRaw, progressByDay, sessions, totalXp, weeklySum]) => {
      if (profileRaw) setProfile(JSON.parse(profileRaw));
      const streak = getStreakDays(progressByDay);
      setStreakDays(streak);
      setXp(totalXp);
      setWeekly(weeklySum);
      const todayKey = new Date().toISOString().slice(0, 10);
      const todayProgress = progressByDay[todayKey];
      setTodayMissions({
        completed: todayProgress?.completedIds.length ?? 0,
        total: todayProgress?.missionIds.length ?? DEFAULT_MISSIONS.length,
      });
      setTodayFocus(
        sessions
          .filter((s) => new Date(s.date).toISOString().slice(0, 10) === todayKey)
          .reduce((t, s) => t + s.minutes, 0),
      );
      setQuote(randomStoicQuote(profileRaw ? JSON.parse(profileRaw).name : undefined));
    });

  useFocusEffect(() => {
    load();
  });

  useEffect(() => {
    const target = todayMissions.total
      ? todayMissions.completed / todayMissions.total
      : 0;
    progress.value = withTiming(target, { duration: 900, easing: Easing.out(Easing.cubic) });
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.04, { duration: 1400 }),
        withTiming(1, { duration: 1400 }),
      ),
      -1,
      true,
    );
    streakGlow.value = withSpring(streakDays > 0 ? 1.1 : 1, { damping: 10 });
  }, [todayMissions.completed, todayMissions.total, streakDays]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));
  const xpStyle = useAnimatedStyle(() => ({
    width: `${Math.min(100, rank.progress * 100)}%`,
  }));
  const streakGlowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: streakGlow.value }],
  }));
  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const weekdayLabels = ["L", "M", "X", "J", "V", "S", "D"];
  const maxFocus = Math.max(60, ...(weekly.days.map((d) => d.focusMinutes)), 1);

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 110 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          entering={FadeInDown.duration(500)}
          style={styles.header}
        >
          <View>
            <Text style={styles.eyebrow}>
              {new Intl.DateTimeFormat("es-ES", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })
                .format(new Date())
                .toUpperCase()}
            </Text>
            <Text style={styles.title}>
              {profile ? `Forjando a ${profile.name}` : "Bienvenido a VÉRTICE"}
            </Text>
          </View>
          <Animated.View style={[styles.avatar, pulseStyle]}>
            <Text style={styles.avatarText}>{rank.current.icon}</Text>
          </Animated.View>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(80).duration(550)}
          style={[styles.mantraCard]}
        >
          <Text style={styles.mantraLabel}>MANTRÁ DEL DÍA</Text>
          <Text style={styles.mantraText}>
            {profile?.mantra ?? "Cada minuto cuenta, cada acción forja."}
          </Text>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(140).duration(600)}
          style={[styles.forgeCard, SHADOWS.card]}
        >
          <View style={styles.forgeTopline}>
            <Animated.View style={[streakGlowStyle, styles.streakBadge]}>
              <Text style={styles.streakFlame}>🔥</Text>
              <Text style={styles.streakText}>{streakDays} DÍAS</Text>
            </Animated.View>
            <View style={styles.rankChip}>
              <Text style={styles.rankIcon}>{rank.current.icon}</Text>
              <Text style={styles.rankLabel}>{rank.current.title}</Text>
            </View>
          </View>
          <Text style={styles.forgeTitle}>La Forja está encendida</Text>
          <Text style={styles.forgeSubtitle}>
            {todayMissions.completed >= todayMissions.total
              ? "Racha asegurada. Ahora da un paso más por ti mismo."
              : todayFocus >= 45
                ? "La mente ya está caliente. Completa tus misiones."
                : "La disciplina no se negocia. Empieza el enfoque profundo."}
          </Text>
          <View style={styles.focusRow}>
            <View style={styles.focusStat}>
              <Text style={styles.focusValue}>{todayFocus}</Text>
              <Text style={styles.focusUnit}>min de enfoque</Text>
            </View>
            <View style={styles.focusDivider} />
            <View style={styles.focusStat}>
              <Text style={styles.focusValue}>
                {todayMissions.completed}/{todayMissions.total}
              </Text>
              <Text style={styles.focusUnit}>misiones</Text>
            </View>
            <View style={styles.focusDivider} />
            <View style={styles.focusStat}>
              <Text style={styles.focusValue}>{xp}</Text>
              <Text style={styles.focusUnit}>XP acumulada</Text>
            </View>
          </View>
          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressFill, progressStyle]} />
          </View>
          <Pressable
            style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
            onPress={() => router.push("/focus")}
          >
            <Text style={styles.primaryButtonText}>EMPEZAR ENFOQUE PROFUNDO</Text>
            <Text style={styles.buttonArrow}>→</Text>
          </Pressable>
        </Animated.View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Consistencia semanal</Text>
          <Pressable onPress={() => router.push("/missions")}>
            <Text style={styles.sectionLink}>Ver misiones</Text>
          </Pressable>
        </View>

        <Animated.View
          entering={FadeInRight.delay(220).duration(500)}
          style={[styles.chartCard]}
        >
          <View style={styles.chartSummary}>
            <Text style={styles.chartValue}>{weekly.activeDays} · 7</Text>
            <Text style={styles.chartHint}>días activos · {weekly.totalFocus} min</Text>
            <View style={[styles.streakPill, streakDays > 2 && styles.streakPillHot]}>
              <Text style={[styles.streakPillText, streakDays > 2 && styles.streakPillTextHot]}>
                {streakDays > 2 ? `${streakDays} días racha` : streakDays > 0 ? "En marcha" : "Empieza hoy"}
              </Text>
            </View>
          </View>
          <View style={styles.chartBars}>
            {weekdayLabels.map((label, index) => {
              const day = weekly.days[index];
              const height = day
                ? Math.max(12, (day.focusMinutes / maxFocus) * 86)
                : 10;
              const active = day?.active;
              const missionsFill = day?.missionsTotal
                ? (day.missionsCompleted / day.missionsTotal) * height
                : 0;
              return (
                <Animated.View
                  key={label}
                  entering={FadeInDown.delay(260 + index * 70).duration(450)}
                  style={styles.barColumn}
                >
                  <View style={styles.barStack}>
                    <View
                      style={[
                        styles.bar,
                        {
                          height,
                          backgroundColor: active ? `${LUXURY.neon}30` : LUXURY.charcoal,
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.barFill,
                          {
                            height: Math.min(height, missionsFill),
                            backgroundColor: active ? LUXURY.gold : LUXURY.slate,
                          },
                        ]}
                      />
                    </View>
                  </View>
                  <Text style={[styles.barLabel, active && styles.barLabelActive]}>{label}</Text>
                </Animated.View>
              );
            })}
          </View>
        </Animated.View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Progreso de rango</Text>
          <Text style={styles.sectionLink}>
            Siguiente · {rank.next ? rank.next.title : "Cima alcanzada"}
          </Text>
        </View>

        <Animated.View
          entering={FadeInDown.delay(340).duration(500)}
          style={[styles.rankCard]}
        >
          <View style={styles.rankHeader}>
            <View>
              <Text style={styles.rankEyebrow}>RANGO ACTUAL</Text>
              <Text style={styles.rankTitle}>
                {rank.current.title}
              </Text>
            </View>
            <Text style={styles.xpValue}>{xp} XP</Text>
          </View>
          <View style={styles.xpTrack}>
            <Animated.View style={[styles.xpFill, xpStyle]} />
          </View>
          <Text style={styles.rankHint}>
            {rank.next
              ? `${xp - rank.current.xp} / ${rank.next.xp - rank.current.xp} XP hacia ${rank.next.title}`
              : "Has alcanzado la cima. Mantente ahí."}
          </Text>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(420).duration(550)}
          style={[styles.stoicCard]}
        >
          <Text style={styles.stoicEyebrow}>FRASE ESTOICA</Text>
          <Text style={styles.stoicQuote}>{quote}</Text>
        </Animated.View>

        <View style={styles.quickGrid}>
          {[
            { label: "Respiración 4·7·8", color: LUXURY.teal, route: "/breathing", icon: "◯" },
            { label: "Misiones hoy", color: LUXURY.gold, route: "/missions", icon: "✦" },
            { label: "El Espejo", color: LUXURY.neon, route: "/vault", icon: "⟐" },
          ].map((item, index) => (
            <Animated.View
              key={item.label}
              entering={FadeInRight.delay(480 + index * 80).duration(450)}
            >
              <Pressable
                style={({ pressed }) => [
                  styles.quickCard,
                  { borderColor: `${item.color}44` },
                  pressed && styles.pressed,
                ]}
                onPress={() => router.push(item.route as any)}
              >
                <View style={[styles.quickIcon, { backgroundColor: `${item.color}22` }]}>
                  <Text style={[styles.quickIconText, { color: item.color }]}>{item.icon}</Text>
                </View>
                <Text style={styles.quickLabel}>{item.label}</Text>
              </Pressable>
            </Animated.View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: LUXURY.ink },
  content: {
    paddingHorizontal: 20,
    maxWidth: 800,
    width: "100%",
    alignSelf: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.4,
    color: LUXURY.ash,
    marginBottom: 6,
    textTransform: "uppercase",
  },
  title: { fontSize: 30, lineHeight: 36, fontWeight: "800", color: LUXURY.snow },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: LUXURY.graphite,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: `${LUXURY.gold}44`,
  },
  avatarText: { color: LUXURY.goldSoft, fontSize: 18 },
  mantraCard: {
    backgroundColor: LUXURY.graphite,
    borderRadius: 18,
    padding: 18,
    marginBottom: 22,
    borderWidth: 1,
    borderColor: `${LUXURY.gold}1A`,
  },
  mantraLabel: {
    color: LUXURY.gold,
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: "800",
    marginBottom: 8,
  },
  mantraText: {
    color: LUXURY.snow,
    fontSize: 16,
    lineHeight: 23,
    fontWeight: "600",
  },
  forgeCard: {
    backgroundColor: LUXURY.graphite,
    borderRadius: 28,
    padding: 24,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: `${LUXURY.gold}22`,
  },
  forgeTopline: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: LUXURY.charcoal,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: `${LUXURY.blood}44`,
  },
  streakFlame: { fontSize: 12 },
  streakText: {
    color: LUXURY.goldSoft,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
  },
  rankChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: `${LUXURY.neon}18`,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: `${LUXURY.neon}30`,
  },
  rankIcon: { color: LUXURY.neonSoft, fontSize: 14 },
  rankLabel: { color: LUXURY.neonSoft, fontSize: 11, fontWeight: "700" },
  forgeTitle: {
    color: LUXURY.snow,
    fontSize: 26,
    lineHeight: 32,
    fontWeight: "800",
  },
  forgeSubtitle: {
    color: LUXURY.mist,
    marginTop: 6,
    fontSize: 13,
    lineHeight: 19,
  },
  focusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 22,
    marginBottom: 18,
  },
  focusStat: { flex: 1, alignItems: "center" },
  focusValue: {
    color: LUXURY.snow,
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 2,
  },
  focusUnit: {
    color: LUXURY.ash,
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.4,
  },
  focusDivider: {
    width: 1,
    height: 28,
    backgroundColor: LUXURY.charcoal,
  },
  progressTrack: {
    height: 6,
    backgroundColor: LUXURY.charcoal,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: LUXURY.gold,
    borderRadius: 4,
  },
  primaryButton: {
    backgroundColor: LUXURY.gold,
    borderRadius: 16,
    minHeight: 52,
    paddingHorizontal: 18,
    marginTop: 22,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  primaryButtonText: {
    color: LUXURY.ink,
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  buttonArrow: { color: LUXURY.ink, fontSize: 18, fontWeight: "800" },
  pressed: { opacity: 0.82, transform: [{ scale: 0.985 }] },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: LUXURY.snow,
    letterSpacing: 0.3,
  },
  sectionLink: {
    fontSize: 12,
    fontWeight: "700",
    color: LUXURY.gold,
    letterSpacing: 0.5,
  },
  chartCard: {
    backgroundColor: LUXURY.graphite,
    borderRadius: 22,
    padding: 20,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: LUXURY.charcoal,
  },
  chartSummary: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
    marginBottom: 16,
  },
  chartValue: {
    fontSize: 26,
    fontWeight: "800",
    color: LUXURY.snow,
    letterSpacing: 0.5,
  },
  chartHint: { fontSize: 13, color: LUXURY.mist },
  streakPill: {
    backgroundColor: LUXURY.charcoal,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginLeft: "auto",
  },
  streakPillHot: {
    backgroundColor: `${LUXURY.gold}22`,
    borderWidth: 1,
    borderColor: `${LUXURY.gold}44`,
  },
  streakPillText: { color: LUXURY.mist, fontSize: 11, fontWeight: "700" },
  streakPillTextHot: { color: LUXURY.goldSoft },
  chartBars: {
    height: 120,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingTop: 20,
    gap: 4,
  },
  barColumn: {
    alignItems: "center",
    justifyContent: "flex-end",
    flex: 1,
  },
  barStack: {
    height: 86,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  bar: {
    width: 22,
    borderRadius: 12,
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  barFill: {
    width: "100%",
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  barLabel: {
    color: LUXURY.ash,
    fontSize: 11,
    marginTop: 8,
    fontWeight: "600",
  },
  barLabelActive: { color: LUXURY.goldSoft, fontWeight: "700" },
  rankCard: {
    backgroundColor: LUXURY.graphite,
    borderRadius: 22,
    padding: 20,
    marginBottom: 22,
    borderWidth: 1,
    borderColor: `${LUXURY.neon}22`,
  },
  rankHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rankEyebrow: {
    color: LUXURY.neonSoft,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  rankTitle: {
    color: LUXURY.snow,
    fontSize: 24,
    fontWeight: "800",
    marginTop: 4,
  },
  xpValue: { color: LUXURY.snow, fontSize: 16, fontWeight: "800" },
  xpTrack: {
    height: 7,
    backgroundColor: LUXURY.charcoal,
    borderRadius: 4,
    overflow: "hidden",
    marginTop: 18,
  },
  xpFill: {
    height: "100%",
    backgroundColor: LUXURY.neon,
    borderRadius: 4,
  },
  rankHint: {
    color: LUXURY.mist,
    fontSize: 12,
    marginTop: 12,
    fontWeight: "600",
  },
  stoicCard: {
    backgroundColor: LUXURY.obsidian,
    borderRadius: 22,
    padding: 22,
    marginBottom: 22,
    borderWidth: 1,
    borderColor: `${LUXURY.violet}22`,
  },
  stoicEyebrow: {
    color: LUXURY.violet,
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: "800",
    marginBottom: 12,
  },
  stoicQuote: {
    color: LUXURY.pearl,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "600",
  },
  quickGrid: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  quickCard: {
    flex: 1,
    backgroundColor: LUXURY.graphite,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
  },
  quickIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  quickIconText: { fontSize: 16, fontWeight: "800" },
  quickLabel: {
    color: LUXURY.snow,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 16,
  },
});

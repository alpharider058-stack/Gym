import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, {
  FadeInDown,
  FadeInRight,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { LUXURY } from "@/constants/theme";
import {
  DEFAULT_MISSIONS,
  STOIC_QUOTES,
  getAchievements,
  getRank,
  getStreakDays,
  getTotalXp,
  getVictories,
  getWeeklySummary,
  readAllProgress,
  RANKS,
  type VictoryCard,
  type WarriorProfile,
} from "@/lib/forge-storage";

const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

export default function VaultScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [profile, setProfile] = useState<WarriorProfile | null>(null);
  const [xp, setXp] = useState(0);
  const [streakDays, setStreakDays] = useState(0);
  const [victories, setVictories] = useState<VictoryCard[]>([]);
  const [activeTab, setActiveTab] = useState<"ranks" | "achievements" | "victories" | "stats">("ranks");
  const [monthFocus, setMonthFocus] = useState<number[]>(Array(30).fill(0));
  const [totalMissions, setTotalMissions] = useState(0);
  const [totalFocusMinutes, setTotalFocusMinutes] = useState(0);
  const [weeksTrained, setWeeksTrained] = useState(0);

  const rank = getRank(xp);
  const achievements = getAchievements(xp, streakDays, totalFocusMinutes, totalMissions);
  const unlocked = achievements.filter((a) => a.unlocked).length;

  const load = async () => {
    const profileRaw = await AsyncStorage.getItem("vertice-profile");
    if (profileRaw) setProfile(JSON.parse(profileRaw));
    const [progressByDay, totalXp, victoriesList, weekly] = await Promise.all([
      readAllProgress(),
      getTotalXp(),
      getVictories(),
      getWeeklySummary(),
    ]);
    setXp(totalXp);
    setVictories(victoriesList);
    setStreakDays(getStreakDays(progressByDay));
    const totalM = Object.values(progressByDay).reduce(
      (sum, day) => sum + day.completedIds.length,
      0,
    );
    setTotalMissions(totalM);

    const daysArr = Array.from({ length: 30 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (29 - i));
      const key = d.toISOString().slice(0, 10);
      const day = progressByDay[key];
      return day ? day.completedIds.length + (day.focusMinutes / 15) : 0;
    });
    setMonthFocus(daysArr);

    const { totalFocus, activeDays } = await getWeeklySummary();
    setTotalFocusMinutes(totalFocus * Math.ceil(streakDays / 7) || totalFocus + (streakDays * 40));
    setWeeksTrained(Math.max(1, Math.ceil(streakDays / 7)));
  };

  useFocusEffect(() => {
    load();
  });

  const tabScale = useSharedValue(1);
  const tabStyle = useAnimatedStyle(() => ({
    transform: [{ scale: tabScale.value }],
  }));

  const monthMax = Math.max(...monthFocus, 1);
  const today = new Date();

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 110,
          paddingHorizontal: 20,
          maxWidth: 800,
          alignSelf: "center",
          width: "100%",
        }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          entering={FadeInDown.duration(500)}
          style={styles.header}
        >
          <View>
            <Text style={styles.eyebrow}>EL ESPEJO DE LOGROS</Text>
            <Text style={styles.title}>
              {profile ? `${profile.name}` : "Guerrero"}
            </Text>
            <Text style={styles.subtitle}>{rank.current.title}</Text>
          </View>
          <View style={[styles.emblem]}>
            <Text style={styles.emblemIcon}>{rank.current.icon}</Text>
          </View>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(80).duration(500)}
          style={[styles.summaryCard]}
        >
          <View style={styles.summaryGrid}>
            {[
              { label: "Nivel actual", value: `Nº ${rank.current.level}`, color: LUXURY.gold },
              { label: "Racha", value: `${streakDays} d`, color: LUXURY.blood },
              { label: "XP total", value: `${xp}`, color: LUXURY.neon },
              { label: "Logros", value: `${unlocked}/${achievements.length}`, color: LUXURY.emerald },
            ].map((m, i) => (
              <Animated.View
                key={m.label}
                entering={FadeInRight.delay(160 + i * 70).duration(420)}
                style={[styles.summaryPill, { borderColor: `${m.color}33` }]}
              >
                <Text style={[styles.summaryValue, { color: m.color }]}>{m.value}</Text>
                <Text style={styles.summaryLabel}>{m.label}</Text>
              </Animated.View>
            ))}
          </View>
          <View style={styles.quoteRow}>
            <Text style={styles.quoteText}>
              “{profile?.mantra ?? STOIC_QUOTES[Math.floor(Math.random() * STOIC_QUOTES.length)]}”
            </Text>
          </View>
        </Animated.View>

        <View style={styles.tabRow}>
          {([
            { key: "ranks", label: "Rangos" },
            { key: "achievements", label: "Logros" },
            { key: "victories", label: "Victorias" },
            { key: "stats", label: "Estadísticas" },
          ] as const).map((t) => {
            const active = activeTab === t.key;
            return (
              <Pressable
                key={t.key}
                style={[styles.tab, active && styles.tabActive]}
                onPress={() => {
                  tabScale.value = withSpring(1.02, { damping: 14 });
                  setTimeout(() => {
                    tabScale.value = withSpring(1, { damping: 14 });
                  }, 120);
                  setActiveTab(t.key);
                }}
              >
                <Animated.Text style={[styles.tabText, active && styles.tabTextActive]}>
                  {t.label}
                </Animated.Text>
              </Pressable>
            );
          })}
        </View>

        {activeTab === "ranks" && (
          <Animated.View
            entering={FadeInRight.duration(400)}
            style={styles.section}
          >
            {RANKS.map((r, i) => {
              const unlocked = xp >= r.xp;
              const isCurrent = rank.current.level === r.level;
              return (
                <Animated.View
                  key={r.level}
                  entering={FadeInDown.delay(i * 60).duration(380)}
                  style={[
                    styles.rankRow,
                    unlocked && styles.rankRowUnlocked,
                    isCurrent && styles.rankRowCurrent,
                  ]}
                >
                  <Text style={[styles.rankIcon, unlocked && styles.rankIconUnlocked]}>
                    {r.icon}
                  </Text>
                  <View style={{ flex: 1, marginLeft: 14 }}>
                    <Text style={[styles.rankTitle, unlocked && styles.rankTitleUnlocked]}>
                      {r.title}
                    </Text>
                    <Text style={styles.rankXp}>
                      {r.xp} XP requeridos · Nivel {r.level}
                    </Text>
                  </View>
                  <View style={[styles.rankBadge, unlocked && styles.rankBadgeUnlocked]}>
                    <Text style={[styles.rankBadgeText, unlocked && styles.rankBadgeTextUnlocked]}>
                      {unlocked ? "ALCANZADO" : isCurrent ? "ACTUAL" : "BLOQUEADO"}
                    </Text>
                  </View>
                </Animated.View>
              );
            })}
          </Animated.View>
        )}

        {activeTab === "achievements" && (
          <Animated.View
            entering={FadeInRight.duration(400)}
            style={[styles.section, styles.achievementsGrid]}
          >
            {achievements.map((a, i) => (
              <Animated.View
                key={a.id}
                entering={FadeInDown.delay(i * 70).duration(380)}
                style={[styles.achievementCard, !a.unlocked && styles.achievementLocked]}
              >
                <View style={[
                  styles.achievementIcon,
                  { borderColor: a.unlocked ? `${LUXURY.gold}55` : LUXURY.charcoal },
                ]}>
                  <Text style={[styles.achievementIconText, a.unlocked && styles.achievementIconTextActive]}>
                    {a.icon}
                  </Text>
                </View>
                <Text style={[styles.achievementTitle, !a.unlocked && { color: LUXURY.ash }]}>
                  {a.title}
                </Text>
                <Text style={[styles.achievementDesc, !a.unlocked && { color: LUXURY.stone }]}>
                  {a.description}
                </Text>
                <View style={[styles.achievementTier, a.unlocked && styles.achievementTierUnlocked]}>
                  <Text style={[styles.achievementTierText, a.unlocked && styles.achievementTierTextUnlocked]}>
                    TIER {a.tier}
                  </Text>
                </View>
              </Animated.View>
            ))}
          </Animated.View>
        )}

        {activeTab === "victories" && (
          <Animated.View
            entering={FadeInRight.duration(400)}
            style={styles.section}
          >
            {victories.length ? (
              victories.slice(0, 10).map((v, i) => (
                <Animated.View
                  key={v.id}
                  entering={FadeInDown.delay(i * 60).duration(380)}
                  style={styles.victoryCard}
                >
                  <View style={styles.victoryIcon}>
                    <Text style={styles.victoryIconText}>{v.icon}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 14 }}>
                    <Text style={styles.victoryTitle}>{v.title}</Text>
                    <Text style={styles.victoryDesc}>{v.description}</Text>
                    <Text style={styles.victoryDate}>
                      {new Date(v.date).toLocaleDateString("es-ES", {
                        weekday: "long",
                        day: "numeric",
                        month: "short",
                      })}
                    </Text>
                  </View>
                  <View style={styles.victoryChip}>
                    <Text style={styles.victoryValue}>{v.value}</Text>
                  </View>
                </Animated.View>
              ))
            ) : (
              <View style={styles.emptyVictories}>
                <Text style={styles.emptyVictoriesIcon}>★</Text>
                <Text style={styles.emptyVictoriesTitle}>Aún sin victorias selladas</Text>
                <Text style={styles.emptyVictoriesHint}>
                  Consigue tu primera racha de 3 días para ver tu tarjeta de victoria aquí.
                </Text>
              </View>
            )}
          </Animated.View>
        )}

        {activeTab === "stats" && (
          <Animated.View
            entering={FadeInRight.duration(400)}
            style={styles.section}
          >
            <View style={styles.statsGrid}>
              {[
                { label: "Misiones completadas", value: `${totalMissions}` },
                { label: "Minutos de enfoque", value: `${totalFocusMinutes}` },
                { label: "Días racha", value: `${streakDays}` },
                { label: "Semanas forjadas", value: `${weeksTrained}` },
                { label: "Rango actual", value: rank.current.title },
                { label: "Siguiente rango", value: rank.next?.title ?? "Cima" },
              ].map((s, i) => (
                <Animated.View
                  key={s.label}
                  entering={FadeInRight.delay(140 + i * 60).duration(360)}
                  style={styles.statBox}
                >
                  <Text style={styles.statValue}>{s.value}</Text>
                  <Text style={styles.statLabel}>{s.label}</Text>
                </Animated.View>
              ))}
            </View>

            <Text style={styles.heatmapLabel}>
              Consistencia últimos 30 días · {MONTHS[today.getMonth()]}
            </Text>
            <View style={styles.heatmap}>
              {monthFocus.map((v, i) => {
                const intensity = Math.min(1, v / monthMax);
                const bg =
                  intensity === 0
                    ? LUXURY.charcoal
                    : intensity < 0.34
                      ? `${LUXURY.neon}33`
                      : intensity < 0.67
                        ? `${LUXURY.gold}88`
                        : LUXURY.gold;
                return <View key={i} style={[styles.heatCell, { backgroundColor: bg }]} />;
              })}
            </View>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: LUXURY.ink },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  eyebrow: {
    color: LUXURY.ash,
    fontSize: 11,
    letterSpacing: 1.6,
    fontWeight: "800",
    marginBottom: 6,
  },
  title: {
    color: LUXURY.snow,
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: 0.3,
  },
  subtitle: {
    color: LUXURY.goldSoft,
    fontSize: 15,
    fontWeight: "700",
    marginTop: 4,
    letterSpacing: 0.4,
  },
  emblem: {
    width: 68,
    height: 68,
    borderRadius: 24,
    backgroundColor: LUXURY.graphite,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: `${LUXURY.gold}55`,
    shadowColor: LUXURY.gold,
    shadowOpacity: 0.3,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
  },
  emblemIcon: {
    color: LUXURY.goldSoft,
    fontSize: 28,
  },
  summaryCard: {
    backgroundColor: LUXURY.graphite,
    borderRadius: 24,
    padding: 20,
    marginBottom: 22,
    borderWidth: 1,
    borderColor: `${LUXURY.gold}22`,
  },
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 18,
  },
  summaryPill: {
    flex: 1,
    minWidth: "46%",
    backgroundColor: LUXURY.obsidian,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: "900",
  },
  summaryLabel: {
    color: LUXURY.ash,
    fontSize: 11,
    marginTop: 4,
    fontWeight: "600",
  },
  quoteRow: {
    backgroundColor: LUXURY.obsidian,
    borderRadius: 14,
    padding: 14,
  },
  quoteText: {
    color: LUXURY.pearl,
    fontSize: 13,
    lineHeight: 19,
    fontStyle: "italic",
    fontWeight: "500",
  },
  tabRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 18,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: LUXURY.graphite,
    borderRadius: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "transparent",
  },
  tabActive: {
    backgroundColor: `${LUXURY.gold}22`,
    borderColor: `${LUXURY.gold}55`,
  },
  tabText: {
    color: LUXURY.ash,
    fontSize: 12,
    fontWeight: "700",
  },
  tabTextActive: {
    color: LUXURY.goldSoft,
    fontWeight: "800",
  },
  section: { gap: 10 },
  rankRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: LUXURY.graphite,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: LUXURY.charcoal,
    opacity: 0.6,
  },
  rankRowUnlocked: { opacity: 1 },
  rankRowCurrent: {
    borderColor: `${LUXURY.gold}55`,
    backgroundColor: `${LUXURY.gold}11`,
  },
  rankIcon: { fontSize: 22, color: LUXURY.stone, fontWeight: "800" },
  rankIconUnlocked: { color: LUXURY.goldSoft },
  rankTitle: {
    color: LUXURY.ash,
    fontSize: 15,
    fontWeight: "800",
  },
  rankTitleUnlocked: { color: LUXURY.snow },
  rankXp: { color: LUXURY.ash, fontSize: 11, marginTop: 3, fontWeight: "500" },
  rankBadge: {
    backgroundColor: LUXURY.charcoal,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  rankBadgeUnlocked: { backgroundColor: `${LUXURY.gold}22` },
  rankBadgeText: { color: LUXURY.ash, fontSize: 10, fontWeight: "800", letterSpacing: 0.8 },
  rankBadgeTextUnlocked: { color: LUXURY.goldSoft },
  achievementsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  achievementCard: {
    width: "48%",
    backgroundColor: LUXURY.graphite,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: `${LUXURY.gold}22`,
  },
  achievementLocked: {
    borderColor: LUXURY.charcoal,
    opacity: 0.72,
  },
  achievementIcon: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: LUXURY.obsidian,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    borderWidth: 1,
  },
  achievementIconText: {
    color: LUXURY.ash,
    fontSize: 20,
    fontWeight: "900",
  },
  achievementIconTextActive: { color: LUXURY.goldSoft },
  achievementTitle: {
    color: LUXURY.snow,
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 18,
    marginBottom: 4,
  },
  achievementDesc: {
    color: LUXURY.mist,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "500",
    marginBottom: 12,
  },
  achievementTier: {
    backgroundColor: LUXURY.charcoal,
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  achievementTierUnlocked: { backgroundColor: `${LUXURY.gold}22` },
  achievementTierText: { color: LUXURY.ash, fontSize: 9, fontWeight: "800", letterSpacing: 0.8 },
  achievementTierTextUnlocked: { color: LUXURY.goldSoft },
  victoryCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: LUXURY.graphite,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: `${LUXURY.gold}22`,
  },
  victoryIcon: {
    width: 50,
    height: 50,
    borderRadius: 18,
    backgroundColor: `${LUXURY.gold}22`,
    alignItems: "center",
    justifyContent: "center",
  },
  victoryIconText: { color: LUXURY.goldSoft, fontSize: 22, fontWeight: "900" },
  victoryTitle: {
    color: LUXURY.snow,
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 3,
  },
  victoryDesc: {
    color: LUXURY.mist,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "500",
    marginBottom: 6,
  },
  victoryDate: { color: LUXURY.ash, fontSize: 10, fontWeight: "600" },
  victoryChip: {
    backgroundColor: LUXURY.obsidian,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  victoryValue: {
    color: LUXURY.goldSoft,
    fontSize: 14,
    fontWeight: "900",
  },
  emptyVictories: {
    backgroundColor: LUXURY.graphite,
    borderRadius: 22,
    padding: 24,
    alignItems: "center",
  },
  emptyVictoriesIcon: { color: LUXURY.ash, fontSize: 28, marginBottom: 12 },
  emptyVictoriesTitle: {
    color: LUXURY.snow,
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 6,
  },
  emptyVictoriesHint: {
    color: LUXURY.ash,
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 22,
  },
  statBox: {
    width: "48%",
    backgroundColor: LUXURY.graphite,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: LUXURY.charcoal,
  },
  statValue: {
    color: LUXURY.snow,
    fontSize: 20,
    fontWeight: "900",
    marginBottom: 4,
  },
  statLabel: {
    color: LUXURY.ash,
    fontSize: 11,
    fontWeight: "600",
    lineHeight: 14,
  },
  heatmapLabel: {
    color: LUXURY.mist,
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 12,
  },
  heatmap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  heatCell: {
    width: `${(100 - 22) / 7}%`,
    aspectRatio: 1,
    borderRadius: 6,
    minWidth: 32,
    height: 32,
  },
});

import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
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
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { LUXURY } from "@/constants/theme";
import { VictoryCapture } from "@/components/victory-capture";
import {
  DEFAULT_MISSIONS,
  getDateKey,
  getMissions,
  getWeeklySummary,
  readAllProgress,
  saveMissions,
  toggleMission,
  type Mission,
} from "@/lib/forge-storage";

const CATEGORY_META = {
  discipline: { label: "Disciplina", color: LUXURY.gold, icon: "◎" },
  mindset: { label: "Mentalidad", color: LUXURY.violet, icon: "◇" },
  physical: { label: "Físico", color: LUXURY.emerald, icon: "◆" },
  mastery: { label: "Maestría", color: LUXURY.neon, icon: "✦" },
};

export default function MissionsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [missions, setMissions] = useState<Mission[]>(DEFAULT_MISSIONS);
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [weekly, setWeekly] = useState<{
    days: {
      date: string;
      missionsCompleted: number;
      missionsTotal: number;
      focusMinutes: number;
      active: boolean;
    }[];
    totalFocus: number;
    totalMissionsWeek: number;
    activeDays: number;
  }>({
    days: [],
    totalFocus: 0,
    totalMissionsWeek: 0,
    activeDays: 0,
  });
  const [newMission, setNewMission] = useState("");
  const [addingCategory, setAddingCategory] =
    useState<Mission["category"]>("mindset");
  const [addingDifficulty, setAddingDifficulty] =
    useState<Mission["difficulty"]>(1);
  const [victoryPrompt, setVictoryPrompt] = useState<{ missionId: string; action: string } | null>(null);
  const progress = useSharedValue(0);

  const nonNegotiableCount = missions.filter((m) => m.nonNegotiable).length;
  const nonNegotiableDone = missions.filter(
    (m) => m.nonNegotiable && completedIds.includes(m.id),
  ).length;

  const grouped = useMemo(() => {
    const entries = Object.entries(CATEGORY_META) as [
      Mission["category"],
      typeof CATEGORY_META.discipline,
    ][];
    return entries.map(([key, meta]) => ({
      key,
      meta,
      items: missions.filter((m) => m.category === key),
    }));
  }, [missions]);

  const load = useCallback(async () => {
    const [all, byDay, summary] = await Promise.all([
      getMissions(),
      readAllProgress(),
      getWeeklySummary(),
    ]);
    setMissions(all);
    setCompletedIds(byDay[getDateKey()]?.completedIds ?? []);
    setWeekly(summary);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const target = missions.length
    ? completedIds.filter(
        (id) => missions.find((m) => m.id === id)?.nonNegotiable,
      ).length / Math.max(1, nonNegotiableCount)
    : 0;
  progress.value = withTiming(target, {
    duration: 800,
    easing: Easing.out(Easing.cubic),
  });

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  const onToggle = async (id: string) => {
    const result = await toggleMission(id);
    setCompletedIds((prev) =>
      result.completed
        ? [...new Set([...prev, id])]
        : prev.filter((x) => x !== id),
    );
    if (result.completed) {
      const mission = missions.find((item) => item.id === id);
      setVictoryPrompt({
        missionId: id,
        action: mission ? `He completado: ${mission.text}` : "He completado una misión.",
      });
    } else {
      setVictoryPrompt((current) => current?.missionId === id ? null : current);
    }
  };

  const addCustomMission = async () => {
    const text = newMission.trim();
    if (!text) return;
    const next: Mission = {
      id: `custom_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      text,
      category: addingCategory,
      difficulty: addingDifficulty,
      xp: addingDifficulty * 15,
      nonNegotiable: false,
    };
    const list = [...missions, next];
    setMissions(list);
    setNewMission("");
    await saveMissions(list);
  };

  const allDone =
    nonNegotiableCount > 0 && nonNegotiableDone === nonNegotiableCount;

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
            <Text style={styles.eyebrow}>MISIONES INNEGOCIABLES</Text>
            <Text style={styles.title}>Cada acción cuenta.</Text>
          </View>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.closeChip,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.closeChipText}>Cerrar</Text>
          </Pressable>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(80).duration(500)}
          style={[styles.heroCard, allDone && styles.heroCardDone]}
        >
          <View style={styles.heroTop}>
            <View style={styles.badge}>
              <Text style={styles.badgeIcon}>{allDone ? "✓" : "◎"}</Text>
              <Text style={[styles.badgeText, allDone && styles.badgeTextDone]}>
                {allDone ? "DÍA SELLADO" : "INNEGOCIABLES"}
              </Text>
            </View>
            <Text style={styles.heroCount}>
              {nonNegotiableDone}/{nonNegotiableCount}
            </Text>
          </View>
          <Text style={styles.heroTitle}>
            {allDone
              ? "Cumpliste lo que no se negocia. Eso es disciplina."
              : "Todavía queda trabajo por hacer. Ninguna excusa."}
          </Text>
          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressFill, progressStyle]} />
          </View>
          <View style={styles.heroFooter}>
            <Text style={styles.heroWeekly}>
              {weekly.totalMissionsWeek} misiones esta semana
            </Text>
            <Text style={styles.heroActive}>
              {weekly.activeDays} días activos
            </Text>
          </View>
        </Animated.View>

        {victoryPrompt && (
          <View style={{ marginBottom: 20 }}>
            <VictoryCapture
              key={victoryPrompt.missionId}
              initialAction={victoryPrompt.action}
              onDismiss={() => setVictoryPrompt(null)}
            />
          </View>
        )}

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <Animated.View
            entering={FadeInDown.delay(160).duration(500)}
            style={styles.addCard}
          >
            <Text style={styles.addEyebrow}>+ AÑADE TU MISIÓN</Text>
            <TextInput
              value={newMission}
              onChangeText={setNewMission}
              placeholder="Escribe un reto personal…"
              placeholderTextColor={LUXURY.ash}
              selectionColor={LUXURY.gold}
              style={styles.input}
            />
            <View style={styles.addRow}>
              <View style={styles.chipGroup}>
                {Object.entries(CATEGORY_META).map(([key, meta]) => (
                  <Pressable
                    key={key}
                    style={[
                      styles.chip,
                      addingCategory === key && {
                        backgroundColor: `${meta.color}22`,
                        borderColor: `${meta.color}66`,
                      },
                    ]}
                    onPress={() =>
                      setAddingCategory(key as Mission["category"])
                    }
                  >
                    <Text style={[styles.chipIcon, { color: meta.color }]}>
                      {meta.icon}
                    </Text>
                    <Text
                      style={[
                        styles.chipText,
                        addingCategory === key && { color: meta.color },
                      ]}
                    >
                      {meta.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <View style={styles.chipGroup}>
                {[1, 2, 3].map((d) => (
                  <Pressable
                    key={d}
                    style={[
                      styles.chipSmall,
                      addingDifficulty === d && styles.chipSmallSelected,
                    ]}
                    onPress={() =>
                      setAddingDifficulty(d as Mission["difficulty"])
                    }
                  >
                    <Text style={styles.chipSmallText}>
                      {"●".repeat(d)} · {d * 15}XP
                    </Text>
                  </Pressable>
                ))}
              </View>
              <Pressable
                style={({ pressed }) => [
                  styles.addButton,
                  !newMission.trim() && styles.addButtonDisabled,
                  pressed && styles.pressed,
                ]}
                onPress={addCustomMission}
                disabled={!newMission.trim()}
              >
                <Text style={styles.addButtonText}>AÑADIR</Text>
              </Pressable>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Por categoría</Text>
          <Text style={styles.sectionHint}>
            {completedIds.length}/{missions.length} total
          </Text>
        </View>

        {grouped.map((group, gi) => (
          <View key={group.key} style={{ marginBottom: 22 }}>
            <View style={styles.categoryHead}>
              <View style={styles.categoryTitleRow}>
                <Text
                  style={[styles.categoryIcon, { color: group.meta.color }]}
                >
                  {group.meta.icon}
                </Text>
                <Text style={styles.categoryLabel}>{group.meta.label}</Text>
              </View>
              <Text style={styles.categoryCount}>
                {group.items.filter((m) => completedIds.includes(m.id)).length}/
                {group.items.length}
              </Text>
            </View>

            {group.items.length ? (
              group.items.map((mission, mi) => {
                const done = completedIds.includes(mission.id);
                const scale = useSharedValue(1);
                const pressedStyle = useAnimatedStyle(() => ({
                  transform: [{ scale: scale.value }],
                }));
                return (
                  <Animated.View
                    key={mission.id}
                    entering={FadeInRight.delay(
                      260 + gi * 60 + mi * 50,
                    ).duration(400)}
                    layout={LinearTransition.springify().damping(14)}
                  >
                    <Pressable
                      style={({ pressed }) => [
                        styles.missionCard,
                        done && styles.missionCardDone,
                        mission.nonNegotiable &&
                          styles.missionCardNonNegotiable,
                      ]}
                      onPressIn={() => {
                        scale.value = withSpring(0.97, { damping: 18 });
                      }}
                      onPressOut={() => {
                        scale.value = withSpring(1, { damping: 12 });
                      }}
                      onPress={() => onToggle(mission.id)}
                    >
                      <Animated.View style={pressedStyle}>
                        <View style={styles.missionRow}>
                          <View
                            style={[
                              styles.checkbox,
                              done && {
                                backgroundColor: group.meta.color,
                                borderColor: group.meta.color,
                              },
                            ]}
                          >
                            {done && <Text style={styles.checkmark}>✓</Text>}
                          </View>
                          <View style={{ flex: 1, marginLeft: 14 }}>
                            <Text
                              style={[
                                styles.missionText,
                                done && styles.missionTextDone,
                              ]}
                            >
                              {mission.text}
                            </Text>
                            <View style={styles.missionMeta}>
                              {mission.nonNegotiable && (
                                <View style={styles.nonNegotiableBadge}>
                                  <Text style={styles.nonNegotiableText}>
                                    INNEGOCIABLE
                                  </Text>
                                </View>
                              )}
                              <View style={styles.metaPill}>
                                <Text style={styles.metaPillText}>
                                  {"●".repeat(mission.difficulty)}
                                </Text>
                              </View>
                              <Text style={styles.xpPill}>
                                +{mission.xp} XP
                              </Text>
                            </View>
                          </View>
                        </View>
                      </Animated.View>
                    </Pressable>
                  </Animated.View>
                );
              })
            ) : (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>
                  Sin misiones en esta categoría.
                </Text>
                <Text style={styles.emptyHint}>
                  Crea una propia o completa otras.
                </Text>
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: LUXURY.ink },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  eyebrow: {
    color: LUXURY.ash,
    fontSize: 11,
    letterSpacing: 1.6,
    fontWeight: "800",
    marginBottom: 6,
    textTransform: "uppercase",
  },
  title: {
    color: LUXURY.snow,
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  closeChip: {
    backgroundColor: LUXURY.graphite,
    borderWidth: 1,
    borderColor: LUXURY.charcoal,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
  },
  closeChipText: { color: LUXURY.mist, fontSize: 12, fontWeight: "700" },
  heroCard: {
    backgroundColor: LUXURY.graphite,
    borderRadius: 24,
    padding: 22,
    marginBottom: 22,
    borderWidth: 1,
    borderColor: `${LUXURY.blood}33`,
  },
  heroCardDone: {
    borderColor: `${LUXURY.emerald}55`,
  },
  heroTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: LUXURY.charcoal,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  badgeIcon: { color: LUXURY.blood, fontSize: 12 },
  badgeText: {
    color: LUXURY.pearl,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
  },
  badgeTextDone: { color: LUXURY.emerald },
  heroCount: {
    color: LUXURY.snow,
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  heroTitle: {
    color: LUXURY.pearl,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "600",
  },
  progressTrack: {
    height: 6,
    backgroundColor: LUXURY.charcoal,
    borderRadius: 4,
    overflow: "hidden",
    marginTop: 18,
  },
  progressFill: {
    height: "100%",
    backgroundColor: LUXURY.emerald,
    borderRadius: 4,
  },
  heroFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 14,
  },
  heroWeekly: { color: LUXURY.ash, fontSize: 12, fontWeight: "600" },
  heroActive: { color: LUXURY.gold, fontSize: 12, fontWeight: "700" },
  addCard: {
    backgroundColor: LUXURY.graphite,
    borderRadius: 22,
    padding: 18,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: `${LUXURY.neon}22`,
  },
  addEyebrow: {
    color: LUXURY.neonSoft,
    fontSize: 10,
    letterSpacing: 1.6,
    fontWeight: "800",
    marginBottom: 12,
  },
  input: {
    height: 50,
    borderRadius: 14,
    backgroundColor: LUXURY.obsidian,
    paddingHorizontal: 16,
    color: LUXURY.snow,
    fontSize: 15,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: LUXURY.charcoal,
  },
  addRow: { gap: 12 },
  chipGroup: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: LUXURY.charcoal,
    borderWidth: 1,
    borderColor: "transparent",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
  },
  chipIcon: { fontSize: 11, fontWeight: "800" },
  chipText: { color: LUXURY.pearl, fontSize: 11, fontWeight: "700" },
  chipSmall: {
    backgroundColor: LUXURY.charcoal,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "transparent",
  },
  chipSmallSelected: {
    backgroundColor: `${LUXURY.gold}22`,
    borderColor: `${LUXURY.gold}55`,
  },
  chipSmallText: { color: LUXURY.goldSoft, fontSize: 11, fontWeight: "700" },
  addButton: {
    alignSelf: "flex-end",
    backgroundColor: LUXURY.neon,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 12,
  },
  addButtonDisabled: { opacity: 0.35 },
  addButtonText: {
    color: LUXURY.ink,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 12,
  },
  sectionTitle: { color: LUXURY.snow, fontSize: 20, fontWeight: "800" },
  sectionHint: { color: LUXURY.ash, fontSize: 12, fontWeight: "600" },
  categoryHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  categoryTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  categoryIcon: { fontSize: 14, fontWeight: "800" },
  categoryLabel: { color: LUXURY.snow, fontSize: 14, fontWeight: "700" },
  categoryCount: { color: LUXURY.ash, fontSize: 12, fontWeight: "600" },
  missionCard: {
    backgroundColor: LUXURY.graphite,
    borderRadius: 18,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: LUXURY.charcoal,
  },
  missionCardDone: {
    opacity: 0.72,
    borderColor: `${LUXURY.emerald}44`,
  },
  missionCardNonNegotiable: {
    borderColor: `${LUXURY.blood}55`,
  },
  missionRow: { flexDirection: "row", alignItems: "center" },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: LUXURY.stone,
    alignItems: "center",
    justifyContent: "center",
  },
  checkmark: { color: LUXURY.ink, fontSize: 13, fontWeight: "900" },
  missionText: {
    color: LUXURY.snow,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "600",
  },
  missionTextDone: {
    color: LUXURY.ash,
    textDecorationLine: "line-through",
  },
  missionMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
    flexWrap: "wrap",
  },
  nonNegotiableBadge: {
    backgroundColor: `${LUXURY.blood}22`,
    borderWidth: 1,
    borderColor: `${LUXURY.blood}44`,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  nonNegotiableText: {
    color: LUXURY.blood,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1,
  },
  metaPill: {
    backgroundColor: LUXURY.charcoal,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  metaPillText: { color: LUXURY.gold, fontSize: 9, letterSpacing: 1 },
  xpPill: {
    color: LUXURY.ash,
    fontSize: 11,
    fontWeight: "700",
  },
  emptyCard: {
    backgroundColor: LUXURY.obsidian,
    borderRadius: 16,
    padding: 16,
  },
  emptyText: { color: LUXURY.snow, fontSize: 14, fontWeight: "700" },
  emptyHint: { color: LUXURY.mist, fontSize: 12, marginTop: 4 },
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
});

import { useFocusEffect, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
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
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { LUXURY } from "@/constants/theme";
import {
  STOIC_QUOTES,
  randomStoicQuote,
  readAllProgress,
  saveDailyProgress,
  type DailyProgress,
} from "@/lib/forge-storage";

const DISCOMFORT_OPTIONS = [
  { value: 1, label: "Flojo", hint: "Me faltó exigirme." },
  { value: 2, label: "Templado", hint: "Empecé, pero fui blando." },
  { value: 3, label: "Resistente", hint: "Estuve ahí y aguanté." },
  { value: 4, label: "Forjado", hint: "Me hice daño en el buen sentido." },
  { value: 5, label: "Indomable", hint: "Llegué al límite y seguí." },
];

export default function ResilienceScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [todayProgress, setTodayProgress] = useState<DailyProgress | null>(
    null,
  );
  const [todayDiscomfort, setTodayDiscomfort] = useState<number | null>(null);
  const [journal, setJournal] = useState("");
  const [savedJournal, setSavedJournal] = useState(false);
  const [quote, setQuote] = useState("");
  const [avgDiscomfort, setAvgDiscomfort] = useState(0);
  const [weeklyStress, setWeeklyStress] = useState<
    { day: string; level: number }[]
  >([]);
  const breathe = useSharedValue(1);
  const pulse = useSharedValue(1);

  const breatheStyle = useAnimatedStyle(() => ({
    transform: [{ scale: breathe.value }],
  }));
  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  useEffect(() => {
    breathe.value = withRepeat(
      withSequence(
        withTiming(1.35, { duration: 4000, easing: Easing.inOut(Easing.sin) }),
        withTiming(1, { duration: 4000, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    );
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.06, { duration: 1600 }),
        withTiming(1, { duration: 1600 }),
      ),
      -1,
      true,
    );
  }, []);

  const load = async () => {
    const todayKey = new Date().toISOString().slice(0, 10);
    const byDay = await readAllProgress();
    const today = byDay[todayKey] ?? {
      date: todayKey,
      missionIds: [],
      completedIds: [],
      focusMinutes: 0,
      discomfortAvg: 0,
      journalEntry: "",
    };
    setTodayProgress(today);
    setTodayDiscomfort(today.discomfortAvg || null);
    setJournal(today.journalEntry ?? "");
    setSavedJournal(false);
    setQuote(randomStoicQuote());

    const week = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const key = d.toISOString().slice(0, 10);
      return {
        day: ["D", "L", "M", "X", "J", "V", "S"][d.getDay()],
        level: byDay[key]?.discomfortAvg ?? 0,
      };
    });
    setWeeklyStress(week);

    const values = week.map((w) => w.level).filter(Boolean);
    setAvgDiscomfort(
      values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0,
    );
  };

  useFocusEffect(() => {
    load();
  });

  const saveDiscomfort = async (level: number) => {
    setTodayDiscomfort(level);
    if (!todayProgress) return;
    const updated: DailyProgress = { ...todayProgress, discomfortAvg: level };
    await saveDailyProgress(updated);
    setTodayProgress(updated);
    load();
  };

  const saveJournal = async () => {
    if (!todayProgress) return;
    const updated: DailyProgress = { ...todayProgress, journalEntry: journal };
    await saveDailyProgress(updated);
    setTodayProgress(updated);
    setSavedJournal(true);
    setTimeout(() => setSavedJournal(false), 1600);
  };

  const rotateQuote = () => {
    let next = randomStoicQuote();
    while (next === quote && STOIC_QUOTES.length > 1) {
      next = randomStoicQuote();
    }
    setQuote(next);
  };

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
            <Text style={styles.eyebrow}>RESILIENCIA · FORJA INTERIOR</Text>
            <Text style={styles.title}>
              El dolor informa. Tu respuesta define.
            </Text>
          </View>
        </Animated.View>

        <Pressable
          style={({ pressed }) => [
            styles.breathCard,
            pressed && styles.pressed,
          ]}
          onPress={() => router.push("/breathing" as never)}
        >
          <Animated.View style={[styles.breathOrbit, breatheStyle]}>
            <View style={styles.breathCore} />
          </Animated.View>
          <Text style={styles.breathTitle}>Respiración 4 · 7 · 8</Text>
          <Text style={styles.breathHint}>
            4s de inhalación · 7s retención · 8s exhalación lenta
          </Text>
          <Text style={styles.breathCta}>Tocar para comenzar →</Text>
        </Pressable>

        <Animated.View
          entering={FadeInDown.delay(120).duration(500)}
          style={[styles.discomfortCard]}
        >
          <View style={styles.cardHead}>
            <View>
              <Text style={styles.cardEyebrow}>REGISTRO DE ESFUERZO</Text>
              <Text style={styles.cardTitle}>
                ¿Qué tan duro has golpeado hoy?
              </Text>
            </View>
            <Animated.View style={[styles.discomfortAvg, pulseStyle]}>
              <Text style={styles.discomfortAvgNumber}>
                {avgDiscomfort ? avgDiscomfort.toFixed(1) : "—"}
              </Text>
              <Text style={styles.discomfortAvgLabel}>media sem.</Text>
            </Animated.View>
          </View>
          <View style={styles.discomfortGrid}>
            {DISCOMFORT_OPTIONS.map((opt, i) => {
              const selected = todayDiscomfort === opt.value;
              return (
                <Animated.View
                  key={opt.value}
                  entering={FadeInRight.delay(220 + i * 60).duration(400)}
                >
                  <Pressable
                    style={({ pressed }) => [
                      styles.discomfortChip,
                      selected && styles.discomfortChipSelected,
                      pressed && styles.pressed,
                    ]}
                    onPress={() => saveDiscomfort(opt.value)}
                  >
                    <View style={styles.discomfortRow}>
                      <Text style={styles.discomfortValue}>0{opt.value}</Text>
                      <View style={styles.discomfortLabels}>
                        <Text
                          style={[
                            styles.discomfortLabel,
                            selected && styles.discomfortLabelSelected,
                          ]}
                        >
                          {opt.label.toUpperCase()}
                        </Text>
                        <Text style={styles.discomfortHint}>{opt.hint}</Text>
                      </View>
                      <View
                        style={[
                          styles.discomfortBadge,
                          selected && styles.discomfortBadgeSelected,
                        ]}
                      >
                        <Text
                          style={[
                            styles.discomfortBadgeText,
                            selected && styles.discomfortBadgeTextSelected,
                          ]}
                        >
                          {selected ? "✓" : opt.value}
                        </Text>
                      </View>
                    </View>
                  </Pressable>
                </Animated.View>
              );
            })}
          </View>
          <View style={styles.stressBars}>
            {weeklyStress.map((d, i) => (
              <View key={i} style={styles.stressColumn}>
                <View
                  style={[
                    styles.stressFill,
                    {
                      height: `${Math.max(4, d.level * 20)}%`,
                      backgroundColor:
                        d.level >= 4
                          ? LUXURY.gold
                          : d.level >= 2
                            ? LUXURY.neonSoft
                            : LUXURY.slate,
                    },
                  ]}
                />
                <Text style={styles.stressLabel}>{d.day}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(180).duration(500)}
          style={[styles.stoicCard]}
        >
          <View style={styles.stoicHead}>
            <Text style={styles.stoicEyebrow}>
              ESTOICISMO · MENTE INQUEBRANTABLE
            </Text>
            <Pressable
              onPress={rotateQuote}
              style={({ pressed }) => [
                styles.rotateChip,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.rotateChipText}>SIGUIENTE ↻</Text>
            </Pressable>
          </View>
          <Text style={styles.stoicQuote}>“{quote}”</Text>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(240).duration(500)}
          style={[styles.journalCard]}
        >
          <Text style={styles.journalEyebrow}>DIARIO DE GUERRA</Text>
          <Text style={styles.journalLabel}>
            Escribe 3 cosas por las que estás agradecido y un enemigo mental a
            vencer.
          </Text>
          <TextInput
            value={journal}
            onChangeText={setJournal}
            multiline
            placeholder="Hoy he vencido…\nMañana iré a por…"
            placeholderTextColor={LUXURY.ash}
            selectionColor={LUXURY.gold}
            style={styles.journalInput}
            textAlignVertical="top"
          />
          <Pressable
            style={({ pressed }) => [
              styles.journalButton,
              savedJournal && styles.journalButtonDone,
              pressed && styles.pressed,
            ]}
            onPress={saveJournal}
          >
            <Text style={styles.journalButtonText}>
              {savedJournal ? "✓ GUARDADO" : "SELLAR REFLEXIÓN"}
            </Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: LUXURY.ink },
  header: { marginBottom: 18 },
  eyebrow: {
    color: LUXURY.ash,
    fontSize: 11,
    letterSpacing: 1.6,
    fontWeight: "800",
    marginBottom: 6,
  },
  title: {
    color: LUXURY.snow,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "800",
  },
  breathCard: {
    backgroundColor: LUXURY.graphite,
    borderRadius: 26,
    padding: 22,
    alignItems: "center",
    marginBottom: 22,
    borderWidth: 1,
    borderColor: `${LUXURY.teal}33`,
  },
  breathOrbit: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: `${LUXURY.teal}22`,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
    borderWidth: 1,
    borderColor: `${LUXURY.teal}55`,
  },
  breathCore: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: LUXURY.teal,
    shadowColor: LUXURY.teal,
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  breathTitle: {
    color: LUXURY.snow,
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  breathHint: {
    color: LUXURY.mist,
    fontSize: 12,
    marginTop: 6,
    fontWeight: "500",
  },
  breathCta: {
    color: LUXURY.teal,
    fontSize: 12,
    fontWeight: "800",
    marginTop: 12,
    letterSpacing: 0.8,
  },
  discomfortCard: {
    backgroundColor: LUXURY.graphite,
    borderRadius: 24,
    padding: 22,
    marginBottom: 22,
    borderWidth: 1,
    borderColor: `${LUXURY.amber}22`,
  },
  cardHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 18,
  },
  cardEyebrow: {
    color: LUXURY.amber,
    fontSize: 10,
    letterSpacing: 1.6,
    fontWeight: "800",
    marginBottom: 6,
  },
  cardTitle: {
    color: LUXURY.snow,
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 22,
  },
  discomfortAvg: {
    backgroundColor: `${LUXURY.amber}22`,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: "center",
    minWidth: 58,
    borderWidth: 1,
    borderColor: `${LUXURY.amber}44`,
  },
  discomfortAvgNumber: {
    color: LUXURY.goldSoft,
    fontSize: 18,
    fontWeight: "900",
  },
  discomfortAvgLabel: {
    color: LUXURY.ash,
    fontSize: 9,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  discomfortGrid: { gap: 10 },
  discomfortChip: {
    backgroundColor: LUXURY.obsidian,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: LUXURY.charcoal,
  },
  discomfortChipSelected: {
    borderColor: LUXURY.gold,
    backgroundColor: `${LUXURY.gold}14`,
  },
  discomfortRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  discomfortValue: {
    color: LUXURY.ash,
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 1,
    width: 28,
  },
  discomfortLabels: { flex: 1 },
  discomfortLabel: {
    color: LUXURY.pearl,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
    marginBottom: 2,
  },
  discomfortLabelSelected: { color: LUXURY.goldSoft },
  discomfortHint: {
    color: LUXURY.ash,
    fontSize: 11,
    fontWeight: "500",
  },
  discomfortBadge: {
    width: 34,
    height: 34,
    borderRadius: 18,
    backgroundColor: LUXURY.charcoal,
    alignItems: "center",
    justifyContent: "center",
  },
  discomfortBadgeSelected: { backgroundColor: LUXURY.gold },
  discomfortBadgeText: { color: LUXURY.pearl, fontSize: 12, fontWeight: "900" },
  discomfortBadgeTextSelected: { color: LUXURY.ink },
  stressBars: {
    height: 70,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    marginTop: 20,
  },
  stressColumn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  stressFill: {
    width: 18,
    borderRadius: 10,
    minHeight: 6,
  },
  stressLabel: {
    color: LUXURY.ash,
    fontSize: 10,
    fontWeight: "700",
    marginTop: 6,
  },
  stoicCard: {
    backgroundColor: LUXURY.obsidian,
    borderRadius: 24,
    padding: 22,
    marginBottom: 22,
    borderWidth: 1,
    borderColor: `${LUXURY.violet}22`,
  },
  stoicHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  stoicEyebrow: {
    color: LUXURY.violet,
    fontSize: 10,
    letterSpacing: 1.6,
    fontWeight: "800",
  },
  rotateChip: {
    backgroundColor: `${LUXURY.violet}22`,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  rotateChipText: {
    color: LUXURY.violet,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  stoicQuote: {
    color: LUXURY.pearl,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "600",
  },
  journalCard: {
    backgroundColor: LUXURY.graphite,
    borderRadius: 24,
    padding: 22,
    marginBottom: 22,
    borderWidth: 1,
    borderColor: `${LUXURY.gold}22`,
  },
  journalEyebrow: {
    color: LUXURY.gold,
    fontSize: 10,
    letterSpacing: 1.6,
    fontWeight: "800",
    marginBottom: 10,
  },
  journalLabel: {
    color: LUXURY.pearl,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "600",
    marginBottom: 14,
  },
  journalInput: {
    minHeight: 140,
    borderRadius: 16,
    backgroundColor: LUXURY.obsidian,
    padding: 14,
    color: LUXURY.snow,
    fontSize: 14,
    lineHeight: 20,
    borderWidth: 1,
    borderColor: LUXURY.charcoal,
  },
  journalButton: {
    alignSelf: "flex-end",
    backgroundColor: LUXURY.gold,
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 12,
    marginTop: 16,
  },
  journalButtonDone: {
    backgroundColor: LUXURY.emerald,
  },
  journalButtonText: {
    color: LUXURY.ink,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.1,
  },
  pressed: { opacity: 0.82, transform: [{ scale: 0.985 }] },
});

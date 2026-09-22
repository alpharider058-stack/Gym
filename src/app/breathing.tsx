import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { LUXURY } from "@/constants/theme";

type Phase = "inhale" | "hold" | "exhale";
const PHASES: { key: Phase; label: string; seconds: number; color: string }[] =
  [
    { key: "inhale", label: "INHALAR", seconds: 4, color: LUXURY.teal },
    { key: "hold", label: "RETENER", seconds: 7, color: LUXURY.violet },
    { key: "exhale", label: "EXHALAR", seconds: 8, color: LUXURY.gold },
  ];

export default function BreathingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [remaining, setRemaining] = useState(PHASES[0].seconds);
  const [cycles, setCycles] = useState(0);
  const [paused, setPaused] = useState(false);
  const orbit = useSharedValue(0.6);
  const phaseGlow = useSharedValue(0.2);

  const phase = PHASES[phaseIndex];

  useEffect(() => {
    const id = setInterval(() => {
      if (paused) return;
      setRemaining((r) => {
        if (r > 1) return r - 1;
        setPhaseIndex((prev) => {
          const next = (prev + 1) % PHASES.length;
          if (next === 0) setCycles((c) => c + 1);
          return next;
        });
        return PHASES[(phaseIndex + 1) % PHASES.length].seconds;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [phaseIndex, paused]);

  useEffect(() => {
    const dur = phase.seconds * 1000;
    if (phase.key === "inhale") {
      orbit.value = withTiming(1.4, {
        duration: dur,
        easing: Easing.inOut(Easing.sin),
      });
    } else if (phase.key === "hold") {
      orbit.value = withTiming(1.4, { duration: dur });
    } else {
      orbit.value = withTiming(0.7, {
        duration: dur,
        easing: Easing.inOut(Easing.sin),
      });
    }
    phaseGlow.value = withTiming(phase.key === "hold" ? 0.4 : 0.22, {
      duration: dur / 2,
      easing: Easing.inOut(Easing.sin),
    });
  }, [phase, orbit, phaseGlow]);

  const orbitStyle = useAnimatedStyle(() => ({
    transform: [{ scale: orbit.value }],
  }));
  const glowStyle = useAnimatedStyle(() => ({
    opacity: phaseGlow.value,
    transform: [{ scale: orbit.value + 0.2 }],
  }));

  return (
    <View style={styles.root}>
      <View style={{ paddingTop: insets.top + 18, paddingHorizontal: 20 }}>
        <View style={styles.header}>
          <Pressable
            style={({ pressed }) => [
              styles.closeChip,
              pressed && styles.pressed,
            ]}
            onPress={() => router.back()}
          >
            <Text style={styles.closeChipText}>× Cerrar</Text>
          </Pressable>
          <Text style={styles.headerTitle}>RESPIRACIÓN 4 · 7 · 8</Text>
          <Text style={styles.cycles}>{cycles} ciclos</Text>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.orbWrap}>
          <Animated.View
            style={[styles.glow, glowStyle, { backgroundColor: phase.color }]}
          />
          <Animated.View
            style={[
              styles.orb,
              orbitStyle,
              {
                backgroundColor: phase.color,
                borderColor: phase.color,
              },
            ]}
          >
            <View style={styles.orbInner} />
          </Animated.View>
          <View style={styles.orbText}>
            <Text style={[styles.phaseLabel, { color: phase.color }]}>
              {phase.label}
            </Text>
            <Text style={styles.time}>{remaining}</Text>
            <Text style={styles.phaseHint}>
              {phase.key === "inhale"
                ? "Llena pulmones, abdomen y espalda."
                : phase.key === "hold"
                  ? "Sostén. Deja que el oxígeno actúe."
                  : "Suelta despacio, soltarás lo que no sirve."}
            </Text>
          </View>
        </View>

        <View style={styles.phasesRow}>
          {PHASES.map((p, i) => {
            const active = i === phaseIndex;
            return (
              <View key={p.key} style={styles.phaseCard}>
                <View
                  style={[
                    styles.phaseDot,
                    { backgroundColor: p.color },
                    active && {
                      shadowColor: p.color,
                      shadowOpacity: 0.5,
                      shadowRadius: 10,
                    },
                  ]}
                />
                <Text
                  style={[styles.phaseCardLabel, active && { color: p.color }]}
                >
                  {p.label}
                </Text>
                <Text style={styles.phaseSeconds}>{p.seconds}s</Text>
              </View>
            );
          })}
        </View>

        <View style={styles.actions}>
          <Pressable
            style={({ pressed }) => [
              styles.secondary,
              pressed && styles.pressed,
            ]}
            onPress={() => {
              setPhaseIndex(0);
              setRemaining(PHASES[0].seconds);
              setCycles(0);
            }}
          >
            <Text style={styles.secondaryText}>REINICIAR</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.primary,
              { backgroundColor: phase.color },
              pressed && styles.pressed,
            ]}
            onPress={() => setPaused((p) => !p)}
          >
            <Text style={styles.primaryText}>
              {paused ? "REANUDAR" : "PAUSAR"}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: LUXURY.ink },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  closeChip: {
    backgroundColor: "rgba(255,255,255,0.06)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: `${LUXURY.pearl}22`,
  },
  closeChipText: { color: LUXURY.pearl, fontSize: 13, fontWeight: "700" },
  headerTitle: {
    color: LUXURY.teal,
    fontSize: 11,
    letterSpacing: 2,
    fontWeight: "800",
  },
  cycles: { color: LUXURY.mist, fontSize: 12, fontWeight: "700" },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 24,
  },
  orbWrap: {
    width: 280,
    height: 280,
    alignItems: "center",
    justifyContent: "center",
  },
  glow: {
    position: "absolute",
    width: 240,
    height: 240,
    borderRadius: 120,
  },
  orb: {
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    shadowOpacity: 0.4,
    shadowRadius: 32,
    elevation: 12,
  },
  orbInner: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  orbText: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  phaseLabel: {
    fontSize: 11,
    letterSpacing: 2.5,
    fontWeight: "900",
    marginBottom: 6,
  },
  time: {
    color: LUXURY.snow,
    fontSize: 48,
    fontWeight: "900",
  },
  phaseHint: {
    color: LUXURY.pearl,
    fontSize: 10,
    lineHeight: 15,
    maxWidth: 200,
    textAlign: "center",
    marginTop: 6,
    fontWeight: "600",
    opacity: 0.82,
  },
  phasesRow: {
    width: "100%",
    flexDirection: "row",
    gap: 10,
  },
  phaseCard: {
    flex: 1,
    backgroundColor: LUXURY.graphite,
    borderRadius: 18,
    padding: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: LUXURY.charcoal,
  },
  phaseDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginBottom: 8,
  },
  phaseCardLabel: {
    color: LUXURY.mist,
    fontSize: 10,
    letterSpacing: 1.2,
    fontWeight: "800",
    marginBottom: 4,
  },
  phaseSeconds: {
    color: LUXURY.ash,
    fontSize: 12,
    fontWeight: "800",
  },
  actions: {
    width: "100%",
    flexDirection: "row",
    gap: 12,
  },
  secondary: {
    flex: 1,
    minHeight: 52,
    borderRadius: 18,
    backgroundColor: LUXURY.graphite,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: LUXURY.charcoal,
  },
  secondaryText: {
    color: LUXURY.pearl,
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 1,
  },
  primary: {
    flex: 2,
    minHeight: 52,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 10,
  },
  primaryText: {
    color: LUXURY.ink,
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  pressed: { opacity: 0.82, transform: [{ scale: 0.985 }] },
});

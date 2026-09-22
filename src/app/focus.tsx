import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { LUXURY, SHADOWS } from "@/constants/theme";
import { saveSession } from "@/lib/forge-storage";

const PRESETS = [
  { label: "Rápido · 15m", minutes: 15, cycles: 1, color: LUXURY.teal },
  { label: "Pomodoro · 25m", minutes: 25, cycles: 1, color: LUXURY.gold },
  { label: "Profundo · 45m", minutes: 45, cycles: 1, color: LUXURY.neon },
  { label: "Maratón · 90m", minutes: 90, cycles: 1, color: LUXURY.violet },
];

const CIRC = 2 * Math.PI * 110;

function formatTime(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = Math.floor(totalSeconds % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function FocusScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [preset, setPreset] = useState(PRESETS[1]);
  const [task, setTask] = useState("");
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [finished, setFinished] = useState(false);
  const [distractions, setDistractions] = useState(0);
  const startRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const progress = useSharedValue(0);
  const pulse = useSharedValue(1);
  const scale = useSharedValue(1);

  useEffect(() => {
    progress.value = withTiming(
      running ? elapsed / (preset.minutes * 60) : 0,
      { duration: 600, easing: Easing.out(Easing.cubic) },
    );
  }, [elapsed, running, preset.minutes, progress]);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.06, { duration: running ? 1600 : 3000 }),
        withTiming(1, { duration: running ? 1600 : 3000 }),
      ),
      -1,
      true,
    );
  }, [pulse, running]);

  const start = () => {
    setRunning(true);
    setPaused(false);
    setFinished(false);
    startRef.current = Date.now() - elapsed * 1000;
    scale.value = withSpring(1.02, { damping: 14 });
    setTimeout(() => {
      scale.value = withSpring(1, { damping: 14 });
    }, 180);
    timerRef.current = setInterval(() => {
      setElapsed((prev) => {
        const next = Math.min(preset.minutes * 60, (Date.now() - startRef.current) / 1000);
        if (next >= preset.minutes * 60) {
          stop(true);
          return preset.minutes * 60;
        }
        return next;
      });
    }, 250);
  };

  const stop = (complete = false) => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    if (complete) {
      setRunning(false);
      setFinished(true);
    }
  };

  const pauseResume = () => {
    if (!running) return;
    if (!paused) {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
      setPaused(true);
    } else {
      startRef.current = Date.now() - elapsed * 1000;
      timerRef.current = setInterval(() => {
        setElapsed((prev) => {
          const next = Math.min(
            preset.minutes * 60,
            (Date.now() - startRef.current) / 1000,
          );
          if (next >= preset.minutes * 60) {
            stop(true);
            return preset.minutes * 60;
          }
          return next;
        });
      }, 250);
      setPaused(false);
    }
  };

  const cancel = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    router.back();
  };

  const reset = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setRunning(false);
    setPaused(false);
    setFinished(false);
    setElapsed(0);
    setDistractions(0);
  };

  const saveAndClose = async () => {
    const minutes = Math.max(1, Math.round(elapsed / 60));
    await saveSession({
      id: `focus_${Date.now()}`,
      date: new Date().toISOString(),
      type:
        minutes >= 60 ? "deep" : minutes >= 20 ? "standard" : "quick",
      minutes,
      cycles: preset.cycles,
      distractions,
      task: task.trim() || undefined,
      xp: minutes + Math.max(0, 10 - distractions),
    });
    router.back();
  };

  const strokeDashoffset = useAnimatedStyle(() => ({
    strokeDashoffset: CIRC * (1 - progress.value),
  }));
  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));
  const scaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={styles.root}>
      <View style={{ paddingTop: insets.top + 18, paddingHorizontal: 20 }}>
        <View style={styles.header}>
          <Pressable
            style={({ pressed }) => [styles.closeChip, pressed && styles.pressed]}
            onPress={cancel}
          >
            <Text style={styles.closeChipText}>× Cerrar</Text>
          </Pressable>
          <Text style={styles.headerTitle}>ENFOQUE PROFUNDO</Text>
          <View style={styles.placeholder} />
        </View>
      </View>

      {!running ? (
        <View style={styles.panel}>
          <Text style={styles.sectionLabel}>Escoge el nivel de fuego</Text>
          <View style={styles.presets}>
            {PRESETS.map((p) => {
              const selected = preset.label === p.label;
              return (
                <Pressable
                  key={p.label}
                  style={[
                    styles.preset,
                    selected && {
                      borderColor: `${p.color}77`,
                      backgroundColor: `${p.color}18`,
                    },
                  ]}
                  onPress={() => setPreset(p)}
                >
                  <View style={[styles.presetDot, { backgroundColor: p.color }]} />
                  <Text style={[styles.presetLabel, selected && { color: p.color }]}>
                    {p.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.sectionLabel}>¿Qué vas a forjar en este tiempo?</Text>
          <TextInput
            value={task}
            onChangeText={setTask}
            placeholder="Ej: Estudiar módulo 4 · proyecto · escritura…"
            placeholderTextColor={LUXURY.ash}
            selectionColor={LUXURY.gold}
            style={styles.input}
          />

          <Pressable
            style={({ pressed }) => [
              styles.startButton,
              pressed && styles.pressed,
            ]}
            onPress={start}
          >
            <Text style={styles.startText}>ENCENDER EL FOCO →</Text>
          </Pressable>

          <Text style={styles.hint}>
            Silencia notificaciones. Avisa a los que te interrumpan de que tu
            mente está ocupada construyendo tu mejor versión.
          </Text>
        </View>
      ) : (
        <View style={styles.timerPanel}>
          <Animated.View style={[styles.ringWrap, scaleStyle]}>
            <Animated.View style={[styles.ringGlow, pulseStyle]} />
            <View style={styles.ring}>
              <svg viewBox="0 0 260 260" style={styles.ringInner}>
                <circle
                  cx="130"
                  cy="130"
                  r="110"
                  stroke={LUXURY.charcoal}
                  strokeWidth={14}
                  fill="none"
                />
                <AnimatedCircle
                  cx="130"
                  cy="130"
                  r="110"
                  stroke={finished ? LUXURY.emerald : preset.color}
                  strokeWidth={14}
                  strokeLinecap="round"
                  fill="none"
                  strokeDasharray={CIRC}
                  animatedStyle={strokeDashoffset}
                  rotation={-90}
                  origin="130,130"
                />
              </svg>
              <View style={styles.timeWrap}>
                <Text style={[styles.time, { color: finished ? LUXURY.emerald : preset.color }]}>
                  {formatTime(Math.max(0, preset.minutes * 60 - elapsed))}
                </Text>
                <Text style={styles.timeLabel}>
                  {finished
                    ? "SESIÓN COMPLETA"
                    : paused
                      ? "EN PAUSA"
                      : "RESTANTE"}
                </Text>
              </View>
            </View>
          </Animated.View>

          <View style={styles.meta}>
            <View style={styles.metaChip}>
              <Text style={styles.metaLabel}>Distracciones</Text>
              <View style={styles.metaRow}>
                <Pressable
                  style={styles.metaButton}
                  onPress={() => setDistractions((d) => Math.max(0, d - 1))}
                >
                  <Text style={styles.metaButtonText}>−</Text>
                </Pressable>
                <Text style={styles.metaValue}>{distractions}</Text>
                <Pressable
                  style={styles.metaButton}
                  onPress={() => setDistractions((d) => d + 1)}
                >
                  <Text style={styles.metaButtonText}>+</Text>
                </Pressable>
              </View>
            </View>
            <View style={styles.metaChip}>
              <Text style={styles.metaLabel}>Tiempo</Text>
              <Text style={styles.metaValue}>
                {Math.round(elapsed / 60)}/{preset.minutes}m
              </Text>
            </View>
          </View>

          <View style={styles.actions}>
            <Pressable
              style={({ pressed }) => [
                styles.secondaryButton,
                pressed && styles.pressed,
              ]}
              onPress={reset}
            >
              <Text style={styles.secondaryText}>REINICIAR</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.primaryButton,
                { backgroundColor: finished ? LUXURY.emerald : paused ? preset.color : LUXURY.graphite },
                pressed && styles.pressed,
              ]}
              onPress={finished ? saveAndClose : pauseResume}
            >
              <Text style={[styles.primaryText, !finished && !paused && { color: preset.color }]}>
                {finished ? "SELLAR SESIÓN →" : paused ? "REANUDAR" : "PAUSAR"}
              </Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

function AnimatedCircle({
  animatedStyle,
  rotation,
  origin,
  ...rest
}: {
  cx: string | number;
  cy: string | number;
  r: string | number;
  stroke: string;
  strokeWidth: string | number;
  strokeLinecap: string;
  fill: string;
  strokeDasharray: number;
  animatedStyle: ReturnType<typeof useAnimatedStyle>;
  rotation?: number;
  origin?: string;
}) {
  const props = useAnimatedProps(() => ({
    strokeDashoffset: animatedStyle.value.strokeDashoffset,
  }));
  return (
    // @ts-expect-error svg animated props
    <Animated.circle
      {...rest}
      animatedProps={props}
      style={{
        transform: [
          { rotate: `${rotation ?? 0}deg` },
        ],
        transformOrigin: origin ?? "center",
      }}
    />
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: LUXURY.ink },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  headerTitle: {
    color: LUXURY.gold,
    fontSize: 11,
    letterSpacing: 2,
    fontWeight: "800",
  },
  closeChip: {
    backgroundColor: LUXURY.graphite,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: LUXURY.charcoal,
  },
  closeChipText: { color: LUXURY.pearl, fontSize: 13, fontWeight: "700" },
  placeholder: { width: 68 },
  panel: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 6,
  },
  sectionLabel: {
    color: LUXURY.ash,
    fontSize: 11,
    letterSpacing: 1.4,
    fontWeight: "800",
    marginBottom: 12,
    marginTop: 8,
  },
  presets: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 10,
  },
  preset: {
    width: "48%",
    backgroundColor: LUXURY.graphite,
    borderRadius: 18,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: LUXURY.charcoal,
  },
  presetDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  presetLabel: {
    color: LUXURY.snow,
    fontSize: 13,
    fontWeight: "700",
  },
  input: {
    backgroundColor: LUXURY.graphite,
    borderRadius: 18,
    minHeight: 54,
    paddingHorizontal: 16,
    color: LUXURY.snow,
    fontSize: 15,
    borderWidth: 1,
    borderColor: LUXURY.charcoal,
    marginBottom: 18,
  },
  startButton: {
    minHeight: 58,
    backgroundColor: LUXURY.gold,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
    ...SHADOWS.gold,
  },
  startText: {
    color: LUXURY.ink,
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  hint: {
    color: LUXURY.mist,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "500",
  },
  timerPanel: {
    flex: 1,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 20,
  },
  ringWrap: { alignItems: "center" },
  ringGlow: {
    position: "absolute",
    width: 270,
    height: 270,
    borderRadius: 135,
    backgroundColor: `${LUXURY.gold}10`,
    alignSelf: "center",
    top: 0,
  },
  ring: {
    width: 260,
    height: 260,
    alignItems: "center",
    justifyContent: "center",
  },
  ringInner: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 260,
    height: 260,
  },
  timeWrap: { alignItems: "center" },
  time: {
    fontSize: 62,
    fontWeight: "900",
    letterSpacing: 2,
  },
  timeLabel: {
    color: LUXURY.ash,
    fontSize: 11,
    letterSpacing: 2,
    fontWeight: "800",
    marginTop: 8,
  },
  meta: {
    width: "100%",
    flexDirection: "row",
    gap: 12,
  },
  metaChip: {
    flex: 1,
    backgroundColor: LUXURY.graphite,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: LUXURY.charcoal,
  },
  metaLabel: {
    color: LUXURY.ash,
    fontSize: 10,
    letterSpacing: 1.4,
    fontWeight: "800",
    marginBottom: 10,
  },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  metaButton: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: LUXURY.obsidian,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: LUXURY.charcoal,
  },
  metaButtonText: {
    color: LUXURY.gold,
    fontSize: 20,
    fontWeight: "800",
  },
  metaValue: {
    color: LUXURY.snow,
    fontSize: 20,
    fontWeight: "900",
    minWidth: 22,
    textAlign: "center",
  },
  actions: {
    width: "100%",
    flexDirection: "row",
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    minHeight: 54,
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
  primaryButton: {
    flex: 2,
    minHeight: 54,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: `${LUXURY.gold}22`,
  },
  primaryText: {
    color: LUXURY.ink,
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 1,
  },
  pressed: { opacity: 0.82, transform: [{ scale: 0.985 }] },
});

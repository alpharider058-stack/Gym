import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { LUXURY, SHADOWS } from "@/constants/theme";
import { VictoryCapture } from "@/components/victory-capture";
import {
  getActiveConquest,
  saveActiveConquest,
  saveConquest,
  type ConquestSession,
} from "@/lib/forge-storage-victory";

const CONQUEST_PRESETS = [
  { label: "CONQUISTA ÉPOCA", minutes: 25, color: LUXURY.gold, icon: "⚔️" },
  { label: "BATALLA MAESTRA", minutes: 50, color: LUXURY.emerald, icon: "🛡️" },
  { label: "ASALTO DE GLORIA", minutes: 10, color: LUXURY.neon, icon: "⚡" },
];

function formatTime(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = Math.floor(totalSeconds % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function TriumphRitual() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [preset, setPreset] = useState(CONQUEST_PRESETS[0]);
  const [conquestName, setConquestName] = useState("");
  const [ritualActive, setRitualActive] = useState(false);
  const [paused, setPaused] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [conquestComplete, setConquestComplete] = useState(false);
  const [victoryClaimed, setVictoryClaimed] = useState(false);
  const [distractions, setDistractions] = useState(0);
  const startRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const savedConquestRef = useRef(false);
  const activeConquestIdRef = useRef<string | null>(null);

  useEffect(() => {
    let active = true;
    void getActiveConquest().then((stored) => {
      if (!active || !stored) return;
      activeConquestIdRef.current = stored.id;
      const baseElapsed = stored.elapsedSeconds ?? 0;
      const elapsedSeconds = Math.min(
        stored.durationMin * 60,
        baseElapsed + (stored.paused ? 0 : Math.max(0, (Date.now() - stored.startedAt) / 1000)),
      );
      setPreset(CONQUEST_PRESETS.find(p => p.label === stored.presetLabel) || CONQUEST_PRESETS[0]);
      setConquestName(stored.conquestName);
      setElapsed(elapsedSeconds);
      setConquestComplete(elapsedSeconds >= stored.durationMin * 60);
      setVictoryClaimed(stored.victoryClaimed);
      setPaused(Boolean(stored.paused));
      setRitualActive(!stored.paused && elapsedSeconds < stored.durationMin * 60);
      startRef.current = Date.now() - elapsedSeconds * 1000;
      if (!stored.paused && elapsedSeconds < stored.durationMin * 60) {
        timerRef.current = setInterval(() => {
          const next = Math.min(stored.durationMin * 60, (Date.now() - startRef.current) / 1000);
          setElapsed(next);
          if (next >= stored.durationMin * 60) {
            if (timerRef.current) clearInterval(timerRef.current);
            timerRef.current = null;
            setRitualActive(false);
            setConquestComplete(true);
            void saveActiveConquest({ ...stored, elapsedSeconds: next, paused: true });
          }
        }, 250);
      }
    });
    return () => {
      active = false;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const progress = useSharedValue(0);
  const pulse = useSharedValue(1);
  const scale = useSharedValue(1);
  const victoryPulse = useSharedValue(1);

  useEffect(() => {
    progress.value = withTiming(
      ritualActive ? elapsed / (preset.minutes * 60) : 0,
      { duration: 600, easing: Easing.out(Easing.cubic) },
    );
  }, [elapsed, ritualActive, preset.minutes, progress]);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.04, { duration: ritualActive ? 1200 : 2500 }),
        withTiming(1, { duration: ritualActive ? 1200 : 2500 }),
      ),
      -1,
      true,
    );
  }, [pulse, ritualActive]);

  useEffect(() => {
    if (conquestComplete && !victoryClaimed) {
      victoryPulse.value = withRepeat(
        withSequence(
          withTiming(1.08, { duration: 600 }),
          withTiming(1, { duration: 600 }),
        ),
        -1,
        true,
      );
    } else {
      victoryPulse.value = 1;
    }
  }, [conquestComplete, victoryClaimed]);

  const startConquest = async () => {
    if (timerRef.current) return;
    setRitualActive(true);
    setPaused(false);
    setConquestComplete(false);
    setVictoryClaimed(false);
    setDistractions(0);
    savedConquestRef.current = false;
    const now = Date.now();
    startRef.current = now - elapsed * 1000;
    activeConquestIdRef.current ??= `conquest_${now}`;
    await saveActiveConquest({
      id: activeConquestIdRef.current,
      conquestName: conquestName.trim() || "Conquista sin nombre",
      presetLabel: preset.label,
      durationMin: preset.minutes,
      startedAt: now,
      elapsedSeconds: elapsed,
      paused: false,
      victoryClaimed: false,
    });
    scale.value = withSpring(1.03, { damping: 12 });
    setTimeout(() => {
      scale.value = withSpring(1, { damping: 12 });
    }, 200);
    timerRef.current = setInterval(() => {
      setElapsed((prev) => {
        const next = Math.min(
          preset.minutes * 60,
          (Date.now() - startRef.current) / 1000,
        );
        if (next >= preset.minutes * 60) {
          claimVictory(true);
          return preset.minutes * 60;
        }
        return next;
      });
    }, 250);
  };

  const claimVictory = (complete = false) => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    if (complete) {
      setRitualActive(false);
      setConquestComplete(true);
      setVictoryClaimed(true);
    }
  };

  const pauseResume = async () => {
    if (!ritualActive) return;
    if (!paused) {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
      const elapsedNow = Math.min(preset.minutes * 60, (Date.now() - startRef.current) / 1000);
      setElapsed(elapsedNow);
      setPaused(true);
      const conquest: ConquestSession = {
        id: activeConquestIdRef.current ?? `conquest_${Date.now()}`,
        conquestName: conquestName.trim() || "Conquista sin nombre",
        presetLabel: preset.label,
        durationMin: preset.minutes,
        startedAt: Date.now(),
        elapsedSeconds: elapsedNow,
        paused: true,
        victoryClaimed: false,
      };
      activeConquestIdRef.current = conquest.id;
      await saveActiveConquest(conquest);
    } else {
      const now = Date.now();
      startRef.current = now - elapsed * 1000;
      await saveActiveConquest({
        id: activeConquestIdRef.current ?? `conquest_${now}`,
        conquestName: conquestName.trim() || "Conquista sin nombre",
        presetLabel: preset.label,
        durationMin: preset.minutes,
        startedAt: now,
        elapsedSeconds: elapsed,
        paused: false,
      });
      timerRef.current = setInterval(() => {
        setElapsed((prev) => {
          const next = Math.min(
            preset.minutes * 60,
            (Date.now() - startRef.current) / 1000,
          );
          if (next >= preset.minutes * 60) {
            claimVictory(true);
            return preset.minutes * 60;
          }
          return next;
        });
      }, 250);
      setPaused(false);
    }
  };

  const abandon = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    await saveActiveConquest(null);
    activeConquestIdRef.current = null;
    router.back();
    // En el camino del campeón, no hay retreat, solo diferentes caminos hacia la victoria
  };

  const reset = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    await saveActiveConquest(null);
    activeConquestIdRef.current = null;
    setRitualActive(false);
    setPaused(false);
    setConquestComplete(false);
    setVictoryClaimed(false);
    setElapsed(0);
    setDistractions(0);
    setConquestName("");
  };

  const claimAndClose = async () => {
    if (savedConquestRef.current) return;
    const minutes = Math.max(1, Math.round(elapsed / 60));
    const xpEarned = minutes + Math.max(0, 10 - distractions);
    await saveConquest({
      id: activeConquestIdRef.current ?? `conquest_${Date.now()}`,
      date: new Date().toISOString(),
      conquestName: conquestName.trim() || "Conquista sin nombre",
      presetLabel: preset.label,
      minutes,
      xp: xpEarned,
      distractions,
    });
    await saveActiveConquest(null);
    savedConquestRef.current = true;
    router.push("/conquest-victory" as never);
  };

  const ringColor = conquestComplete && victoryClaimed ? LUXURY.emerald : preset.color;
  const ringTrackStyle = useAnimatedStyle(() => ({
    transform: [
      { rotateZ: `${progress.value * 360}deg` },
    ],
  }));
  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));
  const scaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  const victoryPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: victoryPulse.value }],
  }));

  return (
    <View style={styles.root}>
      <View style={{ paddingTop: insets.top + 18, paddingHorizontal: 20 }}>
        <View style={styles.header}>
          <Pressable
            style={({ pressed }) => [styles.closeChip, pressed && styles.pressed]}
            onPress={abandon}
          >
            <Text style={styles.closeChipText}>× Abandonar</Text>
          </Pressable>
          <Text style={styles.headerTitle}>RITUAL DEL TRIUNFO</Text>
          <View style={styles.placeholder} />
        </View>
      </View>

      {!ritualActive ? (
        <View style={styles.preparationPanel}>
          <Text style={styles.sectionLabel}>Nombre de tu conquista</Text>
          <TextInput
            value={conquestName}
            onChangeText={(val) => setConquestName(val)}
            placeholder="Ej: Dominar el proyecto, Conquistar el miedo, etc."
            placeholderTextColor={LUXURY.ash}
            selectionColor={LUXURY.gold}
            style={styles.conquestInput}
          />

          <Text style={styles.sectionLabel}>Selecciona tu tipo de batalla</Text>
          <View style={presetsContainer}>
            {CONQUEST_PRESETS.map((presetItem, index) => (
              <Pressable
                key={index}
                style={[
                  presetButton,
                  preset === presetItem && presetButtonActive,
                ]}
                onPress={() => setPreset(presetItem)}
              >
                <View style={[presetIconContainer, { backgroundColor: `${presetItem.color}11` }]}>
                  <Text style={presetIconText}>{presetItem.icon}</Text>
                </View>
                <View style={presetTextContainer}>
                  <Text style={presetLabelText}>{presetItem.label}</Text>
                  <Text style={presetDurationText}>{presetItem.minutes} min</Text>
                </View>
              </Pressable>
            ))}
          </View>

          <Pressable
            style={({ pressed }) => [startButton, pressed && startButtonPressed]}
            onPress={startConquest}
          >
            <Text style={startText}>INICIAR RITUAL DEL TRIUNFO →</Text>
          </Pressable>

          <Text style={hintText}>
            El verdadero guerrero no espera el momento perfecto. Él lo crea.
          </Text>
        </View>
      ) : (
        <View style={styles.ritualPanel}>
          <Animated.View style={[styles.ringWrap, scaleStyle]}>
            <Animated.View
              style={[
                styles.ringGlow,
                pulseStyle,
                { backgroundColor: `${ringColor}18` },
              ]}
            />
            <View style={styles.ring}>
              <View style={[styles.ringTrack, { borderColor: LUXURY.charcoal }]} />
              <Animated.View
                style={[
                  styles.ringMask,
                  ringTrackStyle,
                ]}
              >
                <View
                  style={[
                    styles.ringFill,
                    { borderTopColor: ringColor, borderRightColor: ringColor },
                  ]}
                />
              </Animated.View>
              <View style={styles.ringInnerGlow} />
              <View style={styles.timeWrap}>
                <Text
                  style={[
                    styles.time,
                    { color: ringColor },
                  ]}
                >
                  {formatTime(Math.max(0, preset.minutes * 60 - elapsed))}
                </Text>
                <Text style={styles.timeLabel}>
                  {conquestComplete
                    ? "¡CONQUISTA LOGRADA!"
                    : paused
                      ? "EN PAUSA TÁCTICA"
                      : "EN BATALLA"}
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
              <Text style={styles.metaLabel}>Conquista</Text>
              <Text style={styles.metaValue}>
                {conquestName.trim() || "Sin nombre"}
              </Text>
            </View>
          </View>

          {conquestComplete && !victoryClaimed && (
            <View style={victoryPromptContainer}>
              <Text style={victoryPromptTitle}>¡VICTORIA LOGRADA!</Text>
              <Text style={victoryPromptText}>
                Has completado tu ritual de conquista. Ahora reclama tu triunfo.
              </Text>
              <Pressable
                style={({ pressed }) => [
                  victoryButton,
                  pressed && victoryButtonPressed,
                ]}
                onPress={() => claimAndClose()}
              >
                <Text style={victoryButtonText}>RECLAMAR VICTORIA →</Text>
              </Pressable>
              <Animated.View style={victoryPulseStyle}>
                <Text style={victoryPulseText}>⚡⚡⚡</Text>
              </Animated.View>
            </View>
          )}

          {conquestComplete && victoryClaimed && (
            <View style={victoryCelebration}>
              <Text style={victoryCelebrationTitle}>¡VICTORIA RECLAMADA!</Text>
              <Text style={victoryCelebrationText}>
                Tu nombre será grabado en el Salón de los Campeones.
              </Text>
              <View style={victoryCelebrationIcons}>
                <Text style={victoryCelebrationIcon}>🏆</Text>
                <Text style={victoryCelebrationIcon}>⚔️</Text>
                <Text style={victoryCelebrationIcon}>👑</Text>
              </View>
            </View>
          )}

          {!conquestComplete && (
            <View style={styles.actions}>
              <Pressable
                style={({ pressed }) => [secondaryButton, pressed && secondaryButtonPressed]}
                onPress={reset}
              >
                <Text style={secondaryText}>REINICIAR</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  primaryButton,
                  {
                    backgroundColor: conquestComplete
                      ? LUXURY.emerald
                      : paused
                        ? preset.color
                        : LUXURY.graphite,
                  },
                  pressed && primaryButtonPressed,
                ]}
                onPress={conquestComplete ? claimAndClose : pauseResume}
              >
                <Text
                  style={[
                    primaryText,
                    !conquestComplete && !paused && { color: preset.color },
                  ]}
                >
                  {conquestComplete ? "RECLAMAR VICTORIA →" : paused ? "REANUDAR" : "PAUSAR"}
                </Text>
              </Pressable>
            </View>
          )}
        </View>
      )}
    </View>
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
  preparationPanel: { flex: 1, paddingHorizontal: 20, paddingTop: 6 },
  ritualPanel: { flex: 1, paddingHorizontal: 20, paddingTop: 6 },
  sectionLabel: {
    color: LUXURY.ash,
    fontSize: 11,
    letterSpacing: 1.4,
    fontWeight: "800",
    marginBottom: 12,
    marginTop: 8,
  },
  conquestInput: {
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
  presetsContainer: {
    marginVertical: 16,
  },
  presetButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: LUXURY.graphite,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: LUXURY.charcoal,
  },
  presetButtonActive: {
    borderColor: `${LUXURY.gold}66`,
    backgroundColor: `${LUXURY.gold}11`,
  },
  presetIconContainer: {
    marginRight: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  presetIconText: {
    fontSize: 20,
  },
  presetTextContainer: {
    flex: 1,
  },
  presetLabelText: {
    color: LUXURY.snow,
    fontSize: 14,
    fontWeight: "600",
  },
  presetDurationText: {
    color: LUXURY.mist,
    fontSize: 12,
  },
  startButton: {
    minHeight: 58,
    backgroundColor: LUXURY.gold,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    ...SHADOWS.gold,
  },
  startButtonPressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
  startText: {
    color: LUXURY.ink,
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  hintText: {
    color: LUXURY.mist,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "500",
  },
  ritualPanel: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 6,
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
  secondaryButtonPressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
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
  primaryButtonPressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
  primaryText: {
    color: LUXURY.ink,
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 1,
  },
  victoryPromptContainer: {
    backgroundColor: `${LUXURY.emerald}11`,
    borderRadius: 20,
    padding: 24,
    marginVertical: 20,
    alignItems: "center",
  },
  victoryPromptTitle: {
    color: LUXURY.emerald,
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 8,
  },
  victoryPromptText: {
    color: LUXURY.snow,
    fontSize: 16,
    textAlign: "center",
  },
  victoryButton: {
    backgroundColor: LUXURY.emerald,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 50,
    marginTop: 16,
  },
  victoryButtonPressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
  victoryButtonText: {
    color: LUXURY.ink,
    fontSize: 16,
    fontWeight: "600",
  },
  victoryPulseText: {
    color: LUXURY.emerald,
    fontSize: 24,
    fontWeight: "800",
  },
  victoryCelebration: {
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  victoryCelebrationTitle: {
    color: LUXURY.gold,
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 16,
  },
  victoryCelebrationText: {
    color: LUXURY.snow,
    fontSize: 16,
    textAlign: "center",
    marginBottom: 24,
  },
  victoryCelebrationIcons: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
  },
  victoryCelebrationIcon: {
    fontSize: 32,
  },
  timeWrap: { alignItems: "center", zIndex: 3 },
  time: {
    fontSize: 58,
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
  ringWrap: { alignItems: "center", width: 280, height: 280, justifyContent: "center" },
  ringGlow: {
    position: "absolute",
    width: 290,
    height: 290,
    borderRadius: 145,
  },
  ring: {
    width: 260,
    height: 260,
    borderRadius: 130,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  ringTrack: {
    position: "absolute",
    width: "100%",
    height: "100%",
    borderRadius: 130,
    borderWidth: 14,
  },
  ringMask: {
    position: "absolute",
    width: "100%",
    height: "100%",
    borderRadius: 130,
  },
  ringFill: {
    position: "absolute",
    width: "100%",
    height: "100%",
    borderRadius: 130,
    borderWidth: 14,
    borderLeftColor: "transparent",
    borderBottomColor: "transparent",
  },
  ringInnerGlow: {
    position: "absolute",
    width: 208,
    height: 208,
    borderRadius: 104,
    backgroundColor: LUXURY.obsidian,
    borderWidth: 1,
    borderColor: `${LUXURY.charcoal}`,
  },
});

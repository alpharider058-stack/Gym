import { useMemo, useState } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import Animated, {
    FadeInDown,
    FadeInRight,
    FadeOutLeft,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { LUXURY, SHADOWS } from "@/constants/theme";
import {
    getSettings,
    saveProfile,
    saveSettings,
    type WarriorProfile,
} from "@/lib/forge-storage";
import { updateScheduleFromSettings } from "@/lib/notifications";

type OnboardingProps = {
  onFinished: () => void;
};

const STEPS = 3;

export default function Onboarding({ onFinished }: OnboardingProps) {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [notifHour, setNotifHour] = useState(6);
  const [notifMinute, setNotifMinute] = useState(30);
  const [notifEnabled, setNotifEnabled] = useState(true);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  const pressScale = useSharedValue(1);
  const ctaStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.value }],
  }));

  const canAdvance = useMemo(() => {
    if (step === 0) return name.trim().length >= 2;
    if (step === 1) return true;
    if (step === 2) return reason.trim().length >= 6;
    return false;
  }, [step, name, reason]);

  const next = async () => {
    if (!canAdvance) return;
    pressScale.value = withSpring(0.95);
    setTimeout(() => (pressScale.value = withSpring(1)), 120);
    if (step < STEPS - 1) {
      setStep(step + 1);
      return;
    }
    setSaving(true);
    const profile: WarriorProfile = {
      name: name.trim(),
      createdAt: Date.now(),
      onboarded: true,
      defaultReason: reason.trim(),
    };
    await saveProfile(profile);
    const settings = await getSettings();
    settings.notifEnabled = notifEnabled;
    settings.notifHour = notifHour;
    settings.notifMinute = notifMinute;
    await saveSettings(settings);
    if (notifEnabled) void updateScheduleFromSettings(true);
    setSaving(false);
    onFinished();
  };

  const hourInc = (delta: number) =>
    setNotifHour((hour) => (hour + delta + 24) % 24);
  const minuteInc = (delta: number) =>
    setNotifMinute((minute) => (minute + delta + 60) % 60);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={10}
      >
        <View style={styles.header}>
          <Text style={styles.logo}>VÉRTICE</Text>
          <View style={styles.dotsRow}>
            {Array.from({ length: STEPS }).map((_, idx) => (
              <View
                key={idx}
                style={[styles.dot, idx === step && styles.dotActive]}
              />
            ))}
          </View>
        </View>

        <View style={styles.body}>
          {step === 0 && (
            <Animated.View
              key="s0"
              entering={FadeInDown.duration(500)}
              exiting={FadeOutLeft.duration(250)}
              style={styles.step}
            >
              <Text style={styles.eyebrow}>PASO 1 · IDENTIDAD</Text>
              <Text style={styles.title}>¿Quién eres?</Text>
              <Text style={styles.subtitle}>
                Un nombre. Una marca. A partir de ahora será la bandera de tu
                racha.
              </Text>
              <TextInput
                autoFocus
                value={name}
                onChangeText={setName}
                placeholder="Tu nombre, tu guerra..."
                placeholderTextColor={LUXURY.ash}
                style={styles.input}
              />
            </Animated.View>
          )}

          {step === 1 && (
            <Animated.View
              key="s1"
              entering={FadeInRight.duration(450)}
              exiting={FadeOutLeft.duration(250)}
              style={styles.step}
            >
              <Text style={styles.eyebrow}>PASO 2 · HORA DEL ATAQUE</Text>
              <Text style={styles.title}>¿Cuándo recibes tu golpe?</Text>
              <Text style={styles.subtitle}>
                Una notificación diaria. Un mensaje que nadie más te dirá.
                Actívala y elige la hora exacta.
              </Text>
              <View style={styles.toggleRow}>
                <Text
                  style={[
                    styles.toggleLabel,
                    !notifEnabled && styles.toggleLabelOff,
                  ]}
                >
                  Notificación diaria
                </Text>
                <Pressable
                  onPress={() => setNotifEnabled((enabled) => !enabled)}
                  style={[
                    styles.toggleSwitch,
                    notifEnabled && styles.toggleSwitchOn,
                  ]}
                >
                  <View
                    style={[
                      styles.toggleThumb,
                      notifEnabled && { transform: [{ translateX: 26 }] },
                    ]}
                  />
                </Pressable>
              </View>
              <View style={styles.timeRow}>
                <TimePicker
                  label="Hora"
                  value={notifHour}
                  disabled={!notifEnabled}
                  onInc={() => hourInc(1)}
                  onDec={() => hourInc(-1)}
                />
                <Text style={styles.timeColon}>:</Text>
                <TimePicker
                  label="Minuto"
                  value={notifMinute}
                  disabled={!notifEnabled}
                  onInc={() => minuteInc(5)}
                  onDec={() => minuteInc(-5)}
                />
              </View>
            </Animated.View>
          )}

          {step === 2 && (
            <Animated.View
              key="s2"
              entering={FadeInRight.duration(450)}
              exiting={FadeOutLeft.duration(250)}
              style={styles.step}
            >
              <Text style={styles.eyebrow}>PASO 3 · EL MOTIVO</Text>
              <Text style={styles.title}>¿Para qué te bloqueas?</Text>
              <Text style={styles.subtitle}>
                Cada sesión de enfoque recuerda este motivo. Escríbelo bien:
                deberá convencerte cuando estés a punto de rendirte.
              </Text>
              <TextInput
                autoFocus
                value={reason}
                onChangeText={setReason}
                placeholder="Construir la vida que merezco. Basta de mediocridad."
                placeholderTextColor={LUXURY.ash}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                style={[styles.input, styles.textarea]}
              />
              <Text style={styles.hint}>
                Ej: "No ser el cobarde de mis propios sueños."
              </Text>
            </Animated.View>
          )}
        </View>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
          <Pressable
            disabled={step === 0}
            onPress={() => setStep(step - 1)}
            style={[styles.back, step === 0 && styles.backDisabled]}
          >
            <Text
              style={[styles.backText, step === 0 && styles.backTextDisabled]}
            >
              Atrás
            </Text>
          </Pressable>
          <Pressable
            disabled={!canAdvance || saving}
            onPress={next}
            style={{ flex: 1, marginLeft: 14 }}
          >
            <Animated.View
              style={[styles.cta, ctaStyle, !canAdvance && styles.ctaDisabled]}
            >
              <Text style={styles.ctaText}>
                {saving
                  ? "Preparando..."
                  : step < STEPS - 1
                    ? "Siguiente"
                    : "EMPEZAR VÉRTICE"}
              </Text>
            </Animated.View>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

function TimePicker({
  label,
  value,
  disabled,
  onInc,
  onDec,
}: {
  label: string;
  value: number;
  disabled: boolean;
  onInc: () => void;
  onDec: () => void;
}) {
  return (
    <View style={styles.timeBlock}>
      <Text style={styles.timeLabel}>{label}</Text>
      <Pressable
        disabled={disabled}
        onPress={onInc}
        style={[styles.timeBtn, disabled && styles.timeBtnDisabled]}
      >
        <Text style={styles.timeBtnText}>▲</Text>
      </Pressable>
      <View style={[styles.timeValueBox, disabled && styles.timeBoxDisabled]}>
        <Text style={styles.timeValue}>{String(value).padStart(2, "0")}</Text>
      </View>
      <Pressable
        disabled={disabled}
        onPress={onDec}
        style={[styles.timeBtn, disabled && styles.timeBtnDisabled]}
      >
        <Text style={styles.timeBtnText}>▼</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: LUXURY.ink, paddingHorizontal: 24 },
  header: {
    alignItems: "center",
    paddingTop: 8,
    paddingBottom: 24,
  },
  logo: {
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 6,
    color: LUXURY.gold,
    marginBottom: 16,
  },
  dotsRow: { flexDirection: "row", gap: 8 },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: LUXURY.slate,
    opacity: 0.5,
  },
  dotActive: {
    width: 20,
    backgroundColor: LUXURY.gold,
    opacity: 1,
  },
  body: { flex: 1, justifyContent: "center" },
  step: { width: "100%" },
  eyebrow: {
    color: LUXURY.mist,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 2,
    marginBottom: 10,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 34,
    fontWeight: "700",
    lineHeight: 40,
    marginBottom: 12,
  },
  subtitle: {
    color: LUXURY.mist,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 28,
  },
  input: {
    height: 56,
    borderRadius: 16,
    backgroundColor: LUXURY.graphite,
    color: "#fff",
    fontSize: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: LUXURY.charcoal,
  },
  textarea: {
    height: 130,
    paddingTop: 16,
    paddingBottom: 16,
  },
  hint: {
    marginTop: 10,
    fontSize: 12,
    color: LUXURY.ash,
    fontStyle: "italic",
  },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: LUXURY.graphite,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: LUXURY.charcoal,
    marginBottom: 28,
  },
  toggleLabel: { color: "#fff", fontSize: 16, fontWeight: "600" },
  toggleLabelOff: { color: LUXURY.ash },
  toggleSwitch: {
    width: 52,
    height: 32,
    borderRadius: 16,
    backgroundColor: LUXURY.slate,
    padding: 3,
  },
  toggleSwitchOn: { backgroundColor: LUXURY.gold },
  toggleThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#fff",
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 18,
  },
  timeBlock: { alignItems: "center" },
  timeLabel: {
    color: LUXURY.ash,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 10,
  },
  timeBtn: {
    width: 56,
    height: 40,
    borderRadius: 12,
    backgroundColor: LUXURY.graphite,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: LUXURY.charcoal,
  },
  timeBtnDisabled: { opacity: 0.35 },
  timeBtnText: { color: LUXURY.pearl, fontSize: 12, fontWeight: "700" },
  timeValueBox: {
    width: 100,
    height: 80,
    borderRadius: 18,
    backgroundColor: LUXURY.graphite,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 10,
    borderWidth: 1,
    borderColor: LUXURY.charcoal,
    ...SHADOWS.card,
  },
  timeBoxDisabled: { opacity: 0.4 },
  timeValue: {
    color: "#FFFFFF",
    fontSize: 40,
    fontWeight: "800",
    letterSpacing: 2,
  },
  timeColon: {
    color: LUXURY.gold,
    fontSize: 40,
    fontWeight: "700",
    marginTop: 26,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 24,
  },
  back: {
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: LUXURY.graphite,
    borderWidth: 1,
    borderColor: LUXURY.charcoal,
  },
  backDisabled: { opacity: 0.35 },
  backText: { color: "#fff", fontSize: 15, fontWeight: "600" },
  backTextDisabled: { color: LUXURY.ash },
  cta: {
    height: 56,
    borderRadius: 16,
    backgroundColor: LUXURY.gold,
    alignItems: "center",
    justifyContent: "center",
    ...SHADOWS.gold,
  },
  ctaDisabled: { opacity: 0.35 },
  ctaText: {
    color: "#000",
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
});

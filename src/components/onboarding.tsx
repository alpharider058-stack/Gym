import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import Animated, { FadeIn, FadeInRight, useSharedValue, withSpring, useAnimatedStyle } from "react-native-reanimated";

import { LUXURY } from "@/constants/theme";

export type WarriorProfile = {
  name: string;
  mantra: string;
  focusAmbition: string;
  startingLevel: string;
  createdAt: string;
};

type Props = { onComplete: (profile: WarriorProfile) => void };

const options = {
  ambition: [
    "Dominar mi mente y mi cuerpo",
    "Construir hábitos invencibles",
    "Alcanzar mi mejor versión",
    "Crear un legado imborrable",
  ],
  level: [
    "Recién empiezo, quiero el fuego",
    "Llevo tiempo, pero me falta constancia",
    "Ya soy disciplinado, busco el siguiente nivel",
    "Soy una máquina, quiero el VÉRTICE",
  ],
  mantra: [
    "El dolor es temporal, la mediocridad eterna",
    "Hoy haré lo que otros no hacen",
    "Mi voluntad es mi arma",
    "Cada minuto cuenta, cada acción forja",
  ],
};

export function Onboarding({ onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [mantra, setMantra] = useState("");
  const [ambition, setAmbition] = useState("");
  const [level, setLevel] = useState("");
  const pressed = useSharedValue(1);
  const pressedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressed.value }],
  }));
  const values = [name, ambition, level, mantra];
  const labels = [
    "¿Quién eres?",
    "¿Qué ambición arde en ti?",
    "¿Dónde estás ahora?",
    "¿Cuál es tu mantra de batalla?",
  ];
  const subtitles = [
    "Tu nombre es la primera piedra de tu fortaleza.",
    "La ambición da dirección a la disciplina.",
    "La honestidad es el origen del crecimiento real.",
    "Repite estas palabras todos los días antes de ceder.",
  ];
  const canContinue = values[step].trim().length > 0;

  const next = () => {
    if (!canContinue) return;
    if (step === 3)
      onComplete({
        name: name.trim(),
        mantra,
        focusAmbition: ambition,
        startingLevel: level,
        createdAt: new Date().toISOString(),
      });
    else setStep((s) => s + 1);
  };

  const onPressIn = () => {
    pressed.value = withSpring(0.96, { damping: 18 });
  };
  const onPressOut = () => {
    pressed.value = withSpring(1, { damping: 12 });
  };

  return (
    <View style={styles.root}>
      <Animated.View entering={FadeIn.duration(700)} style={styles.brand}>
        <View style={styles.brandMark}>
          <Text style={styles.brandMarkText}>V</Text>
          <View style={styles.brandGlow} />
        </View>
        <Text style={styles.brandName}>VÉRTICE</Text>
        <Text style={styles.brandTag}>FORJA TU DISCIPLINA</Text>
      </Animated.View>
      <View style={styles.progressTrack}>
        <Animated.View
          style={[
            styles.progressFill,
            { width: `${((step + 1) / 4) * 100}%` },
          ]}
        />
      </View>
      <Animated.View
        key={step}
        entering={FadeInRight.duration(500)}
        style={styles.panel}
      >
        <Text style={styles.step}>FASE {step + 1} · 4</Text>
        <Text style={styles.title}>{labels[step]}</Text>
        <Text style={styles.subtitle}>{subtitles[step]}</Text>
        {step === 0 ? (
          <TextInput
            autoFocus
            value={name}
            onChangeText={setName}
            placeholder="Escribe tu nombre"
            placeholderTextColor={LUXURY.ash}
            style={styles.input}
            selectionColor={LUXURY.gold}
          />
        ) : step === 3 ? (
          <View style={styles.options}>
            {options.mantra.map((option, idx) => {
              const selected = mantra === option;
              return (
                <Pressable
                  key={option}
                  onPress={() => setMantra(option)}
                  style={[styles.option, selected && styles.optionSelected]}
                  onPressIn={onPressIn}
                  onPressOut={onPressOut}
                >
                  <View style={styles.optionIndex}>
                    <Text style={styles.optionIndexText}>0{idx + 1}</Text>
                  </View>
                  <Text
                    style={[styles.optionText, selected && styles.optionTextSelected]}
                  >
                    {option}
                  </Text>
                  <View style={[styles.radio, selected && styles.radioSelected]}>
                    {selected && <View style={styles.radioInner} />}
                  </View>
                </Pressable>
              );
            })}
          </View>
        ) : (
          <View style={styles.options}>
            {(step === 1 ? options.ambition : options.level).map((option, idx) => {
              const selected = values[step] === option;
              return (
                <Pressable
                  key={option}
                  onPress={() => (step === 1 ? setAmbition(option) : setLevel(option))}
                  style={[styles.option, selected && styles.optionSelected]}
                  onPressIn={onPressIn}
                  onPressOut={onPressOut}
                >
                  <View style={styles.optionIndex}>
                    <Text style={styles.optionIndexText}>0{idx + 1}</Text>
                  </View>
                  <Text
                    style={[styles.optionText, selected && styles.optionTextSelected]}
                  >
                    {option}
                  </Text>
                  <View style={[styles.radio, selected && styles.radioSelected]}>
                    {selected && <View style={styles.radioInner} />}
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </Animated.View>
      <Pressable
        disabled={!canContinue}
        onPress={next}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        style={[styles.button, !canContinue && styles.buttonDisabled]}
      >
        <Animated.View style={[pressedStyle, { flexDirection: "row", alignItems: "center", justifyContent: "space-between", width: "100%" }]}>
          <Text style={styles.buttonText}>
            {step === 3 ? "ENTRAR EN LA FORJA" : "SIGUIENTE"}
          </Text>
          <Text style={styles.arrow}>→</Text>
        </Animated.View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: LUXURY.ink,
    padding: 24,
    justifyContent: "center",
  },
  brand: { alignItems: "center", marginBottom: 52 },
  brandMark: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: LUXURY.graphite,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: `${LUXURY.gold}55`,
  },
  brandGlow: {
    position: "absolute",
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: `${LUXURY.gold}18`,
    zIndex: -1,
  },
  brandMarkText: {
    color: LUXURY.goldSoft,
    fontSize: 34,
    fontWeight: "800",
    letterSpacing: 2,
  },
  brandName: {
    color: LUXURY.snow,
    fontSize: 18,
    letterSpacing: 8,
    fontWeight: "700",
    marginBottom: 4,
  },
  brandTag: {
    color: LUXURY.ash,
    fontSize: 10,
    letterSpacing: 3,
    fontWeight: "600",
  },
  progressTrack: {
    height: 3,
    backgroundColor: LUXURY.charcoal,
    borderRadius: 3,
    marginBottom: 44,
  },
  progressFill: {
    height: "100%",
    backgroundColor: LUXURY.gold,
    borderRadius: 3,
    shadowColor: LUXURY.gold,
    shadowOpacity: 0.5,
    shadowRadius: 12,
  },
  panel: { minHeight: 290 },
  step: {
    color: LUXURY.ash,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.4,
    marginBottom: 10,
  },
  title: {
    color: LUXURY.snow,
    fontSize: 34,
    lineHeight: 40,
    fontWeight: "800",
  },
  subtitle: {
    color: LUXURY.mist,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 10,
    marginBottom: 28,
  },
  input: {
    height: 58,
    borderRadius: 16,
    backgroundColor: LUXURY.graphite,
    paddingHorizontal: 18,
    color: LUXURY.snow,
    fontSize: 17,
    borderWidth: 1,
    borderColor: LUXURY.charcoal,
  },
  options: { gap: 12 },
  option: {
    minHeight: 64,
    borderRadius: 18,
    paddingHorizontal: 14,
    backgroundColor: LUXURY.graphite,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: LUXURY.charcoal,
    gap: 12,
  },
  optionSelected: {
    borderColor: LUXURY.gold,
    backgroundColor: `${LUXURY.gold}14`,
  },
  optionIndex: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: LUXURY.charcoal,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  optionIndexText: {
    color: LUXURY.ash,
    fontSize: 11,
    fontWeight: "800",
  },
  optionText: {
    color: LUXURY.snow,
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
  },
  optionTextSelected: { color: LUXURY.goldSoft, fontWeight: "700" },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: LUXURY.stone,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  radioSelected: { borderColor: LUXURY.gold },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: LUXURY.gold,
  },
  button: {
    minHeight: 58,
    borderRadius: 18,
    backgroundColor: LUXURY.gold,
    paddingHorizontal: 20,
    marginTop: 32,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: LUXURY.gold,
    shadowOpacity: 0.35,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  buttonDisabled: { opacity: 0.28 },
  buttonText: {
    color: LUXURY.ink,
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 1.1,
  },
  arrow: { color: LUXURY.ink, fontSize: 20, fontWeight: "800" },
});

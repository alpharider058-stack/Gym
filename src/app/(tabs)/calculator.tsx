import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown, withSpring, useAnimatedStyle, useSharedValue } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { LUXURY, SHADOWS } from "@/constants/theme";

export default function DeprecatedCalculatorScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pressCta = useSharedValue(1);

  const ctaStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressCta.value }],
  }));

  return (
    <View style={[styles.root, { paddingTop: insets.top + 24 }]}>
      <Animated.View entering={FadeInDown.duration(500)} style={styles.container}>
        <View style={styles.icon}>
          <Text style={styles.iconText}>◆</Text>
        </View>
        <Text style={styles.eyebrow}>HERRAMIENTA EVOLUCIONADA</Text>
        <Text style={styles.title}>Ahora medimos tu fuerza mental</Text>
        <Text style={styles.subtitle}>
          La calculadora de 1RM ha dado paso a mediciones más importantes: tu racha de disciplina, los minutos de enfoque profundo y tu progreso hacia VÉRTICE.
        </Text>

        <Pressable
          onPress={() => {
            pressCta.value = withSpring(0.94);
            setTimeout(() => (pressCta.value = withSpring(1)), 120);
            router.push("/vault" as never);
          }}
          style={{ width: "100%", maxWidth: 340 }}
        >
          <Animated.View style={[styles.cta, ctaStyle]}>
            <Text style={styles.ctaText}>Ver mis Métricas</Text>
          </Animated.View>
        </Pressable>

        <Pressable onPress={() => router.push("/resilience" as never)} style={styles.secondary}>
          <Text style={styles.secondaryText}>Construir Resiliencia</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: LUXURY.ink,
    paddingHorizontal: 24,
  },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 60,
  },
  icon: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: LUXURY.graphite,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
    ...SHADOWS.card,
  },
  iconText: {
    color: LUXURY.neon,
    fontSize: 30,
    fontWeight: "300",
  },
  eyebrow: {
    color: LUXURY.neon,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.6,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 14,
    lineHeight: 34,
  },
  subtitle: {
    color: LUXURY.mist,
    fontSize: 15,
    lineHeight: 23,
    textAlign: "center",
    maxWidth: 340,
    marginBottom: 36,
  },
  cta: {
    width: "100%",
    height: 54,
    borderRadius: 16,
    backgroundColor: LUXURY.neon,
    alignItems: "center",
    justifyContent: "center",
    ...SHADOWS.neon,
  },
  ctaText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  secondary: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  secondaryText: {
    color: LUXURY.mist,
    fontSize: 14,
    fontWeight: "600",
  },
});

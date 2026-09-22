import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown, withSpring, useAnimatedStyle, useSharedValue } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { LUXURY, SHADOWS } from "@/constants/theme";

export default function DeprecatedPlansScreen() {
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
          <Text style={styles.iconText}>✦</Text>
        </View>
        <Text style={styles.eyebrow}>PLANES MEJORADOS</Text>
        <Text style={styles.title}>Tu estrategia ahora es personal</Text>
        <Text style={styles.subtitle}>
          Los planes semanales de entrenamiento han sido reemplazados por el Coach VÉRTICE: diseña una estrategia de ataque basada en tus debilidades, área de enfoque e intensidad deseada.
        </Text>

        <Pressable
          onPress={() => {
            pressCta.value = withSpring(0.94);
            setTimeout(() => (pressCta.value = withSpring(1)), 120);
            router.push("/coach" as never);
          }}
          style={{ width: "100%", maxWidth: 340 }}
        >
          <Animated.View style={[styles.cta, ctaStyle]}>
            <Text style={styles.ctaText}>Abrir Coach VÉRTICE</Text>
          </Animated.View>
        </Pressable>

        <Pressable onPress={() => router.push("/" as never)} style={styles.secondary}>
          <Text style={styles.secondaryText}>Volver al inicio</Text>
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
    color: LUXURY.violet,
    fontSize: 32,
    fontWeight: "300",
  },
  eyebrow: {
    color: LUXURY.violet,
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
    backgroundColor: LUXURY.violet,
    alignItems: "center",
    justifyContent: "center",
    ...SHADOWS.soft,
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

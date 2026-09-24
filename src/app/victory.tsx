import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
    Easing,
    FadeIn,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withSpring,
    withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { LUXURY } from "@/constants/theme";
import { addVictory, type VictoryCard } from "@/lib/forge-storage";

export default function VictoryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{
    title?: string;
    description?: string;
    value?: string;
    icon?: string;
    type?: VictoryCard["type"];
  }>();
  const [saved, setSaved] = useState(false);

  const scale = useSharedValue(0.7);
  const rotate = useSharedValue(-10);
  const glow = useSharedValue(0.4);
  const sparkle = useSharedValue(0.8);

  const title = params.title ?? "¡Victoria sellada!";
  const description =
    params.description ?? "Hoy has demostrado que tu voluntad no se negocia.";
  const value = params.value ?? "1";
  const icon = params.icon ?? "★";
  const type = (params.type ?? "streak") as VictoryCard["type"];

  useEffect(() => {
    scale.value = withSpring(1, { damping: 12, stiffness: 80 });
    rotate.value = withSpring(0, { damping: 14 });
    glow.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 1600, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.35, { duration: 1600, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    );
    sparkle.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: 900, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.9, { duration: 900, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    );
    const save = async () => {
      try {
        await addVictory({
          id: `victory_${Date.now()}`,
          date: new Date().toISOString(),
          title,
          description,
          type,
          value: Number(value) || 1,
          icon,
        });
        setSaved(true);
      } catch {
        setSaved(true);
      }
    };
    save();
  }, []);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { rotate: `${rotate.value}deg` }],
  }));
  const glowStyle = useAnimatedStyle(() => ({
    opacity: glow.value,
  }));
  const sparkleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: sparkle.value }],
  }));

  const accentColor =
    type === "xp"
      ? LUXURY.gold
      : type === "focus"
        ? LUXURY.neon
        : type === "mindset"
          ? LUXURY.violet
          : type === "mission"
            ? LUXURY.emerald
            : LUXURY.amber;

  return (
    <View style={styles.root}>
      <Animated.View
        entering={FadeIn.duration(800)}
        style={{
          flex: 1,
          paddingTop: insets.top + 20,
          paddingBottom: insets.bottom + 20,
          paddingHorizontal: 20,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={[styles.kicker, { color: accentColor }]}>
          VICTORIA · {type.toUpperCase()}
        </Text>

        <Animated.View
          style={[styles.glow, glowStyle, { backgroundColor: accentColor }]}
        />
        <Animated.View
          style={[styles.glow2, glowStyle, { backgroundColor: accentColor }]}
        />

        <Animated.View
          style={[styles.card, cardStyle, { borderColor: `${accentColor}55` }]}
        >
          <Animated.View
            style={[
              sparkleStyle,
              styles.iconWrap,
              { backgroundColor: `${accentColor}22` },
            ]}
          >
            <Text style={[styles.icon, { color: accentColor }]}>{icon}</Text>
          </Animated.View>

          <Text style={[styles.title, { color: accentColor }]}>{title}</Text>
          <Text style={styles.description}>{description}</Text>

          <View style={[styles.value, { backgroundColor: `${accentColor}1A` }]}>
            <Text style={[styles.valueNumber, { color: accentColor }]}>
              {value}
            </Text>
            <Text style={[styles.valueLabel, { color: accentColor }]}>
              {type === "streak"
                ? "DÍAS DE DOMINIO"
                : type === "focus"
                  ? "MINUTOS DE EJECUCIÓN"
                  : type === "mission"
                    ? "CONQUISTAS"
                    : type === "mindset"
                      ? "FORTALEZA MENTAL"
                      : "PUNTOS DE EGO"}
            </Text>
          </View>
        </Animated.View>

        <Pressable
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: accentColor },
            pressed && styles.pressed,
          ]}
          onPress={() => router.back()}
        >
          <Text style={styles.buttonText}>
            {saved ? "VICTORIA SELLADA · VOLVER →" : "VOLVER →"}
          </Text>
        </Pressable>

        <Text style={styles.hint}>
          Esta victoria es la prueba de que tu voluntad es superior.
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: LUXURY.ink },
  kicker: {
    fontSize: 11,
    letterSpacing: 2.2,
    fontWeight: "900",
    marginBottom: 24,
  },
  glow: {
    position: "absolute",
    width: 340,
    height: 340,
    borderRadius: 170,
    opacity: 0.4,
  },
  glow2: {
    position: "absolute",
    width: 480,
    height: 480,
    borderRadius: 240,
    opacity: 0.18,
    filter: "blur(24px)",
  },
  card: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: LUXURY.graphite,
    borderRadius: 28,
    borderWidth: 1,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.5,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 18 },
    elevation: 14,
  },
  iconWrap: {
    width: 92,
    height: 92,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: `${LUXURY.gold}44`,
  },
  icon: {
    fontSize: 40,
    fontWeight: "900",
  },
  title: {
    color: LUXURY.snow,
    fontSize: 26,
    lineHeight: 32,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 8,
  },
  description: {
    color: LUXURY.pearl,
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    marginBottom: 20,
    fontWeight: "500",
  },
  value: {
    width: "100%",
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: "center",
  },
  valueNumber: {
    fontSize: 36,
    fontWeight: "900",
  },
  valueLabel: {
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: "800",
    marginTop: 4,
  },
  button: {
    minHeight: 56,
    borderRadius: 20,
    paddingHorizontal: 22,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 28,
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 22,
    elevation: 12,
  },
  buttonText: {
    color: LUXURY.ink,
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  pressed: { opacity: 0.86, transform: [{ scale: 0.985 }] },
  hint: {
    color: LUXURY.ash,
    fontSize: 11,
    lineHeight: 16,
    textAlign: "center",
    marginTop: 16,
    maxWidth: 320,
  },
});

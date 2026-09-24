import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, {
    FadeInDown,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { LUXURY, SHADOWS } from "@/constants/theme";
import {
    getChampionTitle,
    getConquests,
    getDominanceScore,
    getProfile,
    getRecentTriumphs,
    getTotalConquests,
    getTrophyCase,
    saveTriumph,
    type Conquest,
    type Triumph,
    type Trophy,
} from "@/lib/forge-storage-victory";

export default function HallOfChampions() {
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState(null);
  const [conquests, setConquests] = useState<Conquest[]>([]);
  const [totalConquests, setTotalConquests] = useState(0);
  const [dominanceScore, setDominanceScore] = useState(0);
  const [championTitle, setChampionTitle] = useState("Iniciado");
  const [trophyCase, setTrophyCase] = useState<Trophy[]>([]);
  const [recentTriumphs, setRecentTriumphs] = useState<Triumph[]>([]);
  const [triumphToSave, setTriumphToSave] = useState<{
    title: string;
    description: string;
  } | null>(null);

  const gloryPulse = useSharedValue(1);
  const gloryPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: gloryPulse.value }],
  }));

  useEffect(() => {
    gloryPulse.value = withRepeat(
      withSequence([
        withTiming(1.05, { duration: 1000 }),
        withTiming(1, { duration: 1000 }),
      ]),
      -1,
      true,
    );
  }, []);

  const loadChampionData = useCallback(async () => {
    const [prof, conquestList, total, dominance, title, trophies, triumphs] =
      await Promise.all([
        getProfile(),
        getConquests(),
        getTotalConquests(),
        getDominanceScore(),
        getChampionTitle(),
        getTrophyCase(),
        getRecentTriumphs(),
      ]);
    setProfile(prof);
    setConquests(conquestList);
    setTotalConquests(total);
    setDominanceScore(dominance);
    setChampionTitle(title);
    setTrophyCase(trophies);
    setRecentTriumphs(triumphs);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadChampionData();
    }, [loadChampionData]),
  );

  const saveTriumphHandler = useCallback(async () => {
    if (triumphToSave) {
      await saveTriumph(triumphToSave);
      setTriumphToSave(null);
      // Refresh triumphs
      const updatedTriumphs = await getRecentTriumphs();
      setRecentTriumphs(updatedTriumphs);
    }
  }, [triumphToSave]);

  const gloryLevels = [
    { threshold: 90, title: "LEYENDA VIVA", icon: "👑", color: LUXURY.gold },
    {
      threshold: 75,
      title: "CAMPEÓN ETERNO",
      icon: "⚔️",
      color: LUXURY.emerald,
    },
    {
      threshold: 60,
      title: "SEÑOR DE LA GUERRA",
      icon: "🛡️",
      color: LUXURY.neon,
    },
    { threshold: 40, title: "GUERRERO ELITE", icon: "🎯", color: LUXURY.gold },
    {
      threshold: 20,
      title: "LUCHADOR VALIENTE",
      icon: "💪",
      color: LUXURY.neon,
    },
    {
      threshold: 0,
      title: "INICIADO DEL TRIUNFO",
      icon: "⚡",
      color: LUXURY.graphite,
    },
  ];

  const currentGlory =
    gloryLevels.find((level) => dominanceScore >= level.threshold) ||
    gloryLevels[gloryLevels.length - 1];

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
        {/* Hall of Champions Header */}
        <Animated.View
          entering={FadeInDown.duration(500)}
          style={styles.championHeader}
        >
          <View style={styles.championInfo}>
            <Text style={styles.championName}>
              {profile?.name ? `${profile.name.toUpperCase()}` : "CAMPEÓN"}
            </Text>
            <Text style={styles.championTitle}>{currentGlory.title}</Text>
          </View>
          <Animated.View
            style={[
              styles.championEmblem,
              gloryPulseStyle,
              {
                backgroundColor: `${currentGlory.color}22`,
                borderColor: currentGlory.color,
              },
            ]}
          >
            <Text style={styles.championIcon}>{currentGlory.icon}</Text>
          </Animated.View>
        </Animated.View>

        {/* Glory Metrics */}
        <View style={styles.metricsContainer}>
          <View style={styles.metricsRow}>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>CONQUISTAS TOTALES</Text>
              <Text style={styles.metricValue}>{totalConquests}</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>PUNTUACIÓN DE GLORIA</Text>
              <Text style={styles.metricValue}>{dominanceScore}%</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>TROFEOS OBTENIDOS</Text>
              <Text style={styles.metricValue}>{trophyCase.length}</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>TRIUNFOS RECIENTES</Text>
              <Text style={styles.metricValue}>{recentTriumphs.length}</Text>
            </View>
          </View>
        </View>

        {/* Glory Bar */}
        <View style={styles.glorySection}>
          <Text style={styles.sectionTitle}>BARRA DE GLORIA</Text>
          <View style={styles.gloryTrackContainer}>
            <View style={styles.gloryTrack}>
              <View
                style={[
                  styles.gloryFill,
                  {
                    width: `${dominanceScore}%`,
                    backgroundColor: currentGlory.color,
                  },
                ]}
              />
            </View>
          </View>
          <View style={styles.gloryLabelContainer}>
            <Text style={styles.gloryLabel}>{currentGlory.title}</Text>
            <Text style={styles.glorySubtitle}>
              {`${Math.ceil((currentGlory.threshold - dominanceScore) / 10) * 10}% para alcanzar el siguiente nivel`}
            </Text>
          </View>
        </View>

        {/* Trophy Case */}
        {trophyCase.length > 0 ? (
          <View style={styles.trophySection}>
            <Text style={styles.sectionTitle}>CAMARA DE TROFEOS</Text>
            <View style={styles.trophyCaseContainer}>
              {trophyCase.map((trophy, index) => (
                <View key={trophy.id} style={styles.trophyDisplay}>
                  <View style={styles.trophyIconContainer}>
                    <Text style={styles.trophyIconText}>{trophy.icon}</Text>
                  </View>
                  <View style={styles.trophyInfo}>
                    <Text style={styles.trophyName}>{trophy.name}</Text>
                    <Text style={styles.trophyDescription}>
                      {trophy.description}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        ) : (
          <View style={styles.emptyTrophyCase}>
            <Text style={styles.emptyTrophyText}>
              Tu cámara de trofeos espera sus primeros premios.
            </Text>
            <Text style={styles.emptyTrophySubtext}>
              Cada conquista épica merece ser inmortalizada. Sigue luchando y
              tus trofeos llegarán.
            </Text>
          </View>
        )}

        {/* Recent Triumphs */}
        {recentTriumphs.length > 0 ? (
          <View style={styles.triumphsSection}>
            <Text style={styles.sectionTitle}>TRIUNFOS RECENTES</Text>
            <View style={styles.triumphsList}>
              {recentTriumphs.map((triumph, index) => (
                <View key={triumph.id} style={styles.triumphCard}>
                  <Animated.View style={gloryPulseStyle}>
                    <View style={styles.triumphPulseContainer}>
                      <Text style={styles.triumphPulseText}>⚡</Text>
                    </View>
                  </Animated.View>
                  <View style={styles.triumphContent}>
                    <Text style={styles.triumphTitle}>{triumph.title}</Text>
                    <Text style={styles.triumphDescription}>
                      {triumph.description}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
            {recentTriumphs.length >= 3 && (
              <Pressable
                style={styles.viewAllTriumphs}
                onPress={() => {
                  setTriumphToSave({
                    title: "¿Qué triunfo reciente quieres celebrar?",
                    description:
                      "Describe tu victoria para inmortalizarla en el salón de los campeones",
                  });
                }}
              >
                <Text style={styles.viewAllText}>
                  Añadir un nuevo triunfo →
                </Text>
              </Pressable>
            )}
          </View>
        ) : (
          <View style={styles.emptyTriumphs}>
            <Text style={styles.emptyTriumphsText}>
              Aún no hay triunfos registrados.
            </Text>
            <Text style={styles.emptyTriumphsSubtext}>
              Cada acto de voluntad es un triunfo esperando ser reconocido.
              Comienza tu jornada de victorias hoy.
            </Text>
          </View>
        )}

        {/* Call to Action: Record New Triumph */}
        <View style={styles.ctaSection}>
          <Pressable
            style={({ pressed }) => [
              styles.triumphCta,
              pressed && styles.triumphCtaPressed,
            ]}
            onPress={() => {
              setTriumphToSave({
                title: "Nuevo triunfo épico",
                description:
                  "Describe tu victoria para inmortalizarla en el salón de los campeones",
              });
            }}
          >
            <View style={styles.ctaIconContainer}>
              <Text style={styles.ctaIconText}>📜</Text>
            </View>
            <View style={styles.ctaTextContainer}>
              <Text style={styles.ctaEyebrow}>INMORTALIZAR TRIUNFO</Text>
              <Text style={styles.ctaLabel}>
                Registra tu próxima victoria legendaria
              </Text>
            </View>
          </Pressable>
        </View>

        {/* Footer Wisdom */}
        <View style={styles.footerContainer}>
          <Text style={styles.footerText}>
            VÉRTICE. Donde los guerreros se convierten en inmortales.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: LUXURY.ink },
  championHeader: {
    alignItems: "center",
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  championInfo: {
    alignItems: "center",
  },
  championName: {
    color: LUXURY.gold,
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: -1,
    marginBottom: 4,
  },
  championTitle: {
    color: LUXURY.pearl,
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  championEmblem: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
  },
  championIcon: {
    fontSize: 36,
    fontWeight: "800",
  },
  metricsContainer: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  metricsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  metricCard: {
    flex: 1,
    minWidth: 80,
    backgroundColor: LUXURY.graphite,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: LUXURY.charcoal,
  },
  metricLabel: {
    color: LUXURY.ash,
    fontSize: 10,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 4,
  },
  metricValue: {
    color: LUXURY.gold,
    fontSize: 24,
    fontWeight: "800",
    textAlign: "center",
  },
  glorySection: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    color: LUXURY.gold,
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
    marginBottom: 12,
    textAlign: "left",
  },
  gloryTrackContainer: {
    width: "100%",
    height: 12,
    backgroundColor: LUXURY.slate,
    borderRadius: 6,
    overflow: "hidden",
  },
  gloryTrack: {
    height: "100%",
  },
  gloryFill: {
    height: "100%",
  },
  gloryLabelContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    paddingHorizontal: 12,
  },
  gloryLabel: {
    color: LUXURY.pearl,
    fontSize: 14,
    fontWeight: "600",
  },
  glorySubtitle: {
    color: LUXURY.mist,
    fontSize: 12,
  },
  trophySection: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  trophyCaseContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "center",
  },
  trophyDisplay: {
    alignItems: "center",
    justifyContent: "center",
    width: 80,
    height: 100,
  },
  trophyIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: `${LUXURY.gold}33`,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  trophyIconText: {
    fontSize: 24,
    fontWeight: "800",
  },
  trophyInfo: {
    alignItems: "center",
  },
  trophyName: {
    color: LUXURY.snow,
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  trophyDescription: {
    color: LUXURY.mist,
    fontSize: 12,
    textAlign: "center",
    lineHeight: 16,
  },
  emptyTrophyCase: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    backgroundColor: LUXURY.graphite,
    borderRadius: 20,
  },
  emptyTrophyText: {
    color: LUXURY.pearl,
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 12,
  },
  emptyTrophySubtext: {
    color: LUXURY.mist,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  triumphsSection: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  triumphsList: {
    gap: 16,
  },
  triumphCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: LUXURY.graphite,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: LUXURY.charcoal,
  },
  triumphPulseContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: `${LUXURY.gold}18`,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  triumphPulseText: {
    color: LUXURY.gold,
    fontSize: 18,
    fontWeight: "600",
  },
  triumphContent: {
    flex: 1,
  },
  triumphTitle: {
    color: LUXURY.snow,
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  triumphDescription: {
    color: LUXURY.mist,
    fontSize: 14,
    lineHeight: 20,
  },
  emptyTriumphs: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    backgroundColor: LUXURY.graphite,
    borderRadius: 20,
  },
  emptyTriumphsText: {
    color: LUXURY.pearl,
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 12,
  },
  emptyTriumphsSubtext: {
    color: LUXURY.mist,
    fontSize: 16,
    textAlign: "center",
    lineHeight: 22,
  },
  viewAllTriumphs: {
    marginTop: 16,
    alignItems: "center",
  },
  viewAllText: {
    color: LUXURY.gold,
    fontSize: 14,
    fontWeight: "600",
  },
  ctaSection: {
    marginHorizontal: 20,
    marginBottom: 32,
  },
  triumphCta: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: LUXURY.gold,
    borderRadius: 50,
    paddingVertical: 16,
    paddingHorizontal: 24,
    ...SHADOWS.gold,
  },
  triumphCtaPressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
  ctaIconContainer: {
    marginRight: 12,
  },
  ctaIconText: {
    fontSize: 20,
  },
  ctaTextContainer: {
    flex: 1,
  },
  ctaEyebrow: {
    color: LUXURY.ink,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  ctaLabel: {
    color: LUXURY.ink,
    fontSize: 16,
    fontWeight: "600",
  },
  footerContainer: {
    marginHorizontal: 20,
    paddingVertical: 24,
    alignItems: "center",
  },
  footerText: {
    color: LUXURY.pearl,
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
});

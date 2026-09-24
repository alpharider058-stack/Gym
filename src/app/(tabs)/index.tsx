import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { LUXURY, SHADOWS } from "@/constants/theme";
import {
  getProfile,
  getStreak,
  getXp,
  getRecentVictories,
  getTotalVictories,
  getDominanceScore,
  getChampionRank,
  saveDailyAffirmation,
  getDailyAffirmation,
  type Victory,
  type WarriorProfile,
} from "@/lib/forge-storage-victory";

export default function VictoryDashboard() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [profile, setProfile] = useState<WarriorProfile | null>(null);
  const [streak, setStreak] = useState({ current: 0, best: 0 });
  const [xp, setXp] = useState(0);
  const [recentVictories, setRecentVictories] = useState<Victory[]>([]);
  const [totalVictories, setTotalVictories] = useState(0);
  const [dominanceScore, setDominanceScore] = useState(0);
  const [championRank, setChampionRank] = useState({ name: "Iniciado", icon: "⚔️", color: LUXURY.graphite });
  const [affirmation, setAffirmation] = useState("");

  const victoryPulse = useSharedValue(1);
  const victoryPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: victoryPulse.value }],
  }));

  useEffect(() => {
    victoryPulse.value = withRepeat(
      withTiming(1.03, { duration: 1800 }),
      -1,
      true,
    );
  }, [victoryPulse]);

  const refresh = useCallback(async () => {
    const [
      prof,
      streakData,
      xpData,
      victories,
      total,
      dominance,
      rank,
      dailyAffirmation,
    ] = await Promise.all([
      getProfile(),
      getStreak(),
      getXp(),
      getRecentVictories(),
      getTotalVictories(),
      getDominanceScore(),
      getChampionRank(),
      getDailyAffirmation(),
    ]);
    setProfile(prof);
    setStreak(streakData);
    setXp(xpData);
    setRecentVictories(victories);
    setTotalVictories(total);
    setDominanceScore(dominance);
    setChampionRank(rank);
    setAffirmation(dailyAffirmation || "Soy imparable. Cada día conquisto más.");
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  const getVictoryTitle = (victory: Victory) => {
    return victory.title || `Victoria #${victory.id}`;
  };

  const getVictoryDescription = (victory: Victory) => {
    return victory.description || "Una conquista personal que demostró tu fuerza interior.";
  };

  return (
    <ScrollView
      style={{ backgroundColor: LUXURY.ink }}
      contentContainerStyle={{
        paddingHorizontal: 24,
        paddingTop: insets.top + 16,
        paddingBottom: insets.bottom + 120,
      }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header with Champion Status */}
      <View style={styles.championHeader}>
        <Text style={styles.championTitle}>
          {profile?.name ? `${profile.name.toUpperCase()}` : "CAMPEÓN"}
        </Text>
        <Text style={styles.championSubtitle}>
          {championRank.name}
        </Text>
        <View style={styles.championBadge}>
          <Text style={styles.championIcon}>{championRank.icon}</Text>
          <Text style={styles.championRankText}>{championRank.name}</Text>
        </View>
      </View>

      {/* Daily Affirmation */}
      <View style={styles.affirmationCard}>
        <Text style={styles.affirmationText}>"{affirmation}"</Text>
      </View>

      {/* Victory Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>VICTORIAS TOTALES</Text>
            <Text style={styles.statValue}>{totalVictories}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>RACHA DE WINS</Text>
            <Text style={styles.statValue}>{streak.current}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>PUNTUACIÓN DE DOMINIO</Text>
            <Text style={styles.statValue}>{dominanceScore}%</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>XP DE GLORIA</Text>
            <Text style={styles.statValue}>{xp}</Text>
          </View>
        </View>
      </View>

      {/* Recent Victories */}
      {recentVictories.length > 0 ? (
        <View style={styles.victoriesSection}>
          <Text style={styles.sectionTitle}>ÚLTIMAS CONQUISTAS</Text>
          <View style={styles.victoriesList}>
            {recentVictories.slice(0, 3).map((victory, index) => (
              <View key={victory.id} style={styles.victoryCard}>
                <View style={styles.victoryPulseContainer}>
                  <Animated.View style={victoryPulseStyle}>
                    <View style={styles.victoryBadge}>
                      <Text style={styles.victoryBadgeText}>{index + 1}</Text>
                    </View>
                  </Animated.View>
                </View>
                <View style={styles.victoryContent}>
                  <Text style={styles.victoryTitle}>{getVictoryTitle(victory)}</Text>
                  <Text style={styles.victoryDescription}>{getVictoryDescription(victory)}</Text>
                </View>
              </View>
            ))}
          </View>
          {recentVictories.length > 3 && (
            <Pressable
              style={styles.viewAllButton}
              onPress={() => router.push("/(tabs)/victory-archive" as never)}
            >
              <Text style={styles.viewAllText}>Ver todas las {recentVictories.length} victorias →</Text>
            </Pressable>
          )}
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>¡Aún no tienes victorias registradas!</Text>
          <Text style={styles.emptyStateSubtext}>
            Cada acción consciente es una victoria.
            Comienza tu viaje de conquistas hoy.
          </Text>
          <Pressable
            style={styles.startVictoryButton}
            onPress={() => router.push("/create-victory" as never)}
          >
            <Text style={styles.startVictoryText}>CREAR MI PRIMERA VICTORIA →</Text>
          </Pressable>
        </View>
      )}

      {/* Dominance Meter */}
      <View style={styles.dominanceSection}>
        <Text style={styles.dominanceTitle}>NIVEL DE DOMINIO</Text>
        <View style={styles.dominanceTrackContainer}>
          <View style={styles.dominanceTrack}>
            <View
              style={[
                styles.dominanceFill,
                { width: `${dominanceScore}%` }
              ]}
            />
          </View>
        </View>
        <Text style={styles.dominanceLabel}>
          {dominanceScore >= 90 ? "LEYENDA VIVO" :
           dominanceScore >= 70 ? "CAMPEÓN ESTABLECIDO" :
           dominanceScore >= 50 ? "GUERRERO RESPECTADO" :
           "ASCENDIENDO AL PODER"}
        </Text>
      </View>

      {/* Call to Action */}
      <View style={styles.ctaContainer}>
        <Pressable
          style={({ pressed }) => [
            styles.victoryCta,
            pressed && styles.victoryCtaPressed,
          ]}
          onPress={() => router.push("/create-victory" as never)}
        >
          <View style={styles.ctaIconContainer}>
            <Text style={styles.ctaIconText}>⚔️</Text>
          </View>
          <View style={styles.ctaTextContainer}>
            <Text style={styles.ctaEyebrow}>INICIAR NUEVA CONQUISTA</Text>
            <Text style={styles.ctaLabel}>Registra tu próxima victoria</Text>
          </View>
        </Pressable>
      </View>

      {/* Footer Wisdom */}
      <View style={styles.footerContainer}>
        <Text style={styles.footerText}>
          VÉRTICE. Donde los guerreros se convierten en leyendas.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  championHeader: {
    alignItems: "center",
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  championTitle: {
    color: LUXURY.gold,
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: -1,
    marginBottom: 4,
  },
  championSubtitle: {
    color: LUXURY.pearl,
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  championBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: LUXURY.graphite,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: LUXURY.gold,
  },
  championIcon: {
    fontSize: 24,
  },
  championRankText: {
    color: LUXURY.gold,
    fontSize: 14,
    fontWeight: "700",
  },
  affirmationCard: {
    backgroundColor: `${LUXURY.gold}0d`,
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: `${LUXURY.gold}33`,
  },
  affirmationText: {
    color: LUXURY.ink,
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 24,
    fontStyle: "italic",
  },
  statsContainer: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  statCard: {
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
  statLabel: {
    color: LUXURY.ash,
    fontSize: 10,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 4,
  },
  statValue: {
    color: LUXURY.gold,
    fontSize: 24,
    fontWeight: "800",
    textAlign: "center",
  },
  victoriesSection: {
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
  victoriesList: {
    gap: 16,
  },
  victoryCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: LUXURY.graphite,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: LUXURY.charcoal,
  },
  victoryPulseContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${LUXURY.gold}18`,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  victoryBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: LUXURY.gold,
    alignItems: "center",
    justifyContent: "center",
  },
  victoryBadgeText: {
    color: LUXURY.ink,
    fontSize: 12,
    fontWeight: "700",
  },
  victoryContent: {
    flex: 1,
  },
  victoryTitle: {
    color: LUXURY.snow,
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  victoryDescription: {
    color: LUXURY.mist,
    fontSize: 14,
    lineHeight: 20,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    backgroundColor: LUXURY.graphite,
    borderRadius: 20,
    marginHorizontal: 20,
  },
  emptyStateText: {
    color: LUXURY.pearl,
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 12,
  },
  emptyStateSubtext: {
    color: LUXURY.mist,
    fontSize: 14,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  startVictoryButton: {
    backgroundColor: LUXURY.gold,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 50,
  },
  startVictoryText: {
    color: LUXURY.ink,
    fontSize: 16,
    fontWeight: "700",
  },
  dominanceSection: {
    marginHorizontal: 20,
    marginBottom: 24,
    alignItems: "center",
  },
  dominanceTitle: {
    color: LUXURY.gold,
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  dominanceTrackContainer: {
    width: "100%",
    height: 12,
    backgroundColor: LUXURY.slate,
    borderRadius: 6,
    overflow: "hidden",
  },
  dominanceTrack: {
    height: "100%",
  },
  dominanceFill: {
    height: "100%",
    backgroundColor: LUXURY.gold,
  },
  dominanceLabel: {
    color: LUXURY.pearl,
    fontSize: 14,
    fontWeight: "600",
    marginTop: 8,
  },
  ctaContainer: {
    marginHorizontal: 20,
    marginBottom: 32,
  },
  victoryCta: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: LUXURY.gold,
    borderRadius: 50,
    paddingVertical: 16,
    paddingHorizontal: 24,
    ...SHADOWS.gold,
  },
  victoryCtaPressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
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

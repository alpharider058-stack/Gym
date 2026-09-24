import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, {
  FadeInDown,
  FadeInRight,
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
  getDailyConquest,
  getConquestStreak,
  getTotalConquestsCompleted,
  getConquestPoints,
  getConquestRank,
  saveConquestProgress,
  type DailyConquest,
  type ConquestReward,
  type ConquestRankInfo,
} from "@/lib/forge-storage-victory";

export default function DailyConquestSystem() {
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState(null);
  const [dailyConquest, setDailyConquest] = useState<DailyConquest | null>(null);
  const [conquestStreak, setConquestStreak] = useState({ current: 0, best: 0 });
  const [totalCompleted, setTotalCompleted] = useState(0);
  const [conquestPoints, setConquestPoints] = useState(0);
  const [conquestRank, setConquestRank] = useState<ConquestRankInfo>({
    name: "Recluta",
    icon: "⚔️",
    color: LUXURY.graphite,
    pointsToNext: 100,
  });
  const [isCompleted, setIsCompleted] = useState(false);
  const [completionPercentage, setCompletionPercentage] = useState(0);

  const conquestPulse = useSharedValue(1);
  const conquestPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: conquestPulse.value }],
  }));

  useEffect(() => {
    conquestPulse.value = withRepeat(
      withTiming(1.04, { duration: 1500 }),
      -1,
      true,
    );
  }, [conquestPulse]);

  const loadConquestData = useCallback(async () => {
    const [
      prof,
      conquest,
      streak,
      total,
      points,
      rank,
    ] = await Promise.all([
      getProfile(),
      getDailyConquest(),
      getConquestStreak(),
      getTotalConquestsCompleted(),
      getConquestPoints(),
      getConquestRank(),
    ]);
    setProfile(prof);
    setDailyConquest(conquest);
    setConquestStreak(streak);
    setTotalCompleted(total);
    setConquestPoints(points);
    setConquestRank(rank);

    // Calculate completion percentage for today's conquest
    if (conquest) {
      const completedActions = conquest.requiredActions.filter(
        action => action.completed
      ).length;
      const percentage = (completedActions / conquest.requiredActions.length) * 100;
      setCompletionPercentage(percentage);
      setIsCompleted(completedActions === conquest.requiredActions.length);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadConquestData();
    }, [loadConquestData])
  );

  const toggleActionCompletion = useCallback(async (actionId: string) => {
    if (!dailyConquest) return;

    const updatedActions = dailyConquest.requiredActions.map(action =>
      action.id === actionId
        ? { ...action, completed: !action.completed }
        : action
    );

    const completedActions = updatedActions.filter(a => a.completed).length;
    const percentage = (completedActions / updatedActions.length) * 100;
    setCompletionPercentage(percentage);

    const isNowCompleted = completedActions === updatedActions.length;
    setIsCompleted(isNowCompleted);

    await saveConquestProgress({
      ...dailyConquest,
      requiredActions: updatedActions,
    });

    // Refresh data
    const [
      updatedStreak,
      updatedTotal,
      updatedPoints,
      updatedRank,
    ] = await Promise.all([
      getConquestStreak(),
      getTotalConquestsCompleted(),
      getConquestPoints(),
      getConquestRank(),
    ]);
    setConquestStreak(updatedStreak);
    setTotalCompleted(updatedTotal);
    setConquestPoints(updatedPoints);
    setConquestRank(updatedRank);
  }, [dailyConquest]);

  const claimReward = useCallback(async () => {
    if (!dailyConquest || !isCompleted) return;

    await saveConquestProgress({
      ...dailyConquest,
      claimed: true,
    });

    // Refresh data
    const [
      updatedStreak,
      updatedTotal,
      updatedPoints,
      updatedRank,
      newConquest,
    ] = await Promise.all([
      getConquestStreak(),
      getTotalConquestsCompleted(),
      getConquestPoints(),
      getConquestRank(),
      getDailyConquest(),
    ]);
    setConquestStreak(updatedStreak);
    setTotalCompleted(updatedTotal);
    setConquestPoints(updatedPoints);
    setConquestRank(updatedRank);
    setDailyConquest(newConquest);
    setCompletionPercentage(0);
    setIsCompleted(false);
  }, [dailyConquest, isCompleted]);

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
        {/* Daily Conquest Header */}
        <Animated.View
          entering={FadeInDown.duration(500)}
          style={styles.conquestHeader}
        >
          <View style={styles.conquestInfo}>
            <Text style={styles.conquestTitle}>
              {profile?.name ? `${profile.name.toUpperCase()}` : "GUERRERO"}
            </Text>
            <Text style={styles.conquestSubtitle}>
              SISTEMA DE CONQUISTAS DIARIAS
            </Text>
          </View>
          <Animated.View style={[styles.conquestEmblem, conquestPulseStyle]}>
            <Text style={styles.conquestIcon}>🏆</Text>
          </Animated.View>
        </Animated.View>

        {/* Conquest Rank & Points */}
        <View style={styles.rankSection}>
          <View style={styles.rankBadge}>
            <Text style={styles.rankIcon}>{conquestRank.icon}</Text>
            <View style={styles.rankText}>
              <Text style={styles.rankName}>{conquestRank.name}</Text>
              <Text style={styles.rankProgress}>
                {conquestPoints}/{conquestRank.pointsToNext} Puntos de Gloria
              </Text>
            </View>
          </View>
        </View>

        {/* Daily Conquest Card */}
        {dailyConquest ? (
          <Animated.View
            entering={FadeInRight.duration(400)}
            style={styles.dailyConquestCard}
          >
            <View style={styles.conquestCardHeader}>
              <Text style={styles.conquestCardTitle}>
                {dailyConquest.title}
              </Text>
              <Text style={styles.conquestCardDate}>
                {dailyConquest.date}
              </Text>
            </View>

            <View style={styles.conquestDescription}>
              <Text style={styles.conquestDescriptionText}>
                {dailyConquest.description}
              </Text>
            </View>

            <View style={styles.conquestActions}>
              {dailyConquest.requiredActions.map((action, index) => (
                <View key={action.id} style={styles.actionItem}>
                  <Pressable
                    onPress={() => toggleActionCompletion(action.id)}
                    style={[
                      styles.actionButton,
                      action.completed && styles.actionButtonCompleted,
                    ]}
                  >
                    <View style={styles.actionIconContainer}>
                      <Text style={styles.actionIcon}>
                        {action.completed ? "✓" : "○"}
                      </Text>
                    </View>
                    <View style={styles.actionContent}>
                      <Text style={styles.actionText}>
                        {action.text}
                      </Text>
                      {action.detail && (
                        <Text style={styles.actionDetail}>
                          {action.detail}
                        </Text>
                      )}
                    </View>
                  </Pressable>
                </View>
              ))}
            </View>

            <View style={styles.progressSection}>
              <Text style={styles.progressLabel}>
                PROGRESO DE LA CONQUISTA
              </Text>
              <View style={styles.progressTrackContainer}>
                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${completionPercentage}%` }
                    ]}
                  />
                </View>
              </View>
              <Text style={styles.progressPercentage}>
                {Math.round(completionPercentage)}%
              </Text>
            </View>

            {!isCompleted && (
              <Pressable
                style={[
                  styles.claimButton,
                  !isCompleted && styles.claimButtonDisabled,
                ]}
                disabled={!isCompleted}
                onPress={() => {
                  // Show tooltip or hint about completing actions
                  alert("Completa todas las acciones para reclamar tu recompensa");
                }}
              >
                <Text style={styles.claimButtonText}>
                  COMPLETAR ACCIONES PRIMERO
                </Text>
              </Pressable>
            )}

            {isCompleted && (
              <Pressable
                style={styles.claimButton}
                onPress={claimReward}
              >
                <Text style={styles.claimButtonText}>
                  RECLAMAR RECOMPENSA
                </Text>
              </Pressable>
            )}
          </Animated.View>
        ) : (
          <View style={styles.loadingState}>
            <Text style={styles.loadingText}>Preparando tu conquista diaria...</Text>
            <Text style={styles.loadingSubtext}>
              Vuelve en unos momentos para enfrentar tu desafío.
            </Text>
          </View>
        )}

        {/* Conquest Stats */}
        <View style={styles.statsSection}>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>RACTHA DE CONQUISTAS</Text>
              <Text style={styles.statValue}>{conquestStreak.current}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>MEJOR RACHA</Text>
              <Text style={styles.statValue}>{conquestStreak.best}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>TOTAL COMPLETADAS</Text>
              <Text style={styles.statValue}>{totalCompleted}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>PUNTOS DE GLORIA</Text>
              <Text style={styles.statValue}>{conquestPoints}</Text>
            </View>
          </View>
        </View>

        {/* Rewards Preview */}
        <View style={styles.rewardsSection}>
          <Text style={styles.sectionTitle}>RECOMPENSAS POSIBLES</Text>
          <View style={styles.rewardsPreview}>
            {/* Example rewards - would come from actual data */}
            {[1, 2, 3].map((reward, index) => (
              <View key={index} style={styles.rewardPreviewItem}>
                <View style={styles.rewardIcon}>
                  <Text style={styles.rewardIconText}>🎁</Text>
                </View>
                <View style={styles.rewardInfo}>
                  <Text style={styles.rewardName}>
                    Cofre del Victorioso
                  </Text>
                  <Text style={styles.rewardDescription}>
                    +50 Puntos de Gloria
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Daily Wisdom */}
        <View style={styles.wisdomSection}>
          <Text style={styles.wisdomText}>
            "Cada conquista diaria te acerca más a la leyenda que estás destinado a ser."
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: LUXURY.ink },
  conquestHeader: {
    alignItems: "center",
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  conquestInfo: {
    alignItems: "center",
  },
  conquestTitle: {
    color: LUXURY.gold,
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: -1,
    marginBottom: 4,
  },
  conquestSubtitle: {
    color: LUXURY.pearl,
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  conquestEmblem: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${LUXURY.gold}22`,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: LUXURY.gold,
  },
  conquestIcon: {
    fontSize: 36,
    fontWeight: "800",
  },
  rankSection: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  rankBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: LUXURY.graphite,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: LUXURY.gold,
  },
  rankIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  rankText: {
    flex: 1,
  },
  rankName: {
    color: LUXURY.snow,
    fontSize: 16,
    fontWeight: "700",
  },
  rankProgress: {
    color: LUXURY.mist,
    fontSize: 12,
  },
  dailyConquestCard: {
    backgroundColor: LUXURY.graphite,
    borderRadius: 20,
    padding: 24,
    marginHorizontal: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: `${LUXURY.gold}33`,
  },
  conquestCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  conquestCardTitle: {
    color: LUXURY.snow,
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 4,
  },
  conquestCardDate: {
    color: LUXURY.mist,
    fontSize: 12,
  },
  conquestDescription: {
    marginBottom: 20,
  },
  conquestDescriptionText: {
    color: LUXURY.pearl,
    fontSize: 14,
    lineHeight: 20,
  },
  conquestActions: {
    gap: 12,
  },
  actionItem: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: LUXURY.obsidian,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: LUXURY.charcoal,
  },
  actionButtonCompleted: {
    backgroundColor: `${LUXURY.gold}22`,
    borderColor: `${LUXURY.gold}44`,
  },
  actionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: LUXURY.gold,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  actionIcon: {
    color: LUXURY.ink,
    fontSize: 18,
    fontWeight: "800",
  },
  actionContent: {
    flex: 1,
  },
  actionText: {
    color: LUXURY.snow,
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },
  actionDetail: {
    color: LUXURY.mist,
    fontSize: 12,
  },
  progressSection: {
    marginVertical: 20,
  },
  progressLabel: {
    color: LUXURY.pearl,
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 8,
  },
  progressTrackContainer: {
    width: "100%",
    height: 8,
    backgroundColor: LUXURY.slate,
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 4,
  },
  progressTrack: {
    height: "100%",
  },
  progressFill: {
    height: "100%",
    backgroundColor: LUXURY.gold,
  },
  progressPercentage: {
    color: LUXURY.gold,
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
  claimButton: {
    backgroundColor: LUXURY.gold,
    borderRadius: 50,
    paddingVertical: 16,
    paddingHorizontal: 32,
    marginTop: 12,
    ...SHADOWS.gold,
  },
  claimButtonDisabled: {
    opacity: 0.5,
  },
  claimButtonText: {
    color: LUXURY.ink,
    fontSize: 16,
    fontWeight: "700",
  },
  loadingState: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    backgroundColor: LUXURY.graphite,
    borderRadius: 20,
  },
  loadingText: {
    color: LUXURY.pearl,
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 12,
  },
  loadingSubtext: {
    color: LUXURY.mist,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  statsSection: {
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
  rewardsSection: {
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
  rewardsPreview: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "center",
  },
  rewardPreviewItem: {
    alignItems: "center",
    gap: 8,
  },
  rewardIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: `${LUXURY.gold}33`,
    alignItems: "center",
    justifyContent: "center",
  },
  rewardIconText: {
    fontSize: 24,
    fontWeight: "800",
  },
  rewardInfo: {
    alignItems: "center",
  },
  rewardName: {
    color: LUXURY.snow,
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  rewardDescription: {
    color: LUXURY.mist,
    fontSize: 12,
    textAlign: "center",
  },
  wisdomSection: {
    marginHorizontal: 20,
    paddingVertical: 24,
    alignItems: "center",
    backgroundColor: LUXURY.graphite,
    borderRadius: 20,
  },
  wisdomText: {
    color: LUXURY.pearl,
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 20,
    fontStyle: "italic",
  },
});
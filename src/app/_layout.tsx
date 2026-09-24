import { DarkTheme, Stack, ThemeProvider, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

import { AnimatedSplashOverlay } from "@/components/animated-icon";
import Onboarding from "@/components/onboarding";
import { LUXURY } from "@/constants/theme";
import {
  getActiveBlock,
  getProfile,
  type WarriorProfile,
} from "@/lib/forge-storage";

SplashScreen.preventAutoHideAsync();

const VERTICE_THEME = {
  ...DarkTheme,
  dark: true,
  colors: {
    ...DarkTheme.colors,
    background: LUXURY.ink,
    card: LUXURY.graphite,
    text: LUXURY.snow,
    border: LUXURY.charcoal,
    notification: LUXURY.gold,
    primary: LUXURY.gold,
  },
};

export default function TabLayout() {
  const [profile, setProfile] = useState<WarriorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const stored = await getProfile();
      if (cancelled) return;
      setProfile(stored);
      setLoading(false);
      if (stored) {
        const active = await getActiveBlock();
        if (active) {
          setTimeout(() => {
            router.push("/focus" as never);
          }, 250);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const finishOnboarding = async () => {
    const stored = await getProfile();
    setProfile(stored);
  };

  return (
    <ThemeProvider value={VERTICE_THEME}>
      <AnimatedSplashOverlay />
      {loading ? (
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: LUXURY.ink,
          }}
        >
          <ActivityIndicator color={LUXURY.gold} />
        </View>
      ) : profile ? (
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: LUXURY.ink },
          }}
        >
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="focus"
            options={{
              presentation: "fullScreenModal",
              animation: "fade",
              gestureEnabled: false,
            }}
          />
        </Stack>
      ) : (
        <Onboarding onFinished={finishOnboarding} />
      )}
    </ThemeProvider>
  );
}

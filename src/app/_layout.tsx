import AsyncStorage from "@react-native-async-storage/async-storage";
import { DarkTheme, Stack, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

import { AnimatedSplashOverlay } from "@/components/animated-icon";
import { Onboarding, WarriorProfile } from "@/components/onboarding";
import { LUXURY } from "@/constants/theme";

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

  useEffect(() => {
    AsyncStorage.getItem("vertice-profile").then((stored) => {
      if (stored) setProfile(JSON.parse(stored));
      setLoading(false);
    });
  }, []);

  const finishOnboarding = (nextProfile: WarriorProfile) => {
    setProfile(nextProfile);
    AsyncStorage.setItem("vertice-profile", JSON.stringify(nextProfile));
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
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: LUXURY.ink } }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="focus" options={{ presentation: "modal" }} />
          <Stack.Screen name="breathing" options={{ presentation: "transparentModal", animation: "fade" }} />
          <Stack.Screen name="victory" options={{ presentation: "modal", animation: "fade" }} />
        </Stack>
      ) : (
        <Onboarding onComplete={finishOnboarding} />
      )}
    </ThemeProvider>
  );
}

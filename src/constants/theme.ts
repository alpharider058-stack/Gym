import "@/global.css";

import { Platform } from "react-native";

export const LUXURY = {
  ink: "#000000",
  obsidian: "#0A0A0C",
  graphite: "#1C1C1E",
  charcoal: "#2C2C2E",
  slate: "#3A3A3C",
  stone: "#48484A",
  ash: "#636366",
  mist: "#8E8E93",
  pearl: "#C7C7CC",
  snow: "#F2F2F7",
  gold: "#D4AF37",
  goldSoft: "#F5D97C",
  titanium: "#B0B3B8",
  titaniumBright: "#E5E5EA",
  neon: "#0A84FF",
  neonSoft: "#64D2FF",
  blood: "#FF3B30",
  emerald: "#30D158",
  amber: "#FF9F0A",
  violet: "#BF5AF2",
  rose: "#FF375F",
  teal: "#30B0C7",
  indigo: "#5E5CE6",
};

export const Colors = {
  light: {
    text: "#000000",
    background: "#ffffff",
    backgroundElement: "#F0F0F3",
    backgroundSelected: "#E0E1E6",
    textSecondary: "#60646C",
  },
  dark: {
    text: "#ffffff",
    background: LUXURY.ink,
    backgroundElement: LUXURY.graphite,
    backgroundSelected: LUXURY.charcoal,
    textSecondary: LUXURY.mist,
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "var(--font-display)",
    serif: "var(--font-serif)",
    rounded: "var(--font-rounded)",
    mono: "var(--font-mono)",
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;

export const SHADOWS = {
  card: {
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
  soft: {
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  gold: {
    shadowColor: LUXURY.gold,
    shadowOpacity: 0.35,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  neon: {
    shadowColor: LUXURY.neon,
    shadowOpacity: 0.35,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
};

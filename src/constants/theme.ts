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
  // Premium colors from design system
  premiumPrimary: "#0D9488",
  premiumPrimaryDark: "#0F172A", // On Secondary from design system
  premiumSecondary: "#14B8A6",
  premiumSecondaryDark: "#0F172A",
  premiumAccent: "#EA580C",
  premiumAccentDark: "#0F172A",
  premiumBackground: "#F0FDFA",
  premiumForeground: "#134E4A",
  premiumCard: "#FFFFFF",
  premiumCardForeground: "#134E4A",
  premiumMuted: "#E8F1F4",
  premiumMutedForeground: "#475569",
  premiumBorder: "#99F6E4",
  premiumDestructive: "#DC2626",
  premiumDestructiveLight: "#FFFFFF",
  premiumRing: "#0D9488",
};

export const Colors = {
  light: {
    text: "#000000",
    background: "#F0FDFA",
    backgroundElement: "#E8F1F4",
    backgroundSelected: "#D0E8E8",
    textSecondary: "#60646C",
    // Premium color references
    premium: {
      primary: "#0D9488",
      primaryDark: "#0F172A",
      secondary: "#14B8A6",
      secondaryDark: "#0F172A",
      accent: "#EA580C",
      accentDark: "#0F172A",
      background: "#F0FDFA",
      foreground: "#134E4A",
      card: "#FFFFFF",
      cardForeground: "#134E4A",
      muted: "#E8F1F4",
      mutedForeground: "#475569",
      border: "#99F6E4",
      destructive: "#DC2626",
      destructiveLight: "#FFFFFF",
      ring: "#0D9488",
    },
  },
  dark: {
    text: "#ffffff",
    background: "#0F172A", // Dark version of background
    backgroundElement: "#1E293B", // Slate-700
    backgroundSelected: "#334155", // Slate-600
    textSecondary: "#94A3B8", // Slate-400
    // Premium color references (dark mode adapted)
    premium: {
      primary: "#6EE7B7", // Teal-300
      primaryDark: "#0D9488", // Teal-600
      secondary: "#67E8F9", // Cyan-300
      secondaryDark: "#14B8A6", // Teal-500
      accent: "#FBBF24", // Amber-400
      accentDark: "#EA580C", // Amber-600
      background: "#0F172A", // Slate-800
      foreground: "#F0FDFA", // Light version
      card: "#1E293B", // Slate-700
      cardForeground: "#F0FDFA",
      muted: "#334155", // Slate-600
      mutedForeground: "#94A3B8", // Slate-400
      border: "#475569", // Slate-500
      destructive: "#F87171", // Red-300
      destructiveLight: "#FECACA", // Red-200
      ring: "#6EE7B7", // Teal-300
    },
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: "Inter",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  default: {
    sans: "Inter",
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

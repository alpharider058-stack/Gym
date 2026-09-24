import Constants, { ExecutionEnvironment } from "expo-constants";
import { Platform } from "react-native";

import { getNextQuote, getSettings, saveSettings } from "./forge-storage";

export type PermissionStatus =
  | "granted"
  | "denied"
  | "undetermined"
  | "unknown";
type NotificationsModule = typeof import("expo-notifications");

function isExpoGo(): boolean {
  return Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
}

async function loadNotifications(): Promise<NotificationsModule> {
  return import("expo-notifications");
}

export async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== "android") return;
  try {
    const Notifications = await loadNotifications();
    await Notifications.setNotificationChannelAsync("vertice-daily", {
      name: "VÉRTICE Diario",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#D4AF37",
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });
  } catch {
    // Expo Go does not support this native operation.
  }
}

export async function getPermissionStatus(): Promise<PermissionStatus> {
  try {
    const Notifications = await loadNotifications();
    const settings = await Notifications.getPermissionsAsync();
    if (settings.granted) return "granted";
    if (settings.canAskAgain === false) return "denied";
    return "undetermined";
  } catch {
    return "unknown";
  }
}

export async function requestPermissions(): Promise<{
  granted: boolean;
  status: PermissionStatus;
}> {
  await ensureAndroidChannel();
  try {
    const Notifications = await loadNotifications();
    const response = await Notifications.requestPermissionsAsync({
      ios: { allowAlert: true, allowBadge: true, allowSound: true },
    });
    if (response.granted) return { granted: true, status: "granted" };
    if (response.canAskAgain === false)
      return { granted: false, status: "denied" };
    return { granted: false, status: "undetermined" };
  } catch {
    return { granted: false, status: "unknown" };
  }
}

export async function cancelAllScheduled(): Promise<void> {
  try {
    const Notifications = await loadNotifications();
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {
    // Ignore unsupported Expo Go calls.
  }
}

export async function scheduleDaily(
  hour: number,
  minute: number,
): Promise<string | null> {
  await cancelAllScheduled();
  try {
    const Notifications = await loadNotifications();
    const { text } = await getNextQuote();
    await ensureAndroidChannel();
    return await Notifications.scheduleNotificationAsync({
      content: {
        title: "VÉRTICE",
        subtitle: "Hoy nadie te detiene",
        body: text,
        sound: true,
        badge: 1,
        color: "#000000",
        ...(Platform.OS === "android"
          ? {
              channelId: "vertice-daily",
              priority: Notifications.AndroidNotificationPriority.MAX,
            }
          : {}),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
        repeats: true,
      } as Notifications.DailyTriggerInput,
    });
  } catch {
    return null;
  }
}

export async function updateScheduleFromSettings(
  explicitEnabled?: boolean,
): Promise<{ ok: boolean; reason?: string }> {
  if (isExpoGo()) {
    return {
      ok: false,
      reason: "Las notificaciones requieren un development build",
    };
  }
  const settings = await getSettings();
  const enabled = explicitEnabled ?? settings.notifEnabled;
  settings.notifEnabled = enabled;
  await saveSettings(settings);
  if (!enabled) {
    await cancelAllScheduled();
    return { ok: true };
  }

  const status = await getPermissionStatus();
  if (status !== "granted") {
    const permission = await requestPermissions();
    if (!permission.granted) {
      settings.notifEnabled = false;
      await saveSettings(settings);
      return { ok: false, reason: "Permiso de notificaciones no disponible" };
    }
  }

  const id = await scheduleDaily(settings.notifHour, settings.notifMinute);
  return { ok: !!id, reason: id ? undefined : "No se pudo programar" };
}

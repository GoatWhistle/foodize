import { Platform } from "react-native";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { logError } from "@shared/utils/logError";

export type PushChannel = "order_status" | "promo" | "system";

export interface PushListeners {
  onReceived?: (notification: Notifications.Notification) => void;
  onResponse?: (response: Notifications.NotificationResponse) => void;
}

let handlerConfigured = false;
let channelsConfigured = false;

const isGranted = (status: Notifications.PermissionStatus): boolean =>
  (status as string) === "granted";

export function notificationBehavior(): Promise<Notifications.NotificationBehavior> {
  return Promise.resolve({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  });
}

export function configureNotificationHandler(): void {
  if (handlerConfigured) return;
  handlerConfigured = true;
  Notifications.setNotificationHandler({ handleNotification: notificationBehavior });
}

export async function configureAndroidChannels(): Promise<void> {
  if (channelsConfigured || Platform.OS !== "android") return;
  channelsConfigured = true;
  await Notifications.setNotificationChannelAsync("order_status", {
    name: "Order status",
    importance: Notifications.AndroidImportance.HIGH,
  });
  await Notifications.setNotificationChannelAsync("promo", {
    name: "Promotions",
    importance: Notifications.AndroidImportance.DEFAULT,
  });
  await Notifications.setNotificationChannelAsync("system", {
    name: "System",
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

export async function ensurePushPermission(): Promise<boolean> {
  if (!Device.isDevice) return false;
  const current = await Notifications.getPermissionsAsync();
  if (isGranted(current.status)) return true;
  const requested = await Notifications.requestPermissionsAsync();
  return isGranted(requested.status);
}

export async function getExpoPushToken(): Promise<string | null> {
  if (!Device.isDevice) return null;
  try {
    const granted = await ensurePushPermission();
    if (!granted) return null;
    configureNotificationHandler();
    await configureAndroidChannels();
    const token = await Notifications.getExpoPushTokenAsync();
    return token.data;
  } catch (error) {
    logError("pushNotifications.getExpoPushToken", error);
    return null;
  }
}

export function subscribeToNotifications({
  onReceived,
  onResponse,
}: PushListeners): () => void {
  const received = onReceived
    ? Notifications.addNotificationReceivedListener(onReceived)
    : null;
  const response = onResponse
    ? Notifications.addNotificationResponseReceivedListener(onResponse)
    : null;
  return () => {
    received?.remove();
    response?.remove();
  };
}

export async function setBadgeCount(count: number): Promise<void> {
  try {
    await Notifications.setBadgeCountAsync(count);
  } catch (error) {
    logError("pushNotifications.setBadgeCount", error);
  }
}

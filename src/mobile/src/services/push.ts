import { Platform } from "react-native";
import { api } from "@/services/api";
import { logError } from "@shared/utils/logError";
import { getExpoPushToken } from "@/platform/pushNotifications";

const DEVICES_ENDPOINT = "/notifications/devices";

let registeredToken: string | null = null;

export interface RegisterDeviceResult {
  token: string | null;
  registered: boolean;
}

export async function registerDeviceToken(language?: string): Promise<RegisterDeviceResult> {
  const token = await getExpoPushToken();
  if (!token) return { token: null, registered: false };
  try {
    await api.post(DEVICES_ENDPOINT, {
      token,
      platform: Platform.OS,
      language: language ?? null,
    });
    registeredToken = token;
    return { token, registered: true };
  } catch (error) {
    logError("push.registerDeviceToken", error);
    return { token, registered: false };
  }
}

export async function unregisterDeviceToken(): Promise<void> {
  if (!registeredToken) return;
  const token = registeredToken;
  registeredToken = null;
  try {
    await api.delete(`${DEVICES_ENDPOINT}/${encodeURIComponent(token)}`);
  } catch (error) {
    logError("push.unregisterDeviceToken", error);
  }
}

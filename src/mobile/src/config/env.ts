import Constants from "expo-constants";
import { API_BASE_URL, WS_BASE_URL } from "@shared/config";

const resolveAppVersion = (): string => {
  const version: unknown = Constants.expoConfig?.version;
  return typeof version === "string" ? version : "0.0.0";
};

export const env = {
  apiBaseUrl: API_BASE_URL,
  wsBaseUrl: WS_BASE_URL,
  appVersion: resolveAppVersion(),
} as const;

export { API_BASE_URL, WS_BASE_URL };

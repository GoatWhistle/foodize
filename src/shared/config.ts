const DEFAULT_API_BASE_URL = "http://localhost:8000/api/v1";

interface ViteEnv {
  VITE_API_URL?: string;
  PROD?: boolean;
}

const readViteEnv = (): ViteEnv => {
  try {
    return (import.meta as unknown as { env?: ViteEnv }).env ?? {};
  } catch {
    return {};
  }
};

const readProcessEnv = (key: string): string | undefined => {
  if (typeof process === "undefined") return undefined;
  return process.env[key];
};

const resolveApiBaseUrl = (): string => {
  const viteEnv = readViteEnv();
  const configured = viteEnv.VITE_API_URL ?? readProcessEnv("EXPO_PUBLIC_API_URL");
  if (configured) return configured;
  if (viteEnv.PROD) {
    throw new Error("VITE_API_URL is not set. It must be defined for production builds.");
  }
  return DEFAULT_API_BASE_URL;
};

export const API_BASE_URL = resolveApiBaseUrl();

export const WS_BASE_URL = API_BASE_URL.replace(/^http/, "ws").replace(/\/api\/v1$/, "");

import type { AxiosInstance, InternalAxiosRequestConfig } from "axios";
import { logError } from "@shared/utils/logError";

export interface PinningConfig {
  host: string;
  allowInsecure: boolean;
}

const resolveApiBaseUrl = (): string => {
  const configured: string | undefined = process.env.EXPO_PUBLIC_API_URL;
  return configured ?? "http://localhost:8000/api/v1";
};

const parseHost = (url: string): string | null => {
  try {
    return new URL(url).host;
  } catch {
    return null;
  }
};

const isSecure = (url: string): boolean => {
  try {
    return new URL(url).protocol === "https:";
  } catch {
    return false;
  }
};

export function resolvePinningConfig(baseUrl: string = resolveApiBaseUrl()): PinningConfig {
  const host = parseHost(baseUrl);
  return {
    host: host ?? "",
    allowInsecure: !isSecure(baseUrl),
  };
}

export function assertRequestAllowed(
  requestUrl: string,
  baseUrl: string,
  config: PinningConfig,
): void {
  const resolved = (() => {
    try {
      return new URL(requestUrl, baseUrl).href;
    } catch {
      return requestUrl;
    }
  })();
  if (!isSecure(resolved)) {
    throw new Error(`certificatePinning: rejected insecure request to ${resolved}`);
  }
  const host = parseHost(resolved);
  if (host !== config.host) {
    throw new Error(
      `certificatePinning: rejected request to unpinned host ${host ?? "unknown"}`,
    );
  }
}

export function installCertificatePinning(
  instance: AxiosInstance,
  options?: { enabled?: boolean; baseUrl?: string },
): () => void {
  const baseUrl = options?.baseUrl ?? resolveApiBaseUrl();
  const enabled = options?.enabled ?? !__DEV__;
  const config = resolvePinningConfig(baseUrl);
  if (!enabled || config.allowInsecure || !config.host) {
    return () => {
      return;
    };
  }
  const id = instance.interceptors.request.use(
    (request: InternalAxiosRequestConfig) => {
      const url = request.url ?? "";
      const requestBase = request.baseURL ?? baseUrl;
      try {
        assertRequestAllowed(url, requestBase, config);
      } catch (error) {
        logError("certificatePinning.request", error);
        throw error instanceof Error ? error : new Error("certificatePinning failure");
      }
      return request;
    },
  );
  return () => {
    instance.interceptors.request.eject(id);
  };
}

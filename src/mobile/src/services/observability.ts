import * as Sentry from "@sentry/react-native";
import Constants from "expo-constants";

let initialized = false;

const resolveDsn = (): string | undefined => {
  const extra = Constants.expoConfig?.extra as { sentryDsn?: string } | undefined;
  const fromExtra = extra?.sentryDsn;
  const fromEnv: string | undefined = process.env.EXPO_PUBLIC_SENTRY_DSN;
  return fromExtra ?? fromEnv;
};

export function initObservability(): void {
  if (initialized) return;
  const dsn = resolveDsn();
  if (!dsn) return;
  Sentry.init({
    dsn,
    tracesSampleRate: 0.2,
    enableAutoSessionTracking: true,
  });
  initialized = true;
}

export function captureError(error: unknown, context?: Record<string, unknown>): void {
  if (initialized) {
    Sentry.captureException(error, context ? { extra: context } : undefined);
  }
}

export function captureMessage(message: string, context?: Record<string, unknown>): void {
  if (initialized) {
    Sentry.captureMessage(message, context ? { extra: context } : undefined);
  }
}

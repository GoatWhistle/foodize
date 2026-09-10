export const readEnv = (key: string): string | undefined =>
  (process.env as Record<string, string | undefined>)[key];

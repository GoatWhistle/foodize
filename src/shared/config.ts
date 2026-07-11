const DEFAULT_API_BASE_URL = "http://localhost:8000/api/v1";

const resolveApiBaseUrl = (): string => {
  const configured = import.meta.env.VITE_API_URL;
  if (configured) return configured;
  if (import.meta.env.PROD) {
    throw new Error(
      "VITE_API_URL is not set. It must be defined for production builds.",
    );
  }
  return DEFAULT_API_BASE_URL;
};

export const API_BASE_URL = resolveApiBaseUrl();

export const WS_BASE_URL = API_BASE_URL.replace(/^http/, "ws").replace(
  /\/api\/v1$/,
  "",
);

import axios from "axios";
import { makeId } from "@shared/utils/id";
import { tokenStorage } from "@/platform/tokenStorage";

interface RefreshResponse {
  data: {
    access_token: string;
    refresh_token: string;
  };
}

let inFlight: Promise<void> | null = null;

async function performRefresh(baseUrl: string): Promise<void> {
  const refreshToken = await tokenStorage.getRefreshToken();
  if (!refreshToken) throw new Error("No refresh token");
  const response = await axios.post<RefreshResponse>(
    `${baseUrl}/refresh`,
    { refresh_token: refreshToken },
    { headers: { "X-Request-Id": makeId() } },
  );
  await tokenStorage.setAccessToken(response.data.data.access_token);
  await tokenStorage.setRefreshToken(response.data.data.refresh_token);
}

export function tokenRefresh(baseUrl: string): Promise<void> {
  if (inFlight) return inFlight;
  inFlight = performRefresh(baseUrl).finally(() => {
    inFlight = null;
  });
  return inFlight;
}

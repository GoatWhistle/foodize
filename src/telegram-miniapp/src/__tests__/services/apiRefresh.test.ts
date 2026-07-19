import { describe, it, expect, vi, beforeEach } from "vitest";
import { API_BASE_URL } from "@shared/config";

const cookieRefreshMock = vi.fn();
vi.mock("@shared/services/cookieRefresh", () => ({
  cookieRefresh: (...args: unknown[]) =>
    cookieRefreshMock(...args) as Promise<void>,
}));

vi.mock("@shared/services/api", () => ({
  createApi: vi.fn(() => ({})),
  createWebSocketFactories: vi.fn(() => ({
    createOrderWebSocket: vi.fn(),
    createNotificationWebSocket: vi.fn(),
  })),
}));

describe("miniapp refreshAccessToken", () => {
  beforeEach(() => {
    cookieRefreshMock.mockReset();
    cookieRefreshMock.mockResolvedValue(undefined);
  });

  it("delegates to cookieRefresh with the telegram refresh endpoint", async () => {
    const { refreshAccessToken } = await import("../../services/api");

    await refreshAccessToken();

    expect(cookieRefreshMock).toHaveBeenCalledWith(
      API_BASE_URL,
      "/telegram/refresh",
    );
  });

  it("wires refreshAccessToken as the api refresh token handler", async () => {
    const shared = await import("@shared/services/api");
    const createApiMock = shared.createApi as unknown as ReturnType<
      typeof vi.fn
    >;

    await import("../../services/api");

    const config = createApiMock.mock.calls[0]?.[0] as {
      refreshToken: () => Promise<void>;
      withCredentials: boolean;
      skipRetryUrls: string[];
    };
    expect(config.withCredentials).toBe(true);
    expect(config.skipRetryUrls).toContain("/telegram/refresh");
    await config.refreshToken();
    expect(cookieRefreshMock).toHaveBeenCalledWith(
      API_BASE_URL,
      "/telegram/refresh",
    );
  });
});

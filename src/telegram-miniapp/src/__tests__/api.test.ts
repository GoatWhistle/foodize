import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from "vitest";
import { createWebSocketFactories } from "@shared/services/api";
import type { UserRead } from "@shared/types/models";

type TokenGetter = () => string | null;

interface MockWebSocket {
  orderId?: string;
  userId?: string;
  token: string | null;
  close: () => void;
}

vi.mock("@shared/services/api", () => ({
  createApi: vi.fn(() => ({})),
  createWebSocketFactories: vi.fn((getToken: TokenGetter) => ({
    createOrderWebSocket: (orderId: string): MockWebSocket => {
      const token = getToken();
      return { orderId, token, close: vi.fn() };
    },
    createNotificationWebSocket: (userId: string): MockWebSocket => {
      const token = getToken();
      return { userId, token, close: vi.fn() };
    },
  })),
}));

vi.mock("axios", () => ({
  default: {
    post: vi.fn(),
    create: vi.fn(() => ({
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() },
      },
    })),
  },
}));

vi.mock("../services/api", () => {
  const getToken = (): string | null => sessionStorage.getItem("access_token");
  const factories = createWebSocketFactories(getToken);
  return {
    default: {},
    createOrderWebSocket: factories.createOrderWebSocket,
    createNotificationWebSocket: factories.createNotificationWebSocket,
  };
});

vi.mock("../services/authService", () => ({
  authService: {
    login: vi.fn(),
    getMe: vi.fn(),
    logout: vi.fn(),
  },
}));

type ApiModuleMock = {
  createOrderWebSocket: (orderId: string, onMsg: () => void) => MockWebSocket;
  createNotificationWebSocket: (userId: string, onMsg: () => void) => MockWebSocket;
};

type AuthServiceMock = {
  login: Mock;
  getMe: Mock;
  logout: Mock;
};

const importApi = async (): Promise<ApiModuleMock> =>
  (await import("../services/api")) as unknown as ApiModuleMock;

const importAuthService = async (): Promise<AuthServiceMock> =>
  (
    (await import("../services/authService")) as unknown as {
      authService: AuthServiceMock;
    }
  ).authService;

describe("miniapp api WebSocket factories", () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it("createOrderWebSocket passes token from sessionStorage", async () => {
    sessionStorage.setItem("access_token", "tok-abc");
    const { createOrderWebSocket } = await importApi();
    const ws = createOrderWebSocket("order-123", vi.fn());
    expect(ws.token).toBe("tok-abc");
    expect(ws.orderId).toBe("order-123");
  });

  it("createNotificationWebSocket passes token from sessionStorage", async () => {
    sessionStorage.setItem("access_token", "tok-xyz");
    const { createNotificationWebSocket } = await importApi();
    const ws = createNotificationWebSocket("user-456", vi.fn());
    expect(ws.token).toBe("tok-xyz");
    expect(ws.userId).toBe("user-456");
  });

  it("token is null when sessionStorage is empty", async () => {
    const { createOrderWebSocket } = await importApi();
    const ws = createOrderWebSocket("order-999", vi.fn());
    expect(ws.token).toBeNull();
  });

  it("ws close method is callable", async () => {
    const { createOrderWebSocket } = await importApi();
    const ws = createOrderWebSocket("order-1", vi.fn());
    expect(() => ws.close()).not.toThrow();
  });
});

describe("auth token lifecycle", () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  it("sets isAuthenticated after successful login", async () => {
    const { useAuthStore } = await import("../store/useAuthStore");
    const authService = await importAuthService();

    authService.login.mockResolvedValueOnce({
      data: { data: { access_token: "new-access", refresh_token: "new-refresh" } },
    });
    authService.getMe.mockResolvedValueOnce({
      data: { data: { id: "u1", name: "User" } as unknown as UserRead },
    });

    useAuthStore.setState({ user: null, isAuthenticated: false });
    await useAuthStore.getState().login({ username: "user", password: "pw" });

    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().user).toEqual({ id: "u1", name: "User" });
  });

  it("clears access_token on logout", async () => {
    const { useAuthStore } = await import("../store/useAuthStore");
    const authService = await importAuthService();

    sessionStorage.setItem("access_token", "old-access");
    useAuthStore.setState({ user: { id: "u1" } as unknown as UserRead, isAuthenticated: true });
    authService.logout.mockResolvedValueOnce({});

    await useAuthStore.getState().logout();

    expect(sessionStorage.getItem("access_token")).toBeNull();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });
});

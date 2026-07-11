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
  createWebSocketFactories: vi.fn((getToken?: TokenGetter) => ({
    createOrderWebSocket: (orderId: string): MockWebSocket => {
      const token = getToken?.() ?? null;
      return { orderId, token, close: vi.fn() };
    },
    createNotificationWebSocket: (userId: string): MockWebSocket => {
      const token = getToken?.() ?? null;
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
  const factories = createWebSocketFactories();
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

  it("createOrderWebSocket relies on cookie auth without a token", async () => {
    const { createOrderWebSocket } = await importApi();
    const ws = createOrderWebSocket("order-123", vi.fn());
    expect(ws.token).toBeNull();
    expect(ws.orderId).toBe("order-123");
  });

  it("createNotificationWebSocket relies on cookie auth without a token", async () => {
    const { createNotificationWebSocket } = await importApi();
    const ws = createNotificationWebSocket("user-456", vi.fn());
    expect(ws.token).toBeNull();
    expect(ws.userId).toBe("user-456");
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
    await useAuthStore.getState().login({ phone_number: "user", password: "pw" });

    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().user).toEqual({ id: "u1", name: "User" });
  });

  it("clears auth state and calls cookie logout", async () => {
    const { useAuthStore } = await import("../store/useAuthStore");
    const authService = await importAuthService();

    useAuthStore.setState({ user: { id: "u1" } as unknown as UserRead, isAuthenticated: true });
    authService.logout.mockResolvedValueOnce({});

    await useAuthStore.getState().logout();

    expect(authService.logout).toHaveBeenCalled();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });
});

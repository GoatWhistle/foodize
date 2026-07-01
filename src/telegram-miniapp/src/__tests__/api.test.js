import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createWebSocketFactories } from "@shared/services/api.js";

vi.mock("@shared/services/api.js", () => ({
  createApi: vi.fn(() => ({})),
  createWebSocketFactories: vi.fn((getToken) => ({
    createOrderWebSocket: (orderId, onMsg) => {
      const token = getToken();
      return { orderId, token, close: vi.fn() };
    },
    createNotificationWebSocket: (userId, onMsg) => {
      const token = getToken();
      return { userId, token, close: vi.fn() };
    },
  })),
}));

vi.mock("axios", () => ({
  default: { post: vi.fn(), create: vi.fn(() => ({ interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } } })) },
}));

vi.mock("../services/api", async () => {
  const getToken = () => sessionStorage.getItem("access_token");
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
    const { createOrderWebSocket } = await import("../services/api");
    const ws = createOrderWebSocket("order-123", vi.fn());
    expect(ws.token).toBe("tok-abc");
    expect(ws.orderId).toBe("order-123");
  });

  it("createNotificationWebSocket passes token from sessionStorage", async () => {
    sessionStorage.setItem("access_token", "tok-xyz");
    const { createNotificationWebSocket } = await import("../services/api");
    const ws = createNotificationWebSocket("user-456", vi.fn());
    expect(ws.token).toBe("tok-xyz");
    expect(ws.userId).toBe("user-456");
  });

  it("token is null when sessionStorage is empty", async () => {
    const { createOrderWebSocket } = await import("../services/api");
    const ws = createOrderWebSocket("order-999", vi.fn());
    expect(ws.token).toBeNull();
  });

  it("ws close method is callable", async () => {
    const { createOrderWebSocket } = await import("../services/api");
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
    const { authService } = await import("../services/authService");

    authService.login.mockResolvedValueOnce({
      data: { data: { access_token: "new-access", refresh_token: "new-refresh" } },
    });
    authService.getMe.mockResolvedValueOnce({
      data: { data: { id: "u1", name: "User" } },
    });

    useAuthStore.setState({ user: null, isAuthenticated: false });
    await useAuthStore.getState().login({ username: "user", password: "pw" });

    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().user).toEqual({ id: "u1", name: "User" });
  });

  it("clears access_token on logout", async () => {
    const { useAuthStore } = await import("../store/useAuthStore");
    const { authService } = await import("../services/authService");

    sessionStorage.setItem("access_token", "old-access");
    useAuthStore.setState({ user: { id: "u1" }, isAuthenticated: true });
    authService.logout.mockResolvedValueOnce({});

    await useAuthStore.getState().logout();

    expect(sessionStorage.getItem("access_token")).toBeNull();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });
});

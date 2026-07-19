import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from "vitest";
import { WS_BASE_URL } from "@shared/config";
import type { UserRead } from "@shared/types/models";

class FakeWebSocket {
  static instances: FakeWebSocket[] = [];
  url: string;
  onopen: (() => void) | null = null;
  onmessage: (() => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: (() => void) | null = null;
  readyState = 0;
  send = vi.fn();
  close = vi.fn();
  constructor(url: string) {
    this.url = url;
    FakeWebSocket.instances.push(this);
  }
}

const originalWebSocket = globalThis.WebSocket;

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

vi.mock("../services/authService", () => ({
  authService: {
    login: vi.fn(),
    getMe: vi.fn(),
    logout: vi.fn(),
  },
}));

type AuthServiceMock = {
  login: Mock;
  getMe: Mock;
  logout: Mock;
};

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
    FakeWebSocket.instances = [];
    globalThis.WebSocket = FakeWebSocket as unknown as typeof WebSocket;
  });

  afterEach(() => {
    sessionStorage.clear();
    globalThis.WebSocket = originalWebSocket;
  });

  it("createOrderWebSocket builds the versioned order WS url", async () => {
    const { createOrderWebSocket } = await import("../services/api");
    const ws = createOrderWebSocket("order-123", vi.fn());

    expect(FakeWebSocket.instances).toHaveLength(1);
    expect(FakeWebSocket.instances[0]?.url).toBe(
      `${WS_BASE_URL}/api/v1/ws/orders/order-123`,
    );
    expect(WS_BASE_URL.startsWith("ws")).toBe(true);
    expect(() => { ws.close(); }).not.toThrow();
  });

  it("createNotificationWebSocket builds the versioned notification WS url", async () => {
    const { createNotificationWebSocket } = await import("../services/api");
    const ws = createNotificationWebSocket("user-456", vi.fn());

    expect(FakeWebSocket.instances).toHaveLength(1);
    expect(FakeWebSocket.instances[0]?.url).toBe(
      `${WS_BASE_URL}/api/v1/ws/notifications/user-456`,
    );
    expect(() => { ws.close(); }).not.toThrow();
  });

  it("does not attach a bearer token frame (cookie auth) on open", async () => {
    const { createOrderWebSocket } = await import("../services/api");
    createOrderWebSocket("order-1", vi.fn());

    const socket = FakeWebSocket.instances[0];
    if (!socket) throw new Error("WebSocket was not constructed");
    socket.readyState = 1;
    socket.onopen?.();

    expect(socket.send).not.toHaveBeenCalled();
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

    useAuthStore.setState({ user: null });
    await useAuthStore.getState().login({ phone_number: "user", password: "pw" });

    expect(useAuthStore.getState().user).not.toBeNull();
    expect(useAuthStore.getState().user).toEqual({ id: "u1", name: "User" });
  });

  it("clears auth state and calls cookie logout", async () => {
    const { useAuthStore } = await import("../store/useAuthStore");
    const authService = await importAuthService();

    useAuthStore.setState({ user: { id: "u1" } as unknown as UserRead });
    authService.logout.mockResolvedValueOnce({});

    await useAuthStore.getState().logout();

    expect(authService.logout).toHaveBeenCalled();
    expect(useAuthStore.getState().user).toBeNull();
  });
});

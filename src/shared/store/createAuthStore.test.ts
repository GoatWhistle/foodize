import { describe, it, expect, vi, beforeEach } from "vitest";
import type { AuthServiceContract, AuthUser } from "./createAuthStore";
import { createAuthStore, selectIsAuthenticated } from "./createAuthStore";

vi.mock("@shared/utils/logError", () => ({ logError: vi.fn() }));

const user = { id: "u1", name: "Ivan" } as unknown as AuthUser;

const makeService = (): AuthServiceContract => ({
  register: vi.fn().mockResolvedValue(undefined),
  login: vi.fn().mockResolvedValue(undefined),
  getMe: vi.fn().mockResolvedValue({ data: { data: user } }),
  logout: vi.fn().mockResolvedValue(undefined),
});

let service: AuthServiceContract;

beforeEach(() => {
  localStorage.clear();
  service = makeService();
});

describe("createAuthStore", () => {
  it("login stores the fetched user", async () => {
    const store = createAuthStore({ authService: service });
    await store.getState().login({} as never);
    expect(store.getState().user).toEqual(user);
    expect(service.login).toHaveBeenCalled();
  });

  it("login clears the user and rethrows on failure", async () => {
    vi.mocked(service.login).mockRejectedValueOnce(new Error("bad"));
    const store = createAuthStore({ authService: service });
    await expect(store.getState().login({} as never)).rejects.toThrow("bad");
    expect(store.getState().user).toBeNull();
  });

  it("register delegates to the service", async () => {
    const store = createAuthStore({ authService: service });
    await store.getState().register({} as never);
    expect(service.register).toHaveBeenCalled();
  });

  it("fetchMe sets the user on success", async () => {
    const store = createAuthStore({ authService: service });
    await store.getState().fetchMe();
    expect(store.getState().user).toEqual(user);
  });

  it("fetchMe clears the user on failure", async () => {
    vi.mocked(service.getMe).mockRejectedValueOnce(new Error("401"));
    const store = createAuthStore({ authService: service });
    await store.getState().fetchMe();
    expect(store.getState().user).toBeNull();
  });

  it("logout clears the user and calls onLogout", async () => {
    const onLogout = vi.fn();
    const store = createAuthStore({ authService: service, onLogout });
    store.setState({ user });
    await store.getState().logout();
    expect(store.getState().user).toBeNull();
    expect(onLogout).toHaveBeenCalled();
  });

  it("logout still clears the user when the service throws", async () => {
    vi.mocked(service.logout).mockRejectedValueOnce(new Error("net"));
    const store = createAuthStore({ authService: service });
    store.setState({ user });
    await store.getState().logout();
    expect(store.getState().user).toBeNull();
  });

  it("supports extra actions and persistence", async () => {
    const store = createAuthStore({
      authService: service,
      persistKey: "auth-test",
      extraActions: (set) => ({ reset: () => { set({ user: null }); } }),
    });
    await store.getState().login({} as never);
    expect(store.getState().user).toEqual(user);
    (store.getState() as unknown as { reset: () => void }).reset();
    expect(store.getState().user).toBeNull();
  });

  it("selectIsAuthenticated reflects the user presence", () => {
    expect(selectIsAuthenticated({ user } as never)).toBe(true);
    expect(selectIsAuthenticated({ user: null } as never)).toBe(false);
  });
});

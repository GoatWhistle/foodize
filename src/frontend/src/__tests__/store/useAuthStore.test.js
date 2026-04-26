import { describe, it, expect, vi, beforeEach } from "vitest";
import { useAuthStore } from "../../store/useAuthStore";
import { authService } from "../../services/authService";

// Mock authService
vi.mock("../../services/authService", () => ({
  authService: {
    login: vi.fn(),
    register: vi.fn(),
    getMe: vi.fn(),
    logout: vi.fn(),
  },
}));

describe("useAuthStore", () => {
  beforeEach(() => {
    // Reset store state
    useAuthStore.setState({
      user: null,
      token: null,
      isAuthenticated: false,
      loading: false,
      error: null,
    });
    vi.clearAllMocks();
  });

  it("initial state is correct", () => {
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBe(null);
  });

  it("login updates state on success", async () => {
    const mockUser = { id: "1", name: "Test" };
    const mockToken = "token123";
    authService.login.mockResolvedValueOnce({
      data: { data: { access_token: mockToken } },
    });
    authService.getMe.mockResolvedValueOnce({ data: { data: mockUser } });

    await useAuthStore
      .getState()
      .login({ phone_number: "123", password: "pw" });

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.user).toEqual(mockUser);
    expect(localStorage.getItem("access_token")).toBe(mockToken);
  });

  it("login propagates errors", async () => {
    const errorMsg = "Wrong credentials";
    authService.login.mockRejectedValueOnce(new Error(errorMsg));

    await expect(
      useAuthStore.getState().login({ phone_number: "123", password: "pw" }),
    ).rejects.toThrow(errorMsg);

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
  });

  it("logout clears state", async () => {
    useAuthStore.setState({ isAuthenticated: true, user: { id: "1" } });
    localStorage.setItem("access_token", "tk");

    await useAuthStore.getState().logout();

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBe(null);
    expect(localStorage.getItem("access_token")).toBe(null);
  });
});

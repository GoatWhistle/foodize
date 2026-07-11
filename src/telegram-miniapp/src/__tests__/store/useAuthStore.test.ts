import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { useAuthStore } from "../../store/useAuthStore";
import { authService } from "../../services/authService";
import type { AuthUser } from "@shared/store/createAuthStore";

vi.mock("../../services/authService", () => ({
  authService: {
    login: vi.fn(),
    getMe: vi.fn(),
    logout: vi.fn(),
  },
}));

const authServiceMock = authService as unknown as {
  login: Mock;
  getMe: Mock;
  logout: Mock;
};

describe("useAuthStore", () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
    });
    vi.clearAllMocks();
    sessionStorage.clear();
    localStorage.clear();
  });

  it("should have correct initial state", () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it("should set authenticated state", () => {
    const mockUser = { id: 1, name: "Test" } as unknown as AuthUser;
    const setAuthenticated = useAuthStore.getState().setAuthenticated;
    setAuthenticated(mockUser);
    const state = useAuthStore.getState();
    expect(state.user).toEqual(mockUser);
    expect(state.isAuthenticated).toBe(true);
  });

  it("should login successfully", async () => {
    const mockUser = { id: 1, name: "Test" };
    authServiceMock.login.mockResolvedValueOnce({
      data: { data: { access_token: "access", refresh_token: "refresh" } },
    });
    authServiceMock.getMe.mockResolvedValueOnce({
      data: { data: mockUser },
    });

    await useAuthStore.getState().login({ phone_number: "user", password: "pw" });

    const state = useAuthStore.getState();
    expect(state.user).toEqual(mockUser);
    expect(state.isAuthenticated).toBe(true);
    expect(authServiceMock.login).toHaveBeenCalledWith({
      phone_number: "user",
      password: "pw",
    });
    expect(localStorage.getItem("foodize_tg_logged_out")).toBeNull();
  });

  it("should fetchMe successfully", async () => {
    const mockUser = { id: 1, name: "Test" };
    authServiceMock.getMe.mockResolvedValueOnce({
      data: { data: mockUser },
    });

    await useAuthStore.getState().fetchMe();

    const state = useAuthStore.getState();
    expect(state.user).toEqual(mockUser);
    expect(state.isAuthenticated).toBe(true);
  });

  it("should handle fetchMe failure", async () => {
    authServiceMock.getMe.mockRejectedValueOnce(new Error("Failed"));

    await useAuthStore.getState().fetchMe();

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it("should logout successfully", async () => {
    const mockUser = { id: 1, phone_number: "+123456" } as unknown as AuthUser;
    useAuthStore.setState({ user: mockUser, isAuthenticated: true });
    authServiceMock.logout.mockResolvedValueOnce({});

    await useAuthStore.getState().logout();

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(localStorage.getItem("foodize_tg_logged_out")).toBe("1");
    expect(authServiceMock.logout).toHaveBeenCalled();
  });
});

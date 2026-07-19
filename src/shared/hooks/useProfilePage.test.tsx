import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

const updateMe = vi.fn();
const changePassword = vi.fn();
const logout = vi.fn();
const fetchMe = vi.fn();

let storeUser: Record<string, unknown> | null = null;

vi.mock("zustand/react/shallow", () => ({
  useShallow: (fn: unknown) => fn,
}));

vi.mock("@shared/store/useAuthStore.instance", () => ({
  useAuthStore: vi.fn((sel?: (s: unknown) => unknown) => {
    const state = { user: storeUser, logout, fetchMe };
    return sel ? sel(state) : state;
  }),
}));

vi.mock("@shared/services/userService", () => ({
  userService: {
    updateMe: (...a: unknown[]) => updateMe(...a) as unknown,
    changePassword: (...a: unknown[]) => changePassword(...a) as unknown,
  },
}));

import { useProfilePage } from "@shared/hooks/useProfilePage";

describe("useProfilePage", () => {
  beforeEach(() => {
    updateMe.mockReset();
    changePassword.mockReset();
    logout.mockReset();
    fetchMe.mockReset();
    storeUser = null;
  });

  it("falls back to a default display name", () => {
    storeUser = null;
    const { result } = renderHook(() => useProfilePage());
    expect(result.current.displayName).toBe("Пользователь");
  });

  it("uses first + last name when available", () => {
    storeUser = { first_name: "Иван", last_name: "Петров", name: "ipetrov" };
    const { result } = renderHook(() => useProfilePage());
    expect(result.current.displayName).toBe("Иван Петров");
  });

  it("uses the account name when no last name", () => {
    storeUser = { first_name: "Иван", name: "ipetrov" };
    const { result } = renderHook(() => useProfilePage());
    expect(result.current.displayName).toBe("ipetrov");
  });

  it("startEdit populates the form from the user", () => {
    storeUser = { name: "n", first_name: "f", last_name: "l", middle_name: "m", email: "e@x" };
    const { result } = renderHook(() => useProfilePage());
    act(() => {
      result.current.startEdit();
    });
    expect(result.current.editMode).toBe(true);
    expect(result.current.editForm).toEqual({
      name: "n",
      first_name: "f",
      last_name: "l",
      middle_name: "m",
      email: "e@x",
    });
  });

  it("cancelEdit closes edit mode", () => {
    const { result } = renderHook(() => useProfilePage());
    act(() => {
      result.current.startEdit();
    });
    act(() => {
      result.current.cancelEdit();
    });
    expect(result.current.editMode).toBe(false);
  });

  it("handleSave persists, refreshes and flags success", async () => {
    updateMe.mockResolvedValue({});
    fetchMe.mockResolvedValue(undefined);
    const { result } = renderHook(() => useProfilePage());
    act(() => {
      result.current.startEdit();
    });
    await act(async () => {
      await result.current.handleSave();
    });
    expect(updateMe).toHaveBeenCalled();
    expect(fetchMe).toHaveBeenCalled();
    expect(result.current.editSuccess).toBe(true);
    expect(result.current.editMode).toBe(false);
    expect(result.current.editLoading).toBe(false);
  });

  it("handleSave surfaces a translated error", async () => {
    updateMe.mockRejectedValue({
      response: { status: 400, data: { detail: "Bad request" } },
    });
    const { result } = renderHook(() => useProfilePage());
    await act(async () => {
      await result.current.handleSave();
    });
    expect(result.current.editError).toBe("Некорректный запрос");
    expect(result.current.editSuccess).toBe(false);
  });

  it("handlePasswordChange resets the form on success", async () => {
    changePassword.mockResolvedValue({});
    const { result } = renderHook(() => useProfilePage());
    act(() => {
      result.current.setPwForm({ old_password: "a", new_password: "b" });
    });
    const preventDefault = vi.fn();
    await act(async () => {
      await result.current.handlePasswordChange({
        preventDefault,
      } as unknown as React.SyntheticEvent);
    });
    expect(preventDefault).toHaveBeenCalled();
    expect(changePassword).toHaveBeenCalled();
    expect(result.current.pwSuccess).toBe(true);
    expect(result.current.pwForm).toEqual({ old_password: "", new_password: "" });
  });

  it("handlePasswordChange reports a translated error", async () => {
    changePassword.mockRejectedValue({
      response: { status: 401, data: { detail: "Invalid credentials" } },
    });
    const { result } = renderHook(() => useProfilePage());
    await act(async () => {
      await result.current.handlePasswordChange();
    });
    expect(result.current.pwError).toBe("Неверный телефон или пароль");
    expect(result.current.pwSuccess).toBe(false);
  });

  it("exposes the logout action from the store", async () => {
    logout.mockResolvedValue(undefined);
    const { result } = renderHook(() => useProfilePage());
    await act(async () => {
      await result.current.logout();
    });
    expect(logout).toHaveBeenCalled();
  });
});

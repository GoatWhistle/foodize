import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ProfilePage } from "@shared/pages/ProfilePage/ProfilePage";
import { useProfilePage } from "@shared/hooks/useProfilePage";
import type { UseProfilePageResult } from "@shared/hooks/useProfilePage";
import { t } from "@shared/i18n/useTranslation";
import { useModalStore } from "@shared/store/useModalStore";

vi.mock("@shared/hooks/useProfilePage", () => ({
  useProfilePage: vi.fn(),
}));

const mockedHook = vi.mocked(useProfilePage);

const hookState = (over: Partial<UseProfilePageResult> = {}): UseProfilePageResult =>
  ({
    user: { id: "u1", name: "Тест", phone_number: "+79990001122", permissions: [] },
    logout: vi.fn().mockResolvedValue(undefined),
    displayName: "Тест Пользователь",
    editMode: false,
    editForm: { name: "", first_name: "", last_name: "", middle_name: "", email: "" },
    setEditForm: vi.fn(),
    editLoading: false,
    editError: "",
    editSuccess: false,
    startEdit: vi.fn(),
    cancelEdit: vi.fn(),
    handleSave: vi.fn(),
    pwForm: { old_password: "", new_password: "" },
    setPwForm: vi.fn(),
    pwLoading: false,
    pwError: "",
    pwSuccess: false,
    handlePasswordChange: vi.fn(),
    ...over,
  }) as UseProfilePageResult;

const renderPage = (props = {}) =>
  render(
    <MemoryRouter>
      <ProfilePage {...props} />
    </MemoryRouter>,
  );

describe("ProfilePage", () => {
  beforeEach(() => {
    mockedHook.mockReset();
  });

  it("renders the display name, phone and core menu items", () => {
    mockedHook.mockReturnValue(hookState());
    renderPage();
    expect(screen.getByText("Тест Пользователь")).toBeInTheDocument();
    expect(screen.getByText("+79990001122")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: new RegExp(t("profile.page.myOrders")) })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: new RegExp(t("profile.page.favorites")) })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: new RegExp(t("profile.page.logout")) })).toBeInTheDocument();
  });

  it("renders order and favorite counts", () => {
    mockedHook.mockReturnValue(hookState());
    renderPage({ ordersTotal: 7, favoritesCount: 3 });
    expect(screen.getByText("7")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("does not show the admin panel for non-admins", () => {
    mockedHook.mockReturnValue(hookState());
    renderPage({ routes: { admin: "/admin" } });
    expect(screen.queryByText(t("profile.page.adminPanelShort"))).not.toBeInTheDocument();
  });

  it("shows the admin panel for admins", () => {
    mockedHook.mockReturnValue(
      hookState({ user: { id: "u1", name: "Admin", permissions: ["admin.access"] } as UseProfilePageResult["user"] }),
    );
    renderPage({ routes: { admin: "/admin" } });
    expect(screen.getByText(t("profile.page.adminPanelShort"))).toBeInTheDocument();
  });

  it("shows the notifications item with an unread badge", () => {
    mockedHook.mockReturnValue(hookState());
    renderPage({ routes: { notifications: "/notifications" }, unreadCount: 5 });
    expect(screen.getByRole("button", { name: new RegExp(t("profile.page.notifications")) })).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("logs out and calls onLogout when Выйти is clicked", async () => {
    const user = userEvent.setup();
    const logout = vi.fn().mockResolvedValue(undefined);
    const onLogout = vi.fn();
    mockedHook.mockReturnValue(hookState({ logout }));
    renderPage({ onLogout });
    await user.click(screen.getByRole("button", { name: new RegExp(t("profile.page.logout")) }));
    await useModalStore.getState().runConfirmAction();
    expect(logout).toHaveBeenCalledTimes(1);
    await vi.waitFor(() => { expect(onLogout).toHaveBeenCalledTimes(1); });
  });

  it("renders extra menu items", () => {
    mockedHook.mockReturnValue(hookState());
    renderPage({ extraMenuItems: [{ id: "x", label: "Кастомный пункт", onClick: vi.fn() }] });
    expect(screen.getByRole("button", { name: /Кастомный пункт/ })).toBeInTheDocument();
  });

  it("navigates from each core menu item", async () => {
    const user = userEvent.setup();
    mockedHook.mockReturnValue(hookState());
    renderPage({
      routes: {
        orders: "/orders",
        favorites: "/favorites",
        notifications: "/notifications",
        settings: "/settings",
      },
    });
    await user.click(screen.getByRole("button", { name: new RegExp(t("profile.page.myOrders")) }));
    await user.click(screen.getByRole("button", { name: new RegExp(t("profile.page.favorites")) }));
    await user.click(screen.getByRole("button", { name: new RegExp(t("profile.page.notifications")) }));
    await user.click(screen.getByRole("button", { name: new RegExp(t("profile.page.settings")) }));
  });

  it("caps the unread badge at 9+", () => {
    mockedHook.mockReturnValue(hookState());
    renderPage({ routes: { notifications: "/n" }, unreadCount: 42 });
    expect(screen.getByText("9+")).toBeInTheDocument();
  });

  it("navigates to the admin panel when clicked", async () => {
    const user = userEvent.setup();
    mockedHook.mockReturnValue(
      hookState({
        user: {
          id: "u1",
          name: "Admin",
          permissions: ["admin.access"],
        } as UseProfilePageResult["user"],
      }),
    );
    renderPage({ routes: { admin: "/admin" } });
    await user.click(screen.getByRole("button", { name: new RegExp(t("profile.page.adminPanelShort")) }));
  });

  it("shows the Telegram-only admin item and triggers the alert", async () => {
    const user = userEvent.setup();
    const showAlert = vi.fn();
    (window as unknown as { Telegram?: unknown }).Telegram = {
      WebApp: { showAlert },
    };
    mockedHook.mockReturnValue(
      hookState({
        user: {
          id: "u1",
          name: "Admin",
          permissions: ["admin.access"],
        } as UseProfilePageResult["user"],
      }),
    );
    renderPage();
    await user.click(
      screen.getByRole("button", { name: new RegExp(t("profile.page.adminPanel")) }),
    );
    expect(showAlert).toHaveBeenCalled();
    delete (window as unknown as { Telegram?: unknown }).Telegram;
  });

  it("renders a static extra item without an onClick handler", () => {
    mockedHook.mockReturnValue(hookState());
    renderPage({
      extraMenuItems: [{ label: "Только текст", right: <span>R</span> }],
    });
    expect(
      screen.getByRole("button", { name: /Только текст/ }),
    ).toBeDisabled();
    expect(screen.getByText("R")).toBeInTheDocument();
  });

  it("renders the avatar image and email when provided", () => {
    mockedHook.mockReturnValue(
      hookState({
        user: {
          id: "u1",
          name: "Тест",
          phone_number: "+70000000000",
          email: "a@b.c",
          permissions: [],
        } as unknown as UseProfilePageResult["user"],
      }),
    );
    renderPage({ avatarUrl: "http://img/a.jpg" });
    expect(screen.getByText("a@b.c")).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: "Тест Пользователь" }),
    ).toBeInTheDocument();
  });

  it("wires the Telegram BackButton", () => {
    mockedHook.mockReturnValue(hookState());
    const handlers: (() => void)[] = [];
    const BackButton = {
      show: vi.fn(),
      hide: vi.fn(),
      onClick: vi.fn((h: () => void) => handlers.push(h)),
      offClick: vi.fn(),
    };
    const { unmount } = render(
      <MemoryRouter>
        <ProfilePage BackButton={BackButton} routes={{ home: "/" }} />
      </MemoryRouter>,
    );
    expect(BackButton.show).toHaveBeenCalled();
    handlers[0]?.();
    unmount();
    expect(BackButton.hide).toHaveBeenCalled();
  });
});

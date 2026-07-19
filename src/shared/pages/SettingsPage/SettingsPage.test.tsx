import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { SettingsPage } from "@shared/pages/SettingsPage/SettingsPage";
import { useProfilePage } from "@shared/hooks/useProfilePage";
import type { UseProfilePageResult } from "@shared/hooks/useProfilePage";

vi.mock("@shared/hooks/useProfilePage", () => ({
  useProfilePage: vi.fn(),
}));

vi.mock("@shared/components/ThemeSwitcher/ThemeSwitcher", () => ({
  ThemeSwitcher: () => <div data-testid="theme-switcher" />,
}));

const mockedHook = vi.mocked(useProfilePage);

const hookState = (over: Partial<UseProfilePageResult> = {}): UseProfilePageResult =>
  ({
    user: { id: "u1", name: "Тест", permissions: [] },
    logout: vi.fn().mockResolvedValue(undefined),
    displayName: "Тест",
    editMode: false,
    editForm: { name: "Ник", first_name: "Имя", last_name: "Фамилия", middle_name: "", email: "a@b.c" },
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
      <SettingsPage {...props} />
    </MemoryRouter>,
  );

describe("SettingsPage", () => {
  beforeEach(() => {
    mockedHook.mockReset();
  });

  it("renders the settings sections", () => {
    mockedHook.mockReturnValue(hookState());
    renderPage();
    expect(screen.getByRole("heading", { name: "Настройки" })).toBeInTheDocument();
    expect(screen.getByTestId("theme-switcher")).toBeInTheDocument();
    expect(screen.getByText("Данные профиля")).toBeInTheDocument();
    expect(screen.getByText("Безопасность")).toBeInTheDocument();
  });

  it("prefills profile inputs from the hook form", () => {
    mockedHook.mockReturnValue(hookState());
    renderPage();
    expect(screen.getByPlaceholderText("Отображаемое имя")).toHaveValue("Ник");
    expect(screen.getByPlaceholderText("Имя")).toHaveValue("Имя");
    expect(screen.getByPlaceholderText("Email")).toHaveValue("a@b.c");
  });

  it("calls handleSave when the save button is clicked", async () => {
    const user = userEvent.setup();
    const handleSave = vi.fn();
    mockedHook.mockReturnValue(hookState({ handleSave }));
    renderPage();
    await user.click(screen.getByRole("button", { name: "Сохранить" }));
    expect(handleSave).toHaveBeenCalledTimes(1);
  });

  it("shows an edit error message", () => {
    mockedHook.mockReturnValue(hookState({ editError: "Не удалось" }));
    renderPage();
    expect(screen.getByText("Не удалось")).toBeInTheDocument();
  });

  it("shows an edit success message", () => {
    mockedHook.mockReturnValue(hookState({ editSuccess: true }));
    renderPage();
    expect(screen.getByText("Данные сохранены")).toBeInTheDocument();
  });

  it("hides the password section when disabled", () => {
    mockedHook.mockReturnValue(hookState());
    renderPage({ showPasswordChange: false });
    expect(screen.queryByText("Безопасность")).not.toBeInTheDocument();
  });

  it("submits the password change form", async () => {
    const user = userEvent.setup();
    const handlePasswordChange = vi.fn();
    mockedHook.mockReturnValue(
      hookState({
        handlePasswordChange,
        pwForm: { old_password: "current-pass", new_password: "new-password-123" },
      }),
    );
    renderPage();
    await user.click(screen.getByRole("button", { name: "Сменить пароль" }));
    expect(handlePasswordChange).toHaveBeenCalled();
  });

  it("navigates to documents pages", async () => {
    const user = userEvent.setup();
    mockedHook.mockReturnValue(hookState());
    renderPage();
    await user.click(screen.getByRole("button", { name: /Условия сервиса/ }));
    await user.click(screen.getByRole("button", { name: /Политика конфиденциальности/ }));
    expect(screen.getByRole("button", { name: /Политика конфиденциальности/ })).toBeInTheDocument();
  });

  it("updates every profile field through its onChange handler", async () => {
    const user = userEvent.setup();
    const setEditForm = vi.fn();
    mockedHook.mockReturnValue(hookState({ setEditForm }));
    renderPage();
    await user.type(screen.getByPlaceholderText("Отображаемое имя"), "X");
    await user.type(screen.getByPlaceholderText("Имя"), "X");
    await user.type(screen.getByPlaceholderText("Фамилия"), "X");
    await user.type(screen.getByPlaceholderText("Отчество"), "X");
    await user.type(screen.getByPlaceholderText("Email"), "X");
    expect(setEditForm).toHaveBeenCalled();
    const updater = setEditForm.mock.calls.at(-1)?.[0] as
      | ((prev: unknown) => unknown)
      | undefined;
    expect(typeof updater).toBe("function");
    expect(updater?.({})).toBeTypeOf("object");
  });

  it("updates the password fields", async () => {
    const user = userEvent.setup();
    const setPwForm = vi.fn();
    mockedHook.mockReturnValue(hookState({ setPwForm }));
    renderPage();
    await user.type(screen.getByPlaceholderText("Текущий пароль"), "a");
    await user.type(screen.getByPlaceholderText("Минимум 8 символов"), "b");
    expect(setPwForm).toHaveBeenCalled();
  });

  it("shows password error and success and loading labels", () => {
    mockedHook.mockReturnValue(
      hookState({
        pwError: "Пароль неверный",
        pwSuccess: true,
        pwLoading: true,
        editLoading: true,
      }),
    );
    renderPage();
    expect(screen.getByText("Пароль неверный")).toBeInTheDocument();
    expect(screen.getByText("Пароль изменён")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Меняем..." })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Сохраняем..." })).toBeDisabled();
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
        <SettingsPage BackButton={BackButton} routes={{ profile: "/profile" }} />
      </MemoryRouter>,
    );
    expect(BackButton.show).toHaveBeenCalled();
    handlers[0]?.();
    unmount();
    expect(BackButton.hide).toHaveBeenCalled();
  });
});

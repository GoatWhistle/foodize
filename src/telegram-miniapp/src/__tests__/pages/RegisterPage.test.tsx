import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";

const completeTelegramAuth = vi.fn();
vi.mock("../../telegram/init", () => ({
  completeTelegramAuth: (...args: unknown[]) =>
    completeTelegramAuth(...args) as Promise<void>,
}));

const fetchMe = vi.fn();
vi.mock("../../store/useAuthStore", () => ({
  useAuthStore: (sel: (s: { fetchMe: () => Promise<void> }) => unknown) =>
    sel({ fetchMe }),
}));

vi.mock("@shared/utils/translateApiError", () => ({
  translateApiError: (_e: unknown, fallback: string) => fallback,
}));

import { RegisterPage } from "../../pages/auth/RegisterPage";

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  completeTelegramAuth.mockResolvedValue(undefined);
  fetchMe.mockResolvedValue(undefined);
});

describe("RegisterPage", () => {
  it("renders the welcome heading and name field for new users", () => {
    render(<RegisterPage initData="init" onSuccess={vi.fn()} />);
    expect(screen.getByText("Добро пожаловать")).toBeInTheDocument();
    expect(screen.getByText("Ваше имя")).toBeInTheDocument();
  });

  it("renders the login heading and hides the name field when logged out flag is set", () => {
    localStorage.setItem("foodize_tg_logged_out", "1");
    render(<RegisterPage initData="init" onSuccess={vi.fn()} />);
    expect(screen.getByText("Вход в аккаунт")).toBeInTheDocument();
    expect(screen.queryByText("Ваше имя")).not.toBeInTheDocument();
  });

  it("shows a validation error for an invalid phone and does not submit", async () => {
    render(<RegisterPage initData="init" onSuccess={vi.fn()} />);
    const phone = screen.getByPlaceholderText("+7XXXXXXXXXX");
    await userEvent.type(phone, "123");
    await userEvent.click(screen.getByRole("button", { name: "Продолжить" }));
    expect(
      screen.getByText("Неверный формат номера (+7XXXXXXXXXX)"),
    ).toBeInTheDocument();
    expect(completeTelegramAuth).not.toHaveBeenCalled();
  });

  it("submits with a valid phone and name, then calls onSuccess", async () => {
    const onSuccess = vi.fn();
    render(<RegisterPage initData="init-token" onSuccess={onSuccess} />);
    await userEvent.type(screen.getByPlaceholderText("+7XXXXXXXXXX"), "+79991234567");
    await userEvent.type(screen.getByPlaceholderText("Имя"), "Иван");
    await userEvent.click(screen.getByRole("button", { name: "Продолжить" }));
    await waitFor(() => {
      expect(completeTelegramAuth).toHaveBeenCalledWith("init-token", "+79991234567", "Иван");
    });
    expect(fetchMe).toHaveBeenCalledTimes(1);
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  it("falls back to a default name when only whitespace is entered", async () => {
    render(<RegisterPage initData="init" onSuccess={vi.fn()} />);
    await userEvent.type(screen.getByPlaceholderText("+7XXXXXXXXXX"), "+79991234567");
    await userEvent.type(screen.getByPlaceholderText("Имя"), "   ");
    await userEvent.click(screen.getByRole("button", { name: "Продолжить" }));
    await waitFor(() => {
      expect(completeTelegramAuth).toHaveBeenCalledWith(
        "init",
        "+79991234567",
        "Telegram User",
      );
    });
  });

  it("shows an error message when registration fails", async () => {
    completeTelegramAuth.mockRejectedValueOnce(new Error("nope"));
    render(<RegisterPage initData="init" onSuccess={vi.fn()} />);
    await userEvent.type(screen.getByPlaceholderText("+7XXXXXXXXXX"), "+79991234567");
    await userEvent.type(screen.getByPlaceholderText("Имя"), "Иван");
    await userEvent.click(screen.getByRole("button", { name: "Продолжить" }));
    await waitFor(() => {
      expect(
        screen.getByText("Не удалось зарегистрироваться. Проверьте данные."),
      ).toBeInTheDocument();
    });
  });

  it("prefills and locks the phone when prefillPhone is provided", () => {
    render(<RegisterPage initData="init" prefillPhone="+79990001122" onSuccess={vi.fn()} />);
    const phone = screen.getByPlaceholderText("+7XXXXXXXXXX");
    expect(phone).toHaveValue("+79990001122");
    expect(phone).toHaveAttribute("readonly");
  });
});

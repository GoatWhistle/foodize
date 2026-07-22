import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";

const authExistingUser = vi.fn();
const initTelegramApp = vi.fn();
vi.mock("../../telegram/init", () => ({
  authExistingUser: (...a: unknown[]) => authExistingUser(...a) as Promise<void>,
  initTelegramApp: (...a: unknown[]) => initTelegramApp(...a) as Promise<unknown>,
}));

const getTelegramInitData = vi.fn();
const requestTelegramContact = vi.fn();
vi.mock("../../telegram/sdk", () => ({
  getTelegramInitData: () => getTelegramInitData() as string,
  requestTelegramContact: () => requestTelegramContact() as Promise<boolean>,
}));

const fetchMe = vi.fn();
vi.mock("../../store/useAuthStore", () => ({
  useAuthStore: (sel: (s: { fetchMe: () => Promise<void> }) => unknown) =>
    sel({ fetchMe }),
}));

vi.mock("@shared/utils/translateApiError", () => ({
  translateApiError: (_e: unknown, fallback: string) => fallback,
}));

import { LoginPage } from "../../pages/auth/LoginPage";
import { t } from "@shared/i18n/useTranslation";

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  getTelegramInitData.mockReturnValue("");
  fetchMe.mockResolvedValue(undefined);
  authExistingUser.mockResolvedValue(undefined);
});

describe("LoginPage", () => {
  it("renders the Telegram login button and heading", () => {
    render(<LoginPage onSuccess={vi.fn()} />);
    expect(screen.getByRole("heading", { name: t("auth.miniapp.title") })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: new RegExp(t("auth.buttons.loginWithTelegram")) })).toBeInTheDocument();
  });

  it("shows an error when Telegram passed no init data", async () => {
    render(<LoginPage onSuccess={vi.fn()} />);
    await userEvent.click(screen.getByRole("button", { name: new RegExp(t("auth.buttons.loginWithTelegram")) }));
    expect(screen.getByText(t("auth.miniapp.errors.noInitData"))).toBeInTheDocument();
    expect(authExistingUser).not.toHaveBeenCalled();
  });

  it("logs in directly when existing auth succeeds", async () => {
    getTelegramInitData.mockReturnValue("live-init");
    const onSuccess = vi.fn();
    render(<LoginPage onSuccess={onSuccess} />);
    await userEvent.click(screen.getByRole("button", { name: new RegExp(t("auth.buttons.loginWithTelegram")) }));
    await waitFor(() => {
      expect(authExistingUser).toHaveBeenCalledWith("live-init");
    });
    expect(fetchMe).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem("foodize_tg_logged_out")).toBeNull();
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  it("uses the initData prop when the SDK returns none", async () => {
    getTelegramInitData.mockReturnValue("");
    const onSuccess = vi.fn();
    render(<LoginPage initData="prop-init" onSuccess={onSuccess} />);
    await userEvent.click(screen.getByRole("button", { name: new RegExp(t("auth.buttons.loginWithTelegram")) }));
    await waitFor(() => {
      expect(authExistingUser).toHaveBeenCalledWith("prop-init");
    });
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  it("asks for a contact and errors when it is not granted", async () => {
    getTelegramInitData.mockReturnValue("live-init");
    authExistingUser.mockRejectedValueOnce({ response: { status: 404 } });
    requestTelegramContact.mockResolvedValueOnce(false);
    render(<LoginPage onSuccess={vi.fn()} />);
    await userEvent.click(screen.getByRole("button", { name: new RegExp(t("auth.buttons.loginWithTelegram")) }));
    await waitFor(() => {
      expect(
        screen.getByText(t("auth.miniapp.errors.shareContact")),
      ).toBeInTheDocument();
    });
    expect(requestTelegramContact).toHaveBeenCalledTimes(1);
  });

  it("polls for the contact link and logs in when the account becomes registered", async () => {
    vi.useFakeTimers();
    getTelegramInitData.mockReturnValue("live-init");
    authExistingUser
      .mockRejectedValueOnce({ response: { status: 404 } })
      .mockResolvedValue(undefined);
    requestTelegramContact.mockResolvedValueOnce(true);
    initTelegramApp.mockResolvedValue({
      status: "registered",
      initData: "linked-init",
    });
    const onSuccess = vi.fn();
    render(<LoginPage onSuccess={onSuccess} />);

    fireEvent.click(
      screen.getByRole("button", { name: new RegExp(t("auth.buttons.loginWithTelegram")) }),
    );

    for (let i = 0; i < 5 && onSuccess.mock.calls.length === 0; i += 1) {
      await vi.advanceTimersByTimeAsync(1000);
    }

    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(authExistingUser).toHaveBeenLastCalledWith("linked-init");
    vi.useRealTimers();
  });

  it("shows a retry hint when the contact link never resolves", async () => {
    vi.useFakeTimers();
    getTelegramInitData.mockReturnValue("live-init");
    authExistingUser.mockRejectedValueOnce({ response: { status: 404 } });
    requestTelegramContact.mockResolvedValueOnce(true);
    initTelegramApp.mockResolvedValue({ status: "no_init_data" });
    render(<LoginPage onSuccess={vi.fn()} />);

    fireEvent.click(
      screen.getByRole("button", { name: new RegExp(t("auth.buttons.loginWithTelegram")) }),
    );

    for (let i = 0; i < 16; i += 1) {
      await vi.advanceTimersByTimeAsync(1000);
    }

    expect(
      screen.getByText(t("auth.miniapp.errors.contactNotLinked")),
    ).toBeInTheDocument();
    vi.useRealTimers();
  });

  it("shows a generic error when contact request throws", async () => {
    getTelegramInitData.mockReturnValue("live-init");
    authExistingUser.mockRejectedValueOnce({ response: { status: 404 } });
    requestTelegramContact.mockRejectedValueOnce(new Error("contact boom"));
    render(<LoginPage onSuccess={vi.fn()} />);

    await userEvent.click(
      screen.getByRole("button", { name: new RegExp(t("auth.buttons.loginWithTelegram")) }),
    );
    await waitFor(() => {
      expect(
        screen.getByText(t("auth.miniapp.errors.telegramAuthFailed")),
      ).toBeInTheDocument();
    });
  });
});

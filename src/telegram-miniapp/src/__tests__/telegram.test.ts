import { vi, describe, it, expect, beforeEach, type Mock } from "vitest";

vi.hoisted(() => {
  window.Telegram = {
    WebApp: {
      initData: "init_data_string",
      initDataUnsafe: {
        user: { id: 123, first_name: "Test" },
        start_param: "restaurant_123",
      },
      colorScheme: "dark",
      themeParams: { bg_color: "#ffffff" },
      expand: () => {},
      ready: () => {},
      close: () => {},
      showAlert: () => {},
      showConfirm: () => {},
      requestContact: (callback: (granted: boolean) => void) => { callback(true); },
    },
  };
});

import { authService } from "../services/authService";
import {
  getTelegramInitData,
  getTelegramUser,
  getStartParam,
  expandApp,
  readyApp,
  getColorScheme,
  getThemeParams,
  closeApp,
  showAlert,
  showConfirm,
  requestTelegramContact,
} from "../telegram/sdk";
import {
  initTelegramApp,
  completeTelegramAuth,
  authExistingUser,
} from "../telegram/init";

vi.mock("../services/authService", () => ({
  authService: {
    telegramCheck: vi.fn(),
    telegramRegister: vi.fn(),
    telegramAuth: vi.fn(),
  },
}));

const authServiceMock = authService as unknown as {
  telegramCheck: Mock;
  telegramRegister: Mock;
  telegramAuth: Mock;
};

const webApp = (): NonNullable<NonNullable<Window["Telegram"]>["WebApp"]> => {
  const app = window.Telegram?.WebApp;
  if (!app) throw new Error("Telegram.WebApp is not initialized in test setup");
  return app;
};

describe("Telegram WebApp SDK functions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  it("should get telegram user, start param, color scheme, theme params", () => {
    const mockUser = { id: 123, first_name: "Test" };
    expect(getTelegramInitData()).toBe("init_data_string");
    expect(getTelegramUser()).toEqual(mockUser);
    expect(getStartParam()).toBe("restaurant_123");
    expect(getColorScheme()).toBe("dark");
    expect(getThemeParams()).toEqual({ bg_color: "#ffffff" });

    const app = webApp();
    app.expand = vi.fn();
    app.ready = vi.fn();
    app.close = vi.fn();
    app.showAlert = vi.fn();
    app.showConfirm = vi.fn();

    expandApp();
    expect(app.expand).toHaveBeenCalled();

    readyApp();
    expect(app.ready).toHaveBeenCalled();

    closeApp();
    expect(app.close).toHaveBeenCalled();

    showAlert("hello", "cb" as unknown as () => void);
    expect(app.showAlert).toHaveBeenCalledWith("hello", "cb");

    showConfirm("confirm", "cb" as unknown as (confirmed: boolean) => void);
    expect(app.showConfirm).toHaveBeenCalledWith("confirm", "cb");
  });

  it("should resolve requestTelegramContact when granted", async () => {
    const res = await requestTelegramContact();
    expect(res).toBe(true);
  });
});

describe("Telegram initialization flows", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("should return registered status when check succeeds", async () => {
    authServiceMock.telegramCheck.mockResolvedValueOnce({
      data: { data: { status: "registered", phone_number: "+123" } },
    });

    const res = await initTelegramApp();
    expect(res.status).toBe("registered");
    expect(res.phone_number).toBe("+123");
    expect(res.start_param).toBe("restaurant_123");
  });

  it("should return error status when check throws", async () => {
    authServiceMock.telegramCheck.mockRejectedValueOnce(new Error("Failed"));

    const res = await initTelegramApp();
    expect(res.status).toBe("error");
  });

  it("should completeTelegramAuth without persisting tokens", async () => {
    authServiceMock.telegramRegister.mockResolvedValueOnce({
      data: { data: { access_token: "acc", refresh_token: "ref" } },
    });

    await completeTelegramAuth("init", "+123", "Name");
    expect(authServiceMock.telegramRegister).toHaveBeenCalledWith(
      "init",
      "+123",
      "Name",
    );
    expect(sessionStorage.getItem("access_token")).toBeNull();
    expect(sessionStorage.getItem("refresh_token")).toBeNull();
  });

  it("should authExistingUser without persisting tokens", async () => {
    authServiceMock.telegramAuth.mockResolvedValueOnce({
      data: { data: { access_token: "acc", refresh_token: "ref" } },
    });

    await authExistingUser("init");
    expect(authServiceMock.telegramAuth).toHaveBeenCalledWith("init");
    expect(sessionStorage.getItem("access_token")).toBeNull();
    expect(sessionStorage.getItem("refresh_token")).toBeNull();
  });
});

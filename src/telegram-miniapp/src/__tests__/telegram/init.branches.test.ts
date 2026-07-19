import { vi, describe, it, expect, beforeEach, type Mock } from "vitest";

const sdk = vi.hoisted(() => ({
  expandApp: vi.fn(),
  readyApp: vi.fn(),
  getTelegramInitData: vi.fn(),
  getStartParam: vi.fn(),
}));
vi.mock("../../telegram/sdk", () => ({
  expandApp: sdk.expandApp,
  readyApp: sdk.readyApp,
  getTelegramInitData: sdk.getTelegramInitData,
  getStartParam: sdk.getStartParam,
}));

const isAxiosErrorMock = vi.hoisted(() =>
  vi.fn((_e: unknown): boolean => false),
);
vi.mock("axios", () => ({
  default: { isAxiosError: (e: unknown) => isAxiosErrorMock(e) },
}));

vi.mock("../../services/authService", () => ({
  authService: {
    telegramCheck: vi.fn(),
    telegramRegister: vi.fn(),
    telegramAuth: vi.fn(),
  },
}));

import { authService } from "../../services/authService";
import {
  initTelegramApp,
  completeTelegramAuth,
  authExistingUser,
} from "../../telegram/init";

const authServiceMock = authService as unknown as {
  telegramCheck: Mock;
  telegramRegister: Mock;
  telegramAuth: Mock;
};

beforeEach(() => {
  vi.clearAllMocks();
  isAxiosErrorMock.mockReturnValue(false);
  sdk.getStartParam.mockReturnValue("restaurant_1");
  sdk.getTelegramInitData.mockReturnValue("init");
});

describe("initTelegramApp without init data", () => {
  it("returns no_init_data and readies the app when Telegram sends no init data", async () => {
    sdk.getTelegramInitData.mockReturnValue("");

    const res = await initTelegramApp();

    expect(res).toEqual({
      status: "no_init_data",
      start_param: "restaurant_1",
    });
    expect(sdk.readyApp).toHaveBeenCalledTimes(1);
    expect(authServiceMock.telegramCheck).not.toHaveBeenCalled();
  });
});

describe("initTelegramApp error description", () => {
  it("captures the http status from an axios error", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    isAxiosErrorMock.mockReturnValue(true);
    authServiceMock.telegramCheck.mockRejectedValueOnce({
      response: { status: 401 },
      message: "unauthorized",
    });

    const res = await initTelegramApp();

    expect(res.status).toBe("error");
    expect(errorSpy).toHaveBeenCalledWith(
      "[initTelegramApp] failed:",
      401,
      "unauthorized",
    );
    errorSpy.mockRestore();
  });

  it("handles a non-Error thrown value with an empty description", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    authServiceMock.telegramCheck.mockRejectedValueOnce("plain string boom");

    const res = await initTelegramApp();

    expect(res.status).toBe("error");
    expect(errorSpy).toHaveBeenCalledWith(
      "[initTelegramApp] failed:",
      undefined,
      undefined,
    );
    errorSpy.mockRestore();
  });
});

describe("completeTelegramAuth error handling", () => {
  it("logs and rethrows when register fails", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    authServiceMock.telegramRegister.mockRejectedValueOnce(
      new Error("register boom"),
    );

    await expect(
      completeTelegramAuth("init", "+700", "Name"),
    ).rejects.toThrow("register boom");
    expect(warnSpy).toHaveBeenCalledWith(
      "[completeTelegramAuth] failed:",
      undefined,
      "register boom",
    );
    warnSpy.mockRestore();
  });
});

describe("authExistingUser error handling", () => {
  it("logs and rethrows when telegram auth fails", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    authServiceMock.telegramAuth.mockRejectedValueOnce(
      new Error("auth boom"),
    );

    await expect(authExistingUser("init")).rejects.toThrow("auth boom");
    expect(warnSpy).toHaveBeenCalledWith(
      "[authExistingUser] failed:",
      undefined,
      "auth boom",
    );
    warnSpy.mockRestore();
  });
});

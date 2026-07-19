import { vi, describe, it, expect, beforeEach } from "vitest";

vi.hoisted(() => {
  delete (window as { Telegram?: unknown }).Telegram;
});

let sdk: typeof import("../../telegram/sdk");

beforeEach(async () => {
  delete (window as { Telegram?: unknown }).Telegram;
  vi.resetModules();
  sdk = await import("../../telegram/sdk");
});

describe("telegram/sdk when Telegram is unavailable", () => {
  it("resolves tg and the singletons to null", () => {
    expect(sdk.tg).toBeNull();
    expect(sdk.BackButton).toBeNull();
    expect(sdk.MainButton).toBeNull();
    expect(sdk.HapticFeedback).toBeNull();
    expect(sdk.getBackButton()).toBeNull();
    expect(sdk.getMainButton()).toBeNull();
    expect(sdk.getHapticFeedback()).toBeNull();
  });

  it("returns safe defaults for data accessors", () => {
    expect(sdk.getTelegramInitData()).toBe("");
    expect(sdk.getTelegramUser()).toBeNull();
    expect(sdk.getStartParam()).toBe("");
    expect(sdk.getColorScheme()).toBe("light");
    expect(sdk.getThemeParams()).toEqual({});
  });

  it("makes the action helpers no-ops without throwing", () => {
    expect(() => {
      sdk.expandApp();
      sdk.readyApp();
      sdk.closeApp();
      sdk.startTelegramApp();
      sdk.showAlert("x");
      sdk.showConfirm("y");
      sdk.hapticSelection();
      sdk.hapticImpact("medium");
      sdk.enableClosingConfirmation();
      sdk.disableClosingConfirmation();
    }).not.toThrow();
  });

  it("rejects requestTelegramContact", async () => {
    await expect(sdk.requestTelegramContact()).rejects.toThrow(
      "Telegram contact request is not available",
    );
  });

  it("writes zeroed safe-area insets and returns a no-op unsubscribe", () => {
    sdk.applySafeAreaInsets();
    const root = document.documentElement.style;
    expect(root.getPropertyValue("--tg-safe-area-inset-top")).toBe("0px");

    const unsubscribe = sdk.subscribeSafeAreaInsets();
    expect(() => { unsubscribe(); }).not.toThrow();
  });
});

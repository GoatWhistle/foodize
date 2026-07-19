import { vi, describe, it, expect, beforeEach } from "vitest";

vi.hoisted(() => {
  const noop = () => {};
  window.Telegram = {
    WebApp: {
      initData: "sdk_init_data",
      initDataUnsafe: {
        user: { id: 77, first_name: "Sdk", username: "sdkuser" },
        start_param: "restaurant_99",
      },
      colorScheme: "dark",
      themeParams: { bg_color: "#101010", text_color: "#fefefe" },
      viewportHeight: 640,
      safeAreaInset: { top: 10, bottom: 20, left: 30, right: 40 },
      contentSafeAreaInset: { top: 1, bottom: 2, left: 3, right: 4 },
      BackButton: {
        show: noop,
        hide: noop,
        onClick: noop,
        offClick: noop,
      },
      MainButton: {
        text: "",
        isVisible: false,
        isActive: false,
        show: noop,
        hide: noop,
        enable: noop,
        disable: noop,
        setText: noop,
        showProgress: noop,
        hideProgress: noop,
        onClick: noop,
        offClick: noop,
      },
      HapticFeedback: {
        impactOccurred: noop,
        notificationOccurred: noop,
        selectionChanged: noop,
      },
      expand: noop,
      ready: noop,
      close: noop,
      enableClosingConfirmation: noop,
      disableClosingConfirmation: noop,
      showAlert: noop,
      showConfirm: noop,
      requestContact: (callback: (granted: boolean) => void) => { callback(true); },
      onEvent: noop,
      offEvent: noop,
    },
  };
});

import * as sdk from "../../telegram/sdk";

type AnyFn = (...args: unknown[]) => unknown;

interface TestWebApp {
  initData: string;
  BackButton: Record<string, AnyFn>;
  MainButton: Record<string, AnyFn>;
  HapticFeedback: { selectionChanged: AnyFn; impactOccurred: AnyFn; notificationOccurred: AnyFn };
  expand: AnyFn;
  ready: AnyFn;
  close: AnyFn;
  showAlert: AnyFn;
  showConfirm: AnyFn;
  requestContact: unknown;
  enableClosingConfirmation: AnyFn;
  disableClosingConfirmation: AnyFn;
  onEvent: AnyFn;
  offEvent: AnyFn;
}

const webApp = (): TestWebApp => {
  const app = window.Telegram?.WebApp;
  if (!app) throw new Error("WebApp missing");
  return app as unknown as TestWebApp;
};

describe("telegram/sdk with Telegram available", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sdk.clearTelegramInitData();
  });

  it("exposes tg and the button/haptic singletons", () => {
    expect(sdk.tg).not.toBeNull();
    expect(sdk.BackButton).not.toBeNull();
    expect(sdk.MainButton).not.toBeNull();
    expect(sdk.HapticFeedback).not.toBeNull();
    expect(sdk.getBackButton()).toBe(webApp().BackButton);
    expect(sdk.getMainButton()).toBe(webApp().MainButton);
    expect(sdk.getHapticFeedback()).toBe(webApp().HapticFeedback);
  });

  it("reads init data, user, start param and caches init data", () => {
    expect(sdk.getTelegramInitData()).toBe("sdk_init_data");
    expect(sdk.getTelegramUser()).toEqual({
      id: 77,
      first_name: "Sdk",
      username: "sdkuser",
    });
    expect(sdk.getStartParam()).toBe("restaurant_99");
  });

  it("falls back to cached init data when live init data is empty", () => {
    expect(sdk.getTelegramInitData()).toBe("sdk_init_data");
    const app = webApp();
    const original = app.initData;
    app.initData = "";
    expect(sdk.getTelegramInitData()).toBe("sdk_init_data");
    sdk.clearTelegramInitData();
    expect(sdk.getTelegramInitData()).toBe("");
    app.initData = original;
  });

  it("reads color scheme and theme params", () => {
    expect(sdk.getColorScheme()).toBe("dark");
    expect(sdk.getThemeParams()).toEqual({
      bg_color: "#101010",
      text_color: "#fefefe",
    });
  });

  it("delegates expand/ready/close/startTelegramApp to the WebApp", () => {
    const app = webApp();
    app.expand = vi.fn();
    app.ready = vi.fn();
    app.close = vi.fn();

    sdk.expandApp();
    expect(app.expand).toHaveBeenCalledTimes(1);

    sdk.readyApp();
    expect(app.ready).toHaveBeenCalledTimes(1);

    sdk.closeApp();
    expect(app.close).toHaveBeenCalledTimes(1);

    sdk.startTelegramApp();
    expect(app.ready).toHaveBeenCalledTimes(2);
    expect(app.expand).toHaveBeenCalledTimes(2);
  });

  it("delegates showAlert and showConfirm with the callback", () => {
    const app = webApp();
    app.showAlert = vi.fn();
    app.showConfirm = vi.fn();
    const alertCb = vi.fn();
    const confirmCb = vi.fn();

    sdk.showAlert("hi", alertCb);
    expect(app.showAlert).toHaveBeenCalledWith("hi", alertCb);

    sdk.showConfirm("ok?", confirmCb);
    expect(app.showConfirm).toHaveBeenCalledWith("ok?", confirmCb);
  });

  it("fires haptic selection and impact", () => {
    const app = webApp();
    app.HapticFeedback.selectionChanged = vi.fn();
    app.HapticFeedback.impactOccurred = vi.fn();

    sdk.hapticSelection();
    expect(app.HapticFeedback.selectionChanged).toHaveBeenCalledTimes(1);

    sdk.hapticImpact();
    expect(app.HapticFeedback.impactOccurred).toHaveBeenCalledWith("light");

    sdk.hapticImpact("heavy");
    expect(app.HapticFeedback.impactOccurred).toHaveBeenCalledWith("heavy");
  });

  it("resolves requestTelegramContact when granted", async () => {
    await expect(sdk.requestTelegramContact()).resolves.toBe(true);
  });

  it("rejects requestTelegramContact when the API is missing", async () => {
    const app = webApp();
    const original = app.requestContact;
    (app as { requestContact?: unknown }).requestContact = undefined;
    await expect(sdk.requestTelegramContact()).rejects.toThrow(
      "Telegram contact request is not available",
    );
    app.requestContact = original;
  });

  it("toggles closing confirmation through optional methods", () => {
    const app = webApp();
    app.enableClosingConfirmation = vi.fn();
    app.disableClosingConfirmation = vi.fn();

    sdk.enableClosingConfirmation();
    expect(app.enableClosingConfirmation).toHaveBeenCalledTimes(1);

    sdk.disableClosingConfirmation();
    expect(app.disableClosingConfirmation).toHaveBeenCalledTimes(1);
  });

  it("writes safe-area inset CSS variables from the WebApp", () => {
    sdk.applySafeAreaInsets();
    const root = document.documentElement.style;
    expect(root.getPropertyValue("--tg-safe-area-inset-top")).toBe("10px");
    expect(root.getPropertyValue("--tg-safe-area-inset-bottom")).toBe("20px");
    expect(root.getPropertyValue("--tg-content-safe-area-inset-left")).toBe("3px");
  });

  it("subscribes to safe-area changes and returns an unsubscribe", () => {
    const app = webApp();
    app.onEvent = vi.fn();
    app.offEvent = vi.fn();

    const unsubscribe = sdk.subscribeSafeAreaInsets();
    expect(app.onEvent).toHaveBeenCalledWith("safeAreaChanged", expect.any(Function));
    expect(app.onEvent).toHaveBeenCalledWith(
      "contentSafeAreaChanged",
      expect.any(Function),
    );

    unsubscribe();
    expect(app.offEvent).toHaveBeenCalledWith("safeAreaChanged", expect.any(Function));
    expect(app.offEvent).toHaveBeenCalledWith(
      "contentSafeAreaChanged",
      expect.any(Function),
    );
  });
});

import { describe, it, expect, afterEach, vi } from "vitest";
import { detectLanguage, useLanguageStore } from "@shared/store/useLanguageStore";
import { DEFAULT_LANGUAGE } from "@shared/i18n/types";

interface MutableGlobal {
  Telegram?: unknown;
  navigator?: unknown;
}

const target = globalThis as MutableGlobal;
const originalNavigator = target.navigator;

afterEach(() => {
  target.navigator = originalNavigator;
  delete target.Telegram;
  vi.unstubAllGlobals();
});

describe("detectLanguage", () => {
  it("prefers the Telegram language code", () => {
    target.Telegram = { WebApp: { initDataUnsafe: { user: { language_code: "en-US" } } } };
    target.navigator = { language: "ru-RU" };
    expect(detectLanguage()).toBe("en");
  });

  it("falls back to navigator.language", () => {
    delete target.Telegram;
    target.navigator = { language: "ru-RU" };
    expect(detectLanguage()).toBe("ru");
  });

  it("falls back to navigator.languages", () => {
    delete target.Telegram;
    target.navigator = { languages: ["en-GB"] };
    expect(detectLanguage()).toBe("en");
  });

  it("returns the default when nothing matches", () => {
    delete target.Telegram;
    target.navigator = { language: "zz", languages: ["qq"] };
    expect(detectLanguage()).toBe(DEFAULT_LANGUAGE);
  });

  it("returns the default when there is no navigator at all", () => {
    delete target.Telegram;
    target.navigator = undefined;
    expect(detectLanguage()).toBe(DEFAULT_LANGUAGE);
  });
});

describe("useLanguageStore", () => {
  it("stores a new language", () => {
    useLanguageStore.getState().setLanguage("en");
    expect(useLanguageStore.getState().language).toBe("en");
    useLanguageStore.getState().setLanguage("ru");
    expect(useLanguageStore.getState().language).toBe("ru");
  });

  it("exposes a valid language by default", () => {
    expect(["ru", "en"]).toContain(useLanguageStore.getState().language);
  });
});

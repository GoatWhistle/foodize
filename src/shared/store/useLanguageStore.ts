import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES, isLanguage } from "@shared/i18n/types";
import type { Language } from "@shared/i18n/types";

const STORAGE_KEY = "foodize-language";

interface NavigatorLike {
  language?: string;
  languages?: readonly string[];
}

interface GlobalWithLocale {
  Telegram?: { WebApp?: { initDataUnsafe?: { user?: { language_code?: string } } } };
  navigator?: NavigatorLike;
}

export const detectLanguage = (): Language => {
  const globalWithLocale = globalThis as GlobalWithLocale;
  const telegram = globalWithLocale.Telegram?.WebApp?.initDataUnsafe?.user?.language_code;
  const navigatorLike = globalWithLocale.navigator;
  const candidates = [
    telegram,
    navigatorLike?.language,
    ...(navigatorLike?.languages ?? []),
  ];
  for (const candidate of candidates) {
    const code = candidate?.slice(0, 2).toLowerCase();
    if (isLanguage(code)) return code;
  }
  return DEFAULT_LANGUAGE;
};

export interface LanguageStoreState {
  language: Language;
  setLanguage: (language: Language) => void;
}

export const useLanguageStore = create<LanguageStoreState>()(
  persist(
    (set) => ({
      language: detectLanguage(),
      setLanguage: (language) => {
        set({ language });
      },
    }),
    {
      name: STORAGE_KEY,
      merge: (persisted, current) => {
        const stored = (persisted as Partial<LanguageStoreState> | undefined)?.language;
        return { ...current, language: isLanguage(stored) ? stored : current.language };
      },
    },
  ),
);

export { SUPPORTED_LANGUAGES };
export type { Language };

import { useCallback } from "react";
import { useLanguageStore } from "@shared/store/useLanguageStore";
import { dictionaries } from "./dictionaries";
import { resolveTranslation } from "./translate";
import type { TranslationParams } from "./translate";
import type { Language } from "./types";

export type TranslateFn = (key: string, params?: TranslationParams) => string;

export const translateWith = (language: Language): TranslateFn =>
  (key, params) => resolveTranslation(dictionaries, language, key, params);

export const useTranslation = (): { t: TranslateFn; language: Language } => {
  const language = useLanguageStore((s) => s.language);
  const t = useCallback<TranslateFn>(
    (key, params) => resolveTranslation(dictionaries, language, key, params),
    [language],
  );
  return { t, language };
};

export const getLanguage = (): Language => useLanguageStore.getState().language;

export const t: TranslateFn = (key, params) =>
  resolveTranslation(dictionaries, useLanguageStore.getState().language, key, params);

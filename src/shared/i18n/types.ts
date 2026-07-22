export const SUPPORTED_LANGUAGES = ["ru", "en"] as const;

export type Language = (typeof SUPPORTED_LANGUAGES)[number];

export const DEFAULT_LANGUAGE: Language = "ru";

export const isLanguage = (value: unknown): value is Language =>
  typeof value === "string" && (SUPPORTED_LANGUAGES as readonly string[]).includes(value);

export type PluralForms = { one: string; few: string; many: string };

export type TranslationValue = string | PluralForms;

export type TranslationTree = { [key: string]: TranslationValue | TranslationTree };

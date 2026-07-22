import { DEFAULT_LANGUAGE } from "./types";
import type { Language, PluralForms, TranslationTree, TranslationValue } from "./types";

export type TranslationParams = Record<string, string | number>;

const PLURAL_RULES: Record<Language, (n: number) => keyof PluralForms> = {
  ru: (n) => {
    const abs = Math.abs(n) % 100;
    const last = abs % 10;
    if (abs > 10 && abs < 20) return "many";
    if (last > 1 && last < 5) return "few";
    if (last === 1) return "one";
    return "many";
  },
  en: (n) => (Math.abs(n) === 1 ? "one" : "many"),
};

const isPluralForms = (value: TranslationValue | TranslationTree): value is PluralForms =>
  typeof value === "object" && value !== null && "one" in value && "many" in value;

const lookup = (tree: TranslationTree, path: string): TranslationValue | TranslationTree | undefined => {
  let current: TranslationValue | TranslationTree | undefined = tree;
  const segments = path.split(".");
  for (let index = 0; index < segments.length; index += 1) {
    if (typeof current !== "object" || current === null || isPluralForms(current)) return undefined;
    const node = current as TranslationTree;
    const literal = segments.slice(index).join(".");
    if (literal in node) return node[literal];
    current = node[segments[index] as string];
  }
  return current;
};

export const interpolate = (template: string, params?: TranslationParams): string => {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in params ? String(params[key]) : match,
  );
};

export const selectPlural = (forms: PluralForms, count: number, language: Language): string => {
  const category = (PLURAL_RULES[language] ?? PLURAL_RULES[DEFAULT_LANGUAGE])(count);
  return forms[category] ?? forms.many;
};

export const resolveTranslation = (
  dictionaries: Record<Language, TranslationTree>,
  language: Language,
  key: string,
  params?: TranslationParams,
): string => {
  const primary = lookup(dictionaries[language], key);
  const value = primary ?? lookup(dictionaries[DEFAULT_LANGUAGE], key);
  if (value === undefined) return key;
  if (typeof value === "string") return interpolate(value, params);
  if (isPluralForms(value)) {
    const count = Number(params?.["count"] ?? 0);
    return interpolate(selectPlural(value, count, language), params);
  }
  return key;
};

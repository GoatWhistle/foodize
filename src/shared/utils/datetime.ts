import { t } from "@shared/i18n/useTranslation";

export const weekdaysShort = (): string[] =>
  [0, 1, 2, 3, 4, 5, 6].map((day) => t(`enums.weekdaysShort.${day}`));

export const toIsoDate = (date: Date): string => {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
};

export interface DateRange {
  date_from: string;
  date_to: string;
}

export const presetToDateRange = (days: number): DateRange => {
  const to = new Date();
  const from = new Date();
  from.setDate(to.getDate() - days);
  return { date_from: toIsoDate(from), date_to: toIsoDate(to) };
};

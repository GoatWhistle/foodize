import { describe, it, expect, afterEach, vi } from "vitest";
import {
  getGreeting,
  isRestaurantOpen,
  toInfoWorkingHours,
  type WorkingHoursSource,
} from "@shared/utils/restaurant";
import { t } from "@shared/i18n/useTranslation";

describe("getGreeting", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  const setHour = (hour: number): void => {
    vi.useFakeTimers();
    const d = new Date(2026, 0, 1, hour, 30, 0);
    vi.setSystemTime(d);
  };

  it("returns night greeting before 5", () => {
    setHour(3);
    expect(getGreeting()).toBe(t("catalog.greeting.night"));
  });

  it("returns morning greeting before 12", () => {
    setHour(9);
    expect(getGreeting()).toBe(t("catalog.greeting.morning"));
  });

  it("returns afternoon greeting before 17", () => {
    setHour(14);
    expect(getGreeting()).toBe(t("catalog.greeting.afternoon"));
  });

  it("returns evening greeting from 17", () => {
    setHour(20);
    expect(getGreeting()).toBe(t("catalog.greeting.evening"));
  });

  it("boundary at 5 is morning", () => {
    setHour(5);
    expect(getGreeting()).toBe(t("catalog.greeting.morning"));
  });

  it("boundary at 17 is evening", () => {
    setHour(17);
    expect(getGreeting()).toBe(t("catalog.greeting.evening"));
  });
});

describe("isRestaurantOpen", () => {
  it("returns true when is_open is true", () => {
    expect(isRestaurantOpen({ is_open: true })).toBe(true);
  });

  it("returns false only when is_open is explicitly false", () => {
    expect(isRestaurantOpen({ is_open: false })).toBe(false);
  });

  it("returns true when is_open is undefined", () => {
    expect(isRestaurantOpen({})).toBe(true);
  });

  it("returns true when is_open is null", () => {
    expect(isRestaurantOpen({ is_open: null })).toBe(true);
  });

  it("returns true for null restaurant", () => {
    expect(isRestaurantOpen(null)).toBe(true);
  });

  it("returns true for undefined restaurant", () => {
    expect(isRestaurantOpen(undefined)).toBe(true);
  });
});

describe("toInfoWorkingHours", () => {
  it("maps working hours source into info shape", () => {
    const source: WorkingHoursSource[] = [
      {
        day_of_week: 1,
        open_time: "09:00",
        close_time: "22:00",
        is_closed: false,
      },
      {
        day_of_week: 2,
        open_time: "00:00",
        close_time: "00:00",
        is_closed: true,
      },
    ];
    expect(toInfoWorkingHours(source)).toEqual([
      {
        day_of_week: 1,
        is_open: true,
        opening_time: "09:00",
        closing_time: "22:00",
      },
      {
        day_of_week: 2,
        is_open: false,
        opening_time: "00:00",
        closing_time: "00:00",
      },
    ]);
  });

  it("returns empty array for empty input", () => {
    expect(toInfoWorkingHours([])).toEqual([]);
  });
});

import { describe, it, expect, afterEach, vi } from "vitest";
import {
  WEEKDAYS_SHORT_RU,
  toIsoDate,
  presetToDateRange,
} from "@shared/utils/datetime";

describe("WEEKDAYS_SHORT_RU", () => {
  it("has seven days starting with Monday", () => {
    expect(WEEKDAYS_SHORT_RU).toHaveLength(7);
    expect(WEEKDAYS_SHORT_RU[0]).toBe("Пн");
    expect(WEEKDAYS_SHORT_RU[6]).toBe("Вс");
  });
});

describe("toIsoDate", () => {
  it("formats a date as YYYY-MM-DD with zero padding", () => {
    expect(toIsoDate(new Date(2026, 0, 5))).toBe("2026-01-05");
  });

  it("pads double-digit months and days", () => {
    expect(toIsoDate(new Date(2026, 11, 31))).toBe("2026-12-31");
  });
});

describe("presetToDateRange", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns a range spanning the requested number of days", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 0, 15, 12, 0, 0));
    const range = presetToDateRange(7);
    expect(range.date_to).toBe("2026-01-15");
    expect(range.date_from).toBe("2026-01-08");
  });

  it("handles zero days (from equals to)", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 0, 15, 12, 0, 0));
    const range = presetToDateRange(0);
    expect(range.date_from).toBe(range.date_to);
  });
});

import { describe, it, expect, afterEach, vi } from "vitest";
import {
  weekdaysShort,
  toIsoDate,
  presetToDateRange,
} from "@shared/utils/datetime";
import { useLanguageStore } from "@shared/store/useLanguageStore";

describe("weekdaysShort", () => {
  afterEach(() => {
    useLanguageStore.setState({ language: "ru" });
  });

  it("has seven days starting with Monday", () => {
    useLanguageStore.setState({ language: "ru" });
    expect(weekdaysShort()).toHaveLength(7);
    expect(weekdaysShort()[0]).toBe("Пн");
    expect(weekdaysShort()[6]).toBe("Вс");
  });

  it("follows the active language", () => {
    useLanguageStore.setState({ language: "en" });
    expect(weekdaysShort()[0]).toBe("Mon");
    expect(weekdaysShort()[6]).toBe("Sun");
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

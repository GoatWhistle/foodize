import { describe, it, expect } from "vitest";
import { formatReviewTime } from "@shared/utils/formatReviewTime";

describe("formatReviewTime", () => {
  it("formats a valid ISO date string", () => {
    const result = formatReviewTime("2026-01-15T10:30:00Z");
    expect(result).not.toBe("");
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  it("formats a Date instance", () => {
    const result = formatReviewTime(new Date("2026-01-15T10:30:00Z"));
    expect(result).not.toBe("");
  });

  it("formats a numeric timestamp", () => {
    const result = formatReviewTime(Date.UTC(2026, 0, 15, 10, 30));
    expect(result).not.toBe("");
  });

  it("returns empty string for null", () => {
    expect(formatReviewTime(null)).toBe("");
  });

  it("returns empty string for undefined", () => {
    expect(formatReviewTime(undefined)).toBe("");
  });

  it("returns empty string for empty string", () => {
    expect(formatReviewTime("")).toBe("");
  });

  it("returns empty string for an invalid date", () => {
    expect(formatReviewTime("not-a-date")).toBe("");
  });
});

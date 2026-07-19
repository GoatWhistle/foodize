import { describe, it, expect } from "vitest";
import {
  formatPrice,
  formatOptionLabel,
  formatOptionsSummary,
} from "@shared/utils/price";
import { CURRENCY_SYMBOL } from "@shared/constants/format";

describe("formatPrice", () => {
  it("appends the currency symbol to a number", () => {
    expect(formatPrice(100)).toBe(`100 ${CURRENCY_SYMBOL}`);
  });

  it("appends the currency symbol to a string", () => {
    expect(formatPrice("250")).toBe(`250 ${CURRENCY_SYMBOL}`);
  });

  it("handles zero", () => {
    expect(formatPrice(0)).toBe(`0 ${CURRENCY_SYMBOL}`);
  });
});

describe("formatOptionLabel", () => {
  it("shows just the name when there is no price delta", () => {
    expect(formatOptionLabel({ name: "Сыр" })).toBe("Сыр");
  });

  it("shows name with delta when price_delta is positive", () => {
    expect(formatOptionLabel({ name: "Сыр", price_delta: 50 })).toBe(
      `Сыр +50 ${CURRENCY_SYMBOL}`,
    );
  });

  it("omits delta when price_delta is zero", () => {
    expect(formatOptionLabel({ name: "Сыр", price_delta: 0 })).toBe("Сыр");
  });

  it("omits delta when price_delta is null", () => {
    expect(formatOptionLabel({ name: "Сыр", price_delta: null })).toBe("Сыр");
  });
});

describe("formatOptionsSummary", () => {
  it("joins multiple option labels", () => {
    const result = formatOptionsSummary([
      { name: "Сыр", price_delta: 50 },
      { name: "Соус" },
    ]);
    expect(result).toBe(`Сыр +50 ${CURRENCY_SYMBOL}, Соус`);
  });

  it("returns empty string for null", () => {
    expect(formatOptionsSummary(null)).toBe("");
  });

  it("returns empty string for undefined", () => {
    expect(formatOptionsSummary(undefined)).toBe("");
  });

  it("returns empty string for empty array", () => {
    expect(formatOptionsSummary([])).toBe("");
  });
});

import { describe, it, expect } from "vitest";
import { formatPhoneNumber, extractPhoneNumber } from "@shared/utils/phone";

describe("formatPhoneNumber", () => {
  it("returns empty string for null/undefined/empty", () => {
    expect(formatPhoneNumber(null)).toBe("");
    expect(formatPhoneNumber(undefined)).toBe("");
    expect(formatPhoneNumber("")).toBe("");
  });

  it("formats a full 11-digit number starting with 7", () => {
    expect(formatPhoneNumber("79161234567")).toBe("+7 (916) 123-45-67");
  });

  it("normalizes a leading 8 to 7", () => {
    expect(formatPhoneNumber("89161234567")).toBe("+7 (916) 123-45-67");
  });

  it("prepends 7 when number does not start with 7", () => {
    expect(formatPhoneNumber("9161234567")).toBe("+7 (916) 123-45-67");
  });

  it("strips non-digit characters", () => {
    expect(formatPhoneNumber("+7 (916) 123-45-67")).toBe("+7 (916) 123-45-67");
  });

  it("formats partial input progressively", () => {
    expect(formatPhoneNumber("7")).toBe("+7");
    expect(formatPhoneNumber("7916")).toBe("+7 (916");
    expect(formatPhoneNumber("7916123")).toBe("+7 (916) 123");
    expect(formatPhoneNumber("791612345")).toBe("+7 (916) 123-45");
  });
});

describe("extractPhoneNumber", () => {
  it("keeps only digits with a leading plus", () => {
    expect(extractPhoneNumber("+7 (916) 123-45-67")).toBe("+79161234567");
  });

  it("handles input with no digits", () => {
    expect(extractPhoneNumber("abc")).toBe("+");
  });
});

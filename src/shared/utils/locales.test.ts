import { describe, it, expect } from "vitest";
import {
  approvalStatusLabel,
  categoryLabel,
  customerOrderStatusLabel,
  discountTypeLabel,
  orderStatusLabel,
  staffRoleLabel,
  staffStatusLabel,
  translateEnum,
} from "@shared/utils/locales";

describe("translateEnum", () => {
  it("returns the fallback for an empty key", () => {
    expect(translateEnum("orderStatus", null, "—")).toBe("—");
    expect(translateEnum("orderStatus", undefined, "—")).toBe("—");
    expect(translateEnum("orderStatus", "")).toBe("");
  });

  it("returns the fallback when the key does not resolve", () => {
    expect(translateEnum("orderStatus", "NOT_A_STATUS", "fallback")).toBe("fallback");
  });

  it("resolves a known enum key", () => {
    const resolved = orderStatusLabel("PENDING");
    expect(typeof resolved).toBe("string");
    expect(resolved.length).toBeGreaterThan(0);
  });
});

describe("enum label helpers", () => {
  it("each helper echoes an unknown key back", () => {
    expect(orderStatusLabel("ZZZ")).toBe("ZZZ");
    expect(customerOrderStatusLabel("ZZZ")).toBe("ZZZ");
    expect(approvalStatusLabel("ZZZ")).toBe("ZZZ");
    expect(categoryLabel("ZZZ")).toBe("ZZZ");
    expect(discountTypeLabel("ZZZ")).toBe("ZZZ");
    expect(staffStatusLabel("ZZZ")).toBe("ZZZ");
    expect(staffRoleLabel("ZZZ")).toBe("ZZZ");
  });

  it("each helper returns an empty string for a nullish key", () => {
    expect(orderStatusLabel(null)).toBe("");
    expect(customerOrderStatusLabel(null)).toBe("");
    expect(approvalStatusLabel(null)).toBe("");
    expect(categoryLabel(undefined)).toBe("");
    expect(discountTypeLabel(undefined)).toBe("");
    expect(staffStatusLabel(undefined)).toBe("");
    expect(staffRoleLabel(undefined)).toBe("");
  });
});

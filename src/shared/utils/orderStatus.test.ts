import { describe, it, expect } from "vitest";
import {
  getOrderStatusStyle,
  getOrderStatusLabel,
  getCustomerOrderStatusLabel,
} from "@shared/utils/orderStatus";
import { t } from "@shared/i18n/useTranslation";

describe("getOrderStatusStyle", () => {
  it("returns the matching style for each known status", () => {
    expect(getOrderStatusStyle("PENDING").solid).toBe("var(--color-warning)");
    expect(getOrderStatusStyle("ACCEPTED").solid).toBe("var(--fire)");
    expect(getOrderStatusStyle("READY").solid).toBe("var(--color-success)");
    expect(getOrderStatusStyle("COMPLETED").solid).toBe("var(--color-neutral)");
    expect(getOrderStatusStyle("CANCELLED").solid).toBe("var(--color-error)");
  });

  it("returns full style object", () => {
    const style = getOrderStatusStyle("READY");
    expect(style).toEqual({
      color: "var(--color-success-dim)",
      bg: "var(--color-success-bg)",
      border: "var(--color-success-border)",
      solid: "var(--color-success)",
    });
  });

  it("falls back to PENDING for unknown status", () => {
    expect(getOrderStatusStyle("WHATEVER").solid).toBe("var(--color-warning)");
  });

  it("falls back to PENDING for null", () => {
    expect(getOrderStatusStyle(null).solid).toBe("var(--color-warning)");
  });

  it("falls back to PENDING for undefined", () => {
    expect(getOrderStatusStyle(undefined).solid).toBe("var(--color-warning)");
  });
});

describe("getOrderStatusLabel", () => {
  it("translates known statuses", () => {
    expect(getOrderStatusLabel("PENDING")).toBe(t("enums.orderStatus.PENDING"));
    expect(getOrderStatusLabel("READY")).toBe(t("enums.orderStatus.READY"));
    expect(getOrderStatusLabel("CANCELLED")).toBe(t("enums.orderStatus.CANCELLED"));
  });

  it("returns the raw status as fallback for unknown", () => {
    expect(getOrderStatusLabel("FOO")).toBe("FOO");
  });

  it("returns empty string for null", () => {
    expect(getOrderStatusLabel(null)).toBe("");
  });

  it("returns empty string for undefined", () => {
    expect(getOrderStatusLabel(undefined)).toBe("");
  });
});

describe("getCustomerOrderStatusLabel", () => {
  it("uses the customer-facing dictionary", () => {
    expect(getCustomerOrderStatusLabel("PENDING")).toBe(t("enums.orderStatusCustomer.PENDING"));
    expect(getCustomerOrderStatusLabel("ACCEPTED")).toBe(t("enums.orderStatusCustomer.ACCEPTED"));
  });

  it("returns empty string for null", () => {
    expect(getCustomerOrderStatusLabel(null)).toBe("");
  });

  it("returns raw status for unknown", () => {
    expect(getCustomerOrderStatusLabel("XXX")).toBe("XXX");
  });
});

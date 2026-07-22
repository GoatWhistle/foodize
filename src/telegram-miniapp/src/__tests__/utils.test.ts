import { describe, it, expect } from "vitest";
import { orderStatusLabel, translateEnum } from "@shared/utils/locales";
import { hasPermission } from "@shared/utils/permissions";
import { translateApiError } from "@shared/utils/translateApiError";
import { t } from "@shared/i18n/useTranslation";

describe("locales translate utility", () => {
  it("should translate order status", () => {
    expect(orderStatusLabel("PENDING")).toBe(t("enums.orderStatus.PENDING"));
    expect(orderStatusLabel("UNKNOWN")).toBe("UNKNOWN");
    expect(translateEnum("orderStatus", null, "fallback")).toBe("fallback");
  });
});

describe("permissions utility", () => {
  it("should check user permissions", () => {
    const user = { permissions: ["orders.manage_status", "other"] };
    expect(hasPermission(user, "orders.manage_status")).toBe(true);
    expect(hasPermission(user, "missing")).toBe(false);
    expect(hasPermission(null, "admin.access")).toBe(false);
    expect(hasPermission({}, "admin.access")).toBe(false);
    expect(hasPermission({ permissions: ["admin.access"] }, "missing")).toBe(true);
  });
});

describe("translateApiError utility", () => {
  it("should translate exact error message", () => {
    const err = { response: { data: { detail: "Invalid credentials" } } };
    expect(translateApiError(err, "fallback")).toBe(
      t("apiErrors.byDetail.Invalid credentials"),
    );
  });

  it("should translate prefixed error message", () => {
    const err = {
      response: {
        data: {
          detail:
            "You can publish up to 5 reviews for one restaurant: extra details",
        },
      },
    };
    expect(translateApiError(err, "fallback")).toBe(
      t("apiErrors.byDetail.You can publish up to 5 reviews for one restaurant"),
    );
  });

  it("should return fallback or detail if untranslatable", () => {
    const err = { response: { data: { detail: "Strange error" } } };
    expect(translateApiError(err, "fallback")).toBe("fallback");
    expect(translateApiError(err, undefined)).toBe("Strange error");
    expect(translateApiError({}, "fallback")).toBe("fallback");
  });
});

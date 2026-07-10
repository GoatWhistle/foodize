import { describe, it, expect } from "vitest";
import { ORDER_STATUS_RU, translate } from "@shared/utils/locales";
import { hasPermission } from "@shared/utils/permissions";
import { translateApiError } from "@shared/utils/translateApiError";

describe("locales translate utility", () => {
  it("should translate order status", () => {
    expect(translate(ORDER_STATUS_RU, "PENDING")).toBe("Ожидается");
    expect(translate(ORDER_STATUS_RU, "UNKNOWN", "UNKNOWN")).toBe("UNKNOWN");
    expect(translate(ORDER_STATUS_RU, null, "fallback")).toBe("fallback");
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
      "Неверный телефон или пароль",
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
      "Можно опубликовать до 5 отзывов на один ресторан",
    );
  });

  it("should return fallback or detail if untranslatable", () => {
    const err = { response: { data: { detail: "Strange error" } } };
    expect(translateApiError(err, "fallback")).toBe("fallback");
    expect(translateApiError(err, undefined)).toBe("Strange error");
    expect(translateApiError({}, "fallback")).toBe("fallback");
  });
});

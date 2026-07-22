import { describe, it, expect } from "vitest";
import { translateApiError } from "@shared/utils/translateApiError";
import { t } from "@shared/i18n/useTranslation";

const err = (status?: number, detail?: unknown): unknown => ({
  response: { status, data: { detail } },
});

describe("translateApiError", () => {
  it("maps an exact known error message", () => {
    expect(translateApiError(err(400, "Invalid credentials"))).toBe(
      t("apiErrors.byDetail.Invalid credentials"),
    );
  });

  it("maps by prefix when message starts with a known key", () => {
    expect(
      translateApiError(err(404, "Order not found: extra context")),
    ).toBe(t("apiErrors.byDetail.Order not found"));
  });

  it("prefers explicit fallback over status fallback for unknown string detail", () => {
    expect(translateApiError(err(400, "Totally unknown"), "мой запас")).toBe(
      "мой запас",
    );
  });

  it("falls back to status message for unknown string detail without fallback", () => {
    expect(translateApiError(err(500, "Totally unknown"))).toBe(
      t("apiErrors.byStatus.500"),
    );
  });

  it("returns the raw detail when no status fallback exists", () => {
    expect(translateApiError(err(418, "Teapot detail"))).toBe("Teapot detail");
  });

  it("uses first msg from array detail", () => {
    expect(
      translateApiError(err(422, [{ msg: "field required" }])),
    ).toBe("field required");
  });

  it("prefers fallback over array msg when provided", () => {
    expect(
      translateApiError(err(422, [{ msg: "field required" }]), "валидация"),
    ).toBe("валидация");
  });

  it("uses status fallback when detail is absent", () => {
    expect(translateApiError(err(401))).toBe(t("apiErrors.byStatus.401"));
  });

  it("prefers explicit fallback over status fallback when detail is absent", () => {
    expect(translateApiError(err(401), "нужен вход")).toBe("нужен вход");
  });

  it("returns generic unknown for non-object errors", () => {
    expect(translateApiError("boom")).toBe(t("common.errors.unknown"));
    expect(translateApiError(null)).toBe(t("common.errors.unknown"));
  });

  it("returns explicit fallback for non-object errors", () => {
    expect(translateApiError(undefined, "ой")).toBe("ой");
  });

  it("translates structured detail by code", () => {
    expect(
      translateApiError(err(404, { error: "Order not found", code: "ORDER_NOT_FOUND" })),
    ).toBe(t("apiErrors.byCode.ORDER_NOT_FOUND"));
  });

  it("interpolates params from structured detail", () => {
    expect(
      translateApiError(
        err(400, {
          error: "Not enough options selected for Sauces",
          code: "ORDER_NOT_ENOUGH_OPTIONS",
          params: { group: "Sauces" },
        }),
      ),
    ).toBe(t("apiErrors.byCode.ORDER_NOT_ENOUGH_OPTIONS", { group: "Sauces" }));
  });

  it("falls back to detail phrase when code is unknown", () => {
    expect(
      translateApiError(err(404, { error: "Order not found", code: "TOTALLY_UNKNOWN" })),
    ).toBe(t("apiErrors.byDetail.Order not found"));
  });

  it("falls back to status when structured detail is untranslatable", () => {
    expect(translateApiError(err(401, { error: "whatever", code: "NOPE" }))).toBe(
      t("apiErrors.byStatus.401"),
    );
  });

  it("prefers explicit fallback over status for structured detail", () => {
    expect(translateApiError(err(401, { error: "whatever", code: "NOPE" }), "вход")).toBe(
      "вход",
    );
  });
});

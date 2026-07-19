import { describe, it, expect } from "vitest";
import { translateApiError } from "@shared/utils/translateApiError";

const err = (status?: number, detail?: unknown): unknown => ({
  response: { status, data: { detail } },
});

describe("translateApiError", () => {
  it("maps an exact known error message", () => {
    expect(translateApiError(err(400, "Invalid credentials"))).toBe(
      "Неверный телефон или пароль",
    );
  });

  it("maps by prefix when message starts with a known key", () => {
    expect(
      translateApiError(err(404, "Order not found: extra context")),
    ).toBe("Заказ не найден");
  });

  it("prefers explicit fallback over status fallback for unknown string detail", () => {
    expect(translateApiError(err(400, "Totally unknown"), "мой запас")).toBe(
      "мой запас",
    );
  });

  it("falls back to status message for unknown string detail without fallback", () => {
    expect(translateApiError(err(500, "Totally unknown"))).toBe(
      "Внутренняя ошибка сервера",
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
    expect(translateApiError(err(401))).toBe("Необходима авторизация");
  });

  it("prefers explicit fallback over status fallback when detail is absent", () => {
    expect(translateApiError(err(401), "нужен вход")).toBe("нужен вход");
  });

  it("returns generic unknown for non-object errors", () => {
    expect(translateApiError("boom")).toBe("Неизвестная ошибка");
    expect(translateApiError(null)).toBe("Неизвестная ошибка");
  });

  it("returns explicit fallback for non-object errors", () => {
    expect(translateApiError(undefined, "ой")).toBe("ой");
  });
});

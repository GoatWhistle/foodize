import { describe, it, expect } from "vitest";
import { notificationMessage, notificationTitle } from "@shared/utils/notificationText";

describe("notificationText", () => {
  it("falls back to the plain title when no key is given", () => {
    expect(notificationTitle({ title: "Заказ готов", message: "Заберите" })).toBe("Заказ готов");
  });

  it("falls back to the plain message when no key is given", () => {
    expect(notificationMessage({ title: "T", message: "Заберите заказ" })).toBe("Заберите заказ");
  });

  it("falls back when the key does not resolve", () => {
    expect(
      notificationTitle({ title: "Fallback", message: "m", title_key: "nope.missing.key" }),
    ).toBe("Fallback");
  });

  it("resolves a known key through the dictionary", () => {
    const resolved = notificationTitle({
      title: "Fallback",
      message: "m",
      title_key: "common.actions.retry",
    });
    expect(resolved).not.toBe("Fallback");
    expect(resolved.length).toBeGreaterThan(0);
  });

  it("passes string and number params through untouched", () => {
    const resolved = notificationMessage({
      title: "t",
      message: "Fallback",
      message_key: "common.actions.retry",
      params: { restaurant: "Пиццерия", count: 2 },
    });
    expect(typeof resolved).toBe("string");
  });

  it("stringifies boolean, bigint and object params, and skips null", () => {
    const resolved = notificationMessage({
      title: "t",
      message: "Fallback",
      message_key: "common.actions.retry",
      params: { flag: true, big: 10n, obj: { a: 1 }, empty: null },
    });
    expect(typeof resolved).toBe("string");
  });

  it("treats null and undefined params as empty", () => {
    expect(
      notificationMessage({ title: "t", message: "F", message_key: null, params: null }),
    ).toBe("F");
    expect(
      notificationMessage({ title: "t", message: "F", message_key: undefined, params: undefined }),
    ).toBe("F");
  });
});

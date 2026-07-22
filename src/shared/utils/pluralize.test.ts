import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { plural } from "@shared/utils/pluralize";
import { useLanguageStore } from "@shared/store/useLanguageStore";

const KEY = "order.cart.itemsCount";

describe("plural (ru)", () => {
  beforeEach(() => {
    useLanguageStore.setState({ language: "ru" });
  });

  afterEach(() => {
    useLanguageStore.setState({ language: "ru" });
  });

  it("uses the one form for 1", () => {
    expect(plural(KEY, 1)).toBe("1 товар");
  });

  it("uses the one form for 21", () => {
    expect(plural(KEY, 21)).toBe("21 товар");
  });

  it("uses the few form for 2, 3, 4", () => {
    expect(plural(KEY, 2)).toBe("2 товара");
    expect(plural(KEY, 3)).toBe("3 товара");
    expect(plural(KEY, 4)).toBe("4 товара");
  });

  it("uses the few form for 22, 24", () => {
    expect(plural(KEY, 22)).toBe("22 товара");
    expect(plural(KEY, 24)).toBe("24 товара");
  });

  it("uses the many form for 0", () => {
    expect(plural(KEY, 0)).toBe("0 товаров");
  });

  it("uses the many form for 5-10", () => {
    expect(plural(KEY, 5)).toBe("5 товаров");
    expect(plural(KEY, 10)).toBe("10 товаров");
  });

  it("uses the many form for teens 11-14", () => {
    expect(plural(KEY, 11)).toBe("11 товаров");
    expect(plural(KEY, 12)).toBe("12 товаров");
    expect(plural(KEY, 13)).toBe("13 товаров");
    expect(plural(KEY, 14)).toBe("14 товаров");
  });

  it("uses the many form for 15-19", () => {
    expect(plural(KEY, 15)).toBe("15 товаров");
    expect(plural(KEY, 19)).toBe("19 товаров");
  });

  it("selects the form by absolute value for negatives", () => {
    expect(plural(KEY, -1)).toBe("-1 товар");
    expect(plural(KEY, -2)).toBe("-2 товара");
    expect(plural(KEY, -11)).toBe("-11 товаров");
    expect(plural(KEY, -5)).toBe("-5 товаров");
  });

  it("selects the form by the last two digits of large numbers", () => {
    expect(plural(KEY, 101)).toBe("101 товар");
    expect(plural(KEY, 111)).toBe("111 товаров");
    expect(plural(KEY, 1002)).toBe("1002 товара");
  });
});

describe("plural (en)", () => {
  beforeEach(() => {
    useLanguageStore.setState({ language: "en" });
  });

  afterEach(() => {
    useLanguageStore.setState({ language: "ru" });
  });

  it("uses the one form for 1", () => {
    expect(plural(KEY, 1)).toBe("1 item");
  });

  it("uses the many form for 0 and 2+", () => {
    expect(plural(KEY, 0)).toBe("0 items");
    expect(plural(KEY, 2)).toBe("2 items");
  });

  it("ignores the russian teen rule", () => {
    expect(plural(KEY, 11)).toBe("11 items");
    expect(plural(KEY, 21)).toBe("21 items");
  });
});

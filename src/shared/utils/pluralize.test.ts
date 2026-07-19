import { describe, it, expect } from "vitest";
import { pluralizeRu } from "@shared/utils/pluralize";

const forms: readonly [string, string, string] = ["товар", "товара", "товаров"];

describe("pluralizeRu", () => {
  it("returns form[0] for 1", () => {
    expect(pluralizeRu(1, forms)).toBe("товар");
  });

  it("returns form[0] for 21", () => {
    expect(pluralizeRu(21, forms)).toBe("товар");
  });

  it("returns form[1] for 2, 3, 4", () => {
    expect(pluralizeRu(2, forms)).toBe("товара");
    expect(pluralizeRu(3, forms)).toBe("товара");
    expect(pluralizeRu(4, forms)).toBe("товара");
  });

  it("returns form[1] for 22, 23, 24", () => {
    expect(pluralizeRu(22, forms)).toBe("товара");
    expect(pluralizeRu(24, forms)).toBe("товара");
  });

  it("returns form[2] for 0", () => {
    expect(pluralizeRu(0, forms)).toBe("товаров");
  });

  it("returns form[2] for 5-10", () => {
    expect(pluralizeRu(5, forms)).toBe("товаров");
    expect(pluralizeRu(10, forms)).toBe("товаров");
  });

  it("returns form[2] for teens 11-14", () => {
    expect(pluralizeRu(11, forms)).toBe("товаров");
    expect(pluralizeRu(12, forms)).toBe("товаров");
    expect(pluralizeRu(13, forms)).toBe("товаров");
    expect(pluralizeRu(14, forms)).toBe("товаров");
  });

  it("returns form[2] for 15-20", () => {
    expect(pluralizeRu(15, forms)).toBe("товаров");
    expect(pluralizeRu(19, forms)).toBe("товаров");
  });

  it("handles negatives via absolute value", () => {
    expect(pluralizeRu(-1, forms)).toBe("товар");
    expect(pluralizeRu(-2, forms)).toBe("товара");
    expect(pluralizeRu(-11, forms)).toBe("товаров");
    expect(pluralizeRu(-5, forms)).toBe("товаров");
  });

  it("handles large numbers by last two digits", () => {
    expect(pluralizeRu(101, forms)).toBe("товар");
    expect(pluralizeRu(111, forms)).toBe("товаров");
    expect(pluralizeRu(1002, forms)).toBe("товара");
  });
});

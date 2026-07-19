import { describe, it, expect } from "vitest";
import {
  getOptionIds,
  getSelectedOptions,
  getOptionsTotal,
  getLinePrice,
  getLineKey,
  normalizeCartLine,
  normalizeOrderItemForCart,
  uniqueOptions,
  toCartSelectedOptions,
  buildCartItemIn,
  makeIdempotencyKey,
  type CartLine,
  type CartLineOption,
  type CartMenuItem,
} from "@shared/utils/cartLine";
import type { OrderItem } from "@shared/types/models";

const menuItem = (over: Partial<CartMenuItem> = {}): CartMenuItem =>
  ({ id: "m1", name: "Бургер", price: 300, ...over });

const line = (over: Partial<CartLine> = {}): CartLine => ({
  menuItem: menuItem(),
  quantity: 1,
  selectedOptionIds: [],
  selectedOptions: [],
  ...over,
});

describe("getOptionIds", () => {
  it("dedupes and drops empty ids", () => {
    const item = line({ selectedOptionIds: ["a", "a", "", "b"] });
    expect(getOptionIds(item)).toEqual(["a", "b"]);
  });

  it("returns empty array when there are no ids", () => {
    expect(getOptionIds(line())).toEqual([]);
  });
});

describe("getSelectedOptions", () => {
  it("returns the line's selected options", () => {
    const opts: CartLineOption[] = [{ option_id: "a", name: "A" }];
    expect(getSelectedOptions(line({ selectedOptions: opts }))).toBe(opts);
  });
});

describe("getOptionsTotal", () => {
  it("sums numeric price deltas", () => {
    const item = line({
      selectedOptions: [
        { option_id: "a", price_delta: 50 },
        { option_id: "b", price_delta: 30 },
      ],
    });
    expect(getOptionsTotal(item)).toBe(80);
  });

  it("treats null/undefined/NaN deltas as zero", () => {
    const item = line({
      selectedOptions: [
        { option_id: "a", price_delta: null },
        { option_id: "b" },
      ],
    });
    expect(getOptionsTotal(item)).toBe(0);
  });
});

describe("getLinePrice", () => {
  it("adds base price to options total", () => {
    const item = line({
      menuItem: menuItem({ price: 200 }),
      selectedOptions: [{ option_id: "a", price_delta: 25 }],
    });
    expect(getLinePrice(item)).toBe(225);
  });

  it("uses 0 base when menu item price is falsy", () => {
    const item = line({ menuItem: menuItem({ price: 0 }) });
    expect(getLinePrice(item)).toBe(0);
  });
});

describe("getLineKey", () => {
  it("builds a key sorted by option ids", () => {
    expect(getLineKey("m1", ["b", "a"])).toBe("m1:a,b");
  });

  it("builds a key with no options", () => {
    expect(getLineKey("m1")).toBe("m1:");
  });
});

describe("normalizeCartLine", () => {
  it("maps a CartItem into a CartLine", () => {
    const cartItem = {
      menuItem: menuItem(),
      quantity: 2,
      selected_option_ids: ["a"],
      selected_options: [{ option_id: "a", name: "A", price_delta: 10 }],
    };
    const result = normalizeCartLine(cartItem);
    expect(result.quantity).toBe(2);
    expect(result.selectedOptionIds).toEqual(["a"]);
    expect(result.selectedOptions[0]).toMatchObject({
      id: "a",
      option_id: "a",
      name: "A",
      price_delta: 10,
    });
    expect(result.lineKey).toBe("m1:a");
  });
});

describe("normalizeOrderItemForCart", () => {
  it("subtracts options total from purchase price for base price", () => {
    const orderItem = {
      menu_item_id: "m1",
      menu_item_name: "Бургер",
      price_at_purchase: 350,
      quantity: 1,
      selected_options: [
        { option_id: "a", name: "A", price_delta: 50 },
        { option_id: null, name: "B", price_delta: 0 },
      ],
    } as unknown as OrderItem;
    const result = normalizeOrderItemForCart(orderItem);
    expect(result.menu_item_id).toBe("m1");
    expect(result.price).toBe(300);
    expect(result.selected_option_ids).toEqual(["a"]);
    expect(result.selected_options).toEqual([
      { option_id: "a", name: "A", price_delta: 50 },
      { option_id: "", name: "B", price_delta: 0 },
    ]);
  });

  it("never produces a negative base price", () => {
    const orderItem = {
      menu_item_id: "m1",
      menu_item_name: "Бургер",
      price_at_purchase: 10,
      quantity: 1,
      selected_options: [{ option_id: "a", name: "A", price_delta: 50 }],
    } as unknown as OrderItem;
    expect(normalizeOrderItemForCart(orderItem).price).toBe(0);
  });
});

describe("uniqueOptions", () => {
  it("removes duplicates by id or option_id", () => {
    const opts: CartLineOption[] = [
      { id: "a", name: "A" },
      { option_id: "a", name: "A2" },
      { option_id: "b", name: "B" },
    ];
    expect(uniqueOptions(opts)).toEqual([
      { id: "a", name: "A" },
      { option_id: "b", name: "B" },
    ]);
  });

  it("drops options without any id", () => {
    expect(uniqueOptions([{ name: "no-id" }])).toEqual([]);
  });

  it("defaults to empty input", () => {
    expect(uniqueOptions()).toEqual([]);
  });
});

describe("toCartSelectedOptions", () => {
  it("normalizes ids, names and numeric deltas", () => {
    const opts: CartLineOption[] = [
      { option_id: "a", name: "A", price_delta: 5 },
      { id: "b", price_delta: null },
    ];
    expect(toCartSelectedOptions(opts)).toEqual([
      { option_id: "a", name: "A", price_delta: 5 },
      { option_id: "b", name: "", price_delta: 0 },
    ]);
  });
});

describe("buildCartItemIn", () => {
  it("builds the payload from a cart line", () => {
    const item = line({
      menuItem: menuItem({ image_url: "img.png" }),
      quantity: 3,
      selectedOptionIds: ["a", "a"],
      selectedOptions: [{ option_id: "a", name: "A", price_delta: 5 }],
    });
    const result = buildCartItemIn(item);
    expect(result).toEqual({
      menu_item_id: "m1",
      name: "Бургер",
      price: 300,
      image_url: "img.png",
      quantity: 3,
      selected_option_ids: ["a"],
      selected_options: [{ option_id: "a", name: "A", price_delta: 5 }],
    });
  });

  it("defaults image_url to null", () => {
    expect(buildCartItemIn(line()).image_url).toBeNull();
  });
});

describe("makeIdempotencyKey", () => {
  it("returns a non-empty string", () => {
    const key = makeIdempotencyKey();
    expect(typeof key).toBe("string");
    expect(key.length).toBeGreaterThan(0);
  });

  it("returns unique keys", () => {
    expect(makeIdempotencyKey()).not.toBe(makeIdempotencyKey());
  });
});

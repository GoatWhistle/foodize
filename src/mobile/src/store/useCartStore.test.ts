import { Alert } from "react-native";
import type { Order } from "@shared/types/models";

interface CartOptions {
  onRestaurantChange: () => Promise<boolean>;
  onOrderPlaced: (order: Order) => void;
}

const captured: CartOptions[] = [];

jest.mock("@shared/store/createCartStore", () => ({
  createCartStore: (options: CartOptions): { getState: () => unknown } => {
    captured.push(options);
    return { getState: () => ({ cart: [] }) };
  },
}));

/* eslint-disable import/first */
import { useOrdersStore } from "@/store/useOrdersStore";
import "@/store/useCartStore";
/* eslint-enable import/first */

const options = (): CartOptions => {
  const first = captured[0];
  if (!first) throw new Error("createCartStore was not called");
  return first;
};

describe("useCartStore wiring", () => {
  beforeEach(() => {
    useOrdersStore.setState({ orders: [], currentOrder: null, activeOrder: null });
  });

  it("passes both platform callbacks to the shared factory", () => {
    expect(typeof options().onRestaurantChange).toBe("function");
    expect(typeof options().onOrderPlaced).toBe("function");
  });

  it("resolves true when the replace confirmation is accepted", async () => {
    const spy = jest.spyOn(Alert, "alert").mockImplementation((_title, _message, buttons) => {
      buttons?.[1]?.onPress?.();
    });
    await expect(options().onRestaurantChange()).resolves.toBe(true);
    spy.mockRestore();
  });

  it("resolves false when the replace confirmation is cancelled", async () => {
    const spy = jest.spyOn(Alert, "alert").mockImplementation((_title, _message, buttons) => {
      buttons?.[0]?.onPress?.();
    });
    await expect(options().onRestaurantChange()).resolves.toBe(false);
    spy.mockRestore();
  });

  it("pushes a placed order into the orders store", () => {
    options().onOrderPlaced({ id: "o1" } as Order);
    expect(useOrdersStore.getState().activeOrder?.id).toBe("o1");
    expect(useOrdersStore.getState().orders[0]?.id).toBe("o1");
  });
});

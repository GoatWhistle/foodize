import { type Mock } from "vitest";
import { useCartStore } from "../../store/useCartStore";
import { cartService } from "@shared/services/cartService";
import type { CartLine } from "@shared/store/createCartStore";

export interface CartServiceMock {
  getCart: Mock;
  updateCart: Mock;
  clearCart: Mock;
}

export const cartServiceMock = cartService as unknown as CartServiceMock;

export const asCartLines = (lines: Partial<CartLine>[]): CartLine[] =>
  lines as CartLine[];

export const makeLine = (
  menuItem: { id: string; name: string; price: number },
  quantity: number,
): CartLine => ({
  menuItem,
  quantity,
  selectedOptionIds: [],
  selectedOptions: [],
  lineKey: `${menuItem.id}:`,
});

export const resetCartStore = (): void => {
  useCartStore.setState({
    cart: [],
    cartRestaurantId: null,
    cartError: null,
    orderPlacing: false,
  });
};

import { createCartStore } from "@shared/store/createCartStore";
import { useOrdersStore } from "./useOrdersStore";

export const useCartStore = createCartStore({
  onRestaurantChange: () =>
    new Promise<boolean>((resolve) => {
      const tg = window.Telegram?.WebApp;
      if (tg?.showConfirm) {
        tg.showConfirm(
          "Заменить корзину?\nТекущие товары будут удалены.",
          resolve,
        );
      } else {
        resolve(
          window.confirm("Заменить корзину? Текущие товары будут удалены."),
        );
      }
    }),
  onOrderPlaced: (order) =>
    { useOrdersStore.setState((s) => ({
      orders: [order, ...s.orders],
      currentOrder: order,
      activeOrder: order,
    })); },
});

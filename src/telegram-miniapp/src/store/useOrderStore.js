import { createOrderStore } from "@shared/store/useOrderStore.js";

export const useOrderStore = createOrderStore({
  onRestaurantChange: () =>
    new Promise((resolve) => {
      const tg = window.Telegram?.WebApp;
      if (tg?.showConfirm) {
        tg.showConfirm(
          "Заменить корзину?\nТекущие товары будут удалены.",
          resolve,
        );
      } else {
        resolve(window.confirm("Заменить корзину? Текущие товары будут удалены."));
      }
    }),
});

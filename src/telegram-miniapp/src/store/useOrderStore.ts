import { createOrderStore } from "@shared/store/useOrderStore";

export const useOrderStore = createOrderStore({
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
});

import { createOrderStore } from "@shared/store/useOrderStore";

export const useOrderStore = createOrderStore({
  onRestaurantChange: () =>
    Promise.resolve(window.confirm("Заменить корзину? Текущие товары будут удалены.")),
});

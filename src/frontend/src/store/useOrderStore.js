import { createOrderStore } from "@shared/store/useOrderStore.js";

export const useOrderStore = createOrderStore({
  onRestaurantChange: () =>
    Promise.resolve(window.confirm("Заменить корзину? Текущие товары будут удалены.")),
});

import { createCartStore } from '@shared/store/createCartStore';
import { useOrdersStore } from './useOrdersStore';

export const useCartStore = createCartStore({
  onRestaurantChange: () =>
    Promise.resolve(window.confirm('Заменить корзину? Текущие товары будут удалены.')),
  onOrderPlaced: (order) =>
    { useOrdersStore.setState((s) => ({
      orders: [order, ...s.orders],
      currentOrder: order,
      activeOrder: order,
    })); },
});

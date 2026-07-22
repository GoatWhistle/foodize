import { createCartStore } from '@shared/store/createCartStore';
import { t } from '@shared/i18n/useTranslation';
import { useOrdersStore } from './useOrdersStore';

export const useCartStore = createCartStore({
  onRestaurantChange: () =>
    Promise.resolve(window.confirm(t('order.cart.replaceConfirm'))),
  onOrderPlaced: (order) =>
    { useOrdersStore.setState((s) => ({
      orders: [order, ...s.orders],
      currentOrder: order,
      activeOrder: order,
    })); },
});

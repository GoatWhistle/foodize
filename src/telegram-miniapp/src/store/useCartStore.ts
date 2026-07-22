import { createCartStore } from "@shared/store/createCartStore";
import { useOrdersStore } from "./useOrdersStore";
import { t } from "@shared/i18n/useTranslation";

export const useCartStore = createCartStore({
  onRestaurantChange: () =>
    new Promise<boolean>((resolve) => {
      const tg = window.Telegram?.WebApp;
      if (tg?.showConfirm) {
        tg.showConfirm(
          t("order.cart.replaceConfirmMultiline"),
          resolve,
        );
      } else {
        resolve(
          window.confirm(t("order.cart.replaceConfirm")),
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

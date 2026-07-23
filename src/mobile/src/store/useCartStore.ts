import { Alert } from "react-native";
import { createCartStore } from "@shared/store/createCartStore";
import { t } from "@shared/i18n/useTranslation";
import { useOrdersStore } from "@/store/useOrdersStore";

const confirmReplace = (): Promise<boolean> =>
  new Promise((resolve) => {
    Alert.alert(t("order.cart.replaceConfirm"), undefined, [
      {
        text: t("common.actions.cancel"),
        style: "cancel",
        onPress: () => {
          resolve(false);
        },
      },
      {
        text: t("common.actions.confirm"),
        style: "destructive",
        onPress: () => {
          resolve(true);
        },
      },
    ]);
  });

export const useCartStore = createCartStore({
  onRestaurantChange: confirmReplace,
  onOrderPlaced: (order) => {
    useOrdersStore.setState((s) => ({
      orders: [order, ...s.orders],
      currentOrder: order,
      activeOrder: order,
    }));
  },
});

import type { StoreApi, UseBoundStore } from "zustand";
import type { OrdersStoreState } from "@shared/store/createOrdersStore";

export type OrdersStoreHook = UseBoundStore<StoreApi<OrdersStoreState>>;

export const useOrdersStore = new Proxy(
  {},
  {
    get() {
      throw new Error(
        "@shared/store/useOrdersStore.instance must be aliased by the consuming app. " +
          "Add alias in vite.config.js pointing to your app's useOrdersStore.js",
      );
    },
    apply() {
      throw new Error(
        "@shared/store/useOrdersStore.instance must be aliased by the consuming app.",
      );
    },
  },
) as OrdersStoreHook;

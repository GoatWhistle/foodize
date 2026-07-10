import type { StoreApi, UseBoundStore } from "zustand";
import type { OrderStoreState } from "@shared/store/useOrderStore";

export type OrderStoreHook = UseBoundStore<StoreApi<OrderStoreState>>;

export const useOrderStore = new Proxy(
  {},
  {
    get() {
      throw new Error(
        "@shared/store/useOrderStore.instance must be aliased by the consuming app. " +
          "Add alias in vite.config.js pointing to your app's useOrderStore.js",
      );
    },
    apply() {
      throw new Error(
        "@shared/store/useOrderStore.instance must be aliased by the consuming app.",
      );
    },
  },
) as OrderStoreHook;

import type { StoreApi, UseBoundStore } from "zustand";
import type { CartStoreState } from "@shared/store/createCartStore";

export type CartStoreHook = UseBoundStore<StoreApi<CartStoreState>>;

export const useCartStore = new Proxy(
  {},
  {
    get() {
      throw new Error(
        "@shared/store/useCartStore.instance must be aliased by the consuming app. " +
          "Add alias in vite.config.js pointing to your app's useCartStore.js",
      );
    },
    apply() {
      throw new Error(
        "@shared/store/useCartStore.instance must be aliased by the consuming app.",
      );
    },
  },
) as CartStoreHook;

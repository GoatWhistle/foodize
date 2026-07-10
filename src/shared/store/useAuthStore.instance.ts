import type { StoreApi, UseBoundStore } from "zustand";
import type { AuthStoreState } from "@shared/store/createAuthStore";

export type AuthStoreHook = UseBoundStore<StoreApi<AuthStoreState>>;

export const useAuthStore = new Proxy(
  {},
  {
    get() {
      throw new Error(
        "@shared/store/useAuthStore.instance must be aliased by the consuming app. " +
          "Add alias in vite.config.js pointing to your app's useAuthStore.js",
      );
    },
    apply() {
      throw new Error(
        "@shared/store/useAuthStore.instance must be aliased by the consuming app.",
      );
    },
  },
) as AuthStoreHook;

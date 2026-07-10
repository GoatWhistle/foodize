import type { AxiosInstance } from "axios";

const api = new Proxy(
  {},
  {
    get() {
      throw new Error(
        "@shared/services/api.instance must be aliased by the consuming app. " +
          "Add alias in vite.config.js pointing to your app's api.ts",
      );
    },
    apply() {
      throw new Error(
        "@shared/services/api.instance must be aliased by the consuming app.",
      );
    },
  },
) as AxiosInstance;

export default api;

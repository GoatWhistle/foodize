import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

const coverageGlob = (rel: string): string =>
  path.resolve(__dirname, rel).replace(/\\/g, "/");

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      {
        find: "@shared/services/api.instance",
        replacement: path.resolve(__dirname, "test/apiInstance.ts"),
      },
      {
        find: "@shared/store/useAuthStore.instance",
        replacement: path.resolve(__dirname, "test/authStoreInstance.ts"),
      },
      {
        find: "@shared/store/useCartStore.instance",
        replacement: path.resolve(__dirname, "test/cartStoreInstance.ts"),
      },
      {
        find: "@shared/store/useOrdersStore.instance",
        replacement: path.resolve(__dirname, "test/ordersStoreInstance.ts"),
      },
      {
        find: "@shared",
        replacement: path.resolve(__dirname, "."),
      },
    ],
    dedupe: [
      "react",
      "react-dom",
      "react-router-dom",
      "zustand",
      "axios",
      "@testing-library/react",
      "@testing-library/user-event",
      "@testing-library/dom",
    ],
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./vitest.setup.ts",
    include: ["**/*.{test,spec}.{ts,tsx}"],
    exclude: ["**/node_modules/**"],
    coverage: {
      provider: "v8",
      allowExternal: true,
      include: [
        coverageGlob("hooks/**/*.{ts,tsx}"),
        coverageGlob("services/**/*.{ts,tsx}"),
        coverageGlob("store/**/*.{ts,tsx}"),
        coverageGlob("utils/**/*.{ts,tsx}"),
        coverageGlob("components/**/*.{ts,tsx}"),
        coverageGlob("pages/**/*.{ts,tsx}"),
      ],
      exclude: [
        "**/*.{test,spec}.{ts,tsx}",
        "**/*.instance.ts",
        "**/node_modules/**",
        "test/**",
      ],
      thresholds: {
        perFile: true,
        statements: 85,
        branches: 85,
        functions: 85,
        lines: 85,
      },
    },
  },
});

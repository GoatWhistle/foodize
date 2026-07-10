import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      {
        find: "@shared/services/api.instance",
        replacement: path.resolve(__dirname, "src/services/api"),
      },
      {
        find: "@shared/store/useOrderStore.instance",
        replacement: path.resolve(__dirname, "src/store/useOrderStore"),
      },
      {
        find: "@shared/store/useAuthStore.instance",
        replacement: path.resolve(__dirname, "src/store/useAuthStore"),
      },
      {
        find: "@shared",
        replacement: path.resolve(__dirname, "../shared"),
      },
    ],
    dedupe: ["react", "react-dom", "react-router-dom", "@phosphor-icons/react", "zustand", "axios"],
    modules: [path.resolve(__dirname, "node_modules"), "node_modules"],
  },
  server: {
    host: true,
    allowedHosts: [".ngrok-free.dev"],
    port: 5174,
    fs: {
      allow: [__dirname, path.resolve(__dirname, "../shared")],
    },
    watch: {
      usePolling: true,
    },
    hmr: {
      clientPort: 5174,
    },
    proxy: {
      "/api": {
        target: "http://backend:8000",
        changeOrigin: true,
        ws: true,
      },
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/__tests__/setup.ts",
    coverage: {
      provider: "v8",
      include: ["src/store/**", "src/telegram/**", "src/utils/**"],
    },
  },
});

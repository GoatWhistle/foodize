import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      {
        find: "@shared/services/api.instance.js",
        replacement: path.resolve(__dirname, "src/services/api.js"),
      },
      {
        find: "@shared/store/useOrderStore.instance.js",
        replacement: path.resolve(__dirname, "src/store/useOrderStore.js"),
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
    setupFiles: "./src/__tests__/setup.js",
    coverage: {
      provider: "v8",
      include: ["src/store/**", "src/telegram/**", "src/utils/**"],
    },
  },
});

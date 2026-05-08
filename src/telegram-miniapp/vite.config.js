import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
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
});

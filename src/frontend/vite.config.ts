import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

const coverageGlob = (rel: string): string =>
  path.resolve(__dirname, rel).replace(/\\/g, '/');
const sharedGlob = (sub: string): string =>
  coverageGlob(`../shared/${sub}/**/*.{ts,tsx}`);

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      {
        find: '@shared/services/api.instance',
        replacement: path.resolve(__dirname, 'src/services/api'),
      },
      {
        find: '@shared/store/useOrderStore.instance',
        replacement: path.resolve(__dirname, 'src/store/useOrderStore'),
      },
      {
        find: '@shared/store/useAuthStore.instance',
        replacement: path.resolve(__dirname, 'src/store/useAuthStore'),
      },
      {
        find: '@shared',
        replacement: path.resolve(__dirname, '../shared'),
      },
    ],
    dedupe: ['react', 'react-dom', 'react-router-dom', '@phosphor-icons/react', 'zustand', 'axios'],
    modules: [path.resolve(__dirname, 'node_modules'), 'node_modules'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          charts: ['recharts'],
          qrcode: ['qrcode'],
          icons: ['@phosphor-icons/react'],
          state: ['zustand'],
        },
      },
    },
  },
  server: {
    host: true,
    port: 5173,
    fs: {
      allow: [__dirname, path.resolve(__dirname, '../shared')],
    },
    watch: {
      usePolling: true,
    },
    hmr: {
      clientPort: 5173,
    },
    proxy: {
      '/api': {
        target: 'http://backend:8000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/__tests__/setup.ts',
    coverage: {
      provider: 'v8',
      allowExternal: true,
      include: [
        coverageGlob('src/store/**/*.{ts,tsx}'),
        coverageGlob('src/utils/**/*.{ts,tsx}'),
        coverageGlob('src/services/**/*.{ts,tsx}'),
        coverageGlob('src/components/**/*.{ts,tsx}'),
        coverageGlob('src/pages/**/*.{ts,tsx}'),
        coverageGlob('src/hooks/**/*.{ts,tsx}'),
        sharedGlob('store'),
        sharedGlob('services'),
        sharedGlob('utils'),
        sharedGlob('hooks'),
        sharedGlob('components'),
        sharedGlob('pages'),
      ],
      exclude: ['src/services/generated/**', '**/node_modules/**'],
      thresholds: {
        statements: 50,
        branches: 65,
        functions: 45,
        lines: 50,
      },
    },
  },
});

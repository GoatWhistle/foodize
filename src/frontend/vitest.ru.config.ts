import base from './vite.config';
import { mergeConfig } from 'vitest/config';

export default mergeConfig(base, {
  test: {
    setupFiles: ['./src/__tests__/setup.ts', './src/__tests__/ru-lang.setup.ts'],
  },
});

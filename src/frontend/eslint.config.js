import { reactWebConfig } from '../shared/eslint.preset.js';

export default reactWebConfig({
  rootDir: import.meta.dirname,
  ignores: ['*.config.js', '*.config.ts'],
});

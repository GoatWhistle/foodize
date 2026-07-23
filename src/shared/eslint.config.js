import { reactWebConfig } from "./eslint.preset.js";

export default reactWebConfig({
  rootDir: import.meta.dirname,
  ignores: ["types/api.ts", "*.config.js"],
});

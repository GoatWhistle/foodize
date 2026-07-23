import js from "@eslint/js";
import tseslint from "typescript-eslint";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import prettierConfig from "eslint-config-prettier";

export const sharedRules = {
  "react/jsx-uses-vars": "error",
  "react/react-in-jsx-scope": "off",
  "react/prop-types": "off",
  "react-hooks/rules-of-hooks": "error",
  "react-hooks/exhaustive-deps": "error",
  "no-empty": "error",
  "no-console": ["error", { allow: ["warn", "error"] }],
  "@typescript-eslint/no-unused-vars": [
    "error",
    { caughtErrorsIgnorePattern: "^_", argsIgnorePattern: "^_" },
  ],
  "@typescript-eslint/no-floating-promises": "error",
  "@typescript-eslint/no-misused-promises": "error",
  "@typescript-eslint/await-thenable": "error",
  "@typescript-eslint/no-explicit-any": "error",
  "@typescript-eslint/no-deprecated": "error",
  "@typescript-eslint/no-non-null-assertion": "error",
  "@typescript-eslint/restrict-template-expressions": ["error", { allowNumber: true }],
};

export function reactWebConfig({ rootDir, ignores = [] }) {
  return tseslint.config(
    {
      ignores: ["dist/**", "node_modules/**", "coverage/**", "eslint.preset.js", ...ignores],
    },
    js.configs.recommended,
    ...tseslint.configs.strictTypeChecked,
    prettierConfig,
    {
      files: ["**/*.{ts,tsx,js,jsx}"],
      languageOptions: {
        globals: {
          ...globals.browser,
          ...globals.es2021,
        },
        ecmaVersion: "latest",
        sourceType: "module",
        parserOptions: {
          projectService: true,
          tsconfigRootDir: rootDir,
          ecmaFeatures: {
            jsx: true,
          },
        },
      },
      plugins: {
        react,
        "react-hooks": reactHooks,
      },
      rules: sharedRules,
      settings: {
        react: {
          version: "detect",
        },
      },
    },
  );
}

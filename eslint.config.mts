import type { Linter } from "eslint";
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import ReactEslintPlugin from "eslint-plugin-react";
import PrettierEslint from "eslint-plugin-prettier/recommended";

export default tseslint.config(
  eslint.configs.recommended,
  tseslint.configs.recommended,
  PrettierEslint,
  ...[ReactEslintPlugin.configs.flat.recommended ?? []],
  ...[ReactEslintPlugin.configs.flat["jsx-runtime"] ?? []],
  {
    ignores: ["node_modules", "dist", "__snapshots__"],
    settings: {
      react: {
        version: "detect",
      },
    },
    rules: {
      "prettier/prettier": "error",
      "@typescript-eslint/no-namespace": "off",
      "@typescript-eslint/no-empty-function": "off",
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          args: "none",
          caughtErrors: "none",
        },
      ],
      "react/jsx-uses-vars": "error",
      "react/jsx-uses-react": "error",
    },
  },
) as Linter.Config;

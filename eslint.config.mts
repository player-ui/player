import type { Linter } from "eslint"
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import ReactEslintPlugin from "eslint-plugin-react"
import PrettierEslint from "eslint-plugin-prettier/recommended"

export default tseslint.config(
  eslint.configs.recommended,
  tseslint.configs.recommended,
  PrettierEslint,
  ...[ReactEslintPlugin.configs.flat.all ?? []],
  {
    ignores: ["node_modules", "dist", "__snapshots__"],
    rules: {
      "prettier/prettier": "error",
      "@typescript-eslint/no-namespace": "off",
      "@typescript-eslint/no-empty-function": "off",
      "@typescript-eslint/no-explicit-any": "warn"
    },
  }
) as Linter.Config
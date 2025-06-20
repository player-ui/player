import { defineConfig, UserConfig } from "vite";
import react from "@vitejs/plugin-react";

const config: UserConfig = defineConfig({
  plugins: [
    react({
      include: /\.(jsx|tsx)$/,
      babel: {
        babelrc: false,
        configFile: false,
      },
    }),
  ],
  optimizeDeps: {
    include: [
      "hoist-non-react-statics",
      "sorted-array",
      "timm",
      "queue-microtask",
      "ts-nested-error",
      "p-defer",
      "semver",
      "@babel/runtime/helpers/objectSpread2",
      "@babel/runtime/helpers/objectWithoutProperties",
      "@babel/runtime/helpers/extends",
      "lz-string",
      "esbuild-wasm/lib/browser",
      "typescript",
      "redux-state-sync",
    ],
  },
  build: {
    rollupOptions: {
      external: ["@monaco-editor/react"],
    },
  },
});
export default config;

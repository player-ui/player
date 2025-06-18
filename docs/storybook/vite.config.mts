import { defineConfig, UserConfig } from "vite";
import react from "@vitejs/plugin-react";
import commonjs from "vite-plugin-commonjs";

const config: UserConfig = defineConfig({
  plugins: [
    react({
      include: /\.(jsx|tsx)$/,
      babel: {
        babelrc: false,
        configFile: false,
      },
    }),
    commonjs({
      filter(id) {
        if (id.includes(".css.js")) {
          return true;
        }
      },
    }),
  ],
  build: {
    rollupOptions: {
      external: ["@monaco-editor/react"],
    },
  },
});
export default config;

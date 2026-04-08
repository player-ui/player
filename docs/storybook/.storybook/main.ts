import type { StorybookConfig } from "@storybook/react-vite";
import path, { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const thisFilename = fileURLToPath(import.meta.url);
const thisDir = dirname(thisFilename);

const config: StorybookConfig = {
  stories: ["../src/**/*.@(stories.@(js|tsx|ts))", "../src/**/*.mdx"],
  addons: [
    "@vueless/storybook-dark-mode",
    "@storybook/addon-docs",
    "@player-ui/storybook",
  ],
  typescript: {
    reactDocgen: false,
  },
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  viteFinal(config) {
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...config.resolve.alias,

      // storybook + pnpm issue
      // https://github.com/storybookjs/storybook/discussions/22650#discussioncomment-6414161
      react: path.resolve(thisDir, "../../../node_modules/react"),
      "react-dom": path.resolve(thisDir, "../../../node_modules/react-dom"),
    };
    return config;
  },
};

export default config;

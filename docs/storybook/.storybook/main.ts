import type { StorybookConfig } from "@storybook/react-webpack5";
import type { Configuration as WebpackConfig } from "webpack";
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
    "@storybook/addon-webpack5-compiler-babel",
  ],
  typescript: {
    reactDocgen: false,
  },
  framework: {
    name: "@storybook/react-webpack5",
    options: {},
  },
  webpackFinal(config: WebpackConfig) {
    if (config.resolve) {
      config.resolve.alias = {
        ...config.resolve.alias,

        // storybook + pnpm issue
        // https://github.com/storybookjs/storybook/discussions/22650#discussioncomment-6414161
        react: path.resolve(thisDir, "../../../node_modules/react"),
        "react-dom": path.resolve(thisDir, "../../../node_modules/react-dom"),
      };
    }
    return config;
  },
  refs: {
    "@chakra-ui/react": {
      disable: true,
    },
  },
};

export default config;

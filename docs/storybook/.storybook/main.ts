import type { StorybookConfig } from "@storybook/react-webpack5";
import path from "path";

const config: StorybookConfig = {
  stories: ["../src/**/*.@(stories.@(js|tsx|ts))", "../src/**/*.mdx"],
  addons: ["@storybook/addon-docs", "@player-ui/storybook", "@storybook/addon-webpack5-compiler-babel"],
  typescript: {
    reactDocgen: false,
  },
  framework: {
    name: "@storybook/react-webpack5",
    options: {},
  },
  webpackFinal(config) {
    if (config.resolve) {
      config.resolve.alias = {
        ...config.resolve.alias,

        // storybook + pnpm issue
        // https://github.com/storybookjs/storybook/discussions/22650#discussioncomment-6414161
        react: path.resolve(__dirname, "../../../node_modules/react"),
        "react-dom": path.resolve(__dirname, "../../../node_modules/react-dom"),
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

module.exports = config;

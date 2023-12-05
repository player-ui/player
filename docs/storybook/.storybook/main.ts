import type { StorybookConfig } from "@storybook/react-webpack5";

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(js|mdx|tsx|ts)"],
  addons: ["@storybook/addon-docs", "@player-ui/storybook"],
  typescript: {
    reactDocgen: false,
  },
  framework: {
    name: "@storybook/react-webpack5",
    options: {},
  },
  refs: {
    "@chakra-ui/react": {
      disable: true,
    },
  },
};

module.exports = config;

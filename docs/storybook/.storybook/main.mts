import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  stories: ["../src/**/*.@(stories.@(js|tsx|ts))", "../src/**/*.mdx"],
  addons: ["@storybook/addon-docs", "@player-ui/storybook"],
  typescript: {
    reactDocgen: false,
  },
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },

  async viteFinal(config) {
    const { mergeConfig } = await import("vite");

    return mergeConfig(config, {
      resolve: {
        dedupe: ["@player-ui/react", "@player-ui/player", "@player-tools/dsl"],
      },
    });
  },
};

export default config;

// This file has been automatically migrated to valid ESM format by Storybook.
import { fileURLToPath } from "node:url";
import type { StorybookConfig } from "@storybook/react-vite";
import path, { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const config: StorybookConfig = {
  stories: ["../src/**/*.@(stories.@(js|tsx|ts))", "../src/**/*.mdx"],
  addons: [
    "@storybook/addon-docs",
    "@player-ui/storybook",
    "@vueless/storybook-dark-mode",
  ],
  typescript: {
    reactDocgen: false,
  },
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  viteFinal(config) {
    return {
      ...config,
      optimizeDeps: {
        ...config.optimizeDeps,
        force: true,
        include: [
          ...(config.optimizeDeps?.include ?? []),
          "react-redux > prop-types",
          "react-is",
          "sorted-array",
          "timm",
          "queue-microtask",
          "nested-error",
          "ts-nested-error",
          "p-defer",
          "react-json-reconciler",
          "@player-tools/dsl",
          "storybook > semver",
          "@player-ui/partial-match-registry",
          "@player-ui/common-types-plugin",
          "@player-ui/data-change-listener-plugin",
          "@player-ui/computed-properties-plugin",
          "@player-ui/reference-assets-plugin-components",
        ],
      },
    };
  },
};

export default config;

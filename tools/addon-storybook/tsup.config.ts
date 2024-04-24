// Based on https://github.com/storybookjs/addon-kit/blob/main/tsup.config.ts

import { defineConfig, type Options } from "tsup";
import { globalPackages as globalManagerPackages } from "@storybook/manager/globals";
import { globalPackages as globalPreviewPackages } from "@storybook/preview/globals";

// The current browsers supported by Storybook v7
const BROWSER_TARGET: Options["target"] = [
  "chrome100",
  "safari15",
  "firefox91",
];
const NODE_TARGET: Options["target"] = ["node16"];

export default defineConfig(async (options) => {
  const exportEntries: Array<string> = ["./src/index.ts"];
  const managerEntries: Array<string> = []; // ["./src/manager.tsx"];
  const previewEntries: Array<string> = []; // ["./src/preview.tsx"];

  const commonConfig: Options = {
    splitting: false,
    minify: false,
    treeshake: true,
    sourcemap: true,
    clean: true,
  };

  const configs: Options[] = [];

  // export entries are entries meant to be manually imported by the user
  // they are not meant to be loaded by the manager or preview
  // they'll be usable in both node and browser environments, depending on which features and modules they depend on
  if (exportEntries.length) {
    configs.push({
      ...commonConfig,
      entry: exportEntries,
      format: ["esm", "cjs"],
      target: [...BROWSER_TARGET, ...NODE_TARGET],
      platform: "neutral",
      external: [...globalManagerPackages, ...globalPreviewPackages],
    });
  }

  // manager entries are entries meant to be loaded into the manager UI
  // they'll have manager-specific packages externalized and they won't be usable in node
  // they won't have types generated for them as they're usually loaded automatically by Storybook
  if (managerEntries.length) {
    configs.push({
      ...commonConfig,
      entry: managerEntries,
      format: ["esm"],
      target: BROWSER_TARGET,
      platform: "browser",
      external: globalManagerPackages,
    });
  }

  // preview entries are entries meant to be loaded into the preview iframe
  // they'll have preview-specific packages externalized and they won't be usable in node
  // they won't have types generated for them as they're usually loaded automatically by Storybook
  if (previewEntries.length) {
    configs.push({
      ...commonConfig,
      entry: previewEntries,
      format: ["esm"],
      target: BROWSER_TARGET,
      platform: "browser",
      external: globalPreviewPackages,
    });
  }

  return configs;
});

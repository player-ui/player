import { defineConfig, Options } from "tsup";
import fs from "fs";

// Using the work from mark
// https://github.com/reduxjs/redux/blob/c9e06506f88926e252daf5275495eba0c04bf8e3/tsup.config.ts#L2
// https://blog.isquaredsoftware.com/2023/08/esm-modernization-lessons/

export function createConfig() {
  return defineConfig((options: Options) => {
    const pkgJson = JSON.parse(fs.readFileSync("package.json", "utf8"));

    const defaultOptions: Options = {
      entry: [pkgJson.main],
      sourcemap: true,
      ...options,
    };

    return [
      {
        ...defaultOptions,
        format: ["esm"],
        outExtension: () => ({ js: ".mjs", dts: ".d.mts" }),
        clean: true,
        async onSuccess() {
          // Support Webpack 4 by pointing `"module"` to a file with a `.js` extension
          fs.copyFileSync("dist/index.mjs", "dist/index.legacy-esm.js");
        },
      },
      // Browser-ready ESM, production + minified
      {
        ...defaultOptions,
        define: {
          "process.env.NODE_ENV": JSON.stringify("production"),
        },
        format: ["esm"],
        outExtension: () => ({ js: ".mjs" }),
        minify: true,
      },
      {
        ...defaultOptions,
        format: "cjs",
        outDir: "./dist/cjs/",
        outExtension: () => ({ js: ".cjs" }),
      },
    ];
  });
}

import { defineConfig, Options } from "tsup";
import fs from "fs";
import path from "path";

// Using the work from mark
// https://github.com/reduxjs/redux/blob/c9e06506f88926e252daf5275495eba0c04bf8e3/tsup.config.ts#L2
// https://blog.isquaredsoftware.com/2023/08/esm-modernization-lessons/

/** Adds support for replacing process.env.* references with stamped values from bazel */
function getStampedSubstitutions(): Record<string, string> {
  const contextDir = path.join(
    process.env.BAZEL_BINDIR ?? "",
    process.env.BAZEL_PACKAGE ?? "",
  );
  const contextDirRelative = contextDir.split(path.sep).map(() => "..");
  const rootDir = path.join(process.cwd(), ...contextDirRelative);

  if (
    !process.env.BAZEL_STABLE_STATUS_FILE ||
    !process.env.BAZEL_VOLATILE_STATUS_FILE
  ) {
    return {};
  }

  const stableStatusFile = path.join(
    rootDir,
    process.env.BAZEL_STABLE_STATUS_FILE,
  );

  const volatileStatusFile = path.join(
    rootDir,
    process.env.BAZEL_VOLATILE_STATUS_FILE,
  );

  const customSubstitutions = {
    __VERSION__: "{STABLE_VERSION}",
    __GIT_COMMIT__: "{STABLE_GIT_COMMIT}",
  };

  const substitutions: Record<string, string> = {};

  [stableStatusFile, volatileStatusFile].forEach((statusFile) => {
    if (!fs.existsSync(statusFile)) {
      return;
    }

    const contents = fs.readFileSync(statusFile, "utf-8");

    contents.split("\n").forEach((statusLine) => {
      if (!statusLine.trim()) {
        return;
      }

      const firstSpace = statusLine.indexOf(" ");
      const varName = statusLine.substring(0, firstSpace);
      const varVal = statusLine.substring(firstSpace + 1);

      substitutions[`process.env.${varName}`] = JSON.stringify(varVal);

      Object.entries(customSubstitutions).forEach(([key, value]) => {
        if (value === `{${varName}}`) {
          substitutions[key] = JSON.stringify(varVal);
        }
      });
    });
  });

  return substitutions;
}

export function createConfig(): ReturnType<typeof defineConfig> {
  return defineConfig((options: Options) => {
    const pkgJson = JSON.parse(fs.readFileSync("package.json", "utf8"));

    const defaultOptions: Options = {
      entry: [pkgJson.main],
      sourcemap: true,
      define: getStampedSubstitutions(),
      ...options,
    };

    if (process.env.PLAYER_NATIVE_BUNDLE) {
      const bundleEntryName = process.env.PLAYER_NATIVE_BUNDLE;
      const bundleFileTarget = path.join(
        "dist",
        bundleEntryName + ".native.js",
      );

      const peerDeps = Object.keys(pkgJson.peerDependencies || {});

      // Maps @player-ui peer dep package names to the global variable they expose
      // in their native bundles (the native_bundle value in each package's BUILD file).
      const nativeGlobals: Record<string, string> = {
        "@player-ui/player": "Player",
        "@player-ui/partial-match-registry": "Registry",
      };

      // Replaces peer dep imports with references to their runtime globals so they
      // are not bundled into the native .js file.
      const peerDepGlobalsPlugin = {
        name: "peer-dep-globals",
        setup(build: any) {
          peerDeps.forEach((dep) => {
            const globalName = nativeGlobals[dep];
            if (!globalName) return;
            const filter = new RegExp(
              `^${dep.replace(/[/\\^$*+?.()|[\]{}]/g, "\\$&")}$`,
            );
            build.onResolve({ filter }, () => ({
              path: dep,
              namespace: "peer-dep-globals",
            }));
            build.onLoad(
              { filter: /.*/, namespace: "peer-dep-globals" },
              () => ({
                contents: `module.exports = ${globalName}`,
                loader: "js",
              }),
            );
          });
        },
      };

      return [
        {
          ...defaultOptions,
          globalName: bundleEntryName,
          external: [],
          esbuildPlugins: [peerDepGlobalsPlugin],
          define: {
            ...defaultOptions.define,
            "process.env.NODE_ENV": JSON.stringify("production"),
          },
          target: "es5",
          format: ["iife"],
          async onSuccess() {
            await fs.promises.copyFile(
              "dist/index.global.js",
              bundleFileTarget,
            );
            await fs.promises.copyFile(
              "dist/index.global.js.map",
              bundleFileTarget + ".map",
            );

            await fs.promises.rm("dist/index.global.js");
            await fs.promises.rm("dist/index.global.js.map");
          },
        },
      ];
    }

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
          ...defaultOptions.define,
          "process.env.NODE_ENV": JSON.stringify("production"),
        },
        format: ["esm"],
        outExtension: () => ({ js: ".mjs" }),
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

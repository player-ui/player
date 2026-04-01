import { configDefaults, defineConfig } from "vitest/config";
import type { UserConfig } from "vitest/node";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "happy-dom",
    exclude: [
      ...configDefaults.exclude,
      "helpers",
      "bazel-bin",
      "bazel-out",
      "bazel-player",
      "bazel-testlogs",
    ],
    reporters: [
      ...(process.env.XML_OUTPUT_FILE ? ["junit", "default"] : ["default"]),
      path.join(__dirname, "tools", "vitest_coverage_mapper.ts"),
    ],
    benchmark: {
      exclude: [...configDefaults.exclude, "bazel-*/**"],
    },
    setupFiles: [
      path.join(
        process.env.XML_OUTPUT_FILE ? "" : __dirname,
        "./scripts/vitest.setup.ts",
      ),
    ],

    outputFile: {
      junit: process.env.XML_OUTPUT_FILE ?? "test-results.xml",
    },

    passWithNoTests: true,

    coverage: {
      enabled: Boolean(process.env.COVERAGE_OUTPUT_FILE),
      reportOnFailure: true,
      provider: "v8",
      exclude: [
        "**/node_modules/**",
        "external/**",
        "tools/**",
        "**/__tests__/**",
        "**/__mocks__/**",
        "**/*.d.ts",
        "**/*.test.*",
        "**/vitest.config.mts",
        "**/postcss.config.js",
        "**/tailwind.config.js",
      ],
      all: true,
      reporter: ["text", "html", "lcovonly"],
    },
  },
}) as UserConfig;

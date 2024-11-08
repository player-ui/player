import { configDefaults, defineConfig } from "vitest/config";
import type { UserConfig } from "vitest/node";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "happy-dom",
    exclude: [...configDefaults.exclude, "helpers"],
    reporters: [
      "default",
      process.env.XML_OUTPUT_FILE ? "junit" : "basic",
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
      ],
      all: true,
      reporter: ["text", "html", "lcovonly"],
    },
  },
}) as UserConfig;

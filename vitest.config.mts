import { configDefaults, defineConfig } from "vitest/config";
import type { UserConfig } from "vitest/node";
import path from "node:path";
import fs from "node:fs";

function benchmarkPaths() {
  // In a bazel run, BUILD_WORKSPACE_DIRECTORY + BENCH_PACKAGE_PATH give us
  // the source-tree package root so writes land in the right place.
  // In a direct pnpm vitest bench run, CWD is the package directory.
  const workspaceDir = process.env.BUILD_WORKSPACE_DIRECTORY;
  const pkgPath = process.env.BENCH_PACKAGE_PATH;
  const benchDir =
    workspaceDir && pkgPath
      ? path.join(workspaceDir, pkgPath, "benchmarks")
      : path.join(process.cwd(), "benchmarks");

  const outputJson = path.join(benchDir, "current.json");
  const compareFile = path.join(benchDir, "baseline.json");

  return {
    outputJson,
    ...(fs.existsSync(compareFile) ? { compare: compareFile } : {}),
  };
}

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
      ...benchmarkPaths(),
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

import { configDefaults, defineConfig } from "vitest/config";
import path from "node:path";

const COVERAGE_OUTPUT_FILE = path.relative(
  process.cwd(),
  process.env.COVERAGE_OUTPUT_FILE ?? "coverage.dat",
);

export default defineConfig({
  test: {
    environment: "happy-dom",
    exclude: [...configDefaults.exclude, "helpers"],
    reporters: ["default", process.env.XML_OUTPUT_FILE ? "junit" : "basic"],

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
      reportsDirectory: "coverage_test",
      reporter: ["text", "html", ["lcovonly", { file: COVERAGE_OUTPUT_FILE }]],
    },
  },
});

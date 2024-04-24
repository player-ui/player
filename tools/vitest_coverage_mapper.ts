import fs from "fs";
import path from "path";

/**
 * Setting the output file in vitest.config.ts doesn't actually write the file to the right location
 * This is a workaround to copy to the file to where bazel expects it to be once the test is over
 */
class CustomReporter {
  onFinished() {
    const { COVERAGE_OUTPUT_FILE } = process.env;

    if (!COVERAGE_OUTPUT_FILE) {
      return;
    }

    const coverageDir = path.join(process.cwd(), "coverage");
    const testCov = path.join(coverageDir, "lcov.info");

    if (!fs.existsSync(coverageDir)) {
      fs.mkdirSync(coverageDir);
    }

    if (
      fs.existsSync(COVERAGE_OUTPUT_FILE) &&
      fs.statSync(COVERAGE_OUTPUT_FILE).size > 0
    ) {
      fs.copyFileSync(testCov, COVERAGE_OUTPUT_FILE);
      return;
    }

    const watcher = fs.watch(coverageDir, (event, filename) => {
      if (event === "rename" && filename === "lcov.info") {
        if (fs.statSync(testCov).size > 0) {
          fs.copyFileSync(testCov, COVERAGE_OUTPUT_FILE);
          watcher.close();
        }
      }
    });
  }
}

export default CustomReporter;

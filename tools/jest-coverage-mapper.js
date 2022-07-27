const path = require('path');
const fs = require('fs');

class JestCovReporter {
  onRunComplete(_, results) {
    if (process.env.COVERAGE_OUTPUT_FILE) {
      const lcov = path.join('coverage', 'lcov.info');
      fs.copyFileSync(lcov, process.env.COVERAGE_OUTPUT_FILE);
    }
  }
}

module.exports = JestCovReporter;

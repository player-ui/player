const path = require('path');

const LOCAL_VSCODE = process.env.CI === 'vscode-jest-tests';

module.exports = {
  reporters: [
    'default',
    'jest-junit',
    path.join(__dirname, 'tools', 'jest-coverage-mapper.js'),
  ],
  coverageDirectory: 'coverage/',
  collectCoverage: !LOCAL_VSCODE,
  moduleFileExtensions: ['js', 'jsx', 'json', 'ts', 'tsx'],
  coverageReporters: ['cobertura', 'html', 'lcov', 'json-summary'],
  transform: {
    '^.+\\.[jt]sx?$': [
      'babel-jest',
      { configFile: path.join(__dirname, 'babel.config.js') },
    ],
  },
  setupFilesAfterEnv: [path.join(__dirname, 'tools', 'jest-setup.js')],
  testEnvironment: process.env.testEnvironment ?? 'jsdom',
  maxWorkers: '50%',
  haste: {
    enableSymlinks: true,
  },
  watchman: false,
  passWithNoTests: true,
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/helpers/',
    'test-utils',
    '_backup',
  ],
  collectCoverageFrom: [
    '**/src/**',
    '!**/*.json',
    '!**/theme.*',
    '!**/*.stories.*',
    '!**/*.snippet.*',
    '!**/__tests__/**',
    '!**/*.snap',
    '!**/dist/**',
    '!**/jest-test.sh.runfiles/**',
    '!**/test-utils/*.ts',
    '!**/perf-ui/**',
    '!**/perf-core/**',
    '!**/_backup/**',
  ],
  automock: false,
  transformIgnorePatterns: ['node-modules', '!mdast-util-from-markdown'],
};

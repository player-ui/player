import path from 'path';
import type { UserConfig, UserWorkspaceConfig } from 'vitest';
// eslint-disable-next-line import/extensions, import/no-unresolved
import { defineProject, mergeConfig } from 'vitest/config';

/** Whether we're running in Bazel. */
export const BAZEL = !!process.env.BAZEL;

/**
 * Default configuration for a project in a workspace.
 */
export const defaultProjectConfig: UserWorkspaceConfig = {
  logLevel: 'warn',
  clearScreen: false,
  test: {
    testTimeout: 10000,
    hookTimeout: 1000,
    pool: 'vmThreads',
    include: [`**/*.test.ts?(x)`],
    exclude: [
      '**/node_modules',
      '**/dist',
      '**/out',
      '.git',
      '**/.cache',
      '**/*.runfiles/__main__', // for Bazel
      '**/testSetup.test.[jt]s',
    ],
    css: { modules: { classNameStrategy: 'non-scoped' } },
    hideSkippedTests: true,
  },
};

/**
 * Configuration that applies to the entire workspace.
 */
const userConfig: UserConfig = {
  test: {
    cache: BAZEL ? false : undefined, // don't cache in Bazel

    teardownTimeout: 1000,

    // For compatibility with Jest's defaults; can be changed to the Vitest defaults.
    snapshotFormat: {
      escapeString: true,
      printBasicPrototype: true,
    },

    reporters: ['basic'],
  },
};

export function defineProjectWithDefaults(
  dir: string,
  config: UserWorkspaceConfig
): UserWorkspaceConfig {
  const name = path.basename(dir);
  if (!config.test) {
    config.test = {};
  }
  if (!config.test.name) {
    config.test.name = name;
  }
  if (!config.test.root) {
    // Reorient the dir around process.cwd() if we're running in Bazel and we got a __dirname-relative path.
    // https://medium.com/@Jakeherringbone/running-tools-under-bazel-8aa416e7090c
    if (BAZEL && dir.startsWith(__dirname)) {
      dir = path.join(process.cwd(), dir.slice(__dirname.length));
    }
    config.test.root = dir;
  }

  return mergeConfig(
    mergeConfig(defaultProjectConfig, userConfig),
    defineProject(config) as UserWorkspaceConfig
  );
}

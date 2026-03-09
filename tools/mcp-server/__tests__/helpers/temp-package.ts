/**
 * Helper utility for creating temporary test packages
 * Used in E2E tests to simulate end-user package setups
 */

import { mkdtemp, mkdir, rm, writeFile } from "fs/promises";
import { join } from "path";

export interface TempPackageOptions {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  name?: string;
  private?: boolean;
}

/**
 * Creates a temporary package directory with a package.json file
 * Useful for E2E testing of package detection and knowledge retrieval
 *
 * Example:
 * ```typescript
 * const tempPkg = new TempPackage({
 *   dependencies: {
 *     '@player-ui/react': 'workspace:*',
 *     '@player-ui/player': 'workspace:*'
 *   }
 * });
 *
 * await tempPkg.create();
 * try {
 *   // Run tests using tempPkg.getPackageJsonPath()
 * } finally {
 *   await tempPkg.cleanup();
 * }
 * ```
 */
export class TempPackage {
  private tempDir: string | null = null;

  constructor(private options: TempPackageOptions = {}) {}

  /**
   * Creates the temporary directory and writes package.json
   */
  async create(): Promise<void> {
    const tmpBase = join(process.cwd(), ".test-tmp");
    await mkdir(tmpBase, { recursive: true });
    this.tempDir = await mkdtemp(join(tmpBase, "mcp-test-"));

    const packageJson = {
      name: this.options.name || "test-consumer",
      version: "1.0.0",
      private: this.options.private ?? true,
      dependencies: this.options.dependencies || {},
      devDependencies: this.options.devDependencies || {},
      peerDependencies: this.options.peerDependencies || {},
    };

    await writeFile(
      join(this.tempDir, "package.json"),
      JSON.stringify(packageJson, null, 2),
      "utf-8",
    );
  }

  /**
   * Returns the absolute path to the package.json file
   */
  getPackageJsonPath(): string {
    if (!this.tempDir) {
      throw new Error(
        "TempPackage not created. Call create() before accessing paths.",
      );
    }
    return join(this.tempDir, "package.json");
  }

  /**
   * Returns the absolute path to the temporary directory
   */
  getTempDir(): string {
    if (!this.tempDir) {
      throw new Error(
        "TempPackage not created. Call create() before accessing paths.",
      );
    }
    return this.tempDir;
  }

  /**
   * Removes the temporary directory and all its contents
   */
  async cleanup(): Promise<void> {
    if (this.tempDir) {
      try {
        await rm(this.tempDir, { recursive: true, force: true });
      } catch (error) {
        // Ignore cleanup errors - temp dir will be cleaned by OS eventually
        console.warn(
          `Warning: Failed to cleanup temp directory ${this.tempDir}:`,
          error,
        );
      }
      this.tempDir = null;
    }
  }

  /**
   * Creates additional files in the temporary package directory
   * Useful for testing scenarios with additional config files, etc.
   */
  async addFile(relativePath: string, content: string): Promise<void> {
    if (!this.tempDir) {
      throw new Error(
        "TempPackage not created. Call create() before adding files.",
      );
    }
    await writeFile(join(this.tempDir, relativePath), content, "utf-8");
  }
}

/**
 * Helper function to create temporary packages with common configurations
 */
export const TempPackagePresets = {
  /**
   * React app with common Player UI dependencies
   */
  reactApp: (): TempPackageOptions => ({
    name: "test-react-app",
    dependencies: {
      "@player-ui/react": "workspace:*",
      "@player-ui/reference-assets-plugin-react": "workspace:*",
      react: "^18.0.0",
      "react-dom": "^18.0.0",
    },
  }),

  /**
   * Core-only app (no React)
   */
  coreOnly: (): TempPackageOptions => ({
    name: "test-core-app",
    dependencies: {
      "@player-ui/player": "workspace:*",
      "@player-ui/types": "workspace:*",
    },
  }),

  /**
   * Empty project with no Player UI dependencies
   */
  noPlayer: (): TempPackageOptions => ({
    name: "test-empty-app",
    dependencies: {
      react: "^18.0.0",
    },
  }),

  /**
   * Project with multiple Player UI plugins
   */
  multiPackage: (): TempPackageOptions => ({
    name: "test-multi-plugin-app",
    dependencies: {
      "@player-ui/react": "workspace:*",
      "@player-ui/reference-assets-plugin-react": "workspace:*",
      "@player-ui/player": "workspace:*",
    },
    devDependencies: {
      "@player-ui/make-flow": "workspace:*",
    },
  }),
};

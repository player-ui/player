import { describe, it, expect, afterEach } from "vitest";
import { detectPackages } from "../../../src/tools/detect-packages.js";
import { TempPackage } from "../../helpers/temp-package.js";
import {
  PathTraversalError,
  FileSystemError,
  PackageJsonError,
} from "../../../src/errors.js";

describe("detectPackages", () => {
  let tempPkg: TempPackage;

  afterEach(async () => {
    if (tempPkg) {
      await tempPkg.cleanup();
    }
  });

  it("should detect player-ui packages in React app", async () => {
    tempPkg = new TempPackage({
      dependencies: {
        "@player-ui/react": "workspace:*",
        "@player-ui/reference-assets-plugin-react": "workspace:*",
        react: "^18.0.0",
      },
    });
    await tempPkg.create();

    const result = await detectPackages({
      packageJsonPath: tempPkg.getPackageJsonPath(),
    });

    expect(result).toContain("@player-ui/react");
    expect(result).toContain("Detected Player UI Packages");
    expect(result).toContain("Quick Reference");
  });

  it("should detect player-ui packages in core-only app", async () => {
    tempPkg = new TempPackage({
      dependencies: {
        "@player-ui/player": "workspace:*",
        "@player-ui/types": "workspace:*",
      },
    });
    await tempPkg.create();

    const result = await detectPackages({
      packageJsonPath: tempPkg.getPackageJsonPath(),
    });

    expect(result).toContain("@player-ui/player");
    expect(result).toContain("@player-ui/types");
    expect(result).toContain("**Found**: 2 package(s)");
  });

  it("should handle empty project with no player-ui packages", async () => {
    tempPkg = new TempPackage({
      dependencies: {
        react: "^18.0.0",
      },
    });
    await tempPkg.create();

    const result = await detectPackages({
      packageJsonPath: tempPkg.getPackageJsonPath(),
    });

    expect(result).toContain("No Player UI packages detected");
  });

  it("should use default package.json path when not specified", async () => {
    // Create a temp package without player-ui dependencies
    tempPkg = new TempPackage({
      dependencies: {
        react: "^18.0.0",
        "@modelcontextprotocol/sdk": "^1.0.0",
      },
    });
    await tempPkg.create();

    // Change to temp directory so default path works
    const originalCwd = process.cwd();
    process.chdir(tempPkg.getTempDir());

    try {
      const result = await detectPackages({});
      expect(result).toContain("No Player UI packages detected");
    } finally {
      process.chdir(originalCwd);
    }
  });

  it("should throw PathTraversalError for path traversal attempts", async () => {
    await expect(
      detectPackages({
        packageJsonPath: "../../etc/passwd",
      }),
    ).rejects.toThrow(PathTraversalError);
  });

  it("should throw FileSystemError for non-existent files", async () => {
    await expect(
      detectPackages({
        packageJsonPath: "./nonexistent-package.json",
      }),
    ).rejects.toThrow(FileSystemError);
  });

  it("should throw PackageJsonError for invalid JSON", async () => {
    tempPkg = new TempPackage();
    await tempPkg.create();

    // Overwrite package.json with invalid JSON
    await tempPkg.addFile("package.json", "{ invalid json }");

    await expect(
      detectPackages({
        packageJsonPath: tempPkg.getPackageJsonPath(),
      }),
    ).rejects.toThrow(PackageJsonError);
  });

  it("should include overview from knowledge artifacts", async () => {
    tempPkg = new TempPackage({
      dependencies: {
        "@player-ui/react": "workspace:*",
      },
    });
    await tempPkg.create();

    const result = await detectPackages({
      packageJsonPath: tempPkg.getPackageJsonPath(),
    });

    expect(result).toContain("### @player-ui/react");
    // Should have truncated overview
    expect(result).toMatch(/\.\.\./);
  });

  it("should handle packages with dev and peer dependencies", async () => {
    tempPkg = new TempPackage({
      dependencies: {
        "@player-ui/react": "workspace:*",
      },
      devDependencies: {
        "@player-ui/player": "workspace:*",
      },
      peerDependencies: {
        "@player-ui/types": "workspace:*",
      },
    });
    await tempPkg.create();

    const result = await detectPackages({
      packageJsonPath: tempPkg.getPackageJsonPath(),
    });

    expect(result).toContain("@player-ui/react");
    expect(result).toContain("@player-ui/player");
    expect(result).toContain("@player-ui/types");
  });

  it("should suggest using player_get_package", async () => {
    tempPkg = new TempPackage({
      dependencies: {
        "@player-ui/react": "workspace:*",
      },
    });
    await tempPkg.create();

    const result = await detectPackages({
      packageJsonPath: tempPkg.getPackageJsonPath(),
    });

    expect(result).toContain("player_get_package");
    expect(result).toContain("package");
  });
});

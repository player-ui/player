/**
 * E2E Tests - Consumer Simulation
 *
 * These tests simulate how end users would interact with the MCP server
 * by creating temporary packages with player-ui dependencies and testing
 * the complete workflow from package detection to knowledge retrieval.
 */

import { describe, it, expect, afterEach } from "vitest";
import { TempPackage, TempPackagePresets } from "../helpers/temp-package.js";
import { detectPackages } from "../../src/tools/detect-packages.js";
import { getPackage } from "../../src/tools/get-package.js";
import { searchApi } from "../../src/tools/search-api.js";
import {
  PathTraversalError,
  PackageNotFoundError,
  PackageJsonError,
} from "../../src/errors.js";

describe("E2E: Consumer Simulation", () => {
  let tempPkg: TempPackage;

  afterEach(async () => {
    if (tempPkg) {
      await tempPkg.cleanup();
    }
  });

  describe("React Application Workflow", () => {
    it("should detect, search, and retrieve knowledge for React app", async () => {
      // Step 1: Create a React app package
      tempPkg = new TempPackage(TempPackagePresets.reactApp());
      await tempPkg.create();

      // Step 2: Detect player-ui packages in the project
      const detected = await detectPackages({
        packageJsonPath: tempPkg.getPackageJsonPath(),
      });

      expect(detected).toContain("@player-ui/react");
      expect(detected).toContain("Quick Reference");
      expect(detected).toContain("**Found**: 1 package(s)");

      // Step 3: Get full knowledge for the main package
      const knowledge = await getPackage({
        package: "@player-ui/react",
        includeDependencies: true,
      });

      expect(knowledge).toContain("Knowledge for @player-ui/react");
      expect(knowledge).toContain("Includes dependencies");
      // Should include dependencies like @player-ui/player
      expect(knowledge).toContain("@player-ui/player");
    });

    it("should search for React-related packages", async () => {
      const searchResults = await searchApi({
        query: "react",
        scope: "all",
      });

      expect(searchResults).toContain("Search Results for");
      expect(searchResults).toContain("@player-ui/react");
      expect(searchResults).toMatch(/\*\*Found\*\*: \d+ package\(s\)/);
    });
  });

  describe("Core-Only Application Workflow", () => {
    it("should detect and retrieve knowledge for core packages", async () => {
      tempPkg = new TempPackage(TempPackagePresets.coreOnly());
      await tempPkg.create();

      const detected = await detectPackages({
        packageJsonPath: tempPkg.getPackageJsonPath(),
      });

      expect(detected).toContain("@player-ui/player");
      expect(detected).toContain("@player-ui/types");

      // Get knowledge without dependencies
      const knowledge = await getPackage({
        package: "@player-ui/player",
        includeDependencies: false,
      });

      expect(knowledge).toContain("@player-ui/player");
      // Should NOT include dependency headers when includeDependencies is false
      expect(knowledge).not.toContain("Includes dependencies");
    });
  });

  describe("Empty Project Workflow", () => {
    it("should handle projects with no player-ui dependencies", async () => {
      tempPkg = new TempPackage(TempPackagePresets.noPlayer());
      await tempPkg.create();

      const detected = await detectPackages({
        packageJsonPath: tempPkg.getPackageJsonPath(),
      });

      expect(detected).toContain("No Player UI packages detected");
    });

    it("should still allow searching for packages", async () => {
      // Even without detected packages, users can search
      const searchResults = await searchApi({
        query: "validation",
        scope: "core",
      });

      expect(searchResults).toMatch(/Search Results for|No packages found/);
    });
  });

  describe("Multi-Package Application Workflow", () => {
    it("should handle projects with multiple player-ui packages", async () => {
      tempPkg = new TempPackage(TempPackagePresets.multiPackage());
      await tempPkg.create();

      const detected = await detectPackages({
        packageJsonPath: tempPkg.getPackageJsonPath(),
      });

      expect(detected).toContain("@player-ui/react");
      expect(detected).toContain("@player-ui/player");
    });

    it("should retrieve knowledge with dependency chains", async () => {
      tempPkg = new TempPackage(TempPackagePresets.multiPackage());
      await tempPkg.create();

      const knowledge = await getPackage({
        package: "@player-ui/react",
        includeDependencies: true,
      });

      // React depends on player, which depends on types
      // Should include all in the dependency chain (up to depth 2)
      expect(knowledge).toContain("@player-ui/react");
      expect(knowledge).toContain("@player-ui/player");
      expect(knowledge).toContain("@player-ui/types");
    });
  });

  describe("Search Functionality", () => {
    it("should search by concept and find relevant packages", async () => {
      const results = await searchApi({
        query: "data binding",
      });

      expect(results).toContain("Search Results for");
      // Should find packages tagged with data binding concepts
      expect(results).toMatch(/@player-ui\/(player|types)/);
    });

    it("should filter search by scope", async () => {
      const coreResults = await searchApi({
        query: "player",
        scope: "core",
      });

      expect(coreResults).toContain("**Scope**: core");
      expect(coreResults).toMatch(/@player-ui\/(player|types)/);
    });

    it("should handle searches with no results gracefully", async () => {
      const results = await searchApi({
        query: "nonexistent-package-xyz-123",
      });

      expect(results).toContain("No packages found matching");
    });
  });

  describe("Error Handling", () => {
    it("should handle path traversal attempts", async () => {
      await expect(
        detectPackages({
          packageJsonPath: "../../etc/passwd",
        }),
      ).rejects.toThrow(PathTraversalError);
    });

    it("should handle missing packages gracefully", async () => {
      await expect(
        getPackage({
          package: "@player-ui/nonexistent-package",
        }),
      ).rejects.toThrow(PackageNotFoundError);
    });

    it("should handle invalid JSON in package.json", async () => {
      tempPkg = new TempPackage();
      await tempPkg.create();
      await tempPkg.addFile("package.json", "{ invalid json }");

      await expect(
        detectPackages({
          packageJsonPath: tempPkg.getPackageJsonPath(),
        }),
      ).rejects.toThrow(PackageJsonError);
    });
  });

  describe("Custom Package Scenarios", () => {
    it("should handle package with only devDependencies", async () => {
      tempPkg = new TempPackage({
        devDependencies: {
          "@player-ui/player": "workspace:*",
        },
      });
      await tempPkg.create();

      const detected = await detectPackages({
        packageJsonPath: tempPkg.getPackageJsonPath(),
      });

      expect(detected).toContain("@player-ui/player");
    });

    it("should handle package with peer dependencies", async () => {
      tempPkg = new TempPackage({
        peerDependencies: {
          "@player-ui/react": "workspace:*",
        },
      });
      await tempPkg.create();

      const detected = await detectPackages({
        packageJsonPath: tempPkg.getPackageJsonPath(),
      });

      expect(detected).toContain("@player-ui/react");
    });

    it("should handle package with mixed dependency types", async () => {
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

      const detected = await detectPackages({
        packageJsonPath: tempPkg.getPackageJsonPath(),
      });

      expect(detected).toContain("@player-ui/react");
      expect(detected).toContain("@player-ui/player");
      expect(detected).toContain("@player-ui/types");
      expect(detected).toContain("**Found**: 3 package(s)");
    });
  });

  describe("Knowledge Retrieval Scenarios", () => {
    it("should get knowledge for types package (no dependencies)", async () => {
      const knowledge = await getPackage({
        package: "@player-ui/types",
        includeDependencies: true,
      });

      expect(knowledge).toContain("@player-ui/types");
      // Types has no dependencies, so no dependency section
      expect(knowledge).not.toContain("Includes dependencies");
    });

    it("should get knowledge without dependencies when requested", async () => {
      const knowledge = await getPackage({
        package: "@player-ui/react",
        includeDependencies: false,
      });

      expect(knowledge).toContain("@player-ui/react");
      // Should not include structured dependency headers (raw markdown may
      // still reference other packages in prose)
      expect(knowledge).not.toContain("Dependency:");
      expect(knowledge).not.toContain("Includes dependencies");
    });
  });
});

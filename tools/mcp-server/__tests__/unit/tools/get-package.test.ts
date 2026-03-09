import { describe, it, expect, vi, beforeEach } from "vitest";
import { getPackage } from "../../../src/tools/get-package.js";
import { ValidationError, PackageNotFoundError } from "../../../src/errors.js";
import type { Metadata } from "../../../src/loader.js";
import * as loader from "../../../src/loader.js";

// Mock the loader module
vi.mock("../../../src/loader.js", () => ({
  loadKnowledgeWithDependencies: vi.fn(),
  loadMetadata: vi.fn(),
}));

const mockMetadata: Metadata = {
  version: "1.0.0",
  description: "test",
  packages: {
    "@player-ui/types": {
      category: "core",
      tags: [],
      dependencies: [],
      knowledgeFile: "core/types.md",
      estimatedTokens: 0,
      exports: [],
      description: "Type definitions",
    },
    "@player-ui/player": {
      category: "core",
      tags: [],
      dependencies: ["@player-ui/types"],
      knowledgeFile: "core/player.md",
      estimatedTokens: 0,
      exports: [],
      description: "Core player engine",
    },
    "@player-ui/react": {
      category: "platform",
      tags: [],
      dependencies: ["@player-ui/player"],
      knowledgeFile: "react/player.md",
      estimatedTokens: 0,
      exports: [],
      description: "React integration",
    },
  },
  dependencyGraph: {},
  searchIndex: {},
};

describe("getPackage", () => {
  beforeEach(() => {
    vi.mocked(loader.loadMetadata).mockResolvedValue(mockMetadata);
  });
  it("should throw ValidationError when package name is empty", async () => {
    await expect(getPackage({ package: "" })).rejects.toThrow(ValidationError);
  });

  it("should load knowledge without dependencies when includeDependencies is false", async () => {
    const mockKnowledgeMap = new Map([
      ["@player-ui/types", "# @player-ui/types\n\nType definitions"],
    ]);

    vi.mocked(loader.loadKnowledgeWithDependencies).mockResolvedValue(
      mockKnowledgeMap,
    );

    const result = await getPackage({
      package: "@player-ui/types",
      includeDependencies: false,
    });

    expect(loader.loadKnowledgeWithDependencies).toHaveBeenCalledWith(
      "@player-ui/types",
      0,
    );
    expect(result).toContain("@player-ui/types");
    expect(result).toContain("Type definitions");
  });

  it("should load knowledge with dependencies by default", async () => {
    const mockKnowledgeMap = new Map([
      ["@player-ui/react", "# @player-ui/react\n\nReact integration"],
      ["@player-ui/player", "# @player-ui/player\n\nCore player"],
      ["@player-ui/types", "# @player-ui/types\n\nType definitions"],
    ]);

    vi.mocked(loader.loadKnowledgeWithDependencies).mockResolvedValue(
      mockKnowledgeMap,
    );

    const result = await getPackage({
      package: "@player-ui/react",
    });

    expect(loader.loadKnowledgeWithDependencies).toHaveBeenCalledWith(
      "@player-ui/react",
      2,
    );
    expect(result).toContain("Knowledge for @player-ui/react");
    expect(result).toContain("Includes dependencies");
    expect(result).toContain("@player-ui/player");
    expect(result).toContain("@player-ui/types");
  });

  it("should format response with main package first", async () => {
    const mockKnowledgeMap = new Map([
      ["@player-ui/react", "# React Package\n\nMain package content"],
      ["@player-ui/player", "# Player Package\n\nDependency content"],
    ]);

    vi.mocked(loader.loadKnowledgeWithDependencies).mockResolvedValue(
      mockKnowledgeMap,
    );

    const result = await getPackage({
      package: "@player-ui/react",
      includeDependencies: true,
    });

    const reactIndex = result.indexOf("# React Package");
    const playerIndex = result.indexOf("# Player Package");

    expect(reactIndex).toBeLessThan(playerIndex);
    expect(result).toContain("Dependency: @player-ui/player");
  });

  it("should handle single package without dependency header", async () => {
    const mockKnowledgeMap = new Map([
      ["@player-ui/types", "# @player-ui/types\n\nSingle package"],
    ]);

    vi.mocked(loader.loadKnowledgeWithDependencies).mockResolvedValue(
      mockKnowledgeMap,
    );

    const result = await getPackage({
      package: "@player-ui/types",
      includeDependencies: true,
    });

    expect(result).not.toContain("Includes dependencies");
    expect(result).toContain("@player-ui/types");
  });

  it("should throw PackageNotFoundError for unknown packages", async () => {
    await expect(
      getPackage({ package: "@player-ui/nonexistent" }),
    ).rejects.toThrow(PackageNotFoundError);
  });
});

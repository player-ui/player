import { describe, it, expect, beforeEach, vi } from "vitest";
import { listPackages } from "../../../src/tools/list-packages.js";
import * as loader from "../../../src/loader.js";

// Mock the loader module
vi.mock("../../../src/loader.js", () => ({
  loadMetadata: vi.fn(),
}));

describe("listPackages", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mock metadata
    vi.mocked(loader.loadMetadata).mockResolvedValue({
      version: "1.0.0",
      description: "Test metadata",
      packages: {
        "@player-ui/types": {
          category: "core",
          tags: ["types", "definitions"],
          dependencies: [],
          knowledgeFile: "core/types.md",
          estimatedTokens: 1800,
          exports: ["Asset", "Flow", "View"],
          description: "Pure TypeScript type definitions",
        },
        "@player-ui/player": {
          category: "core",
          tags: ["runtime", "engine"],
          dependencies: ["@player-ui/types"],
          knowledgeFile: "core/player.md",
          estimatedTokens: 2600,
          exports: ["Player", "PlayerPlugin"],
          description: "Core runtime engine",
        },
        "@player-ui/react": {
          category: "platform",
          tags: ["react", "ui"],
          dependencies: ["@player-ui/player"],
          knowledgeFile: "react/player.md",
          estimatedTokens: 2750,
          exports: [
            "ReactPlayer",
            "useReactPlayer",
            "usePlayer",
            "useLogger",
            "useAssetProps",
            "useGetConstant",
          ],
          description: "React integration",
        },
      },
      dependencyGraph: {},
      searchIndex: {},
    });
  });

  it("should list all packages when category is all", async () => {
    const result = await listPackages({ category: "all" });

    expect(result).toContain("Available Player UI Packages");
    expect(result).toContain("**Category Filter**: all");
    expect(result).toContain("**Total**: 3 package(s)");
    expect(result).toContain("@player-ui/types");
    expect(result).toContain("@player-ui/player");
    expect(result).toContain("@player-ui/react");
  });

  it("should list packages grouped by category", async () => {
    const result = await listPackages({});

    expect(result).toContain("Core Packages");
    expect(result).toContain("Platform Packages");
  });

  it("should filter packages by category", async () => {
    const result = await listPackages({ category: "core" });

    expect(result).toContain("**Category Filter**: core");
    expect(result).toContain("**Total**: 2 package(s)");
    expect(result).toContain("@player-ui/types");
    expect(result).toContain("@player-ui/player");
    expect(result).not.toContain("@player-ui/react");
  });

  it("should show package descriptions", async () => {
    const result = await listPackages({});

    expect(result).toContain("Pure TypeScript type definitions");
    expect(result).toContain("Core runtime engine");
    expect(result).toContain("React integration");
  });

  it("should show package tags", async () => {
    const result = await listPackages({});

    expect(result).toContain("**Tags**: types, definitions");
    expect(result).toContain("**Tags**: runtime, engine");
    expect(result).toContain("**Tags**: react, ui");
  });

  it("should show key exports with truncation for long lists", async () => {
    const result = await listPackages({});

    expect(result).toContain("**Key Exports**: Asset, Flow, View");
    expect(result).toContain("**Key Exports**: Player, PlayerPlugin");
    // React has 6 exports, should be truncated to 5 + ...
    expect(result).toContain(
      "**Key Exports**: ReactPlayer, useReactPlayer, usePlayer, useLogger, useAssetProps...",
    );
  });

  it("should show dependencies when present", async () => {
    const result = await listPackages({});

    expect(result).toContain("**Dependencies**: @player-ui/types");
    expect(result).toContain("**Dependencies**: @player-ui/player");
    // Types has no dependencies, should not show dependency line
    const typesSection = result.substring(
      result.indexOf("@player-ui/types"),
      result.indexOf("@player-ui/player"),
    );
    expect(typesSection).not.toContain("**Dependencies**:");
  });

  it("should show estimated token counts", async () => {
    const result = await listPackages({});

    expect(result).toContain("**Estimated Tokens**: ~1800");
    expect(result).toContain("**Estimated Tokens**: ~2600");
    expect(result).toContain("**Estimated Tokens**: ~2750");
  });

  it("should suggest using player_get_package", async () => {
    const result = await listPackages({});

    expect(result).toContain("player_get_package");
    expect(result).toContain("package");
  });

  it("should handle empty category filter", async () => {
    vi.mocked(loader.loadMetadata).mockResolvedValue({
      version: "1.0.0",
      description: "Test metadata",
      packages: {
        "@player-ui/types": {
          category: "core",
          tags: ["types"],
          dependencies: [],
          knowledgeFile: "core/types.md",
          estimatedTokens: 1800,
          exports: ["Asset"],
          description: "Type definitions",
        },
      },
      dependencyGraph: {},
      searchIndex: {},
    });

    const result = await listPackages({ category: "platform" });

    expect(result).toContain("No packages found in category");
    expect(result).toContain('Use scope "all" to see all packages');
    expect(result).toContain("- core");
  });

  it("should default to all category when args is undefined", async () => {
    const result = await listPackages(undefined);

    expect(result).toContain("**Category Filter**: all");
    expect(result).toContain("**Total**: 3 package(s)");
  });

  it("should default to all category when args is empty object", async () => {
    const result = await listPackages({});

    expect(result).toContain("**Category Filter**: all");
  });
});

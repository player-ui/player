import { describe, it, expect, beforeEach, vi } from "vitest";
import { detectPlayerPackages } from "../../src/detect-packages.js";
import * as loader from "../../src/loader.js";

// Mock the loader module
vi.mock("../../src/loader.js", () => ({
  loadMetadata: vi.fn(),
}));

describe("detectPlayerPackages", () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();

    // Setup default mock metadata
    vi.mocked(loader.loadMetadata).mockResolvedValue({
      version: "1.0.0",
      description: "Test metadata",
      packages: {
        "@player-ui/react": {
          category: "platform",
          tags: ["react"],
          dependencies: [],
          knowledgeFile: "react/player.md",
          estimatedTokens: 2000,
          exports: ["ReactPlayer"],
          description: "React integration",
        },
        "@player-ui/player": {
          category: "core",
          tags: ["core"],
          dependencies: [],
          knowledgeFile: "core/player.md",
          estimatedTokens: 2000,
          exports: ["Player"],
          description: "Core player",
        },
        "@player-ui/types": {
          category: "core",
          tags: ["types"],
          dependencies: [],
          knowledgeFile: "core/types.md",
          estimatedTokens: 1500,
          exports: ["Asset"],
          description: "Type definitions",
        },
      },
      dependencyGraph: {},
      searchIndex: {},
    });
  });

  it("should detect player-ui packages from dependencies", async () => {
    const packageJson = {
      dependencies: {
        "@player-ui/react": "^1.0.0",
        react: "^18.0.0",
      },
    };

    const result = await detectPlayerPackages(packageJson);

    expect(result).toEqual(["@player-ui/react"]);
  });

  it("should detect player-ui packages from devDependencies", async () => {
    const packageJson = {
      devDependencies: {
        "@player-ui/make-flow": "^1.0.0",
      },
    };

    // Add make-flow to mock metadata
    vi.mocked(loader.loadMetadata).mockResolvedValue({
      version: "1.0.0",
      description: "Test metadata",
      packages: {
        "@player-ui/make-flow": {
          category: "tools",
          tags: ["testing"],
          dependencies: [],
          knowledgeFile: "tools/make-flow.md",
          estimatedTokens: 1000,
          exports: ["makeFlow"],
          description: "Flow creation utility",
        },
      },
      dependencyGraph: {},
      searchIndex: {},
    });

    const result = await detectPlayerPackages(packageJson);

    expect(result).toEqual(["@player-ui/make-flow"]);
  });

  it("should detect player-ui packages from peerDependencies", async () => {
    const packageJson = {
      peerDependencies: {
        "@player-ui/player": "^1.0.0",
      },
    };

    const result = await detectPlayerPackages(packageJson);

    expect(result).toEqual(["@player-ui/player"]);
  });

  it("should detect player-ui packages from all dependency types", async () => {
    const packageJson = {
      dependencies: {
        "@player-ui/react": "^1.0.0",
        react: "^18.0.0",
      },
      devDependencies: {
        "@player-ui/types": "^1.0.0",
      },
      peerDependencies: {
        "@player-ui/player": "^1.0.0",
      },
    };

    const result = await detectPlayerPackages(packageJson);

    expect(result).toContain("@player-ui/react");
    expect(result).toContain("@player-ui/types");
    expect(result).toContain("@player-ui/player");
    expect(result).toHaveLength(3);
  });

  it("should handle packages with no player-ui dependencies", async () => {
    const packageJson = {
      dependencies: {
        react: "^18.0.0",
        "react-dom": "^18.0.0",
      },
    };

    const result = await detectPlayerPackages(packageJson);

    expect(result).toEqual([]);
  });

  it("should handle empty package.json", async () => {
    const packageJson = {};

    const result = await detectPlayerPackages(packageJson);

    expect(result).toEqual([]);
  });

  it("should not include duplicates", async () => {
    const packageJson = {
      dependencies: {
        "@player-ui/react": "^1.0.0",
      },
      devDependencies: {
        "@player-ui/react": "^1.0.0", // Same package in both
      },
    };

    const result = await detectPlayerPackages(packageJson);

    expect(result).toEqual(["@player-ui/react"]);
  });

  it("should ignore packages not in metadata", async () => {
    const packageJson = {
      dependencies: {
        "@player-ui/nonexistent": "^1.0.0",
        "@player-ui/react": "^1.0.0",
      },
    };

    const result = await detectPlayerPackages(packageJson);

    expect(result).toEqual(["@player-ui/react"]);
    expect(result).not.toContain("@player-ui/nonexistent");
  });

  it("should call loadMetadata once", async () => {
    const packageJson = {
      dependencies: {
        "@player-ui/react": "^1.0.0",
      },
    };

    await detectPlayerPackages(packageJson);

    expect(loader.loadMetadata).toHaveBeenCalledTimes(1);
  });
});

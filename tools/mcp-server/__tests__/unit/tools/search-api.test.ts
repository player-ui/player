import { describe, it, expect, vi } from "vitest";
import { searchApi } from "../../../src/tools/search-api.js";
import { ValidationError } from "../../../src/errors.js";
import * as loader from "../../../src/loader.js";

// Mock the loader module
vi.mock("../../../src/loader.js", () => ({
  searchPackages: vi.fn(),
}));

describe("searchApi", () => {
  it("should throw ValidationError when query is empty", async () => {
    await expect(searchApi({ query: "" })).rejects.toThrow(ValidationError);
  });

  it("should search with default scope", async () => {
    const mockResults = [
      {
        name: "@player-ui/player",
        description: "Core player engine",
        relevance: "concept-match",
      },
    ];

    vi.mocked(loader.searchPackages).mockResolvedValue(mockResults);

    const result = await searchApi({
      query: "validation",
    });

    expect(loader.searchPackages).toHaveBeenCalledWith("validation", "all");
    expect(result).toContain("Search Results for");
    expect(result).toContain("validation");
    expect(result).toContain("@player-ui/player");
    expect(result).toContain("**Scope**: all");
  });

  it("should search with specific scope", async () => {
    const mockResults = [
      {
        name: "@player-ui/react",
        description: "React integration",
        relevance: "name-match",
      },
    ];

    vi.mocked(loader.searchPackages).mockResolvedValue(mockResults);

    const result = await searchApi({
      query: "react",
      scope: "platform",
    });

    expect(loader.searchPackages).toHaveBeenCalledWith("react", "platform");
    expect(result).toContain("**Scope**: platform");
  });

  it("should display match type for each result", async () => {
    const mockResults = [
      {
        name: "@player-ui/react",
        description: "React integration",
        relevance: "concept-match",
      },
      {
        name: "@player-ui/player",
        description: "Core player",
        relevance: "description-match",
      },
    ];

    vi.mocked(loader.searchPackages).mockResolvedValue(mockResults);

    const result = await searchApi({
      query: "test",
    });

    expect(result).toContain("**Match type**: concept-match");
    expect(result).toContain("**Match type**: description-match");
  });

  it("should show count of found packages", async () => {
    const mockResults = [
      {
        name: "@player-ui/react",
        description: "React integration",
        relevance: "name-match",
      },
      {
        name: "@player-ui/player",
        description: "Core player",
        relevance: "name-match",
      },
    ];

    vi.mocked(loader.searchPackages).mockResolvedValue(mockResults);

    const result = await searchApi({
      query: "player",
    });

    expect(result).toContain("**Found**: 2 package(s)");
  });

  it("should handle no results", async () => {
    vi.mocked(loader.searchPackages).mockResolvedValue([]);

    const result = await searchApi({
      query: "nonexistent",
    });

    expect(result).toContain("No packages found matching");
    expect(result).toContain("nonexistent");
  });

  it("should suggest using player_get_package", async () => {
    const mockResults = [
      {
        name: "@player-ui/react",
        description: "React integration",
        relevance: "name-match",
      },
    ];

    vi.mocked(loader.searchPackages).mockResolvedValue(mockResults);

    const result = await searchApi({
      query: "react",
    });

    expect(result).toContain("player_get_package");
  });

  it("should include package descriptions", async () => {
    const mockResults = [
      {
        name: "@player-ui/metrics-plugin",
        description: "Provides metrics collection and reporting",
        relevance: "tag-match",
      },
    ];

    vi.mocked(loader.searchPackages).mockResolvedValue(mockResults);

    const result = await searchApi({
      query: "metrics",
    });

    expect(result).toContain("Provides metrics collection and reporting");
  });
});

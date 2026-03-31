import { describe, it, expect } from "vitest";
import {
  McpError,
  PackageNotFoundError,
  ValidationError,
  FileSystemError,
  PathTraversalError,
  MetadataError,
  KnowledgeArtifactError,
  PackageJsonError,
} from "../../src/errors.js";

describe("McpError", () => {
  it("should create error with message, code, and context", () => {
    const error = new McpError("Test error", "TEST_CODE", {
      foo: "bar",
    });

    expect(error.message).toBe("Test error");
    expect(error.code).toBe("TEST_CODE");
    expect(error.context).toEqual({ foo: "bar" });
    expect(error.name).toBe("McpError");
  });

  it("should serialize to JSON correctly", () => {
    const error = new McpError("Test error", "TEST_CODE", { foo: "bar" });
    const json = error.toJSON();

    expect(json).toEqual({
      name: "McpError",
      message: "Test error",
      code: "TEST_CODE",
      context: { foo: "bar" },
    });
  });

  it("should have stack trace", () => {
    const error = new McpError("Test error", "TEST_CODE");
    expect(error.stack).toBeDefined();
  });
});

describe("PackageNotFoundError", () => {
  it("should create error with helpful message", () => {
    const error = new PackageNotFoundError("@player-ui/nonexistent", [
      "@player-ui/react",
      "@player-ui/player",
      "@player-ui/types",
    ]);

    expect(error.code).toBe("PACKAGE_NOT_FOUND");
    expect(error.message).toContain("@player-ui/nonexistent");
    expect(error.message).toContain("@player-ui/react");
    expect(error.message).toContain("player_search_api");
    expect(error.context.packageName).toBe("@player-ui/nonexistent");
    expect(error.context.availablePackages).toHaveLength(3);
  });

  it("should truncate available packages list when too long", () => {
    const packages = Array.from({ length: 10 }, (_, i) => `package-${i}`);
    const error = new PackageNotFoundError("missing-pkg", packages);

    expect(error.message).toContain("...");
    expect(error.message).not.toContain("package-9");
  });
});

describe("ValidationError", () => {
  it("should create error without field context", () => {
    const error = new ValidationError("Invalid input");

    expect(error.code).toBe("VALIDATION_ERROR");
    expect(error.message).toBe("Invalid input");
    expect(error.context).toBeUndefined();
  });

  it("should create error with field context", () => {
    const error = new ValidationError("Invalid package", "package", 123);

    expect(error.code).toBe("VALIDATION_ERROR");
    expect(error.message).toBe("Invalid package");
    expect(error.context).toEqual({
      field: "package",
      invalidValue: 123,
    });
  });
});

describe("FileSystemError", () => {
  it("should create error with operation and path", () => {
    const error = new FileSystemError("read", "/path/to/file.json", "ENOENT");

    expect(error.code).toBe("FILESYSTEM_ERROR");
    expect(error.message).toContain("read");
    expect(error.message).toContain("/path/to/file.json");
    expect(error.message).toContain("ENOENT");
    expect(error.context).toEqual({
      operation: "read",
      path: "/path/to/file.json",
      cause: "ENOENT",
    });
  });

  it("should handle Error instances as cause", () => {
    const cause = new Error("File not found");
    const error = new FileSystemError("write", "/path/to/file.json", cause);

    expect(error.message).toContain("File not found");
    expect(error.context.cause).toBe("File not found");
  });
});

describe("PathTraversalError", () => {
  it("should create error with attempted path and base dir", () => {
    const error = new PathTraversalError("../../etc/passwd", "/app");

    expect(error.code).toBe("PATH_TRAVERSAL");
    expect(error.message).toContain("../../etc/passwd");
    expect(error.message).toContain("/app");
    expect(error.message).toContain("security");
    expect(error.context).toEqual({
      attemptedPath: "../../etc/passwd",
      baseDir: "/app",
    });
  });
});

describe("MetadataError", () => {
  it("should create error without cause", () => {
    const error = new MetadataError("Invalid format");

    expect(error.code).toBe("METADATA_ERROR");
    expect(error.message).toBe("Knowledge metadata error: Invalid format");
    expect(error.context.cause).toBeUndefined();
  });

  it("should create error with cause", () => {
    const cause = new Error("Parse error");
    const error = new MetadataError("Invalid JSON", cause);

    expect(error.code).toBe("METADATA_ERROR");
    expect(error.message).toContain("Invalid JSON");
    expect(error.message).toContain("Parse error");
    expect(error.context.cause).toBe("Parse error");
  });
});

describe("KnowledgeArtifactError", () => {
  it("should create error with package, path, and cause", () => {
    const cause = new Error("File not found");
    const error = new KnowledgeArtifactError(
      "@player-ui/react",
      "knowledge/react/player.md",
      cause,
    );

    expect(error.code).toBe("KNOWLEDGE_ARTIFACT_ERROR");
    expect(error.message).toContain("@player-ui/react");
    expect(error.message).toContain("knowledge/react/player.md");
    expect(error.message).toContain("File not found");
    expect(error.context).toEqual({
      packageName: "@player-ui/react",
      filePath: "knowledge/react/player.md",
      cause: "File not found",
    });
  });
});

describe("PackageJsonError", () => {
  it("should create error with path and cause", () => {
    const cause = new Error("Unexpected token");
    const error = new PackageJsonError("/app/package.json", cause);

    expect(error.code).toBe("PACKAGE_JSON_ERROR");
    expect(error.message).toContain("/app/package.json");
    expect(error.message).toContain("Unexpected token");
    expect(error.message).toContain("valid JSON");
    expect(error.context).toEqual({
      path: "/app/package.json",
      cause: "Unexpected token",
    });
  });
});

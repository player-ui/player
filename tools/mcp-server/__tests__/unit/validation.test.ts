import { describe, it, expect } from "vitest";
import {
  validateGetPackageArgs,
  validateSearchApiArgs,
  validateDetectPackagesArgs,
  validateListPackagesArgs,
} from "../../src/validation.js";
import { ValidationError } from "../../src/errors.js";

describe("validateGetPackageArgs", () => {
  it("should successfully validate valid arguments", () => {
    const result = validateGetPackageArgs({
      package: "@player-ui/react",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.package).toBe("@player-ui/react");
      expect(result.data.includeDependencies).toBeUndefined();
    }
  });

  it("should successfully validate with includeDependencies", () => {
    const result = validateGetPackageArgs({
      package: "@player-ui/react",
      includeDependencies: false,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.package).toBe("@player-ui/react");
      expect(result.data.includeDependencies).toBe(false);
    }
  });

  it("should fail when args is missing", () => {
    const result = validateGetPackageArgs(undefined);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeInstanceOf(ValidationError);
      expect(result.error.code).toBe("VALIDATION_ERROR");
    }
  });

  it("should fail when package parameter is missing", () => {
    const result = validateGetPackageArgs({});

    expect(result.success).toBe(false);
    if (!result.success && result.error instanceof ValidationError) {
      expect(result.error.context?.field).toBe("package");
    }
  });

  it("should fail when package parameter is not a string", () => {
    const result = validateGetPackageArgs({
      package: 123,
    });

    expect(result.success).toBe(false);
    if (!result.success && result.error instanceof ValidationError) {
      expect(result.error.context?.field).toBe("package");
      expect(result.error.context?.invalidValue).toBe(123);
    }
  });

  it("should fail when includeDependencies is not a boolean", () => {
    const result = validateGetPackageArgs({
      package: "@player-ui/react",
      includeDependencies: "true",
    });

    expect(result.success).toBe(false);
    if (!result.success && result.error instanceof ValidationError) {
      expect(result.error.context?.field).toBe("includeDependencies");
    }
  });
});

describe("validateSearchApiArgs", () => {
  it("should successfully validate valid arguments", async () => {
    const result = await validateSearchApiArgs({
      query: "validation",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.query).toBe("validation");
      expect(result.data.scope).toBeUndefined();
    }
  });

  it("should successfully validate with scope", async () => {
    const result = await validateSearchApiArgs({
      query: "validation",
      scope: "core",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.query).toBe("validation");
      expect(result.data.scope).toBe("core");
    }
  });

  it("should fail when args is missing", async () => {
    const result = await validateSearchApiArgs(undefined);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeInstanceOf(ValidationError);
    }
  });

  it("should fail when query parameter is missing", async () => {
    const result = await validateSearchApiArgs({});

    expect(result.success).toBe(false);
    if (!result.success && result.error instanceof ValidationError) {
      expect(result.error.context?.field).toBe("query");
    }
  });

  it("should fail when query is not a string", async () => {
    const result = await validateSearchApiArgs({
      query: 123,
    });

    expect(result.success).toBe(false);
    if (!result.success && result.error instanceof ValidationError) {
      expect(result.error.context?.field).toBe("query");
    }
  });

  it("should fail when scope is not a string", async () => {
    const result = await validateSearchApiArgs({
      query: "validation",
      scope: 123,
    });

    expect(result.success).toBe(false);
    if (!result.success && result.error instanceof ValidationError) {
      expect(result.error.context?.field).toBe("scope");
    }
  });

  it("should fail when scope is invalid", async () => {
    const result = await validateSearchApiArgs({
      query: "validation",
      scope: "invalid-scope",
    });

    expect(result.success).toBe(false);
    if (!result.success && result.error instanceof ValidationError) {
      expect(result.error.context?.field).toBe("scope");
      expect(result.error.message).toContain("invalid-scope");
    }
  });
});

describe("validateDetectPackagesArgs", () => {
  it("should successfully validate when args is undefined", () => {
    const result = validateDetectPackagesArgs(undefined);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({});
    }
  });

  it("should successfully validate when args is null", () => {
    const result = validateDetectPackagesArgs(null);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({});
    }
  });

  it("should successfully validate with packageJsonPath", () => {
    const result = validateDetectPackagesArgs({
      packageJsonPath: "./package.json",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.packageJsonPath).toBe("./package.json");
    }
  });

  it("should fail when args is not an object", () => {
    const result = validateDetectPackagesArgs("string");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeInstanceOf(ValidationError);
    }
  });

  it("should fail when packageJsonPath is not a string", () => {
    const result = validateDetectPackagesArgs({
      packageJsonPath: 123,
    });

    expect(result.success).toBe(false);
    if (!result.success && result.error instanceof ValidationError) {
      expect(result.error.context?.field).toBe("packageJsonPath");
    }
  });
});

describe("validateListPackagesArgs", () => {
  it("should successfully validate when args is undefined", async () => {
    const result = await validateListPackagesArgs(undefined);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({});
    }
  });

  it("should successfully validate when args is null", async () => {
    const result = await validateListPackagesArgs(null);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({});
    }
  });

  it("should successfully validate when args is empty object", async () => {
    const result = await validateListPackagesArgs({});

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ category: undefined });
    }
  });

  it("should successfully validate with valid category", async () => {
    const result = await validateListPackagesArgs({
      category: "core",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.category).toBe("core");
    }
  });

  it("should successfully validate with 'all' category", async () => {
    const result = await validateListPackagesArgs({
      category: "all",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.category).toBe("all");
    }
  });

  it("should fail when args is not an object", async () => {
    const result = await validateListPackagesArgs("string");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeInstanceOf(ValidationError);
      expect(result.error.message).toContain(
        "Arguments must be an object for player_list_packages",
      );
    }
  });

  it("should fail when category is not a string", async () => {
    const result = await validateListPackagesArgs({
      category: 123,
    });

    expect(result.success).toBe(false);
    if (!result.success && result.error instanceof ValidationError) {
      expect(result.error.context?.field).toBe("category");
      expect(result.error.context?.invalidValue).toBe(123);
      expect(result.error.message).toContain(
        "'category' parameter must be a string",
      );
    }
  });

  it("should fail when category is invalid", async () => {
    const result = await validateListPackagesArgs({
      category: "invalid-category",
    });

    expect(result.success).toBe(false);
    if (!result.success && result.error instanceof ValidationError) {
      expect(result.error.context?.field).toBe("category");
      expect(result.error.context?.invalidValue).toBe("invalid-category");
      expect(result.error.message).toContain("invalid-category");
      expect(result.error.message).toContain("must be one of");
    }
  });

  it("should fail with informative message for invalid category", async () => {
    const result = await validateListPackagesArgs({
      category: "wrong",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      // Should list valid categories in error message
      expect(result.error.message).toContain("all");
      expect(result.error.message).toContain("core");
    }
  });
});

/**
 * Type-safe validation utilities for MCP tool arguments
 */

import type { GetPackageArgs } from "./tools/get-package.js";
import type { DetectPackagesArgs } from "./tools/detect-packages.js";
import type { ListPackagesArgs } from "./tools/list-packages.js";
import { getCategories } from "./loader.js";
import { ValidationError, McpError } from "./errors.js";

/**
 * Validation result type - either success with data or failure with error
 */
export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; error: McpError };

function isNonNullObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/**
 * Validate player_get_package arguments
 */
export function validateGetPackageArgs(
  args: unknown,
): ValidationResult<GetPackageArgs> {
  if (!isNonNullObject(args)) {
    return {
      success: false,
      error: new ValidationError(
        "Arguments are required for player_get_package",
      ),
    };
  }

  const pkg = args.package;
  if (typeof pkg !== "string") {
    return {
      success: false,
      error: new ValidationError(
        "'package' parameter must be a string",
        "package",
        pkg,
      ),
    };
  }

  const includeDeps = args.includeDependencies;
  if (includeDeps !== undefined && typeof includeDeps !== "boolean") {
    return {
      success: false,
      error: new ValidationError(
        "'includeDependencies' parameter must be a boolean",
        "includeDependencies",
        includeDeps,
      ),
    };
  }

  return {
    success: true,
    data: {
      package: pkg,
      includeDependencies:
        typeof includeDeps === "boolean" ? includeDeps : undefined,
    },
  };
}

/**
 * Validate player_search_api arguments
 */
export async function validateSearchApiArgs(
  args: unknown,
): Promise<ValidationResult<{ query: string; scope?: string }>> {
  if (!isNonNullObject(args)) {
    return {
      success: false,
      error: new ValidationError(
        "Arguments are required for player_search_api",
      ),
    };
  }

  const query = args.query;
  if (typeof query !== "string") {
    return {
      success: false,
      error: new ValidationError(
        "'query' parameter must be a string",
        "query",
        query,
      ),
    };
  }

  const scope = args.scope;
  if (scope !== undefined) {
    if (typeof scope !== "string") {
      return {
        success: false,
        error: new ValidationError(
          "'scope' parameter must be a string",
          "scope",
          scope,
        ),
      };
    }

    const validScopes = await getCategories();
    if (!validScopes.includes(scope)) {
      return {
        success: false,
        error: new ValidationError(
          `'scope' parameter must be one of: ${validScopes.join(", ")}. Got: '${scope}'`,
          "scope",
          scope,
        ),
      };
    }
  }

  return {
    success: true,
    data: {
      query,
      scope: typeof scope === "string" ? scope : undefined,
    },
  };
}

/**
 * Validate player_detect_packages arguments
 */
export function validateDetectPackagesArgs(
  args: unknown,
): ValidationResult<DetectPackagesArgs> {
  if (args === undefined || args === null) {
    return {
      success: true,
      data: {},
    };
  }

  if (!isNonNullObject(args)) {
    return {
      success: false,
      error: new ValidationError(
        "Arguments must be an object for player_detect_packages",
      ),
    };
  }

  const packageJsonPath = args.packageJsonPath;
  if (packageJsonPath !== undefined && typeof packageJsonPath !== "string") {
    return {
      success: false,
      error: new ValidationError(
        "'packageJsonPath' parameter must be a string",
        "packageJsonPath",
        packageJsonPath,
      ),
    };
  }

  return {
    success: true,
    data: {
      packageJsonPath:
        typeof packageJsonPath === "string" ? packageJsonPath : undefined,
    },
  };
}

/**
 * Validate player_list_packages arguments
 */
export async function validateListPackagesArgs(
  args: unknown,
): Promise<ValidationResult<ListPackagesArgs>> {
  if (args === undefined || args === null) {
    return {
      success: true,
      data: {},
    };
  }

  if (!isNonNullObject(args)) {
    return {
      success: false,
      error: new ValidationError(
        "Arguments must be an object for player_list_packages",
      ),
    };
  }

  const category = args.category;
  if (category !== undefined) {
    if (typeof category !== "string") {
      return {
        success: false,
        error: new ValidationError(
          "'category' parameter must be a string",
          "category",
          category,
        ),
      };
    }

    const validCategories = await getCategories();
    if (!validCategories.includes(category)) {
      return {
        success: false,
        error: new ValidationError(
          `'category' parameter must be one of: ${validCategories.join(", ")}. Got: '${category}'`,
          "category",
          category,
        ),
      };
    }
  }

  return {
    success: true,
    data: {
      category: typeof category === "string" ? category : undefined,
    },
  };
}

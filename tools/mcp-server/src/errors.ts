/**
 * Structured error types for MCP server
 * All errors include error codes for programmatic handling and helpful context
 */

export interface ValidationErrorContext {
  field: string;
  invalidValue?: unknown;
}

export interface PackageNotFoundContext {
  packageName: string;
  availablePackages: string[];
}

export interface FileSystemErrorContext {
  operation: string;
  path: string;
  cause: string;
}

export interface PathTraversalContext {
  attemptedPath: string;
  baseDir: string;
}

export interface MetadataErrorContext {
  cause: string | undefined;
}

export interface KnowledgeArtifactContext {
  packageName: string;
  filePath: string;
  cause: string;
}

export interface PackageJsonContext {
  path: string;
  cause: string;
}

/**
 * Base error class for all MCP server errors
 */
export class McpError extends Error {
  constructor(
    message: string,
    public code: string,
    public context?: object,
  ) {
    super(message);
    this.name = this.constructor.name;
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      context: this.context,
    };
  }
}

/**
 * Error thrown when a requested package is not found in the knowledge system
 */
export class PackageNotFoundError extends McpError {
  declare context: PackageNotFoundContext;

  constructor(packageName: string, availablePackages: string[]) {
    const suggestionList =
      availablePackages.length > 5
        ? availablePackages.slice(0, 5).join(", ") + "..."
        : availablePackages.join(", ");

    super(
      `Package '${packageName}' not found in knowledge system. ` +
        `Available packages: ${suggestionList}. ` +
        `Use player_search_api to find packages by keyword.`,
      "PACKAGE_NOT_FOUND",
      { packageName, availablePackages },
    );
  }
}

/**
 * Error thrown when validation fails for tool arguments
 */
export class ValidationError extends McpError {
  declare context: ValidationErrorContext | undefined;

  constructor(message: string, field?: string, invalidValue?: unknown) {
    super(
      message,
      "VALIDATION_ERROR",
      field ? { field, invalidValue } : undefined,
    );
  }
}

/**
 * Error thrown for file system operations (read, write, etc.)
 */
export class FileSystemError extends McpError {
  declare context: FileSystemErrorContext;

  constructor(operation: string, path: string, cause?: unknown) {
    const causeMessage = cause instanceof Error ? cause.message : String(cause);
    super(
      `Failed to ${operation} file at '${path}': ${causeMessage}`,
      "FILESYSTEM_ERROR",
      { operation, path, cause: causeMessage },
    );
  }
}

/**
 * Error thrown when path traversal attempt is detected
 */
export class PathTraversalError extends McpError {
  declare context: PathTraversalContext;

  constructor(attemptedPath: string, baseDir: string) {
    super(
      `Path traversal detected: '${attemptedPath}' is not within allowed directory '${baseDir}'. ` +
        `For security, only files within the current working directory are accessible.`,
      "PATH_TRAVERSAL",
      { attemptedPath, baseDir },
    );
  }
}

/**
 * Error thrown when metadata.json is invalid or cannot be parsed
 */
export class MetadataError extends McpError {
  declare context: MetadataErrorContext;

  constructor(message: string, cause?: unknown) {
    const causeMessage =
      cause === undefined
        ? undefined
        : cause instanceof Error
          ? cause.message
          : String(cause);
    super(
      `Knowledge metadata error: ${message}${causeMessage ? ` (${causeMessage})` : ""}`,
      "METADATA_ERROR",
      { cause: causeMessage },
    );
  }
}

/**
 * Error thrown when a knowledge artifact file is invalid or cannot be loaded
 */
export class KnowledgeArtifactError extends McpError {
  declare context: KnowledgeArtifactContext;

  constructor(packageName: string, filePath: string, cause?: unknown) {
    const causeMessage = cause instanceof Error ? cause.message : String(cause);
    super(
      `Failed to load knowledge artifact for '${packageName}' at '${filePath}': ${causeMessage}`,
      "KNOWLEDGE_ARTIFACT_ERROR",
      { packageName, filePath, cause: causeMessage },
    );
  }
}

/**
 * Error thrown when package.json parsing fails
 */
export class PackageJsonError extends McpError {
  declare context: PackageJsonContext;

  constructor(path: string, cause?: unknown) {
    const causeMessage = cause instanceof Error ? cause.message : String(cause);
    super(
      `Failed to parse package.json at '${path}': ${causeMessage}. ` +
        `Ensure the file is valid JSON.`,
      "PACKAGE_JSON_ERROR",
      { path, cause: causeMessage },
    );
  }
}

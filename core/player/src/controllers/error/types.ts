/** Severity levels */
export enum ErrorSeverity {
  FATAL = "fatal", // Cannot continue, flow must end
  ERROR = "error", // Standard error, may allow recovery
  WARNING = "warning", // Non-blocking, logged for telemetry
}

const SEVERITY_SET = new Set<string>(Object.values(ErrorSeverity));

/** Known error types for Player */
export const ErrorTypes = {
  EXPRESSION: "expression",
  BINDING: "binding",
  VIEW: "view",
  ASSET: "asset",
  NAVIGATION: "navigation",
  VALIDATION: "validation",
  DATA: "data",
  SCHEMA: "schema",
  NETWORK: "network",
  PLUGIN: "plugin",
  RENDER: "render",
} as const;

/**
 * Error metadata
 */
export interface ErrorMetadata {
  /** Allow custom fields for domain-specific information */
  [key: string]: unknown;
}

export interface PlayerError {
  /** Native Error object */
  error: Error;
  /** Error category (use ErrorTypes constants or custom plugin types) */
  errorType: string;
  /** Impact level */
  severity?: ErrorSeverity;
  /** Additional metadata */
  metadata?: ErrorMetadata;
  /** Whether or not the error was skipped. */
  skipped: boolean;
}

export interface PlayerErrorMetadata<
  TMetadata extends ErrorMetadata = ErrorMetadata,
> {
  type: string;
  severity?: ErrorSeverity;
  metadata?: TMetadata;
}

export const isErrorWithMetadata = (
  error: Error,
): error is Error & PlayerErrorMetadata => {
  // 1. "type" property must be present and a string
  if (!("type" in error) || typeof error.type !== "string") {
    return false;
  }

  // 2. "severity" property is optional. If presesnt, must be a string within the set of severity options
  if (
    "severity" in error &&
    (typeof error.severity !== "string" || !SEVERITY_SET.has(error.severity))
  ) {
    return false;
  }

  // 3. "metadata" property is optional. If present, must be a non-array object.
  return (
    !("metadata" in error) ||
    (typeof error.metadata === "object" &&
      error.metadata !== null &&
      !Array.isArray(error.metadata))
  );
};

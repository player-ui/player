/** Severity levels */
export enum ErrorSeverity {
  FATAL = "fatal", // Cannot continue, flow must end
  ERROR = "error", // Standard error, may allow recovery
  WARNING = "warning", // Non-blocking, logged for telemetry
}

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
}

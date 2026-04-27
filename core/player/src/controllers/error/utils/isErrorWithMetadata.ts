import { ErrorSeverity, PlayerError } from "../types";

const SEVERITY_SET = new Set<string>(Object.values(ErrorSeverity));

export const isErrorWithMetadata = (error: Error): error is PlayerError => {
  // 1. "type" property must be present and a string
  if (!("type" in error) || typeof error.type !== "string") {
    return false;
  }

  // 2. "severity" property is optional. If present, must be a string within the set of severity options
  if (
    "severity" in error &&
    error.severity !== undefined &&
    (typeof error.severity !== "string" || !SEVERITY_SET.has(error.severity))
  ) {
    return false;
  }

  // 3. "metadata" property is optional. If present, must be a non-array object.
  return (
    !("metadata" in error) ||
    error.metadata === undefined ||
    (typeof error.metadata === "object" &&
      error.metadata !== null &&
      !Array.isArray(error.metadata))
  );
};

import type { ErrorStateTransition } from "@player-ui/types";

/**
 * Type guard to check if a value is a non-null object record.
 * This excludes arrays, null, and other non-object types.
 */
export function isRecord(obj: unknown): obj is Record<PropertyKey, unknown> {
  return typeof obj === "object" && obj !== null && !Array.isArray(obj);
}

/**
 * Resolve an ErrorStateTransition to a specific state name.
 * Handles both string and dictionary-based error transitions.
 *
 * @param errorState - The error state configuration (string or dictionary)
 * @param errorType - Optional error type for dictionary lookup
 * @returns The resolved state name, or undefined if no match
 *
 * @example
 * // String errorState
 * resolveErrorState("ERROR_VIEW") // → "ERROR_VIEW"
 *
 * @example
 * // Dictionary errorState with matching type
 * resolveErrorState({ network: "NET_ERR", "*": "GENERIC" }, "network") // → "NET_ERR"
 *
 * @example
 * // Dictionary errorState with wildcard fallback
 * resolveErrorState({ network: "NET_ERR", "*": "GENERIC" }, "unknown") // → "GENERIC"
 */
export function resolveErrorState(
  errorState: ErrorStateTransition | undefined,
  errorType?: string,
): string | undefined {
  if (!errorState) {
    return undefined;
  }

  if (typeof errorState === "string") {
    return errorState;
  }

  if (isRecord(errorState)) {
    const dict = errorState as Record<string, string>;
    return (errorType && dict[errorType]) || dict["*"];
  }

  return undefined;
}

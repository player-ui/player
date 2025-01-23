import { Severity } from "../../logger";

/** Configuration for runtime Player behavior */
export interface PlayerFlags {
  /** What log level duplicate ID errors during view resolution should be raised as */
  duplicateIDLogLevel: Severity;

  /** Log level for when there are cache conflicts in view resolution (usually related to duplicate IDs) */
  cacheConflictLogLevel: Severity;
}

export const DefaultFlags: PlayerFlags = {
  duplicateIDLogLevel: "error",
  cacheConflictLogLevel: "info",
};

export type Flag = keyof PlayerFlags;

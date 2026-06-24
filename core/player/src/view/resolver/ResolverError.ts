import { Node } from "../parser";
import {
  ErrorSeverity,
  ErrorTypes,
  type PlayerErrorMetadata,
} from "../../controllers";
import type { ResolverErrorMetadata, ResolverStage } from "./types";

/** Error class to represent errors in the player resolver. */
export class ResolverError extends Error implements PlayerErrorMetadata {
  readonly type: string = ErrorTypes.VIEW;
  readonly severity: ErrorSeverity = ErrorSeverity.ERROR;
  readonly metadata: ResolverErrorMetadata;

  constructor(
    public readonly cause: unknown,
    public readonly stage: ResolverStage,
    node: Node.Node,
  ) {
    super(`An error in the resolver occurred at stage '${stage}'`);
    this.metadata = {
      node,
    };
  }
}

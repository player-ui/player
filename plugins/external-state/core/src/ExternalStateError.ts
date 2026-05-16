import type { ErrorMetadata, PlayerErrorMetadata } from "@player-ui/player";
import { ErrorSeverity } from "@player-ui/player";

export type ExternalStateErrorReason =
  | "missing-handler"
  | "missing-transition-value";

export interface ExternalStateErrorMetadata extends ErrorMetadata {
  /** The `ref` of the EXTERNAL state that produced the error */
  ref: string;
  /** Which failure mode this error represents */
  reason: ExternalStateErrorReason;
}

export class ExternalStateError
  extends Error
  implements PlayerErrorMetadata<ExternalStateErrorMetadata>
{
  readonly type: string = "EXTERNAL-STATE";
  readonly severity: ErrorSeverity = ErrorSeverity.ERROR;
  readonly metadata: ExternalStateErrorMetadata;

  private constructor(message: string, metadata: ExternalStateErrorMetadata) {
    super(message);
    this.metadata = metadata;
  }

  /** No handler was registered for the EXTERNAL state's ref. */
  static missingHandler(ref: string): ExternalStateError {
    return new ExternalStateError(
      `No handler found for external state with ref: "${ref}". ` +
        `Ensure a handler is registered for this state.`,
      { ref, reason: "missing-handler" },
    );
  }

  /** A handler ran but returned no transition value. */
  static missingTransitionValue(ref: string): ExternalStateError {
    return new ExternalStateError(
      `Handler for external state with ref: "${ref}" did not return a transition value. ` +
        `Ensure the handler returns the name of a valid transition.`,
      { ref, reason: "missing-transition-value" },
    );
  }
}

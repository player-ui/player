import { SyncBailHook } from "tapable-ts";
import type { Logger } from "../../logger";
import type { DataController } from "../data/controller";
import type { FlowController } from "../flow/controller";
import type { PlayerError } from "./types";
import { ErrorStateMiddleware } from "./middleware";
import { isErrorWithMetadata, makeJsonStringifyReplacer } from "./utils";

/**
 * Private symbol used to authorize ErrorController's writes to errorState
 * Only ErrorController has access to this symbol
 */
const errorControllerWriteSymbol: unique symbol = Symbol(
  "errorControllerWrite",
);

export interface ErrorControllerHooks {
  /**
   * Fired when any error is captured
   * - Called in order for each tapped plugin
   * - Return true to bail and prevent error state navigation
   * - Return undefined/false to continue to next handler
   * - Once true is returned, no further plugins are called
   */
  onError: SyncBailHook<[PlayerError], boolean | undefined>;
}

export interface ErrorControllerOptions {
  /** Logger for error operations */
  logger: Logger;
  /** Flow controller for error navigation */
  flow: FlowController;
  /** Callback to fail/reject the flow */
  fail: (error: Error) => void;
  /** Data model for setting errorState (can be set later via setOptions) */
  model?: DataController;
}

/** The orchestrator for player error handling */
export class ErrorController {
  public hooks: ErrorControllerHooks = {
    onError: new SyncBailHook(),
  };

  private options: ErrorControllerOptions;
  private readonly middleware: ErrorStateMiddleware;
  /**
   * Complete history of all captured errors in chronological order
   * Newest errors are APPENDED to the end of the array
   */
  private errorHistory: PlayerError[] = [];
  private currentError?: PlayerError;

  constructor(options: ErrorControllerOptions) {
    this.options = options;

    this.middleware = new ErrorStateMiddleware({
      logger: options.logger,
      writeSymbol: errorControllerWriteSymbol,
    });
  }

  /**
   * Get the middleware for protecting errorState
   * This should be added to DataController's middleware array
   */
  public getDataMiddleware(): ErrorStateMiddleware {
    return this.middleware;
  }

  /**
   * Set the DataController after initialization
   */
  public setOptions(options: Pick<ErrorControllerOptions, "model">): void {
    this.options.model = options.model;
  }

  /**
   * Capture an error and try to recover. Errors implementing the `PlayerErrorMetadata` interface will be added to history, fire hooks and update data model. As a fallback, all errors will try to trigger an errorTransition. If the error does not have a `type` property, it will default to only using the wildcard navigation.
   */
  public captureError(error: Error): boolean {
    if (!isErrorWithMetadata(error)) {
      this.options.logger.debug(
        `[ErrorController] Captured error: ${error.message}\n`,
        "Cannot determine optional error metadata, attempting default error navigation...",
      );
      return this.tryNavigateToErrorState(error, "*");
    }

    // Add to history
    this.errorHistory.push(error);

    // Set as current error
    this.currentError = error;

    this.options.logger.debug(
      `[ErrorController] Captured error: ${error.message}`,
      JSON.stringify(
        {
          errorType: error.type,
          severity: error.severity,
          metadata: error.metadata,
        },
        makeJsonStringifyReplacer(),
      ),
    );

    // Notify listeners and check if navigation should be skipped
    // Plugins can observe the error and optionally return true to bail
    const shouldSkip = this.hooks.onError.call(error) ?? false;

    if (shouldSkip) {
      this.options.logger.debug(
        "[ErrorController] Error state navigation skipped by plugin",
      );
      return true;
    }

    // Set error in data model
    this.setErrorInDataModel(error);

    // Navigate to error state
    return this.tryNavigateToErrorState(error, error.type);
  }

  /**
   * Navigate to error state using errorTransitions.
   * Uses errorTransition() which handles node-level and flow-level fallback internally.
   */
  private tryNavigateToErrorState(error: Error, transition: string): boolean {
    const flowInstance = this.options.flow.current;

    if (!flowInstance) {
      this.options.logger.warn(
        "[ErrorController] No active flow instance for error navigation",
      );
      return false;
    }

    if (flowInstance.getErrorTransitionState(transition) === undefined) {
      this.options.fail(error);
      return false;
    }

    try {
      flowInstance.errorTransition(transition);
      return true;
    } catch (e) {
      this.options.logger.error(
        `[ErrorController] Error transition failed with unexpected error: ${e}`,
      );

      // Fallback: Reject flow
      this.options.logger.debug("[ErrorController] Rejecting flow with error");
      this.options.fail(error);
      return false;
    }
  }

  /**
   * Get most recent error
   */
  public getCurrentError(): PlayerError | undefined {
    return this.currentError;
  }

  /**
   * Get error history (read-only)
   */
  public getErrors(): ReadonlyArray<PlayerError> {
    return this.errorHistory;
  }

  /**
   * Clear all errors (history + current + data model)
   */
  public clearErrors(): void {
    this.errorHistory = [];
    this.currentError = undefined;
    this.deleteErrorFromDataModel();
    this.options.logger.debug("[ErrorController] All errors cleared");
  }

  /**
   * Clear only current error and remove from data model, preserve history
   */
  public clearCurrentError(): void {
    this.currentError = undefined;
    this.deleteErrorFromDataModel();
    this.options.logger.debug("[ErrorController] Current error cleared");
  }

  /**
   * Write error to data model errorState
   */
  private setErrorInDataModel(playerError: PlayerError): void {
    if (!this.options.model) {
      this.options.logger.warn("[ErrorController] No DataController available");
      return;
    }

    try {
      const { type, severity, metadata, name, message } = playerError;

      // Pass write symbol to authorize write through middleware
      this.options.model.set(
        [
          [
            "errorState",
            {
              message,
              name,
              errorType: type,
              severity,
              ...metadata,
            },
          ],
        ],
        { writeSymbol: errorControllerWriteSymbol },
      );

      this.options.logger.debug(
        "[ErrorController] Error set in data model at 'data.errorState'",
      );
    } catch (e) {
      this.options.logger.error(
        "[ErrorController] Failed to set error in data model",
        e,
      );
    }
  }

  /**
   * Remove errorState from data model
   */
  private deleteErrorFromDataModel(): void {
    if (!this.options.model) {
      return;
    }

    try {
      // Pass write symbol to authorize delete through middleware
      this.options.model.delete("errorState", {
        writeSymbol: errorControllerWriteSymbol,
      });

      this.options.logger.debug(
        "[ErrorController] errorState deleted from data model",
      );
    } catch (e) {
      this.options.logger.error(
        "[ErrorController] Failed to delete errorState from data model",
        e,
      );
    }
  }
}

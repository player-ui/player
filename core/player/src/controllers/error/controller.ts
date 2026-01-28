import { SyncBailHook } from "tapable-ts";
import type { Logger } from "../../logger";
import type { DataController } from "../data/controller";
import type { FlowController } from "../flow/controller";
import type { PlayerError, ErrorMetadata, ErrorSeverity } from "./types";
import { ErrorStateMiddleware } from "./middleware";
import { resolveErrorState } from "./utils";

/**
 * Private symbol used to authorize ErrorController's writes to errorState
 * Only ErrorController has access to this symbol
 */
const ERROR_CONTROLLER_AUTH_SYMBOL: unique symbol = Symbol(
  "ERROR_CONTROLLER_AUTH",
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
    onError: new SyncBailHook<[PlayerError], boolean | undefined>(),
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
      authSymbol: ERROR_CONTROLLER_AUTH_SYMBOL,
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
   * Capture error with metadata, add to history, fire hooks, update data model, and navigate
   */
  public captureError(
    error: Error,
    errorType: string,
    severity?: ErrorSeverity,
    metadata?: ErrorMetadata,
  ): PlayerError {
    const playerError: PlayerError = {
      error,
      errorType,
      severity,
      metadata,
    };

    // Add to history
    this.errorHistory.push(playerError);

    // Set as current error
    this.currentError = playerError;

    this.options.logger.debug(
      `[ErrorController] Captured error: ${error.message}`,
      { errorType, severity, metadata },
    );

    // Notify listeners and check if navigation should be skipped
    // Plugins can observe the error and optionally return true to bail
    const shouldSkip = this.hooks.onError.call(playerError) ?? false;

    if (shouldSkip) {
      this.options.logger.debug(
        "[ErrorController] Error state navigation skipped by plugin",
      );
      return playerError;
    }

    // Set error in data model
    this.setErrorInDataModel(playerError);

    // Navigate to error state
    this.navigateToErrorState(playerError);

    return playerError;
  }

  /**
   * Navigate to error state
   * Node-level errorState
   * Flow-level errorState
   * Reject flow (fallback)
   */
  private navigateToErrorState(playerError: PlayerError): void {
    const flowInstance = this.options.flow.current;

    if (!flowInstance) {
      this.options.logger.warn(
        "[ErrorController] No active flow instance for error navigation",
      );
      return;
    }

    // Node-level errorState
    const currentState = flowInstance.currentState;
    const rawErrorState =
      currentState !== undefined && currentState.value.state_type !== "END"
        ? currentState.value.errorState
        : undefined;
    const nodeErrorState = resolveErrorState(
      rawErrorState,
      playerError.errorType,
    );

    if (nodeErrorState) {
      this.options.logger.debug(
        `[ErrorController] Node-level: Navigating to errorState "${nodeErrorState}" (errorType: ${playerError.errorType || "none"})`,
      );

      try {
        flowInstance.transition(nodeErrorState);
        return;
      } catch (e) {
        this.options.logger.debug(
          `[ErrorController] Node-level transition "${nodeErrorState}" failed: ${e}`,
        );
      }
    }

    // Flow-level errorState
    const flowErrorTransition = resolveErrorState(
      flowInstance.getFlowErrorState(),
      playerError.errorType,
    );

    if (flowErrorTransition) {
      this.options.logger.debug(
        `[ErrorController] Flow-level: Navigating to errorState via "${flowErrorTransition}" (errorType: ${playerError.errorType || "none"})`,
      );

      try {
        flowInstance.flowTransition(flowErrorTransition);
        return;
      } catch (e) {
        this.options.logger.debug(
          `[ErrorController] Flow-level transition "${flowErrorTransition}" failed: ${e}`,
        );
      }
    }

    this.options.logger.debug(
      "[ErrorController] No flow-level errorState defined or no match found",
    );

    // Reject flow (fallback)
    this.options.logger.debug("[ErrorController] Rejecting flow with error");

    this.options.fail(playerError.error);
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
      const { error, errorType, severity, metadata } = playerError;

      // Pass auth token to authorize write through middleware
      this.options.model.set(
        [
          [
            "errorState",
            {
              message: error.message,
              name: error.name,
              errorType,
              severity,
              ...metadata,
            },
          ],
        ],
        { authToken: ERROR_CONTROLLER_AUTH_SYMBOL },
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
      // Pass auth token to authorize delete through middleware
      this.options.model.delete("errorState", {
        authToken: ERROR_CONTROLLER_AUTH_SYMBOL,
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

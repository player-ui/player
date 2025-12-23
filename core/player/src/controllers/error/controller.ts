import { SyncBailHook } from "tapable-ts";
import type { Logger } from "../../logger";
import type { DataController } from "../data/controller";
import type { PlayerError, ErrorMetadata, ErrorSeverity } from "./types";
import { ErrorStateMiddleware } from "./middleware";

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
  /** Optional logger for error operations */
  logger?: Logger;
  /** Data model for setting errorState */
  model?: DataController;
}

/**
 * Get the middleware for protecting errorState from external writes
 * Should be added to DataController's middleware array
 */
export function getErrorStateMiddleware(options?: {
  logger?: Logger;
}): ErrorStateMiddleware {
  return new ErrorStateMiddleware(options);
}

/** The orchestrator for player error handling */
export class ErrorController {
  public hooks: ErrorControllerHooks = {
    onError: new SyncBailHook<[PlayerError], boolean | undefined>(),
  };

  private options?: ErrorControllerOptions;
  private readonly middleware: ErrorStateMiddleware;
  /**
   * Complete history of all captured errors in chronological order
   * Newest errors are APPENDED to the end of the array
   */
  private errorHistory: PlayerError[] = [];
  private currentError?: PlayerError;

  constructor(options: ErrorControllerOptions = {}) {
    this.options = options;

    this.middleware = getErrorStateMiddleware({ logger: options.logger });
  }

  /**
   * Get the middleware for protecting errorState
   * This should be added to DataController's middleware array
   */
  public getDataMiddleware(): ErrorStateMiddleware {
    return this.middleware;
  }

  /**
   * Set options after initialization (e.g., to inject DataController and logger)
   */
  public setOptions(options: ErrorControllerOptions): void {
    this.options = options;
  }

  /**
   * Capture error with metadata, add to history, fire hooks, update data model
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

    this.options?.logger?.debug(
      `[ErrorController] Captured error: ${error.message}`,
      { errorType, severity, metadata },
    );

    // Notify listeners and check if navigation should be skipped
    // Plugins can observe the error and optionally return true to bail
    const shouldSkip = this.hooks.onError.call(playerError) ?? false;

    if (shouldSkip) {
      this.options?.logger?.debug(
        "[ErrorController] Error state navigation skipped by plugin",
      );
      return playerError;
    }

    this.setErrorInDataModel(playerError);

    return playerError;
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
    this.options?.logger?.debug("[ErrorController] All errors cleared");
  }

  /**
   * Clear only current error and remove from data model, preserve history
   */
  public clearCurrentError(): void {
    this.currentError = undefined;
    this.deleteErrorFromDataModel();
    this.options?.logger?.debug("[ErrorController] Current error cleared");
  }

  /**
   * Write error to data model errorState
   */
  private setErrorInDataModel(playerError: PlayerError): void {
    if (!this.options?.model) {
      this.options?.logger?.warn(
        "[ErrorController] No DataController available",
      );
      return;
    }

    try {
      const { error, errorType, severity, metadata } = playerError;

      // Temporarily allow writes to errorState
      this.middleware?.enableWrites();
      this.options.model.set([
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
      ]);
      this.middleware?.disableWrites();

      this.options?.logger?.debug(
        "[ErrorController] Error set in data model at 'data.errorState'",
      );
    } catch (e) {
      this.middleware?.disableWrites();
      this.options?.logger?.error(
        "[ErrorController] Failed to set error in data model",
        e,
      );
    }
  }

  /**
   * Remove errorState from data model
   */
  private deleteErrorFromDataModel(): void {
    if (!this.options?.model) {
      return;
    }

    try {
      // Temporarily allow deletes to errorState
      this.middleware?.enableWrites();
      this.options.model.delete("errorState");
      this.middleware?.disableWrites();

      this.options?.logger?.debug(
        "[ErrorController] errorState deleted from data model",
      );
    } catch (e) {
      this.middleware?.disableWrites();
      this.options?.logger?.error(
        "[ErrorController] Failed to delete errorState from data model",
        e,
      );
    }
  }
}

import { SyncBailHook } from "tapable-ts";
import type { Logger } from "../../logger";
import type { DataController } from "../data/controller";
import type { PlayerError, ErrorMetadata, ErrorSeverity } from "./types";

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
  /** Required for setting data.errorState */
  dataController?: DataController;
}

/** Default error format for data.errorState  */
interface FormattedError {
  message: string;
  name: string;
  state?: string;
  timestamp?: number;
  errorType?: string;
  severity?: ErrorSeverity;
  assetId?: string;
  assetType?: string;
  bindingPath?: string;
  context?: Record<string, unknown>;
}

/** The orchestrator for player error handling */
export class ErrorController {
  public hooks: ErrorControllerHooks = {
    onError: new SyncBailHook<[PlayerError], boolean | undefined>(),
  };

  private readonly log?: Logger;
  private readonly dataController?: DataController;
  private errorHistory: PlayerError[] = [];
  private currentError?: PlayerError;

  constructor(options: ErrorControllerOptions = {}) {
    this.log = options.logger;
    this.dataController = options.dataController;
  }

  /**
   * Capture error with metadata, add to history, fire hooks, update data model
   */
  public captureError(error: Error, metadata: ErrorMetadata = {}): PlayerError {
    const playerError: PlayerError = {
      error,
      metadata: {
        ...metadata,
        timestamp: metadata.timestamp ?? Date.now(),
      },
    };

    // Add to history
    this.errorHistory.push(playerError);

    // Set as current error
    this.currentError = playerError;

    this.log?.debug(
      `[ErrorController] Captured error: ${error.message}`,
      playerError.metadata,
    );

    // Notify listeners and check if navigation should be skipped
    // Plugins can observe the error and optionally return true to bail
    const shouldSkip = this.hooks.onError.call(playerError);

    if (shouldSkip) {
      this.log?.debug(
        "[ErrorController] Error state navigation skipped by plugin",
      );
      return playerError;
    }

    this.setErrorInDataModel(playerError);

    return playerError;
  }

  /**
   * Format error for content binding
   */
  public formatErrorForData(playerError: PlayerError): FormattedError {
    const { error, metadata } = playerError;

    return {
      message: error.message,
      name: error.name,
      state: metadata.state,
      timestamp: metadata.timestamp,
      errorType: metadata.errorType,
      severity: metadata.severity,
      assetId: metadata.assetContext?.asset?.id,
      assetType: metadata.assetContext?.asset?.type,
      bindingPath: metadata.assetContext?.bindingPath,
      context: metadata.context,
    };
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
   * Clear all errors (history + current)
   */
  public clearErrors(): void {
    this.errorHistory = [];
    this.currentError = undefined;
    this.log?.debug("[ErrorController] All errors cleared");
  }

  /**
   * Clear only current error, preserve history
   */
  public clearCurrentError(): void {
    this.currentError = undefined;
    this.log?.debug("[ErrorController] Current error cleared");
  }

  /**
   * Write error to data model errorState
   */
  private setErrorInDataModel(playerError: PlayerError): void {
    if (!this.dataController) {
      this.log?.warn("[ErrorController] No DataController available");
      return;
    }

    try {
      const formattedError = this.formatErrorForData(playerError);
      this.dataController.set([["errorState", formattedError]]);
      this.log?.debug(
        "[ErrorController] Error set in data model at 'data.errorState'",
      );
    } catch (e) {
      this.log?.error("[ErrorController] Failed to set error in data model", e);
    }
  }
}

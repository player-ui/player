import type React from "react";
import type { CompletedState, Flow, FlowResult } from "@player-ui/player";
import type { ReactPlayer, ReactPlayerOptions } from "../player";

export interface FinalState {
  /** Mark the iteration as complete */
  done: true;
}

export interface NextState<T> {
  /** Optional mark the iteration as _not_ completed */
  done?: false;

  /** The next value in the iteration */
  value: T;
}

export interface FlowManager {
  /**
   * An iterator implementation that takes the result of the previous flow and returns a new one or completion marker.
   *
   * If `done: true` is passed, the multi-flow experience is completed.
   *
   * @param previousValue - The result of the previous flow.
   */
  next: (
    previousValue?: CompletedState,
  ) => Promise<FinalState | NextState<Flow>>;

  /**
   * Called when the flow is ended early (the react tree is torn down)
   * Allows clients the opportunity to save-data before destroying the tree
   */
  terminate?: (data?: FlowResult["data"]) => void;
}

export interface FallbackProps {
  /** A callback to reset the flow iteration from the start */
  reset?: () => void;

  /** A callback to retry the last failed segment of the iteration */
  retry?: () => void;

  /** The error that caused the failure */
  error?: Error;
}

export interface ManagedPlayerProps extends ReactPlayerOptions {
  /** The manager for populating the next flows */
  manager: FlowManager;

  /** A callback when a flow is started */
  onStartedFlow?: () => void;

  /** A callback when the entire async iteration is completed */
  onComplete?: (finalState?: CompletedState) => void;

  /** A callback for any errors */
  onError?: (e: Error) => void;

  /** middleware to use in the managed player */
  middleware?: MiddlewareMethod<unknown>[];

  /** A component to render when there are errors */
  fallbackComponent?: React.ComponentType<FallbackProps>;
}

export type ManagedPlayerContext = {
  /** The flow manager */
  manager: FlowManager;

  /** The web-player */
  reactPlayer: ReactPlayer;

  /** The config for Player */
  playerConfig: ReactPlayerOptions;
};

export type ManagedPlayerState =
  | {
      /** The managed player hasn't started yet */
      value: "not_started";

      /** The context for the managed state */
      context: ManagedPlayerContext;
    }
  | {
      /** The managed-player is awaiting a response from the flow manager */
      value: "pending";

      /** The context for the managed state */
      context: ManagedPlayerContext & {
        /** The previous completed state */
        prevResult?: CompletedState;

        /** A promise from the flow manager for the next state */
        next: Promise<FinalState | NextState<Flow>>;
      };
    }
  | {
      /** A flow was retrieved from the flow manager, but hasn't been processed yet */
      value: "loaded";

      /** The context for the managed state */
      context: ManagedPlayerContext & {
        /** The next flow to load */
        flow: Flow;

        /** The previous completed state */
        prevResult?: CompletedState;
      };
    }
  | {
      /** Player is currently executing a flow */
      value: "running";
      /** The context for the managed state */
      context: ManagedPlayerContext & {
        /** The currently running flow */
        flow: Flow;

        /** A promise for the completed result */
        result: Promise<CompletedState>;

        /** The previous completed result */
        prevResult?: CompletedState;
      };
    }
  | {
      /** Player has completed a flow */
      value: "completed";

      /** The context for the managed state */
      context: ManagedPlayerContext & {
        /** The result of the completed flow */
        result?: CompletedState;
      };
    }
  | {
      /** The entire flow iteration has completed */
      value: "ended";

      /** The context for the managed state */
      context: ManagedPlayerContext & {
        /** The result of the last completed flow */
        result?: CompletedState;
      };
    }
  | {
      /** One of the steps in the flow has resulted in an error */
      value: "error";

      /** The context for the managed state */
      context: ManagedPlayerContext & {
        /** The error that caused the flow to halt */
        error: Error;

        /** the result of the last completed flow */
        prevResult?: CompletedState;
      };
    };

export interface ManagerMiddleware {
  /** Middleware for a response from the managed-player */
  next?: <Type>(nextPromise: Promise<Type>) => Promise<Type>;
}

export type MiddlewareMethod<T> = (value: Promise<T>) => Promise<T>;

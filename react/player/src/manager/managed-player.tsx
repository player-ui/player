import React from "react";
import { useSyncExternalStore } from "use-sync-external-store/shim";
import type {
  FlowManager,
  ManagedPlayerProps,
  ManagedPlayerState,
  ManagerMiddleware,
  ManagedPlayerContext,
} from "./types";
import { useRequestTime } from "./request-time";
import type { ReactPlayerOptions } from "../player";
import { ReactPlayer } from "../player";

/** noop middleware */
function identityMiddleware<T>(next: Promise<T>) {
  return next;
}

interface ManagedPlayerStateKey {
  /** the storage key for the state (outside of the react tree) */
  _key: symbol;
}

export type StateChangeCallback = (state?: ManagedPlayerState) => void;

/**
 * An object to store the state of the managed player
 */
class ManagedState {
  public state?: ManagedPlayerState;
  private callbacks: Array<StateChangeCallback>;
  private middleware?: ManagerMiddleware;

  constructor({
    middleware,
  }: {
    /** middleware to use in the managed player */
    middleware?: ManagerMiddleware;
  }) {
    this.middleware = middleware;
    this.callbacks = [];
  }

  /** Add a listener to state changes */
  public addListener(callback: StateChangeCallback): () => void {
    this.callbacks.push(callback);

    return () => {
      this.callbacks = this.callbacks.filter((s) => s !== callback);
    };
  }

  /** start the managed flow */
  public start(options: {
    /** the flow manager to use */
    manager: FlowManager;

    /** the config to use when creating a player */
    playerConfig: ReactPlayerOptions;
  }): this {
    const initialState: ManagedPlayerState = {
      value: "not_started",
      context: {
        playerConfig: options.playerConfig,
        reactPlayer: new ReactPlayer(options.playerConfig),
        manager: options.manager,
      },
    };

    this.setState(initialState);

    return this;
  }

  /** reset starts from nothing */
  public reset(): void {
    if (this.state?.value === "error") {
      const { playerConfig, manager } = this.state.context;
      this.start({ playerConfig, manager });
    } else {
      throw new Error("Flow must be in error state to reset");
    }
  }

  /** restart starts from the last result */
  public restart(): void {
    if (this.state?.value === "error") {
      const { playerConfig, manager, prevResult, reactPlayer } =
        this.state.context;
      this.setState({
        value: "completed",
        context: {
          playerConfig,
          manager,
          result: prevResult,
          reactPlayer,
        },
      });
    } else {
      throw new Error("Flow must be in error state to restart");
    }
  }

  private async setState(state: ManagedPlayerState) {
    this.state = state;
    this.callbacks.forEach((c) => {
      if (c && typeof c === "function") {
        c(this.state);
      }
    });

    const { manager, reactPlayer, playerConfig } = state.context;

    try {
      const nextState = await this.processState(state, {
        manager,
        reactPlayer,
        playerConfig,
      });

      if (nextState) {
        this.setState(nextState);
      }
    } catch (e) {
      this.setState({
        value: "error",
        context: {
          manager,
          reactPlayer,
          playerConfig,
          error: e as Error,
        },
      });
    }
  }

  private async processState(
    state: ManagedPlayerState,
    context: ManagedPlayerContext,
  ): Promise<ManagedPlayerState | undefined> {
    if (state.value === "not_started" || state.value === "completed") {
      const prevResult =
        state.value === "completed" ? state.context.result : undefined;

      const middleware = this.middleware?.next ?? identityMiddleware;

      return {
        value: "pending",
        context: {
          ...context,
          prevResult,
          next: middleware(state.context.manager.next(prevResult)),
        },
      };
    }

    if (state.value === "pending") {
      const nextResult = await state.context.next;

      if (nextResult.done) {
        return {
          value: "ended",
          context: {
            ...context,
            result: state.context.prevResult,
          },
        };
      }

      return {
        value: "loaded",
        context: {
          ...context,
          prevResult: state.context.prevResult,
          flow: nextResult.value,
        },
      };
    }

    if (state.value === "loaded") {
      return {
        value: "running",
        context: {
          ...context,
          flow: state.context.flow,
          prevResult: state.context.prevResult,
          result: state.context.reactPlayer.start(state.context.flow),
        },
      };
    }

    if (state.value === "running") {
      const result = await state.context.result;

      return {
        value: "completed",
        context: {
          ...context,
          result,
        },
      };
    }
  }
}

const managedPlayerStateMachines = new WeakMap<
  ManagedPlayerStateKey,
  ManagedState
>();

function createKey(): ManagedPlayerStateKey {
  return {
    _key: Symbol("managed-player"),
  };
}

/** Creates an x-state state machine that persists when this component is no longer renders (due to Suspense) */
export const usePersistentStateMachine = (options: {
  /** the flow manager to use */
  manager: FlowManager;

  /** Player config  */
  playerConfig: ReactPlayerOptions;

  /** Any middleware for the manager */
  middleware?: ManagerMiddleware;
}): { managedState: ManagedState; state?: ManagedPlayerState } => {
  const mounted = React.useRef(false);
  const previousManager = React.useRef(options.manager);
  const keyRef = React.useRef<ManagedPlayerStateKey>(createKey());
  const managedStateRef = React.useRef(
    new ManagedState({ middleware: options.middleware }),
  );

  if (!mounted.current) {
    managedPlayerStateMachines.set(keyRef.current, managedStateRef.current);
    mounted.current = true;
  }

  if (previousManager.current !== options.manager) {
    const oldManagedState = managedPlayerStateMachines.get(keyRef.current);

    if (oldManagedState) {
      const playerState =
        oldManagedState.state?.context.reactPlayer.player.getState();

      if (
        oldManagedState.state?.value === "running" &&
        playerState?.status === "in-progress"
      ) {
        previousManager.current.terminate?.(
          playerState.controllers.data.serialize(),
        );
      }
    }

    const newKey = createKey();
    const newManagedState = new ManagedState({
      middleware: options.middleware,
    });

    managedPlayerStateMachines.set(newKey, newManagedState);
    keyRef.current = newKey;
    managedStateRef.current = newManagedState;
    previousManager.current = options.manager;
  }

  const managedState =
    managedPlayerStateMachines.get(keyRef.current) ?? managedStateRef.current;

  if (managedState.state === undefined) {
    managedState.start(options);
  }

  function subscription(callback: (val?: ManagedPlayerState) => void) {
    try {
      const unsub = managedState.addListener((s) => {
        callback(s);
      });

      return () => {
        if (managedState) {
          unsub();
        }
      };
    } catch (error) {
      return () => {};
    }
  }

  function getSnapshot() {
    return managedState.state;
  }

  const newState = useSyncExternalStore(
    subscription,
    getSnapshot,
    () => undefined,
  );

  return { managedState, state: newState };
};

/**
 * A ManagedPlayer is a component responsible for orchestrating multi-flow experiences using Player.
 * Provide a valid `FlowManager` to handle fetching the next flow.
 *
 * `suspense` must be enabled to wait for results in flight.
 */
export const ManagedPlayer = (
  props: ManagedPlayerProps,
): React.JSX.Element | null => {
  const { withRequestTime, RequestTimeMetricsPlugin } = useRequestTime();

  const { state, managedState } = usePersistentStateMachine({
    manager: props.manager,
    middleware: { next: withRequestTime },
    playerConfig: {
      plugins: [...(props?.plugins ?? []), RequestTimeMetricsPlugin],
      player: props.player,
    },
  });

  const previousState = React.useRef<ManagedPlayerState | undefined>();

  if (state?.value !== previousState.current?.value) {
    if (state?.value === "ended") {
      props.onComplete?.(state?.context.result);
    } else if (state?.value === "error") {
      props.onError?.(state?.context.error);
    } else if (state?.value === "running") {
      props.onStartedFlow?.();
    }
  }

  previousState.current = state;

  React.useEffect(() => {
    return () => {
      const playerState = state?.context.reactPlayer.player.getState();

      if (state?.value === "running" && playerState?.status === "in-progress") {
        props.manager.terminate?.(playerState.controllers.data.serialize());
      }
    };
  }, [props.manager, state?.context.reactPlayer.player, state?.value]);

  if (state?.value === "error") {
    if (props.fallbackComponent) {
      return (
        <props.fallbackComponent
          reset={() => {
            managedState.reset();
          }}
          retry={() => {
            managedState.restart();
          }}
          error={state.context.error}
        />
      );
    }

    if (!props.onError) {
      throw state.context.error;
    }
  }

  if (state?.context.reactPlayer) {
    const { Component } = state.context.reactPlayer;

    return <Component />;
  }

  return null;
};

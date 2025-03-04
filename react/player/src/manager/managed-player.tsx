import React from "react";
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

export interface StateChangeCallback {
  /** Trigger for state changes */
  onState: (s: ManagedPlayerState) => void;
}

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
      c.onState(state);
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

/** Creates an x-state state machine that persists when this component is no longer rendered (due to Suspense) */
export const createPersistentStateMachine = (
  keyRef: React.MutableRefObject<ManagedPlayerStateKey>,
  middleware?: ManagerMiddleware,
): ManagedState => {
  const managedState =
    managedPlayerStateMachines.get(keyRef.current) ??
    new ManagedState({ middleware: middleware });
  managedPlayerStateMachines.set(keyRef.current, managedState);

  return managedState;
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
  const keyRef = React.useRef<ManagedPlayerStateKey>({
    _key: Symbol("managed-player"),
  });

  const { withRequestTime, RequestTimeMetricsPlugin } = useRequestTime();

  const initialState = createPersistentStateMachine(keyRef, {
    next: withRequestTime,
  });

  const [managedState, setManagedState] = React.useState(initialState);
  const [state, setState] = React.useState(managedState.state);

  React.useEffect(() => {
    const unsub = managedState.addListener({
      onState: (s) => {
        setState(s);
      },
    });
    return unsub;
  }, []);

  React.useEffect(() => {
    if (state?.value === "ended") {
      if (props.manager !== state.context.manager) {
        const newManagedState = createPersistentStateMachine(keyRef, {
          next: withRequestTime,
        });
        setManagedState(newManagedState);
        setState(newManagedState.state);
      } else {
        props.onComplete?.(state?.context.result);
      }
    } else if (state?.value === "error") {
      props.onError?.(state?.context.error);
    } else if (state?.value === "running") {
      props.onStartedFlow?.();
    } else if (state === undefined) {
      managedState.start({
        manager: props.manager,
        playerConfig: {
          plugins: [...(props?.plugins ?? []), RequestTimeMetricsPlugin],
          player: props.player,
        },
      });
    }
  }, [state]);

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

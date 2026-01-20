import { SyncBailHook, SyncHook, SyncWaterfallHook } from "tapable-ts";
import type { DeferredPromise } from "p-defer";
import defer from "p-defer";
import type {
  NavigationFlow,
  NavigationFlowState,
  NavigationFlowEndState,
  NavigationFlowActionState,
  NavigationFlowAsyncActionState,
  NavigationFlowExternalState,
  NavigationFlowFlowState,
  NavigationFlowViewState,
  ErrorStateTransition,
} from "@player-ui/types";
import type { Logger } from "../../logger";
import { resolveErrorState } from "../error/utils";

export interface NamedState {
  /** The name of the navigation node */
  name: string;

  /** The nav node */
  value: NavigationFlowState;
}

export interface TransitionOptions {
  /** Ignore any validations or other signals preventing the transition from taking place  */
  force?: boolean;
}
export type TransitionFunction = (
  name: string,
  options?: TransitionOptions,
) => void;

export interface FlowInstanceHooks {
  beforeStart: SyncBailHook<
    [NavigationFlow],
    NavigationFlow,
    Record<string, any>
  >;
  /** A callback when the onStart node was present */
  onStart: SyncHook<[any], Record<string, any>>;
  /** A callback when the onEnd node was present */
  onEnd: SyncHook<[any], Record<string, any>>;
  /** A hook to intercept and block a transition */
  skipTransition: SyncBailHook<
    [NamedState | undefined],
    boolean | undefined,
    Record<string, any>
  >;
  /** A chance to manipulate the flow-node used to calculate the given transition used  */
  beforeTransition: SyncWaterfallHook<
    [
      (
        | NavigationFlowViewState
        | NavigationFlowFlowState
        | NavigationFlowActionState
        | NavigationFlowAsyncActionState
        | NavigationFlowExternalState
      ),
      string,
    ],
    Record<string, any>
  >;
  /** A chance to manipulate the flow-node calculated after a transition */
  resolveTransitionNode: SyncWaterfallHook<
    [NavigationFlowState],
    Record<string, any>
  >;
  /** A callback when a transition from 1 state to another was made */
  transition: SyncHook<
    [NamedState | undefined, NamedState],
    Record<string, any>
  >;
  /** A callback to run actions after a transition occurs */
  afterTransition: SyncHook<[FlowInstance], Record<string, any>>;
}

/** The Content navigation state machine */
export class FlowInstance {
  private flow: NavigationFlow;
  private log?: Logger;
  private history: string[];
  private isTransitioning = false;
  private flowPromise?: DeferredPromise<NavigationFlowEndState>;
  public readonly id: string;
  public currentState?: NamedState;
  public readonly hooks: FlowInstanceHooks = {
    beforeStart: new SyncBailHook<[NavigationFlow], NavigationFlow>(),
    onStart: new SyncHook<[any]>(),
    onEnd: new SyncHook<[any]>(),
    skipTransition: new SyncBailHook<
      [NamedState | undefined],
      boolean | undefined
    >(),
    beforeTransition: new SyncWaterfallHook<
      [Exclude<NavigationFlowState, NavigationFlowEndState>, string]
    >(),
    resolveTransitionNode: new SyncWaterfallHook<[NavigationFlowState]>(),
    transition: new SyncHook<[NamedState | undefined, NamedState]>(),
    afterTransition: new SyncHook<[FlowInstance]>(),
  };

  constructor(
    id: string,
    flow: NavigationFlow,
    options?: {
      /** Logger instance to use */
      logger?: Logger;
    },
  ) {
    this.id = id;
    this.flow = flow;
    this.log = options?.logger;
    this.history = [];

    this.hooks.transition.tap(
      "startPromise",
      async (_oldState, nextState: NamedState) => {
        const newState = nextState.value;

        if (this.flowPromise && newState.state_type === "END") {
          this.flowPromise.resolve(newState);
        }
      },
    );
  }

  /** Start the state machine */
  public async start(): Promise<NavigationFlowEndState> {
    if (this.flowPromise) {
      this.log?.warn("Already called start for flow");

      return this.flowPromise.promise;
    }

    this.flow = this.hooks.beforeStart.call(this.flow) || this.flow;

    if (this.flow.onStart) {
      this.hooks.onStart.call(this.flow.onStart);
    }

    const initialState = this.flow.startState;

    if (!initialState) {
      return Promise.reject(new Error("No 'startState' defined for flow"));
    }

    this.flowPromise = defer();
    this.pushHistory(initialState);

    return this.flowPromise.promise;
  }

  /**
   * Navigate to flow-level errorState (fallback when node-level fails)
   * Uses direct navigation, bypassing transition map lookup
   * @param errorType Optional error type for dictionary-based error transition
   * @returns true if navigation succeeded, false if errorState not defined or navigation failed
   */
  public transitionToErrorState(errorType?: string): boolean {
    const errorStateConfig: ErrorStateTransition | undefined =
      this.flow.errorState;

    if (!errorStateConfig) {
      return false;
    }

    // Resolve errorState (handle string or dictionary)
    const errorStateName = resolveErrorState(errorStateConfig, errorType);

    if (!errorStateName) {
      this.log?.debug(
        `[FlowInstance] No matching flow-level errorState found for errorType: ${errorType}`,
      );
      return false;
    }

    this.log?.debug(
      `[FlowInstance] Navigating to flow-level errorState: ${errorStateName}` +
        (errorType ? ` (errorType: ${errorType})` : ""),
    );

    this.pushHistory(errorStateName);
    return true;
  }

  public transition(
    transitionValue: string,
    options?: TransitionOptions,
  ): void {
    if (this.isTransitioning) {
      throw new Error(
        `Transitioning while ongoing transition from ${this.currentState?.name} is in progress is not supported`,
      );
    }

    if (this.currentState?.value.state_type === "END") {
      this.log?.warn(
        `Skipping transition using ${transitionValue}. Already at and END state`,
      );

      return;
    }

    if (this.currentState === undefined) {
      throw new Error("Cannot transition when there's no current state");
    }

    if (options?.force) {
      this.log?.debug(`Forced transition. Skipping validation checks`);
    } else {
      const skipTransition = this.hooks.skipTransition.call(this.currentState);

      if (skipTransition) {
        this.log?.debug(
          `Skipping transition from ${this.currentState.name} b/c hook told us to`,
        );
        return;
      }
    }

    const state = this.hooks.beforeTransition.call(
      this.currentState.value,
      transitionValue,
    );

    if (!("transitions" in state)) {
      throw new Error(`No transitions defined for ${this.currentState.value}`);
    }

    const { transitions } = state;
    const nextState = transitions[transitionValue] || transitions["*"];

    if (nextState === undefined) {
      this.log?.warn(
        `No transition from ${this.currentState.name} using ${transitionValue} or *`,
      );

      return;
    }

    this.log?.debug(
      `Transitioning from ${this.currentState.name} to ${nextState} using ${transitionValue} `,
    );

    return this.pushHistory(nextState, options);
  }

  private pushHistory(stateName: string, options?: TransitionOptions) {
    if (!Object.prototype.hasOwnProperty.call(this.flow, stateName)) {
      throw new Error(`No flow definition for: ${stateName} was found.`);
    }

    let nextState = this.flow[stateName];

    if (
      !this.flow[stateName] ||
      typeof nextState !== "object" ||
      !("state_type" in nextState)
    ) {
      this.log?.error(`Flow doesn't contain any states named: ${stateName}`);

      return;
    }

    const prevState = this.currentState;

    this.isTransitioning = true;
    nextState = this.hooks.resolveTransitionNode.call(nextState);

    const newCurrentState = {
      name: stateName,
      value: nextState,
    } as NamedState;
    this.currentState = newCurrentState;
    this.history.push(stateName);

    // If the new state is an END state call the `onEnd` if it exists

    if (newCurrentState.value.state_type === "END" && this.flow.onEnd) {
      this.hooks.onEnd.call(this.flow.onEnd);
    }

    this.hooks.transition.call(prevState, {
      ...newCurrentState,
    });

    this.isTransitioning = false;

    this.hooks.afterTransition.call(this);
  }
}

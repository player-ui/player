import type { Asset, Flow, FlowResult } from "@player-ui/types";
import type { BindingParser, BindingLike } from "./binding";
import type { SchemaController } from "./schema";
import type { ExpressionEvaluator } from "./expressions";
import type { Logger } from "./logger";
import type {
  ViewController,
  DataController,
  ValidationController,
  FlowController,
} from "./controllers";
import type { ReadOnlyDataController } from "./controllers/data/utils";
import { SyncHook, SyncWaterfallHook } from "tapable-ts";
import { ViewInstance } from "./view";

/**
 * Public Player Hooks
 */
export interface PlayerHooks {
  /** The hook that fires every time we create a new flowController (a new Content blob is passed in) */
  flowController: SyncHook<[FlowController], Record<string, any>>;
  /** The hook that updates/handles views */
  viewController: SyncHook<[ViewController], Record<string, any>>;
  /** A hook called every-time there's a new view. This is equivalent to the view hook on the view-controller */
  view: SyncHook<[ViewInstance], Record<string, any>>;
  /** Called when an expression evaluator was created */
  expressionEvaluator: SyncHook<[ExpressionEvaluator], Record<string, any>>;
  /** The hook that creates and manages data */
  dataController: SyncHook<[DataController], Record<string, any>>;
  /** Called after the schema is created for a flow */
  schema: SyncHook<[SchemaController], Record<string, any>>;
  /** Manages validations (schema and x-field ) */
  validationController: SyncHook<[ValidationController], Record<string, any>>;
  /** Manages parsing binding */
  bindingParser: SyncHook<[BindingParser], Record<string, any>>;
  /** A that's called for state changes in the flow execution */
  state: SyncHook<[PlayerFlowState], Record<string, any>>;
  /** A hook to access the current flow */
  onStart: SyncHook<[Flow<Asset<string>>], Record<string, any>>;
  /** A hook for when the flow ends either in success or failure */
  onEnd: SyncHook<[], Record<string, any>>;
  /** Mutate the Content flow before starting */
  resolveFlowContent: SyncWaterfallHook<
    [Flow<Asset<string>>],
    Record<string, any>
  >;
}

/** The status for a flow's execution state */
export type PlayerFlowStatus =
  | "not-started"
  | "in-progress"
  | "completed"
  | "error";

/** Common interface for the state of Player's flow execution */
export interface BaseFlowState<T extends PlayerFlowStatus> {
  /** A unique reference for the life-cycle of a flow */
  ref: symbol;

  /** The status of the given flow */
  status: T;
}

/** The beginning state of Player, before it's seen a flow  */
export type NotStartedState = BaseFlowState<"not-started">;

export const NOT_STARTED_STATE: NotStartedState = {
  ref: Symbol("not-started"),
  status: "not-started",
};

/** Shared properties for a flow in any state of execution (in-progress, completed successfully, or errored out) */
export interface PlayerFlowExecutionData {
  /** The currently executing flow */
  flow: Flow;
}

export interface ControllerState {
  /** The manager for data for a flow */
  data: DataController;

  /** The view manager for a flow */
  view: ViewController;

  /** The schema manager for a flow */
  schema: SchemaController;

  /** The validation manager for a flow */
  validation: ValidationController;

  /** The expression evaluator for a flow */
  expression: ExpressionEvaluator;

  /** The manager for parsing and resolving bindings */
  binding: BindingParser;

  /** the manager for the flow state machine */
  flow: FlowController;
}

/** A flow is currently executing */
export type InProgressState = BaseFlowState<"in-progress"> &
  PlayerFlowExecutionData & {
    /** A promise that resolves when the flow is completed */
    flowResult: Promise<FlowResult>;

    /** The underlying state controllers for the current flow */
    controllers: ControllerState;

    /** Allow other platforms to abort the current flow with an error  */
    fail: (error: Error) => void;

    /**
     * The Logger for the current player instance
     */
    logger: Logger;
  };

/** The flow completed properly */
export type CompletedState = BaseFlowState<"completed"> &
  PlayerFlowExecutionData &
  FlowResult & {
    /** Readonly Player controllers to provide Player functionality after the flow has ended */
    controllers: {
      /** A read only instance of the Data Controller */
      data: ReadOnlyDataController;
    };
  };

/** The flow finished but not successfully */
export type ErrorState = BaseFlowState<"error"> & {
  /** The currently executing flow */
  flow: Flow;

  /** The error associated with the failed flow */
  error: Error;
};

/** Any Player state  */
export type PlayerFlowState =
  | NotStartedState
  | InProgressState
  | CompletedState
  | ErrorState;

// Model

export type RawSetType = [BindingLike, any];
export type RawSetTransaction = Record<string, any> | RawSetType[];

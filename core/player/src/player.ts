import { SyncHook, SyncWaterfallHook } from 'tapable';
import type { FlowInstance } from '@player-ui/flow';
import { FlowController } from '@player-ui/flow';
import type { Logger } from '@player-ui/logger';
import { TapableLogger } from '@player-ui/logger';
import type { ExpressionHandler } from '@player-ui/expressions';
import { ExpressionEvaluator } from '@player-ui/expressions';
import { SchemaController } from '@player-ui/schema';
import { BindingParser } from '@player-ui/binding';
import type { ViewInstance } from '@player-ui/view';
import { setIn } from 'timm';
import deferred from 'p-defer';
import type { Flow as FlowType, FlowResult } from '@player-ui/types';
import { resolveDataRefs } from '@player-ui/string-resolver';
import { ConstantsController } from '@player-ui/constants';
import queueMicrotask from 'queue-microtask';
import { ViewController } from './view';
import { DataController } from './data';
import { ValidationController } from './validation';
import { FlowExpPlugin } from './plugins/flow-exp-plugin';
import type {
  PlayerFlowState,
  InProgressState,
  CompletedState,
  ErrorState,
} from './types';
import { NOT_STARTED_STATE } from './types';

// Variables injected at build time
const PLAYER_VERSION = '__VERSION__';
const COMMIT = '__GIT_COMMIT__';

export interface PlayerPlugin {
  /**
   * Unique identifier of the plugin.
   * Enables the plugin to be retrievable from Player.
   */
  symbol?: symbol;

  /** The name of the plugin */
  name: string;

  /**
   * Use this to tap into Player hooks
   */
  apply: (player: Player) => void;
}

export interface PlayerConfigOptions {
  /** A set of plugins to load  */
  plugins?: PlayerPlugin[];

  /** A logger to use */
  logger?: Logger;
}

export interface PlayerInfo {
  /** Version of the running player */
  version: string;

  /** Hash of the HEAD commit used to build the current version */
  commit: string;
}

/**
 * This is it.
 */
export class Player {
  public static readonly info: PlayerInfo = {
    version: PLAYER_VERSION,
    commit: COMMIT,
  };

  public readonly logger = new TapableLogger();
  public readonly constantsController = new ConstantsController();
  private config: PlayerConfigOptions;
  private state: PlayerFlowState = NOT_STARTED_STATE;

  public readonly hooks = {
    /** The hook that fires every time we create a new flowController (a new Content blob is passed in) */
    flowController: new SyncHook<FlowController>(['flowController']),

    /** The hook that updates/handles views */
    viewController: new SyncHook<ViewController>(['viewController']),

    /** A hook called every-time there's a new view. This is equivalent to the view hook on the view-controller */
    view: new SyncHook<ViewInstance>(['view']),

    /** Called when an expression evaluator was created */
    expressionEvaluator: new SyncHook<ExpressionEvaluator>([
      'expressionEvaluator',
    ]),

    /** The hook that creates and manages data */
    dataController: new SyncHook<DataController>(['dataController']),

    /** Called after the schema is created for a flow */
    schema: new SyncHook<SchemaController>(['schema']),

    /** Manages validations (schema and x-field ) */
    validationController: new SyncHook<ValidationController>([
      'validationController',
    ]),

    /** Manages parsing binding */
    bindingParser: new SyncHook<BindingParser>(['bindingParser']),

    /** A that's called for state changes in the flow execution */
    state: new SyncHook<PlayerFlowState>(['state']),

    /** A hook to access the current flow */
    onStart: new SyncHook<FlowType>(['flow']),

    /** A hook for when the flow ends either in success or failure */
    onEnd: new SyncHook(),
    /** Mutate the Content flow before starting */
    resolveFlowContent: new SyncWaterfallHook<FlowType>(['content']),
  };

  constructor(config?: PlayerConfigOptions) {
    const initialPlugins: PlayerPlugin[] = [];
    const flowExpPlugin = new FlowExpPlugin();

    initialPlugins.push(flowExpPlugin);

    if (config?.logger) {
      this.logger.addHandler(config.logger);
    }

    this.config = config || {};
    this.config.plugins = [...(this.config.plugins || []), ...initialPlugins];
    this.config.plugins?.forEach((plugin) => {
      plugin.apply(this);
    });
  }

  /** Find instance of [Plugin] that has been registered to Player */
  public findPlugin<Plugin extends PlayerPlugin>(
    symbol: symbol
  ): Plugin | undefined {
    return this.config.plugins?.find((el) => el.symbol === symbol) as Plugin;
  }

  /** Retrieve an instance of [Plugin] and conditionally invoke [apply] if it exists */
  public applyTo<Plugin extends PlayerPlugin>(
    symbol: symbol,
    apply: (plugin: Plugin) => void
  ): void {
    const plugin = this.findPlugin<Plugin>(symbol);

    if (plugin) {
      apply(plugin);
    }
  }

  /** Register and apply [Plugin] if one with the same symbol is not already registered. */
  public registerPlugin(plugin: PlayerPlugin) {
    plugin.apply(this);
    this.config.plugins?.push(plugin);
  }

  /** Returns the current version of the running player */
  public getVersion(): string {
    return Player.info.version;
  }

  /** Returns the git commit used to build Player version */
  public getCommit(): string {
    return Player.info.commit;
  }

  /**
   * Fetch the current state of Player.
   * It will return either `not-started`, `in-progress`, `completed`
   * with some extra data in each
   */
  public getState(): PlayerFlowState {
    return this.state;
  }

  /**
   * A private means of setting the state of Player
   * Calls the hooks for subscribers to listen for this event
   */
  private setState(state: PlayerFlowState) {
    this.state = state;
    this.hooks.state.call(state);
  }

  /** Start Player with the given flow */
  private setupFlow(userContent: FlowType): {
    /** a callback to _actually_ start the flow */
    start: () => void;

    /** the state object to kick if off */
    state: Omit<InProgressState, 'ref'>;
  } {
    const userFlow = this.hooks.resolveFlowContent.call(userContent);

    const flowController = new FlowController(userFlow.navigation, {
      logger: this.logger,
    });

    this.hooks.onStart.call(userFlow);

    this.hooks.flowController.call(flowController);

    // eslint-disable-next-line prefer-const
    let expressionEvaluator: ExpressionEvaluator;
    // eslint-disable-next-line prefer-const
    let dataController: DataController;

    const pathResolver = new BindingParser({
      get: (binding) => {
        return dataController.get(binding);
      },
      set: (transaction) => {
        return dataController.set(transaction);
      },
      evaluate: (expression) => {
        return expressionEvaluator.evaluate(expression);
      },
    });

    this.hooks.bindingParser.call(pathResolver);
    const parseBinding = pathResolver.parse;
    const flowResultDeferred = deferred<FlowResult>();

    const schema = new SchemaController(userFlow.schema);
    this.hooks.schema.call(schema);

    const validationController = new ValidationController(schema);

    this.hooks.validationController.call(validationController);

    dataController = new DataController(userFlow.data, {
      pathResolver,
      middleware: validationController.getDataMiddleware(),
      logger: this.logger,
    });

    dataController.hooks.format.tap('player', (value, binding) => {
      const formatter = schema.getFormatter(binding);

      return formatter ? formatter.format(value) : value;
    });

    dataController.hooks.deformat.tap('player', (value, binding) => {
      const formatter = schema.getFormatter(binding);

      return formatter ? formatter.deformat(value) : value;
    });

    dataController.hooks.resolveDefaultValue.tap(
      'player',
      (binding) => schema.getApparentType(binding)?.default
    );

    // eslint-disable-next-line prefer-const
    let viewController: ViewController;

    expressionEvaluator = new ExpressionEvaluator({
      model: dataController,
      logger: this.logger,
    });

    this.hooks.expressionEvaluator.call(expressionEvaluator);

    expressionEvaluator.hooks.onError.tap('player', (e) => {
      flowResultDeferred.reject(e);

      return true;
    });

    /** Resolve any data references in a string */
    function resolveStrings<T>(val: T) {
      return resolveDataRefs(val, {
        model: dataController,
        evaluate: expressionEvaluator.evaluate,
      });
    }

    flowController.hooks.flow.tap('player', (flow: FlowInstance) => {
      flow.hooks.beforeTransition.tap('player', (state, transitionVal) => {
        if (!('transitions' in state) || !state.transitions[transitionVal]) {
          return state;
        }

        return setIn(
          state,
          ['transitions', transitionVal],
          resolveStrings(state.transitions[transitionVal])
        ) as any;
      });

      flow.hooks.skipTransition.tap('validation', (currentState) => {
        if (currentState?.value.state_type === 'VIEW') {
          const { canTransition, validations } =
            validationController.validateView('navigation');

          if (!canTransition && validations) {
            const bindings = new Set(validations.keys());
            viewController?.currentView?.update(bindings);

            return true;
          }
        }

        return undefined;
      });

      flow.hooks.resolveTransitionNode.tap('player', (state) => {
        let newState = state;

        if ('ref' in state) {
          newState = setIn(state, ['ref'], resolveStrings(state.ref)) as any;
        }

        if ('param' in state) {
          newState = setIn(
            state,
            ['param'],
            resolveStrings(state.param)
          ) as any;
        }

        return newState;
      });

      flow.hooks.transition.tap('player', (_oldState, newState) => {
        if (newState.value.state_type === 'ACTION') {
          const { exp } = newState.value;

          // The nested transition call would trigger another round of the flow transition hooks to be called.
          // This created a weird timing where this nested transition would happen before the view had a chance to respond to the first one
          // Use a queueMicrotask to make sure the expression transition is outside the scope of the flow hook
          queueMicrotask(() => {
            flowController?.transition(
              String(expressionEvaluator?.evaluate(exp))
            );
          });
        }

        expressionEvaluator.reset();
      });
    });

    this.hooks.dataController.call(dataController);

    validationController.setOptions({
      parseBinding,
      model: dataController,
      logger: this.logger,
      evaluate: expressionEvaluator.evaluate,
      constants: this.constantsController,
    });

    viewController = new ViewController(userFlow.views || [], {
      evaluator: expressionEvaluator,
      parseBinding,
      transition: flowController.transition,
      model: dataController,
      logger: this.logger,
      flowController,
      schema,
      format: (binding, value) => {
        const formatter = schema.getFormatter(binding);

        return formatter?.format ? formatter.format(value) : value;
      },
      formatValue: (ref, value) => {
        const formatter = schema.getFormatterForType(ref);

        return formatter?.format ? formatter.format(value) : value;
      },
      validation: {
        ...validationController.forView(parseBinding),
        type: (b) => schema.getType(parseBinding(b)),
      },
    });
    viewController.hooks.view.tap('player', (view) => {
      validationController.onView(view);
      this.hooks.view.call(view);
    });
    this.hooks.viewController.call(viewController);

    /** Gets formatter for given formatName and formats value if found, returns value otherwise */
    const formatFunction: ExpressionHandler<[unknown, string], any> = (
      ctx,
      value,
      formatName
    ) => {
      return (
        schema.getFormatterForType({ type: formatName })?.format(value) ?? value
      );
    };

    expressionEvaluator.addExpressionFunction('format', formatFunction);

    return {
      start: () => {
        flowController
          .start()
          .then((endState) => {
            const flowResult: FlowResult = {
              endState: resolveStrings(endState),
              data: dataController.serialize(),
            };

            return flowResult;
          })
          .then(flowResultDeferred.resolve)
          .catch((e) => {
            this.logger.error(`Something went wrong: ${e.message}`);
            throw e;
          })
          .catch(flowResultDeferred.reject)
          .finally(() => this.hooks.onEnd.call());
      },
      state: {
        status: 'in-progress',
        flowResult: flowResultDeferred.promise,
        controllers: {
          data: dataController,
          view: viewController,
          flow: flowController,
          schema,
          expression: expressionEvaluator,
          binding: pathResolver,
          validation: validationController,
        },
        fail: flowResultDeferred.reject,
        flow: userFlow,
        logger: this.logger,
      },
    };
  }

  public async start(payload: FlowType): Promise<CompletedState> {
    const ref = Symbol(payload?.id ?? 'payload');

    /** A check to avoid updating the state for a flow that's not the current one */
    const maybeUpdateState = <T extends PlayerFlowState>(newState: T) => {
      if (this.state.ref !== ref) {
        this.logger.warn(
          `Received update for a flow that's not the current one`
        );

        return newState;
      }

      this.setState(newState);

      return newState;
    };

    this.setState({
      status: 'not-started',
      ref,
    });

    try {
      const { state, start } = this.setupFlow(payload);
      this.setState({
        ref,
        ...state,
      });

      start();

      // common data for the end state
      // make sure to use the same ref as the starting one
      const endProps = {
        ref,
        status: 'completed',
        flow: state.flow,
        dataModel: state.controllers.data.getModel(),
      } as const;

      return maybeUpdateState({
        ...(await state.flowResult),
        ...endProps,
      });
    } catch (error: any) {
      const errorState: ErrorState = {
        status: 'error',
        ref,
        flow: payload,
        error,
      };

      maybeUpdateState(errorState);

      throw error;
    }
  }
}

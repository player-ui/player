import {
  Player,
  PlayerPlugin,
  DataController,
  ValidationController,
  ViewInstance,
  BindingParser,
  SchemaController,
  ExpressionEvaluator,
} from '@player-ui/player';
import { View as ViewType } from '@player-ui/types';
import {
  Events,
  Methods,
} from '@player-tools/devtools-common';
import { ProfilerPlugin } from './ProfilerPlugin';

type DevtoolsEventPublisher = (event: Events.Event) => void

type DevtoolsMethodHandlers = {
  [type in Methods.Method["type"]]: (params: Methods.ByType<type>['params']) => Methods.ByType<type>['result']
}

/** Core [PlayerPlugin] responsible for building out the core [DevtoolsMethodHandlers] */
export class DevtoolsPlugin implements PlayerPlugin {
  name = 'devtools';

  private profilerPlugin: ProfilerPlugin = new ProfilerPlugin();

  private player?: WeakRef<Player>;
  private dataController?: WeakRef<DataController>;
  private validationController?: WeakRef<ValidationController>;
  private bindingParser?: WeakRef<BindingParser>;
  private schemaController?: WeakRef<SchemaController>;
  private view?: WeakRef<ViewInstance>;
  private expressionEvaluator?: WeakRef<ExpressionEvaluator>;

  private publisher: DevtoolsEventPublisher;
  public readonly playerID: string;

  public readonly callbacks: DevtoolsMethodHandlers = {
    'player-config-request': () => {
      const plugins = this.player
        ?.deref()
        ?.getPlugins()
        .map((p) => p.name);
      const schema: any[] = [];
      const expressions: any[] = [];

      this.schemaController?.deref()?.schema.forEach((val: any) => {
        schema.push(JSON.parse(JSON.stringify(val)));
      });

      this.expressionEvaluator
        ?.deref()
        ?.operators.expressions.forEach((_expressionHandler, name) => {
          expressions.push(name);
        });

      return {
        plugins,
        schema,
        expressions,
      };
    },
    'player-data-binding-details': (params: any) => {
      const binding = params?.binding ?? '';
      const parsedBinding = this.bindingParser?.deref()?.parse(binding);

      const result = {
        binding,
        value: {
          currentValue: this.dataController
            ?.deref()
            ?.get(binding, { includeInvalid: true }),
          formattedValue: this.dataController
            ?.deref()
            ?.get(binding, { includeInvalid: true, formatted: true }),
          modelValue: this.dataController
            ?.deref()
            ?.get(binding, { includeInvalid: false }),
        },
        validation:
          parsedBinding &&
          this.validationController
            ?.deref()
            ?.getValidationForBinding(parsedBinding)
            ?.get(),
        type:
          parsedBinding &&
          this.schemaController?.deref()?.getType(parsedBinding),
      };

      return result;
    },
    'player-runtime-info-request': () => {
      const playerState = this.player?.deref()?.getState();

      if (playerState?.status === 'in-progress') {
        return {
          currentFlow: playerState.flow,
          currentFlowID: playerState.flow.id,
          // TODO: Verify name -> id
          currentFlowState: playerState.controllers.flow.current?.id,
          currentViewID:
            playerState.controllers.view.currentView?.lastUpdate?.id,
        };
      }

      return {};
    },
    'player-view-details-request': () => {
      let lastViewUpdate = this.view?.deref()?.lastUpdate as
        | ViewType
        | undefined;

      if (lastViewUpdate) {
        lastViewUpdate = JSON.parse(JSON.stringify(lastViewUpdate));
      }

      return {
        lastViewUpdate,
      };
    },
    'player-execute-expression': ({
      expression,
    }: {
      /**
       * Expression to be evaluated.
       */
      expression: any;
    }) => {
      try {
        this.expressionEvaluator?.deref()?.hooks.onError.intercept({
          call: (error) => {
            throw error;
          },
        });
        const evaluatorResult = this.expressionEvaluator
          ?.deref()
          ?.evaluate(expression);

        return {
          status: 'success',
          data: evaluatorResult,
          exp: expression,
        };
      } catch (error) {
        if (error instanceof Error) {
          return {
            status: 'error',
            message: error.message,
            exp: expression,
          };
        }
      }
    },
    'player-start-profiler-request': this.profilerPlugin.start,
    'player-stop-profiler-request': this.profilerPlugin.stop,
  };

  constructor(playerID: string, publisher: DevtoolsEventPublisher) {
    this.playerID = playerID;
    this.publisher = publisher;
  }

  apply(player: Player) {
    player.registerPlugin(this.profilerPlugin);

    this.player = new WeakRef(player);

    const { playerID, publisher } = this;
    player.hooks.dataController.tap(this.name, (dc) => {
      this.dataController = new WeakRef(dc);
      dc.hooks.onUpdate.tap(this.name, (updates) => {
        const timestamp = Date.now();
        updates.forEach(({ binding, oldValue, newValue }) => {
          publisher({
            playerID,
            type: 'player-data-change-event',
            binding: binding.asString(),
            timestamp,
            oldValue,
            newValue,
            source: '__PLAYER_RUNTIME__',
          });
        });
      });
    });

    player.hooks.bindingParser.tap(this.name, (bp) => {
      this.bindingParser = new WeakRef(bp);
    });

    player.hooks.validationController.tap(this.name, (vc) => {
      this.validationController = new WeakRef(vc);
    });

    player.logger.hooks.log.tap(this.name, (severity, message) => {
      publisher({
        playerID,
        type: 'player-log-event',
        timestamp: Date.now(),
        severity,
        message,
        source: '__PLAYER_RUNTIME__',
      });
    });

    player.hooks.onStart.tap(this.name, (flow) => {
      publisher({
        playerID,
        type: 'player-flow-start',
        flow,
        timestamp: Date.now(),
        source: '__PLAYER_RUNTIME__',
      });
    });

    player.hooks.view.tap(this.name, (v) => {
      this.view = new WeakRef(v);

      v.hooks.onUpdate.tap(this.name, (viewUpdate) => {
        publisher({
          type: 'player-view-update-event',
          playerID,
          timestamp: Date.now(),
          update: JSON.parse(JSON.stringify(viewUpdate)),
          source: '__PLAYER_RUNTIME__',
        });
      });
    });

    player.hooks.schema.tap(this.name, (schema) => {
      this.schemaController = new WeakRef(schema);
    });

    player.hooks.expressionEvaluator.tap(this.name, (evaluator) => {
      this.expressionEvaluator = new WeakRef(evaluator);
    });
  }
}

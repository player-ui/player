import { SyncBailHook, AsyncSeriesWaterfallHook, SyncHook } from 'tapable-ts';
import type {
  Player,
  PlayerPlugin,
  PlayerFlowState,
  DataController,
  ExpressionEvaluator,
  Logger,
} from '@player-ui/player';
import { resolveDataRefs } from '@player-ui/player';
import type { Asset, View } from '@player-ui/types';
import { setIn } from 'timm';
import { BeaconPluginSymbol } from './symbols';

export type BeaconDataType = string | Record<string, any>;

export interface BeaconMetaData {
  /** Additional data to send along with beacons */
  beacon?: BeaconDataType;
}

export interface AssetBeaconInfo {
  /** Additional data about the asset */
  metaData?: BeaconMetaData;
}

export type AssetBeacon = Asset & AssetBeaconInfo;
export type ViewBeacon = View & AssetBeaconInfo;

export interface BeaconPluginPlugin {
  /** Use this to tap into the beacon plugin hooks */
  apply: (beaconPlugin: BeaconPlugin) => void;
}

export interface BeaconPluginOptions {
  /** Callback when a beacon is published */
  callback?: (beacon: any) => void;
  /** A set of plugins to load  */
  plugins?: BeaconPluginPlugin[];
}

interface BeaconContext {
  /** The full current view */
  view?: ViewBeacon;
}

export interface BeaconArgs {
  /** The action being performed */
  action: string;
  /** The specific element that the beacon originated from */
  element: string;
  /** The asset firing the beacon */
  asset: AssetBeacon;
  /** The current view */
  view?: ViewBeacon;
  /** Any additional data to attach to the event */
  data?: any;
}

export interface HookArgs extends BeaconArgs {
  /** The current player state */
  state?: PlayerFlowState;
  /** The beacon plugin logger */
  logger: Logger;
}

/**
 * A player plugin to manage beacon events.
 * It automatically keeps track of the current user's view, and adds additional metaData to each beacon event.
 */
export class BeaconPlugin implements PlayerPlugin {
  name = 'Beacon';

  static Symbol = BeaconPluginSymbol;
  public readonly symbol = BeaconPlugin.Symbol;

  private player?: Player;
  private logger?: Logger;

  private beaconContext: BeaconContext = {
    view: undefined,
  };

  private dataController?: DataController;
  private expressionEvaluator?: ExpressionEvaluator;

  public hooks = {
    buildBeacon: new AsyncSeriesWaterfallHook<[unknown, HookArgs]>(),
    cancelBeacon: new SyncBailHook<[HookArgs], boolean>(),
    publishBeacon: new SyncHook<[any]>(),
  };

  constructor(options?: BeaconPluginOptions) {
    if (options?.plugins) {
      options.plugins.forEach((plugin) => {
        plugin.apply(this);
      });
    }

    if (options?.callback) {
      this.hooks.publishBeacon.tap('BeaconCallback', (beacon: any) => {
        if (options.callback) {
          options.callback(beacon);
        }
      });
    }
  }

  apply(player: Player) {
    this.player = player;
    this.logger = player.logger;

    player.hooks.dataController.tap(this.name, (dataController) => {
      this.dataController = dataController;
    });

    player.hooks.expressionEvaluator.tap(this.name, (expressionEvaluator) => {
      this.expressionEvaluator = expressionEvaluator;
    });

    player.hooks.viewController.tap(this.name, (vc) => {
      this.beaconContext = {
        view: undefined,
      };

      vc.hooks.view.tap(this.name, (view) => {
        let beaconedView = false;

        view.hooks.parser.tap(this.name, (parser) => {
          /* If there is a 'beacon' property in an asset or view, skip resolving as we
             are doing this manually when beacon is fired. */
          parser.hooks.onCreateASTNode.tap(this.name, (obj) => {
            if (obj?.type !== 'asset' && obj?.type !== 'view') return undefined;

            const propertiesToSkip =
              obj.plugins?.stringResolver?.propertiesToSkip ?? [];

            if (propertiesToSkip.includes('beacon')) return undefined;

            // eslint-disable-next-line no-param-reassign
            obj.plugins = setIn(
              obj.plugins ?? {},
              ['stringResolver', 'propertiesToSkip'],
              ['beacon', ...propertiesToSkip]
            ) as any;

            return obj;
          });
        });

        view.hooks.onUpdate.tap(this.name, (viewUpdate: ViewBeacon) => {
          this.beaconContext = {
            view: viewUpdate,
          };

          if (!beaconedView) {
            this.beacon({
              action: 'viewed',
              element: 'view',
              asset: viewUpdate,
              view: viewUpdate,
            });

            beaconedView = true;
          }
        });
      });
    });

    player.hooks.expressionEvaluator.tap(this.name, (evaluator) => {
      evaluator.addExpressionFunction('beacon', (_ctx, action, data) => {
        const view = this.beaconContext.view || ({} as ViewBeacon);
        this.beacon({
          action: action as string,
          data: data as any,
          element: 'view',
          asset: view,
          view,
        });
      });
    });
  }

  beacon(event: BeaconArgs) {
    const { action, element, asset, view } = event;
    const { view: currentView } = this.beaconContext;
    setTimeout(async () => {
      const unresolvedData = event?.data || event.asset?.metaData?.beacon;

      const data =
        this.dataController && this.expressionEvaluator
          ? resolveDataRefs(unresolvedData, {
              model: this.dataController,
              evaluate: this.expressionEvaluator.evaluate,
            })
          : unresolvedData;

      const defaultBeacon = {
        action,
        element,
        data,
        assetId: asset?.id,
        viewId: currentView?.id,
      };
      const state = this.player?.getState();
      const hookArgs = {
        ...event,
        data,
        state,
        view: view || currentView,
        logger: this.logger as Logger,
      };
      const beacon =
        (await this.hooks.buildBeacon.call(defaultBeacon, hookArgs)) ||
        defaultBeacon;
      const shouldCancel = this.hooks.cancelBeacon.call(hookArgs) || false;

      if (!shouldCancel) {
        this.logger?.debug('Sending beacon event', beacon);
        this.hooks.publishBeacon.call(beacon);
      }
    }, 0);
  }
}

import React from "react";
import { SyncWaterfallHook, AsyncParallelHook } from "tapable-ts";
import { Subscribe, useSubscribedState } from "@player-ui/react-subscribe";
import { Registry } from "@player-ui/partial-match-registry";
import type {
  CompletedState,
  PlayerPlugin,
  Flow,
  View,
  PlayerInfo,
} from "@player-ui/player";
import { Player } from "@player-ui/player";
import { ErrorBoundary } from "react-error-boundary";
import type { AssetRegistryType } from "./asset";
import { AssetContext } from "./asset";
import { PlayerContext } from "./utils";

import type { ReactPlayerProps } from "./app";
import { ReactPlayer as PlayerComp } from "./app";
import { OnUpdatePlugin } from "./plugins/onupdate-plugin";

export interface DevtoolsGlobals {
  /** A global for a plugin to load to Player for devtools */
  __PLAYER_DEVTOOLS_PLUGIN?: {
    new (): ReactPlayerPlugin;
  };
}

export type DevtoolsWindow = typeof window & DevtoolsGlobals;

const _window: DevtoolsWindow | undefined =
  typeof window === "undefined" ? undefined : window;

// Alias until more properties are added
export type ReactPlayerInfo = PlayerInfo;

export interface ReactPlayerPlugin extends Partial<PlayerPlugin> {
  /** The name of this plugin */
  name: string;

  /**
   * Attach listeners to the web-player instance
   */
  applyReact?: (reactPlayer: ReactPlayer) => void;
}

export interface ReactPlayerOptions {
  /** A headless player instance to use */
  player?: Player;

  /** A set of plugins to apply to this player */
  plugins?: Array<ReactPlayerPlugin>;
}

export type ReactPlayerComponentProps = Record<string, unknown>;

/** A Player that renders UI through React */
export class ReactPlayer {
  public readonly options: ReactPlayerOptions;
  public readonly player: Player;
  public readonly assetRegistry: AssetRegistryType = new Registry();
  public readonly Component: React.ComponentType<ReactPlayerComponentProps>;
  public readonly hooks: {
    /**
     * A hook to create a React Component to be used for Player, regardless of the current flow state
     */
    webComponent: SyncWaterfallHook<[React.ComponentType], Record<string, any>>;
    /**
     * A hook to create a React Component that's used to render a specific view.
     * It will be called for each view update from the core player.
     * Typically this will just be `Asset`
     */
    playerComponent: SyncWaterfallHook<
      [React.ComponentType<ReactPlayerProps>],
      Record<string, any>
    >;
    /**
     * A hook to execute async tasks before the view resets to undefined
     */
    onBeforeViewReset: AsyncParallelHook<[], Record<string, any>>;
  } = {
    /**
     * A hook to create a React Component to be used for Player, regardless of the current flow state
     */
    webComponent: new SyncWaterfallHook(),

    /**
     * A hook to create a React Component that's used to render a specific view.
     * It will be called for each view update from the core player.
     * Typically this will just be `Asset`
     */
    playerComponent: new SyncWaterfallHook(),

    /**
     * A hook to execute async tasks before the view resets to undefined
     */
    onBeforeViewReset: new AsyncParallelHook(),
  };

  private viewUpdateSubscription = new Subscribe<View>();
  private reactPlayerInfo: ReactPlayerInfo;

  constructor(options?: ReactPlayerOptions) {
    this.options = options ?? {};

    const Devtools = _window?.__PLAYER_DEVTOOLS_PLUGIN;
    const onUpdatePlugin = new OnUpdatePlugin(
      this.viewUpdateSubscription.publish,
    );

    const plugins = options?.plugins ?? [];

    if (Devtools) {
      plugins.push(new Devtools());
    }

    const playerPlugins = plugins.filter((p) =>
      Boolean(p.apply),
    ) as PlayerPlugin[];

    this.player = options?.player ?? new Player({ plugins: playerPlugins });

    plugins.forEach((plugin) => {
      if (plugin.applyReact) {
        plugin.applyReact(this);
      }
    });

    onUpdatePlugin.apply(this.player);

    this.Component = this.createReactPlayerComponent();
    this.reactPlayerInfo = {
      version: this.player.getVersion(),
      commit: this.player.getCommit(),
    };
  }

  /** Returns the current version Player */
  public getPlayerVersion(): string {
    return this.reactPlayerInfo.version;
  }

  /** Returns the git commit used to build this Player version */
  public getPlayerCommit(): string {
    return this.reactPlayerInfo.commit;
  }

  /** Find instance of [Plugin] that has been registered to the web player */
  public findPlugin<Plugin extends ReactPlayerPlugin>(
    symbol: symbol,
  ): Plugin | undefined {
    return this.options.plugins?.find((el) => el.symbol === symbol) as Plugin;
  }

  /** Register and apply [Plugin] if one with the same symbol is not already registered. */
  public registerPlugin(plugin: ReactPlayerPlugin): void {
    if (!plugin.applyReact) return;

    plugin.applyReact(this);
    this.options.plugins?.push(plugin);
  }

  /**
   * Returns the current version of the running React Player
   * @deprecated use `getPlayerVersion()` instead. Will be removed next major
   */
  public getReactPlayerVersion(): string {
    return this.reactPlayerInfo.version;
  }

  /**
   * Returns the git commit used to build the React Player version
   * @deprecated use `getPlayerCommit()` instead. Will be removed next major
   */
  public getReactPlayerCommit(): string {
    return this.reactPlayerInfo.commit;
  }

  private createReactPlayerComponent(): React.ComponentType<ReactPlayerComponentProps> {
    const BaseComp = this.hooks.webComponent.call(this.createReactComp());

    /** Wrap the Error boundary and context provider after the hook call to catch anything wrapped by the hook */
    const ReactPlayerComponent = (props: ReactPlayerComponentProps) => {
      return (
        <ErrorBoundary
          fallbackRender={() => null}
          onError={(err) => {
            const playerState = this.player.getState();

            if (playerState.status === "in-progress") {
              playerState.fail(err);
            }
          }}
        >
          <PlayerContext.Provider value={{ player: this.player }}>
            <BaseComp {...props} />
          </PlayerContext.Provider>
        </ErrorBoundary>
      );
    };

    return ReactPlayerComponent;
  }

  private createReactComp(): React.ComponentType<ReactPlayerComponentProps> {
    const ActualPlayerComp = this.hooks.playerComponent.call(PlayerComp);

    /** the component to use to render the player */
    const WebPlayerComponent = () => {
      const view = useSubscribedState<View>(this.viewUpdateSubscription);
      this.viewUpdateSubscription.suspend();

      return (
        <AssetContext.Provider
          value={{
            registry: this.assetRegistry,
          }}
        >
          {view && <ActualPlayerComp view={view} />}
        </AssetContext.Provider>
      );
    };

    return WebPlayerComponent;
  }

  /**
   * Call this method to force the ReactPlayer to wait for the next view-update before performing the next render.
   * If the `suspense` option is set, this will suspend while an update is pending, otherwise nothing will be rendered.
   */
  public setWaitForNextViewUpdate(): Promise<void> {
    const shouldCallResetHook = this.hooks.onBeforeViewReset.isUsed();

    return this.viewUpdateSubscription.reset(
      shouldCallResetHook ? this.hooks.onBeforeViewReset.call() : undefined,
    );
  }

  public start(flow: Flow): Promise<CompletedState> {
    this.setWaitForNextViewUpdate();

    return this.player.start(flow).finally(async () => {
      await this.setWaitForNextViewUpdate();
    });
  }
}

// For compatibility
export const WebPlayer: typeof ReactPlayer = ReactPlayer;

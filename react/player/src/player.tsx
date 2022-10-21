/* eslint-disable react/no-this-in-sfc */
import React from 'react';
import { SyncWaterfallHook, AsyncParallelHook } from 'tapable-ts';
import { Subscribe, useSubscribedState } from '@player-ui/react-subscribe';
import { Registry } from '@player-ui/partial-match-registry';
import type {
  CompletedState,
  PlayerPlugin,
  Flow,
  View,
} from '@player-ui/player';
import { Player } from '@player-ui/player';
import { ErrorBoundary } from 'react-error-boundary';
import type { AssetRegistryType } from './asset';
import { AssetContext } from './asset';
import { PlayerContext } from './utils';

import type { ReactPlayerProps } from './app';
import PlayerComp from './app';
import OnUpdatePlugin from './plugins/onupdate-plugin';

const WEB_PLAYER_VERSION = '__VERSION__';
const COMMIT = '__GIT_COMMIT__';

export interface DevtoolsGlobals {
  /** A global for a plugin to load to Player for devtools */
  __PLAYER_DEVTOOLS_PLUGIN?: {
    new (): ReactPlayerPlugin;
  };
}

export type DevtoolsWindow = typeof window & DevtoolsGlobals;

const _window: DevtoolsWindow | undefined =
  typeof window === 'undefined' ? undefined : window;

export interface ReactPlayerInfo {
  /** Version of the running player */
  playerVersion: string;

  /** Version of the running reactPlayer */
  reactPlayerVersion: string;

  /** Hash of the HEAD commit used to build the current player version */
  playerCommit: string;

  /** Hash of the HEAD commit used to build the current reactPlayer version */
  reactPlayerCommit: string;
}

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

  /**
   * If the underlying reactPlayer.Component should use `React.Suspense` to trigger a loading state while waiting for content or content updates.
   * It requires that a `React.Suspense` component handler be somewhere in the `reactPlayer.Component` hierarchy.
   */
  suspend?: boolean;
}

export type ReactPlayerComponentProps = Record<string, unknown>;

/** A Player that renders UI through React */
export class ReactPlayer {
  public readonly options: ReactPlayerOptions;
  public readonly player: Player;
  public readonly assetRegistry: AssetRegistryType = new Registry();
  public readonly Component: React.ComponentType<ReactPlayerComponentProps>;
  public readonly hooks = {
    /**
     * A hook to create a React Component to be used for Player, regardless of the current flow state
     */
    webComponent: new SyncWaterfallHook<[React.ComponentType]>(),

    /**
     * A hook to create a React Component that's used to render a specific view.
     * It will be called for each view update from the core player.
     * Typically this will just be `Asset`
     */
    playerComponent: new SyncWaterfallHook<
      [React.ComponentType<ReactPlayerProps>]
    >(),

    /**
     * A hook to execute async tasks before the view resets to undefined
     */
    onBeforeViewReset: new AsyncParallelHook<[]>(),
  };

  private viewUpdateSubscription = new Subscribe<View>();
  private reactPlayerInfo: ReactPlayerInfo;

  constructor(options?: ReactPlayerOptions) {
    this.options = options ?? {};

    // Default the suspend option to `true` unless explicitly unset
    // Remove the suspend option in the next major
    if (!('suspend' in this.options)) {
      this.options.suspend = true;
    }

    const Devtools = _window?.__PLAYER_DEVTOOLS_PLUGIN;
    const onUpdatePlugin = new OnUpdatePlugin(
      this.viewUpdateSubscription.publish
    );

    const plugins = options?.plugins ?? [];

    if (Devtools) {
      plugins.push(new Devtools());
    }

    const playerPlugins = plugins.filter((p) =>
      Boolean(p.apply)
    ) as PlayerPlugin[];

    this.player = options?.player ?? new Player({ plugins: playerPlugins });

    plugins.forEach((plugin) => {
      if (plugin.applyReact) {
        plugin.applyReact(this);
      }
    });

    onUpdatePlugin.apply(this.player);

    this.Component = this.hooks.webComponent.call(this.createReactComp());
    this.reactPlayerInfo = {
      playerVersion: this.player.getVersion(),
      playerCommit: this.player.getCommit(),
      reactPlayerVersion: WEB_PLAYER_VERSION,
      reactPlayerCommit: COMMIT,
    };
  }

  /** Returns the current version of the underlying core Player */
  public getPlayerVersion(): string {
    return this.reactPlayerInfo.playerVersion;
  }

  /** Returns the git commit used to build this core Player version */
  public getPlayerCommit(): string {
    return this.reactPlayerInfo.playerCommit;
  }

  /** Find instance of [Plugin] that has been registered to the web player */
  public findPlugin<Plugin extends ReactPlayerPlugin>(
    symbol: symbol
  ): Plugin | undefined {
    return this.options.plugins?.find((el) => el.symbol === symbol) as Plugin;
  }

  /** Register and apply [Plugin] if one with the same symbol is not already registered. */
  public registerPlugin(plugin: ReactPlayerPlugin): void {
    if (!plugin.applyReact) return;

    plugin.applyReact(this);
    this.options.plugins?.push(plugin);
  }

  /** Returns the current version of the running React Player */
  public getReactPlayerVersion(): string {
    return this.reactPlayerInfo.reactPlayerVersion;
  }

  /** Returns the git commit used to build the React Player version */
  public getReactPlayerCommit(): string {
    return this.reactPlayerInfo.reactPlayerCommit;
  }

  private createReactComp(): React.ComponentType<ReactPlayerComponentProps> {
    const ActualPlayerComp = this.hooks.playerComponent.call(PlayerComp);

    /** the component to use to render Player */
    const ReactPlayerComponent = () => {
      const view = useSubscribedState<View>(this.viewUpdateSubscription);

      if (this.options.suspend) {
        this.viewUpdateSubscription.suspend();
      }

      return (
        <ErrorBoundary
          fallbackRender={() => null}
          onError={(err) => {
            const playerState = this.player.getState();

            if (playerState.status === 'in-progress') {
              playerState.fail(err);
            }
          }}
        >
          <PlayerContext.Provider value={{ player: this.player }}>
            <AssetContext.Provider
              value={{
                registry: this.assetRegistry,
              }}
            >
              {view && <ActualPlayerComp view={view} />}
            </AssetContext.Provider>
          </PlayerContext.Provider>
        </ErrorBoundary>
      );
    };

    return ReactPlayerComponent;
  }

  /**
   * Call this method to force the ReactPlayer to wait for the next view-update before performing the next render.
   * If the `suspense` option is set, this will suspend while an update is pending, otherwise nothing will be rendered.
   */
  public setWaitForNextViewUpdate() {
    // If the `suspend` option isn't set, then we need to reset immediately otherwise we risk flashing the old view while the new one is processing
    const shouldCallResetHook =
      this.options.suspend && this.hooks.onBeforeViewReset.isUsed();

    return this.viewUpdateSubscription.reset(
      shouldCallResetHook ? this.hooks.onBeforeViewReset.call() : undefined
    );
  }

  public start(flow: Flow): Promise<CompletedState> {
    this.setWaitForNextViewUpdate();

    return this.player.start(flow).finally(async () => {
      if (this.options?.suspend) {
        await this.setWaitForNextViewUpdate();
      }
    });
  }
}

// For compatibility
export const WebPlayer = ReactPlayer;

/* eslint-disable react/no-this-in-sfc */
import React from 'react';
import type {
  CompletedState,
  PlayerPlugin,
  Flow,
  View,
} from '@player-ui/player';
import { Player } from '@player-ui/player';
import type { AssetRegistryType } from '@player-ui/react-asset';
import { AssetContext } from '@player-ui/react-asset';
import { ErrorBoundary } from 'react-error-boundary';
import { PlayerContext } from '@player-ui/react-utils';
import { SyncWaterfallHook, AsyncParallelHook } from 'tapable-ts';
import { Subscribe, useSubscribedState } from '@player-ui/react-subscribe';
import { Registry } from '@player-ui/partial-match-registry';

import type { WebPlayerProps } from './app';
import PlayerComp from './app';
import OnUpdatePlugin from './plugins/onupdate-plugin';

const WEB_PLAYER_VERSION = '__VERSION__';
const COMMIT = '__GIT_COMMIT__';

export interface DevtoolsGlobals {
  /** A global for a plugin to load to Player for devtools */
  __PLAYER_DEVTOOLS_PLUGIN?: {
    new (): WebPlayerPlugin;
  };
}

export type DevtoolsWindow = typeof window & DevtoolsGlobals;

const _window: DevtoolsWindow | undefined =
  typeof window === 'undefined' ? undefined : window;

export interface WebPlayerInfo {
  /** Version of the running player */
  playerVersion: string;

  /** Version of the running webplayer */
  webplayerVersion: string;

  /** Hash of the HEAD commit used to build the current player version */
  playerCommit: string;

  /** Hash of the HEAD commit used to build the current webplayer version */
  webplayerCommit: string;
}

export interface WebPlayerPlugin extends Partial<PlayerPlugin> {
  /** The name of this plugin */
  name: string;

  /**
   * Attach listeners to the web-player instance
   */
  applyWeb?: (webPlayer: WebPlayer) => void;
}

export interface WebPlayerOptions {
  /** A headless player instance to use */
  player?: Player;

  /** A set of plugins to apply to this player */
  plugins?: Array<WebPlayerPlugin>;

  /**
   * If the underlying webPlayer.Component should use `React.Suspense` to trigger a loading state while waiting for content or content updates.
   * It requires that a `React.Suspense` component handler be somewhere in the `webPlayer.Component` hierarchy.
   */
  suspend?: boolean;
}

export type WebPlayerComponentProps = Record<string, unknown>;

/** The React webplayer */
export class WebPlayer {
  public readonly options: WebPlayerOptions;
  public readonly player: Player;
  public readonly assetRegistry: AssetRegistryType = new Registry();
  public readonly Component: React.ComponentType<WebPlayerComponentProps>;
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
      [React.ComponentType<WebPlayerProps>]
    >(),

    /**
     * A hook to execute async tasks before the view resets to undefined
     */
    onBeforeViewReset: new AsyncParallelHook<[]>(),
  };

  private viewUpdateSubscription = new Subscribe<View>();
  private webplayerInfo: WebPlayerInfo;

  constructor(options?: WebPlayerOptions) {
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
      if (plugin.applyWeb) {
        plugin.applyWeb(this);
      }
    });

    onUpdatePlugin.apply(this.player);

    this.Component = this.hooks.webComponent.call(this.createReactComp());
    this.webplayerInfo = {
      playerVersion: this.player.getVersion(),
      playerCommit: this.player.getCommit(),
      webplayerVersion: WEB_PLAYER_VERSION,
      webplayerCommit: COMMIT,
    };
  }

  /** Returns the current version of the underlying core Player */
  public getPlayerVersion(): string {
    return this.webplayerInfo.playerVersion;
  }

  /** Returns the git commit used to build this core Player version */
  public getPlayerCommit(): string {
    return this.webplayerInfo.playerCommit;
  }

  /** Find instance of [Plugin] that has been registered to the web player */
  public findPlugin<Plugin extends WebPlayerPlugin>(
    symbol: symbol
  ): Plugin | undefined {
    return this.options.plugins?.find((el) => el.symbol === symbol) as Plugin;
  }

  /** Register and apply [Plugin] if one with the same symbol is not already registered. */
  public registerPlugin(plugin: WebPlayerPlugin): void {
    if (!plugin.applyWeb) return;

    plugin.applyWeb(this);
    this.options.plugins?.push(plugin);
  }

  /** Returns the current version of the running React Player */
  public getWebPlayerVersion(): string {
    return this.webplayerInfo.webplayerVersion;
  }

  /** Returns the git commit used to build the React Player version */
  public getWebPlayerCommit(): string {
    return this.webplayerInfo.webplayerCommit;
  }

  private createReactComp(): React.ComponentType<WebPlayerComponentProps> {
    const ActualPlayerComp = this.hooks.playerComponent.call(PlayerComp);

    /** the component to use to render Player */
    const WebPlayerComponent = () => {
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

    return WebPlayerComponent;
  }

  /**
   * Call this method to force the WebPlayer to wait for the next view-update before performing the next render.
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

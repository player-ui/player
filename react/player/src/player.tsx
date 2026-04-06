import React from "react";
import { SyncWaterfallHook, AsyncParallelHook } from "tapable-ts";
import {
  Subscribe,
  useSubscribedState,
  useSubscriber,
} from "@player-ui/react-subscribe";
import { Registry } from "@player-ui/partial-match-registry";
import type {
  CompletedState,
  PlayerPlugin,
  Flow,
  View,
  PlayerInfo,
} from "@player-ui/player";
import { Player } from "@player-ui/player";
import { ErrorBoundary, FallbackProps } from "react-error-boundary";
import type { AssetRegistryType } from "./asset";
import { AssetContext } from "./asset";
import { PlayerContext } from "./utils";

import type { ReactPlayerProps } from "./app";
import { ReactPlayer as PlayerComp } from "./app";
import { OnUpdatePlugin } from "./plugins/onupdate-plugin";

/** Backup context for receiving ReactPlayerComponentProps when components setup in the webComponent call don't pass the props down to their inner components. */
export const ReactPlayerPropsContext: React.Context<ReactPlayerComponentProps> =
  React.createContext<ReactPlayerComponentProps>({ isInErrorState: false });

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

export type ReactPlayerComponentProps = {
  /** Whether or not player is currently recovering from an error. */
  isInErrorState?: boolean;
  [key: string]: unknown;
};

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
    webComponent: SyncWaterfallHook<
      [React.ComponentType<any>],
      Record<string, any>
    >;
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

  public readonly viewUpdateSubscription: Subscribe<View> =
    new Subscribe<View>();
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
      const trackedErrors = React.useRef(new Map<Error, boolean>());
      const [errorSubId, setErrorSubId] = React.useState<number | undefined>(
        undefined,
      );
      const { subscribe, unsubscribe } = useSubscriber(
        this.viewUpdateSubscription,
      );

      const componentProps: ReactPlayerComponentProps = React.useMemo(
        () => ({
          ...props,
          isInErrorState: errorSubId !== undefined,
        }),
        [props, errorSubId],
      );

      /** Callback to remove all tracked errors and unsub from  */
      const clearErrorTracking = React.useCallback(() => {
        trackedErrors.current.clear();
        setErrorSubId((prev) => {
          if (prev !== undefined) {
            unsubscribe(prev);
          }

          return undefined;
        });
      }, []);

      React.useEffect(() => {
        // Clear errors and error subscription on unmount
        return clearErrorTracking;
      }, [clearErrorTracking]);

      /** capture error and return true or false to represent if we are recovering from the error or not. */
      const captureError = React.useCallback(
        (err: Error) => {
          // If player isn't in progress we can't actually render anything so render errors are irrelevant.
          const playerState = this.player.getState();
          if (playerState.status !== "in-progress") {
            this.player.logger.warn(
              `[ReactPlayer]: An error occurred during rendering but was ignored due to a change in the player state (current state: '${playerState.status}'). Error Details:`,
              err,
            );
            return false;
          }

          // Only capture each error once.
          const currentError = trackedErrors.current.get(err);
          if (currentError !== undefined) {
            return currentError;
          }

          let isRecovering = false;
          setErrorSubId((prev) => {
            // subscribe only if no subscription available.
            // Needs to happen before capture error to ensure error recovery isn't missed
            const subId =
              prev === undefined
                ? subscribe(clearErrorTracking, {
                    initializeWithPreviousValue: false,
                  })
                : prev;

            // Get skipped state after trying to capture.
            isRecovering = playerState.controllers.error.captureError(err);
            trackedErrors.current.set(err, isRecovering);

            // If we can't recover from the error, avoid updating state to stay in error boundary
            if (!isRecovering) {
              // Unsub if not previously subbed since we don't need to reset the view
              if (subId !== prev) {
                unsubscribe(subId);
              }
              return prev;
            }

            return subId;
          });

          return isRecovering;
        },
        [errorSubId],
      );

      return (
        <ErrorBoundary
          fallbackRender={(fallbackProps: FallbackProps) => {
            const isRecovering = captureError(fallbackProps.error);

            if (!isRecovering) {
              // Display nothing if not recovering. Let the player state fail and handle what the view will be.
              return null;
            }
            fallbackProps.resetErrorBoundary();

            // Render the same as on success when recovering to preserve the react tree.
            return (
              <ReactPlayerPropsContext.Provider
                value={{ ...componentProps, isInErrorState: true }}
              >
                <PlayerContext.Provider value={{ player: this.player }}>
                  <BaseComp {...componentProps} isInErrorState />
                </PlayerContext.Provider>
              </ReactPlayerPropsContext.Provider>
            );
          }}
        >
          <ReactPlayerPropsContext.Provider value={{ ...componentProps }}>
            <PlayerContext.Provider value={{ player: this.player }}>
              <BaseComp {...componentProps} />
            </PlayerContext.Provider>
          </ReactPlayerPropsContext.Provider>
        </ErrorBoundary>
      );
    };

    return ReactPlayerComponent;
  }

  private createReactComp(): React.ComponentType<ReactPlayerComponentProps> {
    const ActualPlayerComp = this.hooks.playerComponent.call(PlayerComp);

    /** the component to use to render the player */
    const WebPlayerComponent: React.ComponentType = (): React.ReactElement => {
      const { isInErrorState } = React.useContext(ReactPlayerPropsContext);
      const view = useSubscribedState<View>(this.viewUpdateSubscription);
      const lastSuccessfulView = React.useRef<View | undefined>(undefined);
      this.viewUpdateSubscription.suspend();

      React.useEffect(() => {
        if (!isInErrorState) {
          lastSuccessfulView.current = view;
        }
      }, [isInErrorState, view]);

      const displayedView = isInErrorState ? lastSuccessfulView.current : view;

      return (
        <AssetContext.Provider
          value={{
            registry: this.assetRegistry,
          }}
        >
          {displayedView && <ActualPlayerComp view={displayedView} />}
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

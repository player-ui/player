import type {
  Player,
  PlayerPlugin,
  InProgressState,
  PlayerFlowState,
  NavigationFlowState,
  NavigationFlowExternalState,
  NavigationFlowState,
} from "@player-ui/player";
import { Registry } from "@player-ui/partial-match-registry";
import { ExternalActionPluginSymbol } from "./symbols.js";

export type ExternalStateHandler = (
  state: NavigationFlowExternalState,
  options: InProgressState["controllers"],
) => string | undefined | Promise<string | undefined>;

function isExternal(
  state: NavigationFlowState,
): state is NavigationFlowExternalState {
  return state.state_type === "EXTERNAL";
}

function isInProgress(state: PlayerFlowState): state is InProgressState {
  return state.status === "in-progress";
}

/**
 * A plugin to handle external action states
 *
 * This plugin uses a registry-based approach to match external states to handler functions.
 * Multiple plugins can be registered, and handlers are matched using partial object matching
 * with specificity ordering (more specific matches take precedence).
 */
export class ExternalActionPlugin implements PlayerPlugin {
  name = "ExternalActionPlugin";

  /** Symbol used to identify and find existing instances of this plugin */
  static Symbol: symbol = ExternalActionPluginSymbol;
  public readonly symbol: symbol = ExternalActionPlugin.Symbol;

  /**
   * Whether this is the first plugin instance.
   * Only the first plugin instance creates the registry; all others use the first plugin's registry.
   */
  private isFirstPluginInstance: boolean = true;

  /**
   * The shared registry that maps external states to handlers.
   * All plugin instances use the same registry.
   */
  private registry?: Registry<ExternalStateHandler>;

  /**
   * The handlers for this plugin.
   */
  private readonly handlers: Map<
    Partial<NavigationFlowExternalState> &
      Pick<NavigationFlowExternalState, "ref">,
    ExternalStateHandler
  >;

  /**
   * Creates a new ExternalActionPlugin
   *
   * @param handlers - Map of state matchers to handler functions.
   *                   Keys are partial state objects used for matching.
   *                   More specific keys (with more properties) take precedence.
   *
   * @example
   * ```typescript
   * new ExternalActionPlugin(
   *   new Map([
   *     // Less specific - matches any state with ref: "action"
   *     [{ ref: "action" }, (state, options) => "default"],
   *
   *     // More specific - matches state with both ref and type
   *     [{ ref: "action", type: "special" }, (state, options) => "special"],
   *   ])
   * )
   * ```
   */
  constructor(
    handlers: Map<
      Partial<NavigationFlowExternalState> &
        Pick<NavigationFlowExternalState, "ref">,
      ExternalStateHandler
    >,
  ) {
    this.handlers = handlers;
  }

  apply(player: Player): void {
    this.createRegistry(player);
    this.registerHandlers(player);

    // Since every instance uses the same registry, we should only tap once to avoid redundant taps.
    if (!this.isFirstPluginInstance) {
      return;
    }

    player.hooks.flowController.tap(this.name, (flowController) => {
      flowController.hooks.flow.tap(this.name, (flow) => {
        flow.hooks.afterTransition.tap(this.name, async (flowInstance) => {
          const toState = flowInstance.currentState;
          const currentState = player.getState();

          if (
            toState &&
            toState.value &&
            isExternal(toState.value) &&
            isInProgress(currentState)
          ) {
            try {
              const transitionValue = await this.registry?.get(toState.value)?.(
                toState.value,
                currentState.controllers,
              );

              if (transitionValue !== undefined) {
                const latestState = player.getState();

                // Ensure the Player is still in the same state after waiting for transitionValue
                if (
                  isInProgress(latestState) &&
                  latestState.controllers.flow.current?.currentState?.name ===
                    toState.name
                ) {
                  latestState.controllers.flow.transition(transitionValue);
                } else {
                  player.logger.warn(
                    `External state resolved with [${transitionValue}], but Player already navigated away from [${toState.name}]`,
                  );
                }
              }
            } catch (error) {
              if (error instanceof Error) {
                currentState.fail(error);
              }
            }
          }
        });
      });
    });
  }

  /**
   * Create the registry for this plugin instance.
   *
   * Uses the Player's plugin registry to find if another instance of ExternalActionPlugin
   * has already been registered. If found, this instance will share that plugin's registry.
   * Otherwise, this instance creates a new registry.
   *
   * @param player - The Player instance this plugin is being applied to
   */
  private createRegistry(player: Player): void {
    // This should find the first instance of this plugin registered to the Player.
    const existing = player.findPlugin<ExternalActionPlugin>(
      ExternalActionPluginSymbol,
    );
    // If we found a plugin and it's not ourselves, we are not the first plugin instance.
    if (existing && existing !== this) {
      this.isFirstPluginInstance = false;
      // Use the first plugin's registry
      this.registry = existing.registry;
    } else {
      // We are the first plugin instance, create the registry
      this.registry = new Registry<ExternalStateHandler>(
        undefined,
        player.logger,
      );
    }
  }

  /**
   * Register this plugin's handlers to the shared registry.
   *
   * If a handler with the same specificity already exists, it will be replaced
   * and a debug log will be emitted (accessible via player.logger.debug).
   *
   * @param player - The Player instance (used to access the registry)
   */
  private registerHandlers(player: Player): void {
    for (const [state, handler] of this.handlers) {
      // Registry will handle keeping only the last handler for each state.
      this.registry?.set(state, handler);
    }
  }
}

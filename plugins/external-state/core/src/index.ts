import type {
  Player,
  PlayerPlugin,
  InProgressState,
  PlayerFlowState,
  NavigationFlowExternalState,
  NavigationFlowState,
} from "@player-ui/player";
import { Registry } from "@player-ui/partial-match-registry";
import { ExternalStatePluginSymbol } from "./symbols.js";

export type ExternalStateHandler = (
  state: NavigationFlowExternalState,
  options: InProgressState["controllers"],
) => string | undefined | Promise<string | undefined>;

type ExternalStateMatch = {
  ref: string;
} & Partial<NavigationFlowExternalState>;

/**
 * A plugin to handle external state states
 *
 * This plugin uses a registry-based approach to match external states to handler functions.
 * Multiple plugins can be registered, and handlers are matched using partial object matching
 * with specificity ordering (more specific matches take precedence).
 */
export class ExternalStatePlugin implements PlayerPlugin {
  name = "ExternalStatePlugin";

  /** Symbol used to identify and find existing instances of this plugin */
  static Symbol: symbol = ExternalStatePluginSymbol;
  public readonly symbol: symbol = ExternalStatePlugin.Symbol;

  /**
   * The shared registry that maps external states to handlers.
   * All plugin instances use the same registry.
   */
  private registry?: Registry<ExternalStateHandler>;

  /**
   * The handlers for this plugin instance.
   */
  private readonly handlers: Map<ExternalStateMatch, ExternalStateHandler>;

  /**
   * Creates a new ExternalStatePlugin
   *
   * @param handlers - Array of [matcher, handler] tuples.
   *                   Matchers are partial state objects used for matching.
   *                   More specific matchers (with more properties) take precedence.
   *
   * @example
   * ```typescript
   * new ExternalStatePlugin([
   *   // Less specific - matches any state with ref: "action"
   *   [{ ref: "action" }, (state, options) => "default"],
   *
   *   // More specific - matches state with both ref and type
   *   [{ ref: "action", type: "special" }, (state, options) => "special"],
   * ])
   * ```
   */
  constructor(
    // This array of tuples is an established player pattern. Internally we use a Map.
    handlers: [ExternalStateMatch, ExternalStateHandler][],
  ) {
    this.handlers = new Map(handlers);
  }

  apply(player: Player): void {
    const isFirstInstance = this.createRegistry(player);
    this.registerHandlers(player);

    // Only the first instance should tap the hooks to avoid redundant taps
    if (!isFirstInstance) {
      return;
    }

    player.hooks.flowController.tap(this.name, (flowController) => {
      flowController.hooks.flow.tap(this.name, (flow) => {
        flow.hooks.transition.tap(this.name, (fromState, toNamedState) => {
          const { value: toState } = toNamedState;
          if (toState.state_type !== "EXTERNAL") {
            return;
          }

          setTimeout(async () => {
            const currentState = player.getState();
            if (!this.shouldTransition(currentState, toState)) {
              return;
            }

            try {
              const handler = this.registry?.get(toState);
              const transitionValue = await handler?.(
                toState,
                currentState.controllers,
              );

              if (transitionValue !== undefined) {
                // Ensure the Player is still in the same state after waiting for transitionValue
                const latestState = player.getState();
                if (this.shouldTransition(latestState, toState)) {
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
          }, 0);
        });
      });
    });
  }

  /**
   * Create or share the registry for this plugin instance.
   *
   * Uses the Player's plugin registry to find if another instance of ExternalStatePlugin
   * has already been registered. If found, this instance will share that plugin's registry.
   * Otherwise, this instance creates a new registry.
   *
   * @param player - The Player instance this plugin is being applied to
   * @returns True if this is the first plugin instance, false otherwise
   */
  private createRegistry(player: Player): boolean {
    // Find the first instance of this plugin registered to the Player
    const existing = player.findPlugin<ExternalStatePlugin>(
      ExternalStatePluginSymbol,
    );

    // If we found a plugin and it's not ourselves, we are not the first plugin instance
    if (existing && existing !== this) {
      // Use the first plugin's registry
      this.registry = existing.registry;
      return false;
    }

    // We are the first plugin instance, create the registry
    this.registry = new Registry<ExternalStateHandler>(
      undefined,
      player.logger,
    );
    return true;
  }

  /**
   * Register this plugin's handlers to the shared registry.
   *
   * If a handler with the same specificity already exists, it will be replaced
   * and a debug log will be emitted (accessible via player.logger.debug).
   */
  private registerHandlers(player: Player): void {
    for (const [state, handler] of this.handlers) {
      // Runtime check for 'ref' property is necessary despite TypeScript constraint because
      // the Swift bridge allows improperly formatted objects to bypass TypeScript validation.
      // We log this here and not in the constructor because the Logger is not yet available in the constructor.
      if (!state.ref) {
        player.logger.warn(
          `An external state match is missing the 'ref' property. This handler will be ignored. Match: ${JSON.stringify(state)}`,
        );
        continue;
      }
      // Registry will handle keeping only the last handler for each state
      this.registry?.set(state, handler);
    }
  }

  /**
   * Helper for ensuring the Player is still in the expected state.
   *
   * Used to verify the Player hasn't transitioned away from an external state
   * before/after executing async handler operations.
   *
   * @param fromState - The current Player state
   * @param toState - The expected external state
   * @returns True if the Player is in-progress and still on the expected state
   */
  private shouldTransition(
    fromState: PlayerFlowState,
    toState: NavigationFlowState,
  ): fromState is InProgressState {
    return (
      fromState.status === "in-progress" &&
      fromState.controllers.flow.current?.currentState?.value === toState
    );
  }
}

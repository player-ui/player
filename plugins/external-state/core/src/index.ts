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
import { ExternalStatePluginSymbol } from "./symbols.js";

export type ExternalStateHandlerMatch = Record<string, unknown>;

export type ExternalStateHandlerFunction = (
  state: NavigationFlowExternalState,
  options: InProgressState["controllers"],
) => string | undefined | Promise<string | undefined>;

export type ExternalStateHandler = {
  ref: string;
  match?: ExternalStateHandlerMatch;
  handlerFunction: ExternalStateHandlerFunction;
};

function isExternal(
  state: NavigationFlowState,
): state is NavigationFlowExternalState {
  return state.state_type === "EXTERNAL";
}

function isInProgress(state: PlayerFlowState): state is InProgressState {
  return state.status === "in-progress";
}

/**
 * A plugin to handle external states
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
  private registry?: Registry<ExternalStateHandlerFunction>;

  /**
   * The handlers for this plugin instance.
   */
  private readonly handlers: ExternalStateHandler[];

  /**
   * Creates a new ExternalStatePlugin
   *
   * @param handlers - Array of ExternalStateHandler objects.
   *                   Each object has a required `ref` (the external state reference),
   *                   an optional `match` object for additional match criteria,
   *                   and a `handlerFunction` to run when the external state is transitioned to.
   */
  constructor(handlers: ExternalStateHandler[]) {
    this.handlers = handlers;
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
    this.registry = new Registry<ExternalStateHandlerFunction>(
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
    for (const handler of this.handlers) {
      // Runtime check for 'ref' property is necessary despite TypeScript constraint because
      // the Swift bridge allows improperly formatted objects to bypass TypeScript validation.
      // We log this here and not in the constructor because the Logger is not yet available in the constructor.
      if (handler.match?.ref) {
        player.logger.warn(
          `An ExternalStateHandler contains a superfluous 'match.ref' property. 'match.ref' will be ignored. 'ref' will be used instead. Handler: ${JSON.stringify({ ref: handler.ref, match: handler.match })}`,
        );
        delete handler.match?.["ref"];
        continue;
      }
      // Registry will handle keeping only the last handlerFunction for each match
      this.registry?.set(
        { ref: handler.ref, ...handler.match },
        handler.handlerFunction,
      );
    }
  }
}

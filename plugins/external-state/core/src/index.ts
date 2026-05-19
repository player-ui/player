import type {
  Player,
  PlayerPlugin,
  InProgressState,
  PlayerFlowState,
  NavigationFlowState,
  NavigationFlowExternalState,
  ErrorController,
  FlowInstance,
} from "@player-ui/player";
import { Registry } from "@player-ui/partial-match-registry";
import { ExternalStatePluginSymbol } from "./symbols.js";
import { ExternalStateError } from "./ExternalStateError.js";

export { ExternalStateError } from "./ExternalStateError.js";
export type { ExternalStateErrorMetadata } from "./ExternalStateError.js";

export type ExternalStateHandlerMatch = Record<string, unknown>;

export type ExternalStateHandlerFunction = (
  state: NavigationFlowExternalState,
  options: InProgressState["controllers"],
) => string | undefined | Promise<string | undefined>;

export type ExternalStateHandler = {
  /** The name of the external state. This will appear as it's "ref" property in the DSL. */
  ref: string;
  /** Additional properties to match against the external state. */
  match?: ExternalStateHandlerMatch;
  /** The function to run when the external state is transitioned to. This should return the `ref` of the next state to transition to. */
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

  /** The error controller to use for this plugin.
   * Only the first instance of the plugin should tap the error controller hook.
   */
  private errorController?: ErrorController;

  /** Creates a new ExternalStatePlugin */
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

    player.hooks.errorController.tap(this.name, (errorController) => {
      this.errorController = errorController;
    });

    player.hooks.flowController.tap(this.name, (flowController) => {
      flowController.hooks.flow.tap(this.name, (flow) => {
        flow.hooks.afterTransition.tap(this.name, (flowInstance) => {
          this.handleAfterTransition(player, flowInstance);
        });
      });
    });
  }

  /**
   * Resolve an EXTERNAL state transition.
   */
  private async handleAfterTransition(
    player: Player,
    flowInstance: FlowInstance,
  ): Promise<void> {
    const toState = flowInstance.currentState;
    const currentState = player.getState();

    if (
      !toState ||
      !toState.value ||
      !isExternal(toState.value) ||
      !isInProgress(currentState)
    ) {
      return;
    }

    try {
      const handler = this.registry?.get(toState.value);

      if (!handler) {
        this.reportError(
          player,
          ExternalStateError.missingHandler(toState.value.ref),
        );
        return;
      }

      const transitionValue = await handler(
        toState.value,
        currentState.controllers,
      );

      if (!transitionValue) {
        this.reportError(
          player,
          ExternalStateError.missingTransitionValue(toState.value.ref),
        );
        return;
      }

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
    } catch (error) {
      // Thrown errors are treated as purposefully unrecoverable: fail the flow rather than 
      // routing through captureError.
      if (error instanceof Error) {
        currentState.fail(error);
      }
    }
  }

  /**
   * Report an ExternalStateError via the errorController.
   */
  private reportError(player: Player, error: ExternalStateError): void {
    // The compiler believes errorController could be nil, but in practice it should always 
    // be set by the time this method runs. The logger fallback exists only as defense 
    // against an unexpected lifecycle regression — if it ever fires, that's a bug to 
    // investigate, not normal operation.
    if (!this.errorController) {
      player.logger.error(
        `${error.message} (errorController was unexpectedly undefined; it should always be set by the time this code runs)`,
      );
      return;
    }

    this.errorController.captureError(error);
  }

  /**
   * Create or share the registry for this plugin instance.
   *
   * Uses the Player's plugin registry to find if another instance of ExternalStatePlugin
   * has already been registered. If found, this instance will share that plugin's registry.
   * Otherwise, this instance creates a new registry.
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

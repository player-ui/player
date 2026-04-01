import type {
  Player,
  PlayerPlugin,
  InProgressState,
  PlayerFlowState,
  NavigationFlowState,
  NavigationFlowExternalState,
} from "@player-ui/player";

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
 * A plugin to handle external actions states
 */
export class ExternalActionPlugin implements PlayerPlugin {
  name = "ExternalActionPlugin";
  private handler: ExternalStateHandler;

  constructor(handler: ExternalStateHandler) {
    this.handler = handler;
  }

  apply(player: Player): void {
    player.hooks.flowController.tap(this.name, (flowController) => {
      flowController.hooks.flow.tap(this.name, (flow) => {
        flow.hooks.afterTransition.tap(this.name, async (flowInstance) => {
          const state = flowInstance.currentState;
          const currentState = player.getState();

          if (
            state &&
            state.value &&
            isExternal(state.value) &&
            isInProgress(currentState)
          ) {
            try {
              const transitionValue = await this.handler(
                state.value,
                currentState.controllers,
              );

              if (transitionValue !== undefined) {
                const latestState = player.getState();

                // Ensure the Player is still in the same state after waiting for transitionValue
                if (
                  isInProgress(latestState) &&
                  latestState.controllers.flow.current?.currentState?.name ===
                    state.name
                ) {
                  latestState.controllers.flow.transition(transitionValue);
                } else {
                  player.logger.warn(
                    `External state resolved with [${transitionValue}], but Player already navigated away from [${state.name}]`,
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
}

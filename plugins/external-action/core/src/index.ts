import type {
  Player,
  PlayerPlugin,
  InProgressState,
  PlayerFlowState,
} from '@player-ui/player';
import type { NavigationFlowExternalState } from '@player-ui/types';

export type ExternalStateHandler = (
  state: NavigationFlowExternalState,
  options: InProgressState['controllers']
) => string | undefined | Promise<string | undefined>;

/**
 * A plugin to handle external actions states
 */
export class ExternalActionPlugin implements PlayerPlugin {
  name = 'ExternalActionPlugin';
  private handler: ExternalStateHandler;

  constructor(handler: ExternalStateHandler) {
    this.handler = handler;
  }

  apply(player: Player) {
    player.hooks.flowController.tap(this.name, (flowController) => {
      flowController.hooks.flow.tap(this.name, (flow) => {
        flow.hooks.transition.tap(this.name, (fromState, toState) => {
          const { value: state } = toState;
          if (state.state_type === 'EXTERNAL') {
            setTimeout(async () => {
              /** Helper for ensuring state is still current relative to external state this is handling */
              const shouldTransition = (
                currentState: PlayerFlowState
              ): currentState is InProgressState =>
                currentState.status === 'in-progress' &&
                currentState.controllers.flow.current?.currentState?.value ===
                  state;

              const currentState = player.getState();
              if (shouldTransition(currentState)) {
                try {
                  const transitionValue = await this.handler(
                    state,
                    currentState.controllers
                  );

                  if (transitionValue !== undefined) {
                    // Ensure the Player is still in the same state after waiting for transitionValue
                    const latestState = player.getState();
                    if (shouldTransition(latestState)) {
                      latestState.controllers.flow.transition(transitionValue);
                    } else {
                      player.logger.warn(
                        `External state resolved with [${transitionValue}], but Player already navigated away from [${toState.name}]`
                      );
                    }
                  }
                } catch (error) {
                  if (error instanceof Error) {
                    currentState.fail(error);
                  }
                }
              }
            }, 0);
          }
        });
      });
    });
  }
}

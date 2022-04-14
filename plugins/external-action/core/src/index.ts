import type { Player, PlayerPlugin, InProgressState } from '@player-ui/player';
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
              const currentState = player.getState();

              if (
                currentState.status === 'in-progress' &&
                currentState.controllers.flow.current?.currentState?.value ===
                  state
              ) {
                try {
                  const transitionValue = await this.handler(
                    state,
                    currentState.controllers
                  );

                  if (transitionValue !== undefined) {
                    currentState.controllers.flow.transition(transitionValue);
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

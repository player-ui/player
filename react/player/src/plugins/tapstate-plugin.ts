import type { PlayerFlowState, Player } from '@player-ui/player';
import type { WebPlayerPlugin } from '../player';

/**
 * A plugin to tap into state transition changes and call an arbitrary update function
 */
export class StateTapPlugin implements WebPlayerPlugin {
  name = 'statetap';
  private callbackFunction: (state: PlayerFlowState) => void;

  constructor(callback: (state: PlayerFlowState) => void) {
    this.callbackFunction = callback;
  }

  apply(player: Player) {
    player.hooks.state.tap('usePlayer', (newPlayerState: PlayerFlowState) => {
      this.callbackFunction(newPlayerState);
    });
  }
}

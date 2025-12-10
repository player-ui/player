import type { Player } from '@player-ui/player';

/**
 * A very basic repro plugin
 */
export class ReproPlugin {
  name = 'repro';

  apply(player: Player) {
    // Will not be logged on iOS
    player.logger.debug('[REPRO] [CORE] ReproPlugin entered');

    player.hooks.view.tap(this.name, () => {
      // Will be logged on iOS
      player.logger.debug('[REPRO] [CORE] In view hook');
    });

    // Will not be logged on iOS
    player.logger.debug('[REPRO] [CORE] ReproPlugin exited');
  }
}


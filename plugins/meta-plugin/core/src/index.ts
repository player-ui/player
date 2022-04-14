import type { Player, PlayerPlugin } from '@player-ui/player';

/**
 * A plugin that can wrap a set of other plugins.
 */
export class MetaPlugin implements PlayerPlugin {
  name = 'meta-plugin';

  public readonly plugins: Array<PlayerPlugin>;

  constructor(plugins: Array<PlayerPlugin> = []) {
    this.plugins = plugins;
  }

  apply(player: Player) {
    this.plugins.forEach((plugin) => player.registerPlugin(plugin));
  }
}

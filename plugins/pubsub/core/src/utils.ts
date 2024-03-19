import type { Player } from '@player-ui/player';
import { PubSubPlugin } from './plugin';
import { PubSubPluginSymbol } from './symbols';

/**
 * Returns the existing PubSubPlugin or creates and registers a new plugin
 */
export function getPubSubPlugin(player: Player) {
  const existing = player.findPlugin<PubSubPlugin>(PubSubPluginSymbol);
  const plugin = existing || new PubSubPlugin();

  if (!existing) {
    player.registerPlugin(plugin);
  }

  return plugin;
}

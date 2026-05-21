import type { Player } from "@player-ui/player";
import { ContextPlugin } from "./plugin";
import { ContextPluginSymbol } from "./symbols";

/**
 * Returns the existing ContextPlugin or creates and registers a new one.
 */
export function getContextPlugin(player: Player): ContextPlugin {
  const existing = player.findPlugin<ContextPlugin>(ContextPluginSymbol);
  const plugin = existing ?? new ContextPlugin();

  if (!existing) {
    player.registerPlugin(plugin);
  }

  return plugin;
}

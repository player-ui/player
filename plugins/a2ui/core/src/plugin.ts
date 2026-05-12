import type { Player, PlayerPlugin } from "@player-ui/player";
import { MetaPlugin } from "@player-ui/meta-plugin";
import {
  AsyncNodePlugin,
  AsyncNodePluginPlugin,
} from "@player-ui/async-node-plugin";
import { A2UITransformPlugin } from "./plugins";

/**
 * Registers transforms for the A2UI v0.9.1 reference assets so that snapshots
 * adapted via `adaptA2UIToFlow` resolve into render-ready Player assets.
 */
export class A2UIPlugin implements PlayerPlugin {
  name = "a2ui-plugin";

  private readonly metaPlugin = new MetaPlugin([
    new AsyncNodePlugin({ plugins: [new AsyncNodePluginPlugin()] }),
    new A2UITransformPlugin(),
  ]);

  apply(player: Player): void {
    player.registerPlugin(this.metaPlugin);
  }
}

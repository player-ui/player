import type { Player, PlayerPlugin } from "@player-ui/player";
import { MetaPlugin } from "@player-ui/meta-plugin";
import {
  AsyncNodePlugin,
  AsyncNodePluginPlugin,
} from "@player-ui/async-node-plugin";
import {
  A2UIContentPlugin,
  A2UIExpressionsPlugin,
  A2UITransformPlugin,
  A2UIValidationPlugin,
} from "./plugins";

/**
 * Registers transforms and standard expression functions for the A2UI v0.9.1
 * reference assets so that snapshots adapted via `adaptA2UIToFlow` resolve
 * into render-ready Player assets with working validators/formatters/actions.
 */
export class A2UIPlugin implements PlayerPlugin {
  name = "a2ui-plugin";

  private readonly metaPlugin = new MetaPlugin([
    new AsyncNodePlugin({ plugins: [new AsyncNodePluginPlugin()] }),
    new A2UIContentPlugin(),
    new A2UITransformPlugin(),
    new A2UIExpressionsPlugin(),
    new A2UIValidationPlugin(),
  ]);

  apply(player: Player): void {
    player.registerPlugin(this.metaPlugin);
  }
}

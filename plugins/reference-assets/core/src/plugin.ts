import type { Player, PlayerPlugin } from "@player-ui/player";
import { MetaPlugin } from "@player-ui/meta-plugin";
import { ChatUiDemoPlugin, ReferenceAssetsTransformPlugin } from "./plugins";
import {
  AsyncNodePlugin,
  AsyncNodePluginPlugin,
} from "@player-ui/async-node-plugin";

/**
 * A plugin to add transforms for the reference assets
 */
export class ReferenceAssetsPlugin implements PlayerPlugin {
  name = "reference-assets-plugin";

  private readonly metaPlugin = new MetaPlugin([
    new AsyncNodePlugin({
      plugins: [new AsyncNodePluginPlugin()],
    }),
    new ReferenceAssetsTransformPlugin(),
    new ChatUiDemoPlugin(),
  ]);

  apply(player: Player): void {
    player.registerPlugin(this.metaPlugin);
  }
}

import type { Player, PlayerPlugin } from "@player-ui/player";
import { MetaPlugin } from "@player-ui/meta-plugin";
import { ChatUiDemoPlugin, ReferenceAssetsTransformPlugin } from "./plugins";

const metaPlugin = new MetaPlugin([
  new ReferenceAssetsTransformPlugin(),
  new ChatUiDemoPlugin(),
]);

/**
 * A plugin to add transforms for the reference assets
 */
export class ReferenceAssetsPlugin implements PlayerPlugin {
  name = "reference-assets-plugin";

  apply(player: Player): void {
    player.registerPlugin(metaPlugin);
  }
}

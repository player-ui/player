import type { Player, PlayerPlugin } from "@player-ui/player";
import { MetaPlugin } from "@player-ui/meta-plugin";
import { ChatUiDemoPlugin, ReferenceAssetsTransformPlugin } from "./plugins";
import {
  AsyncNodePlugin,
  AsyncNodePluginPlugin,
} from "@player-ui/async-node-plugin";
import { CommonTypesPlugin } from "@player-ui/common-types-plugin";
import { CommonExpressionsPlugin } from "@player-ui/common-expressions-plugin";
import { ComputedPropertiesPlugin } from "@player-ui/computed-properties-plugin";
import { StageRevertDataPlugin } from "@player-ui/stage-revert-data-plugin";

/**
 * A plugin to add transforms for the reference assets
 */
export class ReferenceAssetsPlugin implements PlayerPlugin {
  name = "reference-assets-plugin";

  private readonly metaPlugin = new MetaPlugin([
    new CommonTypesPlugin(),
    new CommonExpressionsPlugin(),
    new ComputedPropertiesPlugin(),
    new StageRevertDataPlugin(),
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

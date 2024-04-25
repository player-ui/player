import type { Player, ExtendedPlayerPlugin } from "@player-ui/player";
import { AssetTransformPlugin } from "@player-ui/asset-transform-plugin";
import {
  inputTransform,
  actionTransform,
  imageTransform,
  infoTransform,
  ActionAsset,
  InputAsset,
  ImageAsset,
  InfoAsset,
} from "./assets";

/**
 * A plugin to add transforms for the reference assets
 */
export class ReferenceAssetsPlugin
  implements
    ExtendedPlayerPlugin<[ActionAsset, InputAsset, ImageAsset], [InfoAsset]>
{
  name = "reference-assets-transforms";

  apply(player: Player) {
    player.registerPlugin(
      new AssetTransformPlugin([
        [{ type: "action" }, actionTransform],
        [{ type: "input" }, inputTransform],
        [{ type: "image" }, imageTransform],
        [{ type: "info" }, infoTransform],
      ]),
    );
  }
}

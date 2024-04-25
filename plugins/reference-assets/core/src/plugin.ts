import type { Player, ExtendedPlayerPlugin } from "@player-ui/player";
import { AssetTransformPlugin } from "@player-ui/asset-transform-plugin";
import type {
  ActionAsset,
  InputAsset,
  ImageAsset,
  InfoAsset,
  TextAsset,
  CollectionAsset,
} from "./assets";
import {
  inputTransform,
  actionTransform,
  imageTransform,
  infoTransform,
} from "./assets";

/**
 * A plugin to add transforms for the reference assets
 */
export class ReferenceAssetsPlugin
  implements
    ExtendedPlayerPlugin<
      [ActionAsset, InputAsset, ImageAsset, TextAsset, CollectionAsset],
      [InfoAsset]
    >
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

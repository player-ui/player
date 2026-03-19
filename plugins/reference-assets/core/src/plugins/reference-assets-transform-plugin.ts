import type { ExtendedPlayerPlugin, Player } from "@player-ui/player";
import { AssetTransformPlugin } from "@player-ui/asset-transform-plugin";
import {
  actionTransform,
  chatMessageTransform,
  choiceTransform,
  imageTransform,
  infoTransform,
  inputTransform,
} from "../assets";
import type {
  ActionAsset,
  ChatMessageAsset,
  ChoiceAsset,
  CollectionAsset,
  ImageAsset,
  InfoAsset,
  InputAsset,
  TextAsset,
} from "../assets";

export class ReferenceAssetsTransformPlugin
  implements
    ExtendedPlayerPlugin<
      [
        ActionAsset,
        InputAsset,
        ImageAsset,
        TextAsset,
        CollectionAsset,
        ChoiceAsset,
        ChatMessageAsset,
      ],
      [InfoAsset]
    >
{
  name = "reference-assets-transforms";

  apply(player: Player): void {
    player.registerPlugin(
      new AssetTransformPlugin([
        [{ type: "action" }, actionTransform],
        [{ type: "input" }, inputTransform],
        [{ type: "image" }, imageTransform],
        [{ type: "info" }, infoTransform],
        [{ type: "choice" }, choiceTransform],
        [{ type: "chat-message" }, chatMessageTransform],
      ]),
    );
  }
}

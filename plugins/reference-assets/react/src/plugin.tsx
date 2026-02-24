import type {
  ReactPlayer,
  ReactPlayerPlugin,
  Player,
  ExtendedPlayerPlugin,
} from "@player-ui/react";
import { AssetProviderPlugin } from "@player-ui/asset-provider-plugin-react";
import type {
  InputAsset,
  TextAsset,
  CollectionAsset,
  ActionAsset,
  InfoAsset,
  ChoiceAsset,
  ThrowingAsset,
} from "@player-ui/reference-assets-plugin";
import { ReferenceAssetsPlugin as ReferenceAssetsCorePlugin } from "@player-ui/reference-assets-plugin";
import {
  Input,
  Text,
  Collection,
  Action,
  Info,
  Image,
  Choice,
  Throwing,
} from "./assets";

/**
 * A plugin to register the base reference assets
 */
export class ReferenceAssetsPlugin
  implements
    ReactPlayerPlugin,
    ExtendedPlayerPlugin<
      [
        InputAsset,
        TextAsset,
        ActionAsset,
        CollectionAsset,
        ChoiceAsset,
        ThrowingAsset,
      ],
      [InfoAsset]
    >
{
  name = "reference-assets-web-plugin";

  applyReact(reactPlayer: ReactPlayer): void {
    reactPlayer.registerPlugin(
      new AssetProviderPlugin([
        ["input", Input],
        ["text", Text],
        ["action", Action],
        ["info", Info],
        ["collection", Collection],
        ["image", Image],
        ["choice", Choice],
        ["throwing", Throwing],
      ]),
    );
  }

  apply(player: Player): void {
    player.registerPlugin(new ReferenceAssetsCorePlugin());
  }
}

import React from "react";
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
} from "@player-ui/reference-assets-plugin";
import { ReferenceAssetsPlugin as ReferenceAssetsCorePlugin } from "@player-ui/reference-assets-plugin";
import { Input, Text, Collection, Action, Info, Image, Choice } from "./assets";

/**
 * A plugin to register the base reference assets
 */
export class ReferenceAssetsPlugin
  implements
    ReactPlayerPlugin,
    ExtendedPlayerPlugin<
      [InputAsset, TextAsset, ActionAsset, CollectionAsset, ChoiceAsset],
      [InfoAsset]
    >
{
  name = "reference-assets-web-plugin";

  applyReact(reactPlayer: ReactPlayer) {
    reactPlayer.registerPlugin(
      new AssetProviderPlugin([
        ["input", Input],
        ["text", Text],
        ["action", Action],
        ["info", Info],
        ["collection", Collection],
        ["image", Image],
        ["choice", Choice],
      ]),
    );
  }

  apply(player: Player) {
    player.registerPlugin(new ReferenceAssetsCorePlugin());
  }
}

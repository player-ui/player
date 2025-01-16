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
import {
  Input,
  Text,
  Collection,
  Action,
  Info,
  Image,
  Choice,
  ChatMessageWrapper,
} from "./assets";
import {
  AsyncNodePlugin,
  AsyncNodePluginPlugin,
} from "@player-ui/async-node-plugin";
import { Node } from "@player-ui/player";

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
        ["chat-message-wrapper", ChatMessageWrapper],
      ]),
    );
  }

  apply(player: Player) {
    const asyncNodePlugin = new AsyncNodePlugin({
      plugins: [new AsyncNodePluginPlugin()],
    });

    let deferredResolve: ((value: any) => void) | undefined;

    let updateContent: any;

    asyncNodePlugin.hooks.onAsyncNode.tap(
      "test",
      async (node: Node.Async, update: (content: any) => void) => {
        const result = new Promise((resolve) => {
          deferredResolve = resolve; // Promise would be resolved only once
        });

        updateContent = update;
        // Return the result to follow the same mechanism as before
        return result;
      },
    );

    player.registerPlugin(asyncNodePlugin);
    player.registerPlugin(new ReferenceAssetsCorePlugin());
  }
}

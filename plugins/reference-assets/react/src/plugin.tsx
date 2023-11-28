import React from "react";
import type {
  ReactPlayer,
  ReactPlayerPlugin,
  Player,
  ExtendedPlayerPlugin,
} from "@player-ui/react";
import { AssetProviderPlugin } from "@player-ui/asset-provider-plugin-react";
import { ChakraProvider, useTheme } from "@chakra-ui/react";
import type {
  InputAsset,
  TextAsset,
  CollectionAsset,
  ActionAsset,
  InfoAsset,
} from "@player-ui/reference-assets-plugin";
import { ReferenceAssetsPlugin as ReferenceAssetsCorePlugin } from "@player-ui/reference-assets-plugin";
import { Input, Text, Collection, Action, Info, Image } from "./assets";

/**
 *
 */
const OptionalChakraThemeProvider = (
  props: React.PropsWithChildren<unknown>,
) => {
  const theme = useTheme();

  if (theme) {
    // eslint-disable-next-line react/jsx-no-useless-fragment
    return <>{props.children}</>;
  }

  return <ChakraProvider>{props.children}</ChakraProvider>;
};

/**
 * A plugin to register the base reference assets
 */
export class ReferenceAssetsPlugin
  implements
    ReactPlayerPlugin,
    ExtendedPlayerPlugin<
      [InputAsset, TextAsset, ActionAsset, CollectionAsset],
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
      ]),
    );

    reactPlayer.hooks.webComponent.tap(this.name, (Comp) => {
      return function ChakraThemeProviderWrapper() {
        return (
          <OptionalChakraThemeProvider>
            <Comp />
          </OptionalChakraThemeProvider>
        );
      };
    });
  }

  apply(player: Player) {
    player.registerPlugin(new ReferenceAssetsCorePlugin());
  }
}

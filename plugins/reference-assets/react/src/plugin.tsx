import React from 'react';
import type { WebPlayer, WebPlayerPlugin } from '@player-ui/react';
import type { Player } from '@player-ui/player';
import { AssetProviderPlugin } from '@player-ui/asset-provider-plugin-react';
import { ChakraProvider, useTheme } from '@chakra-ui/react';
import { ReferenceAssetsPlugin as ReferenceAssetsCorePlugin } from '@player-ui/reference-assets-plugin';
import { Input, Text, Collection, Action, Info } from './assets';

const OptionalChakraThemeProvider = (
  props: React.PropsWithChildren<unknown>
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
export class ReferenceAssetsPlugin implements WebPlayerPlugin {
  name = 'reference-assets-web-plugin';

  applyWeb(webplayer: WebPlayer) {
    webplayer.registerPlugin(
      new AssetProviderPlugin([
        ['input', Input],
        ['text', Text],
        ['action', Action],
        ['info', Info],
        ['collection', Collection],
      ])
    );

    webplayer.hooks.webComponent.tap(this.name, (Comp) => {
      return () => {
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

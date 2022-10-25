import { PlayerDecorator } from '@player-ui/storybook';
import { ReferenceAssetsPlugin } from '@player-ui/reference-assets-plugin-react';
import { CommonTypesPlugin } from '@player-ui/common-types-plugin';

export const parameters = {
  reactPlayerPlugins: [
    new ReferenceAssetsPlugin(),
    new CommonTypesPlugin(),
  ],
  options: {
    storySort: {
      order: [
        'Welcome',
        'Player',
        'Reference Assets',
        ['Overview', 'Intro'],
      ]
    }
  }
}

export const decorators = [PlayerDecorator];
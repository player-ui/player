import { PlayerDecorator } from '@player-ui/storybook';
import { ReferenceAssetsPlugin } from '@player-ui/reference-assets-plugin-react';
import { CommonTypesPlugin } from '@player-ui/common-types-plugin';
import { DataChangeListenerPlugin } from '@player-ui/data-change-listener-plugin';
import { ComputedPropertiesPlugin } from '@player-ui/computed-properties-plugin'
export const parameters = {
  reactPlayerPlugins: [
    new ReferenceAssetsPlugin(),
    new CommonTypesPlugin(),
    new DataChangeListenerPlugin(),
    new ComputedPropertiesPlugin(),
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
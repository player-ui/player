import { PlayerDecorator } from '@player-ui/storybook';
import { ReferenceAssetsPlugin } from '@player-ui/reference-assets-plugin-react';
import { CommonTypesPlugin } from '@player-ui/common-types-plugin';
import { DataChangeListenerPlugin } from '@player-ui/data-change-listener-plugin';
import { ComputedPropertiesPlugin } from '@player-ui/computed-properties-plugin'
import * as dslRefComponents from '@player-ui/reference-assets-components';

const reactPlayerPlugins = [
  new ReferenceAssetsPlugin(),
  new CommonTypesPlugin(),
  new DataChangeListenerPlugin(),
  new ComputedPropertiesPlugin(),
]

export const parameters = {
  reactPlayerPlugins,
  dslEditor: {
    additionalModules: {
      '@player-ui/reference-assets-components': dslRefComponents,
    },
  },
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
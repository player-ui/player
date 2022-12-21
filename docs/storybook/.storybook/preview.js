import { PlayerDecorator } from '@player-ui/storybook';
import { ReferenceAssetsPlugin } from '@player-ui/reference-assets-plugin-react';
import { CommonTypesPlugin } from '@player-ui/common-types-plugin';
import { DataChangeListenerPlugin } from '@player-ui/data-change-listener-plugin';
import { DevtoolsWebPlugin } from '@player-ui/devtools-plugin-react';
let number = 0;
export const parameters = {
  reactPlayerPlugins: [
    new ReferenceAssetsPlugin(),
    new CommonTypesPlugin(),
    new DataChangeListenerPlugin(),
    new DevtoolsWebPlugin(`player-${number++}`),
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
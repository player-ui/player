import type { InProgressState } from '@player-ui/player';
import { Player } from '@player-ui/player';
import { Registry } from '@player-ui/partial-match-registry';
import { PartialMatchFingerprintPlugin } from '@player-ui/partial-match-fingerprint-plugin';
import type { Flow } from '@player-ui/types';
import { mockMappers } from './helpers';
import { MarkdownPlugin } from '..';

const unparsedFlow: Flow = {
  id: 'markdown-flow',
  data: {
    internal: {
      locale: {
        linkMarkdown:
          'Learn more at [TurboTax Canada](https://turbotax.intuit.ca)',
      },
    },
  },
  views: [
    {
      id: 'markdown-view',
      type: 'questionAnswer',
      title: {
        asset: {
          id: 'markdown-view-title',
          type: 'markdown',
          value: '{{internal.locale.linkMarkdown}}',
        },
      },
      primaryInfo: {
        asset: {
          id: 'markdown-primaryInfo-collection',
          type: 'collection',
          values: [
            {
              asset: {
                id: 'markdown-primaryInfo-collection-bold',
                type: 'markdown',
                value: 'some **bold text**',
              },
            },
            {
              asset: {
                id: 'markdown-primaryInfo-collection-italic',
                type: 'markdown',
                value: '*italicized text*',
              },
            },
            {
              asset: {
                id: 'markdown-primaryInfo-collection-orderd-list',
                type: 'markdown',
                value: '1. First\n2. Second\n3. Third',
              },
            },
            {
              asset: {
                id: 'markdown-primaryInfo-collection-unorderd-list',
                type: 'markdown',
                value:
                  '- [First](https://turbotax.intuit.ca)\n- Second\n- Third',
              },
            },
            {
              asset: {
                id: 'markdown-primaryInfo-collection-image',
                type: 'markdown',
                value: '![alt text](image.png)',
              },
            },
            {
              asset: {
                id: 'markdown-primaryInfo-collection-unsupported',
                type: 'markdown',
                value: 'Highlights are ==not supported==',
              },
            },
          ],
        },
      },
    },
  ],
  navigation: {
    BEGIN: 'FLOW_1',
    FLOW_1: {
      startState: 'VIEW_1',
      VIEW_1: {
        state_type: 'VIEW',
        ref: 'markdown-view',
        transitions: {
          '*': 'END_Done',
        },
      },
      END_Done: {
        state_type: 'END',
        outcome: 'done',
      },
    },
  },
};

describe('MarkdownPlugin', () => {
  it('parses the flow containing markdown into valid FRF, based on the given mappers', () => {
    const player = new Player({
      plugins: [new MarkdownPlugin(mockMappers)],
    });
    player.start(unparsedFlow);

    const view = (player.getState() as InProgressState).controllers.view
      .currentView?.lastUpdate;

    expect(view).toMatchSnapshot();
  });

  it('parses the flow, with only the required mappers', () => {
    const player = new Player({
      plugins: [
        new MarkdownPlugin({
          text: mockMappers.text,
          paragraph: mockMappers.paragraph,
        }),
      ],
    });
    player.start(unparsedFlow);

    const view = (player.getState() as InProgressState).controllers.view
      .currentView?.lastUpdate;

    expect(view).toMatchSnapshot();
  });

  it('parses regular flow and maps assets', () => {
    const fingerprint = new PartialMatchFingerprintPlugin(new Registry());

    fingerprint.register({ type: 'action' }, 0);
    fingerprint.register({ type: 'text' }, 1);
    fingerprint.register({ type: 'composite' }, 2);

    const player = new Player({
      plugins: [fingerprint, new MarkdownPlugin(mockMappers)],
    });

    player.start({
      id: 'action-with-expression',
      views: [
        {
          id: 'action',
          type: 'action',
          exp: '{{count}} = {{count}} + 1',
          label: {
            asset: {
              id: 'action-label',
              type: 'markdown',
              value: 'Clicked {{count}} *times*',
            },
          },
        },
      ],
      data: {
        count: 0,
      },
      navigation: {
        BEGIN: 'FLOW_1',
        FLOW_1: {
          startState: 'VIEW_1',
          VIEW_1: {
            state_type: 'VIEW',
            ref: 'action',
            transitions: {
              '*': 'END_Done',
            },
          },
          END_Done: {
            state_type: 'END',
            outcome: 'done',
          },
        },
      },
    });

    // the parser should create 2 text assets: `Clicked {{count}}` and a italicized `times`:
    expect(fingerprint.get('action-label-text-38')).toBe(1);
    expect(fingerprint.get('action-label-text-39')).toBe(1);
  });
});

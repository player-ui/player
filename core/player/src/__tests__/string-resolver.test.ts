import { describe, it, expect } from 'vitest';
import type { Flow } from '@player-ui/types';
import type { InProgressState } from '..';
import { Player } from '..';
import { AssetTransformPlugin } from './helpers/transform-plugin';

describe('AssetTransformPlugin allows custom skipped properties', () => {
  const skippableContent: Flow<any> = {
    id: 'test-flow',
    views: [
      {
        id: 'my-view',
        actions: [
          {
            asset: {
              id: 'next-label-action',
              type: 'skip',
              value: '{{foo}}',
              label: {
                asset: {
                  id: 'someID',
                  type: 'skip',
                  nestedProp: '{{foo}}',
                },
              },
            },
          },
          {
            asset: {
              id: 'last-item-label-action',
              type: 'skip',
              value: '{{foo}}',
              label: {
                asset: {
                  id: 'someID',
                  type: 'skip',
                  nestedProp: '{{foo}}',
                },
              },
            },
          },
          {
            asset: {
              id: 'prev-label-action',
              type: 'skip-parent',
              value: '{{foo}}',
              label: {
                asset: {
                  id: 'someID',
                  type: 'no-skip',
                  nestedProp: '{{foo}}',
                },
              },
            },
          },
        ],
      },
    ],
    data: {
      foo: 'bar',
    },
    navigation: {
      BEGIN: 'FLOW_1',
      FLOW_1: {
        startState: 'VIEW_1',
        VIEW_1: {
          state_type: 'VIEW',
          ref: 'my-view',
          transitions: {},
        },
      },
    },
  };

  it('skips string resolution per asset type', () => {
    const player = new Player({
      plugins: [
        new AssetTransformPlugin([
          [
            { type: 'skip' },
            {
              beforeResolve: (asset) => {
                return {
                  ...asset,
                  plugins: {
                    stringResolver: {
                      propertiesToSkip: ['nestedProp', 'value'],
                    },
                  },
                };
              },
              resolve: (asset) => ({ ...asset }),
            },
          ],
        ]),
      ],
    });

    player.start(skippableContent);

    const view = (player.getState() as InProgressState).controllers.view
      .currentView?.lastUpdate;
    /** Skips the specified properties, including child properties of the same asset type */
    expect(view?.actions[0].asset).toStrictEqual({
      id: 'next-label-action',
      type: 'skip',
      value: '{{foo}}',
      label: {
        asset: {
          id: 'someID',
          type: 'skip',
          nestedProp: '{{foo}}',
        },
      },
    });
    /** Skips sibling props of the same asset type */
    expect(view?.actions[1].asset).toStrictEqual({
      id: 'last-item-label-action',
      type: 'skip',
      value: '{{foo}}',
      label: {
        asset: {
          id: 'someID',
          type: 'skip',
          nestedProp: '{{foo}}',
        },
      },
    });
    /** Shouldn't skip sibling with different asset type */
    expect(view?.actions[2].asset).toStrictEqual({
      id: 'prev-label-action',
      type: 'skip-parent',
      value: 'bar',
      label: {
        asset: {
          id: 'someID',
          type: 'no-skip',
          nestedProp: 'bar',
        },
      },
    });
  });

  it("shouldn't skip child with a different asset type", () => {
    const player = new Player({
      plugins: [
        new AssetTransformPlugin([
          [
            { type: 'skip-parent' },
            {
              beforeResolve: (asset) => {
                return {
                  ...asset,
                  plugins: {
                    stringResolver: {
                      propertiesToSkip: ['nestedProp', 'value'],
                    },
                  },
                };
              },
              resolve: (asset) => ({ ...asset }),
            },
          ],
        ]),
      ],
    });

    player.start(skippableContent);

    const view = (player.getState() as InProgressState).controllers.view
      .currentView?.lastUpdate;

    expect(view?.actions[2].asset).toStrictEqual({
      id: 'prev-label-action',
      type: 'skip-parent',
      value: '{{foo}}',
      label: {
        asset: {
          id: 'someID',
          type: 'no-skip',
          nestedProp: 'bar',
        },
      },
    });
  });
});

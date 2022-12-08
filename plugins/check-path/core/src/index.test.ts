import { waitFor } from '@testing-library/react';
import type { DataController, InProgressState } from '@player-ui/player';
import { Player } from '@player-ui/player';
import type { TransformFunction } from '@player-ui/player';
import { makeFlow } from '@player-ui/make-flow';
import { AssetTransformPlugin } from '@player-ui/asset-transform-plugin';
import { CheckPathPlugin as CheckPathPluginWASM } from '@player-ui/check-path-plugin-wasm';
import type { Asset, AssetWrapper } from '@player-ui/types';
import { CheckPathPlugin } from '.';

const nestedAssetFlow = makeFlow({
  id: 'view-1',
  type: 'view',
  fields: {
    asset: {
      id: 'fields',
      type: 'collection',
      metaData: {
        role: 'awesome',
      },
      values: [
        {
          asset: {
            id: 'coll-val-1',
            type: 'input',
            label: {
              asset: {
                id: 'coll-val-1-label',
                type: 'text',
              },
            },
          },
        },
        {
          asset: {
            id: 'coll-val-2',
            type: 'collection',
            values: [
              {
                asset: {
                  id: 'coll-val-2-1',
                  type: 'choice',
                },
              },
            ],
          },
        },
      ],
    },
  },
});

const applicableFlow = makeFlow({
  id: 'view-1',
  type: 'view',
  fields: {
    asset: {
      id: 'fields',
      values: [
        {
          asset: {
            id: 'asset-1',
            type: 'asset',
          },
        },
        {
          asset: {
            id: 'asset-2',
            applicability: '{{foo.bar}}',
            type: 'asset',
          },
        },
        {
          asset: {
            id: 'asset-3',
            type: 'asset',
          },
        },
        {
          asset: {
            id: 'asset-4',
            applicability: '{{foo.baz}}',
            type: 'asset',
            values: [
              {
                asset: {
                  id: 'asset-4a',
                  type: 'asset',
                },
              },
            ],
          },
        },
      ],
    },
  },
});

interface ViewAsset extends Asset<'view'> {
  /**
   *
   */
  fields?: AssetWrapper;
}

interface TransformedView extends ViewAsset {
  /**
   *
   */
  run: () => string;
}

/**
 *
 */
const ViewTransform: TransformFunction<ViewAsset, TransformedView> = (
  view
) => ({
  ...view,
  run() {
    return 'hello';
  },
});

describe('check path plugin', () => {
  let player: Player;
  const checkPathPlugin = new CheckPathPlugin();
  const checkPathPluginWASM = new CheckPathPluginWASM();

  beforeEach(() => {
    player = new Player({
      plugins: [
        new AssetTransformPlugin([[{ type: 'view' }, ViewTransform]]),
        checkPathPlugin,
        checkPathPluginWASM,
      ],
    });
    player.start(nestedAssetFlow);
  });

  test.each([
    ['JS', checkPathPlugin],
    ['WASM', checkPathPluginWASM],
  ])('getAsset - %s', (type, instance) => {
    const view = instance.getAsset('view-1') as TransformedView;
    expect(view).toBeDefined();
    expect(view.run()).toStrictEqual('hello');
  });

  test.each([
    ['JS', checkPathPlugin],
    ['WASM', checkPathPluginWASM],
  ])('getAsset after setting data - %s', (_, instance) => {
    (player.getState() as InProgressState).controllers.data.set({ count: 5 });
    const view = instance.getAsset('view-1') as TransformedView;
    expect(view).toBeDefined();
    expect(view.run()).toStrictEqual('hello');
  });

  test.each([
    ['JS', checkPathPlugin],
    ['WASM', checkPathPluginWASM],
  ])('path - %s', (_, instance) => {
    expect(instance.getPath('view-1')).toStrictEqual([]);
    expect(instance.getPath('fields')).toStrictEqual(['fields', 'asset']);
    expect(instance.getPath('coll-val-2-1')).toStrictEqual([
      'fields',
      'asset',
      'values',
      1,
      'asset',
      'values',
      0,
      'asset',
    ]);
    expect(
      instance.getPath('coll-val-2-1', { type: 'collection' })
    ).toStrictEqual(['values', 0, 'asset']);
    expect(
      instance.getPath('coll-val-2-1', [
        { type: 'collection' },
        { type: 'view' },
      ])
    ).toStrictEqual([
      'fields',
      'asset',
      'values',
      1,
      'asset',
      'values',
      0,
      'asset',
    ]);
    expect(
      instance.getPath('coll-val-2-1', [
        { type: 'collection' },
        { type: 'collection' },
      ])
    ).toStrictEqual(['values', 1, 'asset', 'values', 0, 'asset']);
    expect(
      instance.getPath('coll-val-1-label', { type: 'input' })
    ).toStrictEqual(['label', 'asset']);
  });

  describe('hasParentContext', () => {
    it.each([
      ['JS', checkPathPlugin],
      ['WASM', checkPathPluginWASM],
    ])('works for types - %s', (_, instance) => {
      expect(instance.hasParentContext('coll-val-1', 'collection')).toBe(true);

      expect(instance.hasParentContext('coll-val-1-label', 'view')).toBe(true);

      expect(
        instance.hasParentContext('coll-val-2-1', [
          'collection',
          'collection',
          'view',
        ])
      ).toBe(true);

      expect(
        instance.hasParentContext('coll-val-2-1', [
          'collection',
          'collection',
          'nah-view',
        ])
      ).toBe(false);
    });

    it.each([
      ['JS', checkPathPlugin],
      ['WASM', checkPathPluginWASM],
    ])('works for objects - %s', (_, instance) => {
      expect(
        instance.hasParentContext('coll-val-1', {
          metaData: { role: 'awesome' },
        })
      ).toBe(true);

      expect(
        instance.hasParentContext('coll-val-1', {
          metaData: { role: 'not-awesome' },
        })
      ).toBe(false);
    });
  });

  describe('hasChildContext', () => {
    it.each([
      ['JS', checkPathPlugin],
      ['WASM', checkPathPluginWASM],
    ])('works for types - %s', (_, instance) => {
      expect(instance.hasChildContext('coll-val-1', 'text')).toBe(true);
      expect(instance.hasChildContext('coll-val-1', 'input')).toBe(false);
    });

    it.each([
      ['JS', checkPathPlugin],
      ['WASM', checkPathPluginWASM],
    ])('returns false for non-existent assets - %s', (_, instance) => {
      expect(instance.hasChildContext('not-there', 'text')).toBe(false);
    });

    it.each([
      ['JS', checkPathPlugin],
      ['WASM', checkPathPluginWASM],
    ])('works for empty arrays - %s', (_, instance) => {
      expect(instance.hasChildContext('coll-val-1', [])).toBe(true);
    });

    it.each([
      ['JS', checkPathPlugin],
      ['WASM', checkPathPluginWASM],
    ])('works for functions - %s', (_, instance) => {
      expect(
        instance.hasChildContext('view-1', [
          (val: any) => val.values?.length === 1,
          { id: 'coll-val-2-1' },
        ])
      ).toBe(true);
    });
  });

  describe('getParentProp', () => {
    it.each([
      ['JS', checkPathPlugin],
      ['WASM', checkPathPluginWASM],
    ])('works for simple things - %s', (_, instance) => {
      expect(instance.getParentProp('coll-val-1')).toBe('values');
      expect(instance.getParentProp('coll-val-1-label')).toBe('label');
      expect(instance.getParentProp('not-there')).toBeUndefined();
      expect(instance.getParentProp('view-1')).toBeUndefined();
    });
  });

  describe('parent', () => {
    it.each([
      ['JS', checkPathPlugin],
      ['WASM', checkPathPluginWASM],
    ])('works without a second arg - %s', (_, instance) => {
      expect(instance.getParent('coll-val-2')?.id).toBe('fields');
    });

    it.each([
      ['JS', checkPathPlugin],
      ['WASM', checkPathPluginWASM],
    ])('handles non-existent node id - %s', (_, instance) => {
      expect(instance.getParent('not-there')).toBeUndefined();
    });

    it.each([
      ['JS', checkPathPlugin],
      ['WASM', checkPathPluginWASM],
    ])('handles the root node not having a parent - %s', (_, instance) => {
      expect(instance.getParent('view-1')).toBeUndefined();
    });
  });
});

describe('works with applicability', () => {
  let player: Player;
  const checkPathPlugin = new CheckPathPlugin();
  const checkPathPluginWASM = new CheckPathPluginWASM();
  let dataController: DataController;

  beforeEach(() => {
    player = new Player({
      plugins: [checkPathPlugin],
    });
    player.start(applicableFlow);
    dataController = (player.getState() as InProgressState).controllers.data;
  });

  test.each([
    ['JS', checkPathPlugin],
    ['WASM', checkPathPluginWASM],
  ])('path - %s', async (_, instance) => {
    expect(instance.getPath('asset-2')).toBeUndefined();
    expect(instance.getPath('asset-3')).toStrictEqual([
      'fields',
      'asset',
      'values',
      1,
      'asset',
    ]);

    dataController.set([
      ['foo.bar', true],
      ['foo.baz', true],
    ]);
    await waitFor(() =>
      expect(instance.getPath('asset-2')).toStrictEqual([
        'fields',
        'asset',
        'values',
        1,
        'asset',
      ])
    );

    expect(instance.getPath('asset-3')).toStrictEqual([
      'fields',
      'asset',
      'values',
      2,
      'asset',
    ]);
    expect(instance.getPath('asset-4a')).toStrictEqual([
      'fields',
      'asset',
      'values',
      3,
      'asset',
      'values',
      0,
      'asset',
    ]);
  });

  test.each([
    ['JS', checkPathPlugin],
    ['WASM', checkPathPluginWASM],
  ])('getAsset - %s', async (_, instance) => {
    expect(instance.getAsset('asset-4')).toBeUndefined();

    dataController.set([['foo.baz', true]]);
    await waitFor(() => {
      expect(instance.getAsset('asset-4')).toBeDefined();
    });
  });
});

describe('handles non-initialized player', () => {
  test.each([
    ['JS', new CheckPathPlugin()],
    ['WASM', new CheckPathPluginWASM()],
  ])('hasParentContext - %s', (_, instance) => {
    expect(instance.hasParentContext('foo', 'bar')).toBe(false);
  });

  test.each([
    ['JS', new CheckPathPlugin()],
    ['WASM', new CheckPathPluginWASM()],
  ])('hasChildContext - %s', (_, instance) => {
    expect(instance.hasChildContext('foo', 'bar')).toBe(false);
  });

  test.each([
    ['JS', new CheckPathPlugin()],
    ['WASM', new CheckPathPluginWASM()],
  ])('getParentProp - %s', (_, instance) => {
    expect(instance.getParentProp('foo')).toBeUndefined();
  });

  test.each([
    ['JS', new CheckPathPlugin()],
    ['WASM', new CheckPathPluginWASM()],
  ])('parent - %s', (_, instance) => {
    expect(instance.getParent('foo', 'bar')).toBeUndefined();
  });
});

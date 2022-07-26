import { waitFor } from '@testing-library/react';
import type { DataController, InProgressState } from '@player-ui/player';
import { Player } from '@player-ui/player';
import type { TransformFunction } from '@player-ui/player';
import { makeFlow } from '@player-ui/make-flow';
import { AssetTransformPlugin } from '@player-ui/asset-transform-plugin';
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
  let checkPathPlugin: CheckPathPlugin;

  beforeEach(() => {
    checkPathPlugin = new CheckPathPlugin();
    player = new Player({
      plugins: [
        new AssetTransformPlugin([[{ type: 'view' }, ViewTransform]]),
        checkPathPlugin,
      ],
    });
    player.start(nestedAssetFlow);
  });

  test('getAsset', () => {
    const view = checkPathPlugin.getAsset('view-1') as TransformedView;
    expect(view).toBeDefined();
    expect(view.run()).toStrictEqual('hello');
  });

  test('getAsset after setting data', () => {
    (player.getState() as InProgressState).controllers.data.set({ count: 5 });
    const view = checkPathPlugin.getAsset('view-1') as TransformedView;
    expect(view).toBeDefined();
    expect(view.run()).toStrictEqual('hello');
  });

  test('path', () => {
    expect(checkPathPlugin.getPath('view-1')).toStrictEqual([]);
    expect(checkPathPlugin.getPath('fields')).toStrictEqual([
      'fields',
      'asset',
    ]);
    expect(checkPathPlugin.getPath('coll-val-2-1')).toStrictEqual([
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
      checkPathPlugin.getPath('coll-val-2-1', { type: 'collection' })
    ).toStrictEqual(['values', 0, 'asset']);
    expect(
      checkPathPlugin.getPath('coll-val-2-1', [
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
      checkPathPlugin.getPath('coll-val-2-1', [
        { type: 'collection' },
        { type: 'collection' },
      ])
    ).toStrictEqual(['values', 1, 'asset', 'values', 0, 'asset']);
    expect(
      checkPathPlugin.getPath('coll-val-1-label', { type: 'input' })
    ).toStrictEqual(['label', 'asset']);
  });

  describe('hasParentContext', () => {
    it('works for types', () => {
      expect(checkPathPlugin.hasParentContext('coll-val-1', 'collection')).toBe(
        true
      );

      expect(checkPathPlugin.hasParentContext('coll-val-1-label', 'view')).toBe(
        true
      );

      expect(
        checkPathPlugin.hasParentContext('coll-val-2-1', [
          'collection',
          'collection',
          'view',
        ])
      ).toBe(true);

      expect(
        checkPathPlugin.hasParentContext('coll-val-2-1', [
          'collection',
          'collection',
          'nah-view',
        ])
      ).toBe(false);
    });

    it('works for objects', () => {
      expect(
        checkPathPlugin.hasParentContext('coll-val-1', {
          metaData: { role: 'awesome' },
        })
      ).toBe(true);

      expect(
        checkPathPlugin.hasParentContext('coll-val-1', {
          metaData: { role: 'not-awesome' },
        })
      ).toBe(false);
    });
  });

  describe('hasChildContext', () => {
    it('works for types', () => {
      expect(checkPathPlugin.hasChildContext('coll-val-1', 'text')).toBe(true);
      expect(checkPathPlugin.hasChildContext('coll-val-1', 'input')).toBe(
        false
      );
    });

    it('returns false for non-existent assets', () => {
      expect(checkPathPlugin.hasChildContext('not-there', 'text')).toBe(false);
    });

    it('works for empty arrays', () => {
      expect(checkPathPlugin.hasChildContext('coll-val-1', [])).toBe(true);
    });

    it('works for functions', () => {
      expect(
        checkPathPlugin.hasChildContext('view-1', [
          (val: any) => val.values?.length === 1,
          { id: 'coll-val-2-1' },
        ])
      ).toBe(true);
    });
  });

  describe('getParentProp', () => {
    it('works for simple things', () => {
      expect(checkPathPlugin.getParentProp('coll-val-1')).toBe('values');
      expect(checkPathPlugin.getParentProp('coll-val-1-label')).toBe('label');
      expect(checkPathPlugin.getParentProp('not-there')).toBeUndefined();
      expect(checkPathPlugin.getParentProp('view-1')).toBeUndefined();
    });
  });

  describe('parent', () => {
    it('works without a second arg', () => {
      expect(checkPathPlugin.getParent('coll-val-2')?.id).toBe('fields');
    });

    it('handles non-existent node id', () => {
      expect(checkPathPlugin.getParent('not-there')).toBeUndefined();
    });

    it('handles the root node not having a parent', () => {
      expect(checkPathPlugin.getParent('view-1')).toBeUndefined();
    });
  });
});

describe('works with applicability', () => {
  let player: Player;
  let checkPathPlugin: CheckPathPlugin;
  let dataController: DataController;

  beforeEach(() => {
    checkPathPlugin = new CheckPathPlugin();
    player = new Player({
      plugins: [checkPathPlugin],
    });
    player.start(applicableFlow);
    dataController = (player.getState() as InProgressState).controllers.data;
  });

  test('path', async () => {
    expect(checkPathPlugin.getPath('asset-2')).toBeUndefined();
    expect(checkPathPlugin.getPath('asset-3')).toStrictEqual([
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
      expect(checkPathPlugin.getPath('asset-2')).toStrictEqual([
        'fields',
        'asset',
        'values',
        1,
        'asset',
      ])
    );

    expect(checkPathPlugin.getPath('asset-3')).toStrictEqual([
      'fields',
      'asset',
      'values',
      2,
      'asset',
    ]);
    expect(checkPathPlugin.getPath('asset-4a')).toStrictEqual([
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
});

describe('handles non-initialized player', () => {
  let checkPathPlugin: CheckPathPlugin;

  beforeEach(() => {
    checkPathPlugin = new CheckPathPlugin();
  });

  test('hasParentContext', () => {
    expect(checkPathPlugin.hasParentContext('foo', 'bar')).toBe(false);
  });

  test('hasChildContext', () => {
    expect(checkPathPlugin.hasChildContext('foo', 'bar')).toBe(false);
  });

  test('getParentProp', () => {
    expect(checkPathPlugin.getParentProp('foo')).toBeUndefined();
  });

  test('parent', () => {
    expect(checkPathPlugin.getParent('foo', 'bar')).toBeUndefined();
  });
});

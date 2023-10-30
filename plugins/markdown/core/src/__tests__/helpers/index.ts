import type { Asset, AssetWrapper } from '@player-ui/types';
import type { Mappers } from '../../types';

// Mock Asset Plugin implementation of the markdown plugin:

let depth = 0;

/**
 * Wrap an Asset in an AssetWrapper
 */
function wrapAsset(asset: Asset): AssetWrapper {
  return {
    asset,
  };
}

/**
 * Flatten a composite Asset with a single element
 */
function flatSingleElementCompositeAsset(asset: Asset): Asset {
  if (asset.type === 'composite' && (asset.values as Asset[]).length === 1) {
    return (asset.values as AssetWrapper[])[0].asset;
  }

  return asset;
}

/**
 * Recursively applies a modifier to an Asset and its children.
 */
function applyModifierToAssets({
  types,
  asset,
  modifiers,
}: {
  /**
   *  Types of Assets to apply the modifier to
   */
  types: string[];
  /**
   * Asset to be modified
   */
  asset: Asset;
  /**
   * Modifiers to be applied to the Asset
   */
  modifiers: any[];
}): Asset {
  let modifiedAsset = asset;
  if (types.includes(asset.type)) {
    modifiedAsset = {
      ...asset,
      modifiers: [...((asset.modifiers as any) || []), ...modifiers],
    };
  }

  if (asset.values) {
    modifiedAsset = {
      ...modifiedAsset,
      values: (asset.values as Asset[]).map((a) =>
        applyModifierToAssets({ types, asset: a, modifiers })
      ),
    };
  }

  return modifiedAsset;
}

export const mockMappers: Mappers = {
  text: ({ originalAsset, value }) => ({
    id: `${originalAsset.id}-text-${depth++}`,
    type: 'text',
    value,
  }),
  collection: ({ originalAsset, value }) => ({
    id: `${originalAsset.id}-collection-${depth++}`,
    type: 'collection',
    values: value.map(wrapAsset),
  }),
  strong: ({ originalAsset, value }) =>
    flatSingleElementCompositeAsset({
      id: `${originalAsset.id}-text-${depth++}`,
      type: 'composite',
      values: value.map((v) =>
        wrapAsset(
          applyModifierToAssets({
            asset: v,
            types: ['text'],
            modifiers: [
              {
                type: 'tag',
                value: 'important',
              },
            ],
          })
        )
      ),
    }),
  emphasis: ({ originalAsset, value }) =>
    flatSingleElementCompositeAsset({
      id: `${originalAsset.id}-text-${depth++}`,
      type: 'composite',
      values: value.map((v) =>
        wrapAsset(
          applyModifierToAssets({
            asset: v,
            types: ['text'],
            modifiers: [
              {
                type: 'tag',
                value: 'emphasis',
              },
            ],
          })
        )
      ),
    }),
  paragraph: ({ originalAsset, value }) =>
    flatSingleElementCompositeAsset({
      id: `${originalAsset.id}-composite-${depth++}`,
      type: 'composite',
      values: value.map(wrapAsset),
    }),
  list: ({ originalAsset, value, ordered }) => ({
    id: `${originalAsset.id}-list-${depth++}`,
    type: 'list',
    values: value.map(wrapAsset),
    ...(ordered && { metaData: { listType: 'ordered' } }),
  }),
  image: ({ originalAsset, value, src }) => ({
    id: `${originalAsset.id}-image-${depth++}`,
    type: 'image',
    accessibility: value,
    metaData: {
      ref: src,
    },
  }),
  link: ({ originalAsset, value, href }) =>
    flatSingleElementCompositeAsset({
      id: `${originalAsset.id}-link-${depth++}`,
      type: 'composite',
      values: value.map((v) =>
        wrapAsset(
          applyModifierToAssets({
            asset: v,
            types: ['text', 'image'],
            modifiers: [
              {
                type: 'link',
                metaData: {
                  ref: href,
                },
              },
            ],
          })
        )
      ),
    }),
};

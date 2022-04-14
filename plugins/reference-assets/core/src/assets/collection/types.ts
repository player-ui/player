import type { AssetWrapper, Asset } from '@player-ui/player';

export interface CollectionAsset extends Asset<'collection'> {
  /** An optional label to title the collection */
  label?: AssetWrapper;
  /** The string value to show */
  values?: Array<AssetWrapper>;
}

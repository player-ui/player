import type { AssetWrapper, Asset, Node } from "@player-ui/player";

export type AsyncNodeHandler = (
  node: Node.Node,
  update: (object: any) => void,
) => void;

export interface AsyncNodeWrapperAsset extends Asset {
  /** The string value to show */
  values?: Array<AssetWrapper> | Array<Asset>;
}

export interface AssetType extends Asset {
  /** Flatten flag */
  flatten?: boolean | false;
}

export type AsyncTransformFunc = (
  asset: Node.Asset<AssetType> | Node.View<AssetType>,
  transformedAssetType: string,
) => Node.Node;

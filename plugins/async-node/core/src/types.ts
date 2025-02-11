import type { Asset, Node } from "@player-ui/player";

export type AsyncNodeHandler = (
  node: Node.Node,
  update: (object: any) => void,
) => void;

export interface AssetType extends Asset {
  /** Flatten flag */
  flatten?: boolean | false;
}

export type AsyncTransformFunc = (
  asset: Node.Asset | Node.View,
  transformedAssetType: string,
  wrapperAssetType: string,
) => Node.Node;

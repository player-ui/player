import type { Asset, Node } from "@player-ui/player";

export type AsyncNodeHandler = (
  node: Node.Node,
  update: (object: any) => void,
) => void;

export type AsyncTransformFunc = (
  id: string,
  wrapperAssetType: string,
  asset?: Asset,
  flatten?: boolean,
) => Node.Node;

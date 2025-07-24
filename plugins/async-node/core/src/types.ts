import type { BeforeTransformFunction, Node } from "@player-ui/player";

export type AsyncNodeHandler = (
  node: Node.Node,
  update: (object: any) => void,
) => void;

export type AsyncTransformFunc = (
  id: string,
  wrapperAssetType: string,
  asset?: Node.Node,
  flatten?: boolean,
  path?: string[],
  me?: BeforeTransformFunction<any>,
) => Node.Asset;

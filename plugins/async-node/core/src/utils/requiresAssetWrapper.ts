import { NodeType } from "@player-ui/player";
import type { Node } from "@player-ui/player";

export const requiresAssetWrapper = (node: Node.Node): boolean => {
  if (node.type === NodeType.Asset) {
    return true;
  }

  if (node.type !== NodeType.Applicability) {
    return false;
  }

  return node.value.type === NodeType.Asset;
};

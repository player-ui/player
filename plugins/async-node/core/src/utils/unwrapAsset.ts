import { NodeType, Node } from "@player-ui/player";

export const unwrapAsset = (node: Node.Node): Node.Node => {
  if (node.type !== NodeType.Value) {
    return node;
  }
  const child = node.children?.find(
    (x) => x.path.length === 1 && x.path[0] === "asset",
  );

  if (!child) {
    return node;
  }

  return child.value;
};

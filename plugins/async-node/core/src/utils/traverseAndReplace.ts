import { NodeType, Node } from "@player-ui/player";

/** Replaces a node using the given replace function. If the node is a multi-node it does this transformation to all of its values. */
export const traverseAndReplace = (
  node: Node.Node,
  replaceFn: (node: Node.Node) => Node.Node,
): Node.Node => {
  if (node.type === NodeType.MultiNode) {
    let index = 0;
    while (index < node.values.length) {
      const child = node.values[index];
      if (!child) {
        index++;
        continue;
      }

      const result = replaceFn(child);
      if (result.type === NodeType.MultiNode) {
        node.values = [
          ...node.values.slice(0, index),
          ...result.values,
          ...node.values.slice(index + 1),
        ];
      } else {
        node.values[index] = result;
        index++;
      }
    }

    return node;
  }

  return replaceFn(node);
};

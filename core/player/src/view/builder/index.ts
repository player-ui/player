import type { Node, AnyAssetType } from "../parser";
import { NodeType } from "../parser";

/**
 * Functions for building AST nodes (relatively) easily
 */
export class Builder {
  /**
   * Creates an asset node
   *
   * @param value - the value to put in the asset node
   */
  static asset<T extends AnyAssetType>(value: T): Node.Asset<T> {
    return {
      type: NodeType.Asset,
      value,
    };
  }

  static assetWrapper<T extends Node.Node>(value: T): Node.Value {
    const valueNode = Builder.value();
    Builder.addChild(valueNode, "asset", value);
    return valueNode;
  }

  /**
   * Creates a value node
   *
   * @param v - The object to put in the value node
   */
  static value(v?: object): Node.Value {
    return {
      type: NodeType.Value,
      value: v,
    };
  }

  /**
   * Creates a multiNode and associates the multiNode as the parent
   * of all the value nodes
   *
   * @param values - the nodes to put in the multinode
   */
  static multiNode(...values: Node.Node[]): Node.MultiNode {
    const m: Node.MultiNode = {
      type: NodeType.MultiNode,
      override: true,
      values,
    };

    values.forEach((v) => {
      v.parent = m;
    });

    return m;
  }

  /**
   * Creates an async node
   *
   * @param id - the id of async node. It should be identical for each async node
   */
  static asyncNode(
    id: string,
    flatten = true,
    onValueReceived?: (node: Node.Node) => Node.Node,
  ): Node.Async {
    return {
      id,
      type: NodeType.Async,
      flatten: flatten,
      onValueReceived,
      value: {
        type: NodeType.Value,
        value: {
          id,
        },
      },
    };
  }

  /**
   * Adds a child node to a node
   *
   * @param node - The node to add a child to
   * @param path - The path at which to add the child
   * @param child - The child node
   */
  static addChild<N extends Node.BaseWithChildren<NT>, NT extends NodeType>(
    node: N,
    path: Node.PathSegment | Node.PathSegment[],
    child: Node.Node,
  ): N {
    child.parent = node as Node.Node;

    const newChild: Node.Child = {
      path: Array.isArray(path) ? path : [path],
      value: child,
    };

    node.children = node.children || [];
    node.children.push(newChild);

    return node;
  }

  /**
   * Updates children of a node of the same path and preserves order
   *
   * @param node - The node to update children for
   * @param pathToMatch - The path to match against child paths
   * @param mapFn - Function to transform matching children
   */
  static updateChildrenByPath<T extends Node.ViewOrAsset | Node.Value>(
    node: T,
    pathToMatch: Node.PathSegment[],
    updateFn: (child: Node.Child) => Node.Node,
  ): T {
    if (!node.children) return node;

    // Use map to preserve original order
    const updatedChildren = node.children.map((child) =>
      // Check if paths match exactly
      child.path.join() === pathToMatch.join()
        ? { ...child, value: updateFn(child) }
        : child,
    );

    return {
      ...node,
      children: updatedChildren,
    };
  }
}

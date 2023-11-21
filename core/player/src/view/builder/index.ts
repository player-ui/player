import type { Node, AnyAssetType } from '../parser';
import { NodeType } from '../parser';

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
   * @param values - the value or applicability nodes to put in the multinode
   */
  static multiNode(
    ...values: (Node.Value | Node.Applicability)[]
  ): Node.MultiNode {
    const m: Node.MultiNode = {
      type: NodeType.MultiNode,
      override: true,
      values,
    };

    values.forEach((v) => {
      // eslint-disable-next-line no-param-reassign
      v.parent = m;
    });

    return m;
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
  ) {
    // eslint-disable-next-line no-param-reassign
    child.parent = node as Node.Node;

    const newChild: Node.Child = {
      path: Array.isArray(path) ? path : [path],
      value: child,
    };

    // eslint-disable-next-line no-param-reassign
    node.children = node.children || [];
    node.children.push(newChild);

    return node;
  }
}

import { NodeType } from '@player-ui/player';
import type { Player, PlayerPlugin, Node, Resolver } from '@player-ui/player';
import type { Asset } from '@player-ui/types';
import { createObjectMatcher } from '@player-ui/partial-match-registry';
import dlv from 'dlv';

export type QueryFunction = (asset: Asset) => boolean;
export type Query = QueryFunction | string | object;

/** Generate a function that matches on the given input */
function createMatcher(
  match: number | string | object | QueryFunction
): QueryFunction {
  if (typeof match === 'string' || typeof match === 'number') {
    return createObjectMatcher({ type: match });
  }

  if (typeof match === 'function') {
    return match as QueryFunction;
  }

  return createObjectMatcher(match);
}

interface ViewInfo {
  /** The root of the view graph */
  root?: Node.Node;

  /** A cache of an asset or view's id to it's node */
  assetIdMap: Map<string, Node.Asset | Node.View>;

  /** A map of a node to it's resolved node and value */
  resolvedMap: Map<
    Node.Node,
    {
      /** The final resolved AST node */
      resolved: Node.Node;

      /** The final, resolved value of the node */
      value: any;
    }
  >;

  /** The resolver instance tied to this view. Used to map back to original nodes */
  resolver: Resolver;
}

/**
 * Traverse up the tree until reaching the first asset or view
 * Returns undefined if no matching parent is found
 */
function getParent(
  node: Node.Node,
  viewInfo: ViewInfo
): Node.ViewOrAsset | undefined {
  let working = node;

  while (
    working.parent &&
    working.parent.type !== NodeType.Asset &&
    working.parent.type !== NodeType.View
  ) {
    working = working.parent;
  }

  const { parent } = working;

  if (
    parent &&
    (parent.type === NodeType.Asset || parent.type === NodeType.View)
  ) {
    const sourceNode = viewInfo.resolver.getSourceNode(parent);
    const viewOrAsset =
      sourceNode?.type === NodeType.Applicability
        ? sourceNode.value
        : viewInfo.resolver.getSourceNode(parent);
    return (viewOrAsset ?? parent) as Node.ViewOrAsset;
  }
}

/**
 * The `check-path-plugin` enables developers to query segments of the view tree for contextual rendering or behavior.
 * This is best suited to be referenced during the UI rendering phase, where one can make decisions about the rendering of an asset based on where it lies in the tree.
 */
export class CheckPathPlugin implements PlayerPlugin {
  name = 'check-path';
  private viewInfo?: ViewInfo;

  apply(player: Player) {
    player.hooks.viewController.tap(this.name, (viewController) => {
      viewController.hooks.view.tap(this.name, (view) => {
        view.hooks.resolver.tap(this.name, (resolver: Resolver) => {
          const viewInfo: ViewInfo = {
            resolvedMap: new Map(),
            assetIdMap: new Map(),
            resolver,
          };
          this.viewInfo = viewInfo;

          resolver.hooks.afterResolve.tap(this.name, (value, node) => {
            const sourceNode = this.getSourceAssetNode(node);

            if (sourceNode) {
              viewInfo.resolvedMap.set(sourceNode, {
                resolved: node,
                value,
              });

              if (node.type === NodeType.Asset || node.type === NodeType.View) {
                const id = dlv(value, 'id');

                if (id) {
                  viewInfo.assetIdMap.set(id, node);
                }
              }
            }

            return value;
          });
        });
      });
    });
  }

  /**
   * Starts at the asset with the given id, and walks backwards _up_ the tree until it finds a match for the parent
   *
   * @param id - The id of the asset to _start_ at
   * @param query - A means of matching a parent asset
   * @returns - The parent object if a match is found, else undefined
   */
  public getParent(
    id: string,
    query?: Query | Array<Query>
  ): Asset | undefined {
    const assetNode = this.viewInfo?.assetIdMap.get(id);

    if (!assetNode || !this.viewInfo) {
      return undefined;
    }

    let potentialMatch = getParent(assetNode, this.viewInfo);

    // Handle the case of an empty query (just get the immediate parent)
    if (query === undefined) {
      if (potentialMatch) {
        const resolved = this.viewInfo.resolvedMap.get(potentialMatch);

        return resolved?.value;
      }

      return;
    }

    const queryArray = Array.isArray(query) ? [...query] : [query];
    let parentQuery = queryArray.shift();

    // Keep track of the recursive depth in case we loop forever
    let depth = 0;

    while (potentialMatch && parentQuery) {
      if (depth++ >= 50) {
        throw new Error(
          'Recursion depth exceeded. Check for cycles in the AST graph'
        );
      }

      const matcher = createMatcher(parentQuery);
      const resolved = this.viewInfo.resolvedMap.get(potentialMatch);

      if (resolved && matcher(resolved.value)) {
        // This is the last match.
        if (queryArray.length === 0) {
          return resolved.value;
        }

        parentQuery = queryArray.shift();
      }

      potentialMatch = getParent(potentialMatch, this.viewInfo);
    }

    return undefined;
  }

  /**
   * Returns the property that the asset resides on relative to it's parent
   *
   * @param id - The id of the asset to _start_ at
   * @returns - The property name or undefined if no parent was found
   */
  public getParentProp(id: string): string | number | undefined {
    const assetNode = this.viewInfo?.assetIdMap.get(id);

    if (!assetNode || !this.viewInfo) {
      return;
    }

    let working: Node.Node | undefined = assetNode;
    let parent;

    while (working) {
      parent =
        working?.parent &&
        this.viewInfo.resolvedMap.get(working.parent)?.resolved;

      if (
        parent &&
        (parent.type === NodeType.Asset || parent.type === NodeType.View)
      ) {
        break;
      }

      working = working?.parent;
    }

    if (parent && 'children' in parent) {
      const childProp = parent.children?.find(
        (child) => child.value === working
      );

      return childProp?.path?.[0];
    }

    return undefined;
  }

  /** Given a node, return itself, or the nested asset if the node is an applicability node */
  private getSourceAssetNode(node: Node.Node) {
    let sourceNode = this.viewInfo?.resolver.getSourceNode(node);
    if (sourceNode?.type === 'applicability') {
      sourceNode = sourceNode.value;
    }

    return sourceNode;
  }

  /**
   * Given the starting node, check to verify that the supplied queries are relevant to the current asset's parents.
   *
   * @param id - The id of the asset to _start_ at
   * @returns - true if the context applies, false if it doesn't
   */
  public hasParentContext(id: string, query: Query | Array<Query>): boolean {
    return Boolean(this.getParent(id, query));
  }

  /** Search the node for any matching paths in the graph that match the query  */
  private findChildPath(
    node: Node.Node,
    query: Array<Query>,
    includeSelfMatch = true
  ): boolean {
    if (query.length === 0) {
      return true;
    }

    const [first, ...rest] = query;
    const matcher = createMatcher(first);

    if (
      node.type === NodeType.Asset ||
      node.type === NodeType.View ||
      node.type === NodeType.Applicability
    ) {
      const resolved =
        node.type === NodeType.Applicability
          ? this.viewInfo?.resolvedMap.get(node.value)
          : this.viewInfo?.resolvedMap.get(node);
      const includesSelf =
        (includeSelfMatch && resolved && matcher(resolved.value)) ?? false;
      const childQuery = includesSelf ? rest : query;

      if (childQuery.length === 0 && includesSelf) {
        return true;
      }

      const children =
        node.type === NodeType.Applicability
          ? (node.value as Node.ViewOrAsset).children
          : node.children;
      if (childQuery.length && (!children || children.length === 0)) {
        return false;
      }

      if (
        children?.some((childNode) =>
          this.findChildPath(childNode.value, childQuery)
        )
      ) {
        return true;
      }
    } else if (
      node.type === NodeType.MultiNode &&
      node.values.some((childNode) => this.findChildPath(childNode, query))
    ) {
      return true;
    } else if (
      'children' in node &&
      node.children?.some((childNode) =>
        this.findChildPath(childNode.value, query)
      )
    ) {
      return true;
    }

    return false;
  }

  /**
   * Given the starting node, check to verify that the supplied queries are relevant to the current asset's children.
   *
   * @param id - The id of the asset to _start_ at
   * @returns - true if the context applies, false if it doesn't
   */
  public hasChildContext(id: string, query: Query | Array<Query>): boolean {
    const assetNode = this.viewInfo?.assetIdMap.get(id);
    const queryArray = Array.isArray(query) ? [...query] : [query];

    if (!assetNode) {
      return false;
    }

    return this.findChildPath(assetNode, queryArray, false);
  }

  /** Get the asset represented by id */
  public getAsset(id: string): Asset | undefined {
    const assetNode = this.viewInfo?.assetIdMap.get(id);
    if (!assetNode) return;

    const sourceNode = this.getSourceAssetNode(assetNode);
    if (!sourceNode) return;

    return this.viewInfo?.resolvedMap.get(sourceNode)?.value;
  }

  /**
   * Get the path of the asset in the view upto
   * the asset that matches the query or to the view if no query is provided
   */
  public getPath(
    id: string,
    query?: Query | Array<Query>
  ): Array<string | number> | undefined {
    const assetNode = this.viewInfo?.assetIdMap.get(id);

    if (!assetNode || !this.viewInfo) {
      return;
    }

    let path: Array<string | number> = [];

    let queryArray: Query[] = [];

    if (query) {
      queryArray = Array.isArray(query) ? [...query] : [query];
    }

    let parentQuery = queryArray.shift();

    let working: Node.Node | undefined = assetNode;

    /** Find the child value for the working value from the given parent */
    const findWorkingChild = (parent: Node.ViewOrAsset | Node.Value) => {
      return parent.children?.find((n) => n.value === working);
    };

    while (working !== undefined) {
      const parent =
        working?.parent && this.viewInfo.resolvedMap.get(working.parent);

      const parentNode = parent?.resolved;

      if (parentNode) {
        if (parentNode.type === NodeType.MultiNode) {
          const index = parentNode.values.indexOf(working);

          if (index !== -1) {
            const actualIndex =
              index -
              parentNode.values
                .slice(0, index)
                .reduce(
                  (undefCount, next) =>
                    this.viewInfo?.resolvedMap.get(next)?.value === undefined
                      ? undefCount + 1
                      : undefCount,
                  0
                );

            path = [actualIndex, ...path];
          }
        } else if ('children' in parentNode) {
          const childProp = findWorkingChild(parentNode);
          path = [...(childProp?.path ?? []), ...path];
        }
      }

      if (parentQuery) {
        const matcher = createMatcher(parentQuery);

        if (matcher(parent?.value)) {
          parentQuery = queryArray.shift();
          if (!parentQuery) return path;
        }
      }

      working = working.parent;
    }

    /* if at the end all queries haven't been consumed, 
       it means we couldn't find a path till the matching query */
    return queryArray.length === 0 ? path : undefined;
  }
}

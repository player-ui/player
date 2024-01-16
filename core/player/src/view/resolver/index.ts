import { SyncWaterfallHook, SyncHook } from "tapable-ts";
import { setIn, addLast, clone } from "timm";
import dlv from "dlv";
import { dequal } from "dequal";
import type { BindingInstance, BindingLike } from "../../binding";
import type {
  DataModelOptions,
  DataModelWithParser,
  Updates,
} from "../../data";
import { DependencyModel, withParser } from "../../data";
import type { Logger } from "../../logger";
import type { Node } from "../parser";
import { NodeType } from "../parser";
import {
  caresAboutDataChanges,
  toNodeResolveOptions,
  unpackAndPush,
} from "./utils";
import type { Resolve } from "./types";
import { getNodeID } from "../parser/utils";

export * from "./types";
export * from "./utils";

interface NodeUpdate extends Resolve.ResolvedNode {
  /** A flag to track if a node has changed since the last resolution */
  updated: boolean;
}

/** Add model context to the data model */
const withContext = (model: DataModelWithParser): DataModelWithParser => {
  return {
    get: (binding: BindingLike, options?: DataModelOptions): any => {
      return model.get(binding, {
        context: { model },
        ...options,
      });
    },

    set: (
      transaction: [BindingLike, any][],
      options?: DataModelOptions,
    ): Updates => {
      return model.set(transaction, {
        context: { model },
        ...options,
      });
    },

    delete: (binding: BindingLike, options?: DataModelOptions): void => {
      return model.delete(binding, {
        context: { model },
        ...options,
      });
    },
  };
};

/**
 * The Resolver is the way to take a parsed AST graph of a view and resolve it to a concrete representation of the current user state
 * It combines the ability to mutate ast nodes before resolving, as well as the mutating the resolved objects while parsing
 */
export class Resolver {
  public readonly hooks = {
    /** A hook to allow skipping of the resolution tree for a specific node */
    skipResolve: new SyncWaterfallHook<
      [boolean, Node.Node, Resolve.NodeResolveOptions]
    >(),

    /** An event emitted before calculating the next update */
    beforeUpdate: new SyncHook<[Set<BindingInstance> | undefined]>(),

    /** An event emitted after calculating the next update */
    afterUpdate: new SyncHook<[any]>(),

    /** The options passed to a node to resolve it to an object */
    resolveOptions: new SyncWaterfallHook<
      [Resolve.NodeResolveOptions, Node.Node]
    >(),

    /** A hook to transform the AST node into a new AST node before resolving it */
    beforeResolve: new SyncWaterfallHook<
      [Node.Node | null, Resolve.NodeResolveOptions]
    >(),

    /**
     * A hook to transform an AST node into it's resolved value.
     * This runs _before_ any children are resolved
     */
    resolve: new SyncWaterfallHook<
      [any, Node.Node, Resolve.NodeResolveOptions]
    >(),

    /**
     * A hook to transform the resolved value of an AST node.
     * This runs _after_ all children nodes are resolved
     */
    afterResolve: new SyncWaterfallHook<
      [any, Node.Node, Resolve.NodeResolveOptions]
    >(),

    /** Called at the very end of a node's tree being updated */
    afterNodeUpdate: new SyncHook<
      [Node.Node, Node.Node | undefined, NodeUpdate]
    >(),
  };

  /**
   * The AST tree after beforeResolve is ran mapped to the AST before beforeResolve is ran
   */
  private readonly ASTMap: Map<Node.Node, Node.Node>;
  /**
   * The root node in the AST tree we want to resolve
   */
  public readonly root: Node.Node;

  /**
   * The cache of the last resolved values when walking the tree.
   * This gets recycled every update to avoid stale data if a node is unused in an update
   */
  private resolveCache: Map<Node.Node, Resolve.ResolvedNode>;

  /**
   * Cache of node IDs that have been processed to track if nodes have duplicate IDs
   */
  private idCache: Set<string>;

  /**
   * The parameters required to resolve AST nodes
   */
  private readonly options: Resolve.ResolverOptions;

  /**
   * Tapable logger for logging errors encountered during view resolution
   */
  private logger?: Logger;

  constructor(root: Node.Node, options: Resolve.ResolverOptions) {
    this.root = root;
    this.options = options;
    this.resolveCache = new Map();
    this.ASTMap = new Map();
    this.logger = options.logger;
    this.idCache = new Set();
  }

  public getSourceNode(convertedAST: Node.Node) {
    return this.ASTMap.get(convertedAST);
  }

  public update(changes?: Set<BindingInstance>): any {
    this.hooks.beforeUpdate.call(changes);
    const resolveCache = new Map<Node.Node, Resolve.ResolvedNode>();
    this.idCache.clear();
    const prevASTMap = new Map(this.ASTMap);
    this.ASTMap.clear();

    const updated = this.computeTree(
      this.root,
      undefined,
      changes,
      resolveCache,
      toNodeResolveOptions(this.options),
      undefined,
      prevASTMap,
    );
    this.resolveCache = resolveCache;
    this.hooks.afterUpdate.call(updated.value);

    return updated.value;
  }

  public getResolveCache() {
    return new Map(this.resolveCache);
  }

  private getPreviousResult(node: Node.Node): Resolve.ResolvedNode | undefined {
    if (!node) {
      return;
    }

    const isFirstUpdate = this.resolveCache.size === 0;
    const id = getNodeID(node);

    if (id) {
      if (this.idCache.has(id)) {
        // Only log this conflict once to cut down on noise
        // May want to swap this to logging when we first see the id -- which may not be the first render
        if (isFirstUpdate) {
          if (node.type === NodeType.Asset || node.type === NodeType.View) {
            this.logger?.error(
              `Cache conflict: Found Asset/View nodes that have conflicting ids: ${id}, may cause cache issues.`,
            );
          } else if (node.type === NodeType.Value) {
            this.logger?.info(
              `Cache conflict: Found Value nodes that have conflicting ids: ${id}, may cause cache issues. To improve performance make value node IDs globally unique.`,
            );
          }
        }

        // Don't use anything from a prev result if there's a duplicate id detected
        return;
      }

      this.idCache.add(id);
    }

    return this.resolveCache.get(node);
  }

  private cloneNode(node: any) {
    const clonedNode = clone(node);

    Object.keys(clonedNode).forEach((key) => {
      if (key === "parent") return;

      const value = clonedNode[key];
      if (typeof value === "object" && value !== null) {
        clonedNode[key] = Array.isArray(value) ? [...value] : { ...value };
      }
    });

    return clonedNode;
  }

  private computeTree(
    node: Node.Node,
    rawParent: Node.Node | undefined,
    dataChanges: Set<BindingInstance> | undefined,
    cacheUpdate: Map<Node.Node, Resolve.ResolvedNode>,
    options: Resolve.NodeResolveOptions,
    partiallyResolvedParent: Node.Node | undefined,
    prevASTMap: Map<Node.Node, Node.Node>,
  ): NodeUpdate {
    const dependencyModel = new DependencyModel(options.data.model);

    dependencyModel.trackSubset("core");
    const depModelWithParser = withContext(
      withParser(dependencyModel, this.options.parseBinding),
    );

    const resolveOptions = this.hooks.resolveOptions.call(
      {
        ...options,
        data: {
          ...options.data,
          model: depModelWithParser,
        },
        evaluate: (exp) =>
          this.options.evaluator.evaluate(exp, { model: depModelWithParser }),
        node,
      },
      node,
    );

    const previousResult = this.getPreviousResult(node);
    const previousDeps = previousResult?.dependencies;

    const dataChanged = caresAboutDataChanges(dataChanges, previousDeps);
    const shouldUseLastValue = this.hooks.skipResolve.call(
      !dataChanged,
      node,
      resolveOptions,
    );

    // Shallow clone the node so that changes to it during the resolve steps don't impact the original.
    // We are trusting that this becomes a deep clone once the whole node tree has been traversed.
    const clonedNode = {
      ...this.cloneNode(node),
      parent: partiallyResolvedParent,
    };
    const resolvedAST = this.hooks.beforeResolve.call(
      clonedNode,
      resolveOptions,
    ) ?? {
      type: NodeType.Empty,
    };

    const isNestedMultiNode =
      resolvedAST.type === NodeType.MultiNode &&
      partiallyResolvedParent?.parent?.type === NodeType.MultiNode &&
      partiallyResolvedParent.type === NodeType.Value;

    if (previousResult && shouldUseLastValue) {
      const update = {
        ...previousResult,
        updated: false,
      };

      /** Recursively repopulate the AST map given some AST Node and it's resolved AST representation */
      const repopulateASTMapFromCache = (
        resolvedNode: Resolve.ResolvedNode,
        AST: Node.Node,
        ASTParent: Node.Node | undefined,
      ) => {
        const { node: resolvedASTLocal } = resolvedNode;
        this.ASTMap.set(resolvedASTLocal, AST);
        const resolvedUpdate = {
          ...resolvedNode,
          updated: false,
        };
        cacheUpdate.set(AST, resolvedUpdate);

        /** Helper function for recursing over child node */
        const handleChildNode = (childNode: Node.Node) => {
          // In order to get the correct results, we need to use the node references from the last update.
          const originalChildNode = prevASTMap.get(childNode) ?? childNode;
          const previousChildResult = this.getPreviousResult(originalChildNode);
          if (!previousChildResult) return;

          repopulateASTMapFromCache(
            previousChildResult,
            originalChildNode,
            AST,
          );
        };

        if ("children" in resolvedASTLocal) {
          resolvedASTLocal.children?.forEach(({ value: childAST }) =>
            handleChildNode(childAST),
          );
        } else if (resolvedASTLocal.type === NodeType.MultiNode) {
          resolvedASTLocal.values.forEach(handleChildNode);
        }

        this.hooks.afterNodeUpdate.call(AST, ASTParent, resolvedUpdate);
      };

      // Point the root of the cached node to the new resolved node.
      previousResult.node.parent = partiallyResolvedParent;

      repopulateASTMapFromCache(previousResult, node, rawParent);

      return update;
    }

    resolvedAST.parent = partiallyResolvedParent;

    resolveOptions.node = resolvedAST;

    this.ASTMap.set(resolvedAST, node);

    let resolved = this.hooks.resolve.call(
      undefined,
      resolvedAST,
      resolveOptions,
    );

    let updated = !dequal(previousResult?.value, resolved);

    if (previousResult && !updated) {
      resolved = previousResult?.value;
    }

    const childDependencies = new Set<BindingInstance>();
    dependencyModel.trackSubset("children");

    if ("children" in resolvedAST) {
      const newChildren = resolvedAST.children?.map((child) => {
        const computedChildTree = this.computeTree(
          child.value,
          node,
          dataChanges,
          cacheUpdate,
          resolveOptions,
          resolvedAST,
          prevASTMap,
        );
        const {
          dependencies: childTreeDeps,
          node: childNode,
          updated: childUpdated,
          value: childValue,
        } = computedChildTree;

        childTreeDeps.forEach((binding) => childDependencies.add(binding));

        if (childValue) {
          if (childNode.type === NodeType.MultiNode && !childNode.override) {
            const arr = addLast(
              dlv(resolved, child.path as any[], []),
              childValue,
            );
            resolved = setIn(resolved, child.path, arr);
          } else {
            resolved = setIn(resolved, child.path, childValue);
          }
        }

        updated = updated || childUpdated;

        return { ...child, value: childNode };
      });

      resolvedAST.children = newChildren;
    } else if (resolvedAST.type === NodeType.MultiNode) {
      const childValue: any = [];
      const rawParentToPassIn = isNestedMultiNode
        ? partiallyResolvedParent?.parent
        : node;

      const newValues = resolvedAST.values.map((mValue) => {
        const mTree = this.computeTree(
          mValue,
          rawParentToPassIn,
          dataChanges,
          cacheUpdate,
          resolveOptions,
          resolvedAST,
          prevASTMap,
        );

        if (mTree.value !== undefined && mTree.value !== null) {
          if (
            mTree.node.parent?.type === NodeType.MultiNode &&
            Array.isArray(mTree.value)
          ) {
            mTree.value.forEach((v: any) => {
              unpackAndPush(v, childValue);
            });
          } else {
            childValue.push(mTree.value);
          }
        }

        mTree.dependencies.forEach((bindingDep) =>
          childDependencies.add(bindingDep),
        );

        updated = updated || mTree.updated;

        return mTree.node;
      });

      resolvedAST.values = newValues;
      resolved = childValue;
    }

    childDependencies.forEach((bindingDep) =>
      dependencyModel.addChildReadDep(bindingDep),
    );

    dependencyModel.trackSubset("core");
    if (previousResult && !updated) {
      resolved = previousResult?.value;
    }

    resolved = this.hooks.afterResolve.call(resolved, resolvedAST, {
      ...resolveOptions,
      getDependencies: (scope?: "core" | "children") =>
        dependencyModel.getDependencies(scope),
    });

    const update: NodeUpdate = {
      node: resolvedAST,
      updated,
      value: resolved,
      dependencies: new Set([
        ...dependencyModel.getDependencies(),
        ...childDependencies,
      ]),
    };

    this.hooks.afterNodeUpdate.call(
      node,
      isNestedMultiNode ? partiallyResolvedParent?.parent : rawParent,
      update,
    );
    cacheUpdate.set(node, update);

    return update;
  }
}

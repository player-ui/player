import { SyncWaterfallHook, SyncHook } from 'tapable-ts';
import { setIn, addLast } from 'timm';
import dlv from 'dlv';
import { dequal } from 'dequal';
import type { BindingInstance, BindingLike } from '../../binding';
import type {
  DataModelOptions,
  DataModelWithParser,
  Updates,
} from '../../data';
import { DependencyModel, withParser } from '../../data';
import type { Logger } from '../../logger';
import type { Node } from '../parser';
import { NodeType } from '../parser';
import { caresAboutDataChanges, toNodeResolveOptions } from './utils';
import type { Resolve } from './types';

export * from './types';
export * from './utils';

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
      options?: DataModelOptions
    ): Updates => {
      return model.set(transaction, {
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
    this.ASTMap.clear();

    const updated = this.computeTree(
      this.root,
      undefined,
      changes,
      resolveCache,
      toNodeResolveOptions(this.options)
    );
    this.resolveCache = resolveCache;
    this.hooks.afterUpdate.call(updated.value);

    return updated.value;
  }

  private getNodeID(node?: Node.Node): string | undefined {
    if (!node) {
      return;
    }

    if (
      (node.type === NodeType.Asset ||
        node.type === NodeType.View ||
        node.type === NodeType.Value) &&
      typeof node.value === 'object' &&
      typeof node.value?.id === 'string'
    ) {
      return node.value.id;
    }
  }

  private getPreviousResult(node: Node.Node): Resolve.ResolvedNode | undefined {
    if (!node) {
      return;
    }

    const isFirstUpdate = this.resolveCache.size === 0;
    const id = this.getNodeID(node);

    if (id) {
      if (this.idCache.has(id)) {
        // Only log this conflict once to cut down on noise
        // May want to swap this to logging when we first see the id -- which may not be the first render
        if (isFirstUpdate) {
          if (node.type === NodeType.Asset || node.type === NodeType.View) {
            this.logger?.error(
              `Cache conflict: Found Asset/View nodes that have conflicting ids: ${id}, may cause cache issues.`
            );
          } else if (node.type === NodeType.Value) {
            this.logger?.info(
              `Cache conflict: Found Value nodes that have conflicting ids: ${id}, may cause cache issues. To improve performance make value node IDs globally unique.`
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

  private computeTree(
    node: Node.Node,
    parent: Node.Node | undefined,
    dataChanges: Set<BindingInstance> | undefined,
    cacheUpdate: Map<Node.Node, Resolve.ResolvedNode>,
    options: Resolve.NodeResolveOptions
  ): NodeUpdate {
    const dependencyModel = new DependencyModel(options.data.model);

    dependencyModel.trackSubset('core');
    const depModelWithParser = withContext(
      withParser(dependencyModel, this.options.parseBinding)
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
      node
    );

    const previousResult = this.getPreviousResult(node);
    const previousDeps = previousResult?.dependencies;

    const dataChanged = caresAboutDataChanges(dataChanges, previousDeps);
    const shouldUseLastValue = this.hooks.skipResolve.call(
      !dataChanged,
      node,
      resolveOptions
    );

    if (shouldUseLastValue && previousResult) {
      const update = {
        ...previousResult,
        updated: false,
      };

      cacheUpdate.set(node, update);

      /** Recursively repopulate the AST map given some AST Node and it's resolved AST representation */
      const repopulateASTMapFromCache = (
        resolvedAST: Node.Node,
        AST: Node.Node
      ) => {
        this.ASTMap.set(resolvedAST, AST);
        if ('children' in resolvedAST) {
          resolvedAST.children?.forEach(({ value: childAST }) => {
            const { node: childResolvedAST } =
              this.getPreviousResult(childAST) || {};
            if (!childResolvedAST) return;

            repopulateASTMapFromCache(childResolvedAST, childAST);

            if (childResolvedAST.type === NodeType.MultiNode) {
              childResolvedAST.values.forEach((mChildAST) => {
                const { node: mChildResolvedAST } =
                  this.getPreviousResult(mChildAST) || {};
                if (!mChildResolvedAST) return;

                repopulateASTMapFromCache(mChildResolvedAST, mChildAST);
              });
            }
          });
        }
      };

      const resolvedAST = previousResult.node;
      repopulateASTMapFromCache(resolvedAST, node);

      this.hooks.afterNodeUpdate.call(node, parent, update);

      return update;
    }

    const resolvedAST = this.hooks.beforeResolve.call(node, resolveOptions) ?? {
      type: NodeType.Empty,
    };

    resolveOptions.node = resolvedAST;

    this.ASTMap.set(resolvedAST, node);

    let resolved = this.hooks.resolve.call(
      undefined,
      resolvedAST,
      resolveOptions
    );

    let updated = !dequal(previousResult?.value, resolved);

    if (previousResult && !updated) {
      resolved = previousResult?.value;
    }

    const childDependencies = new Set<BindingInstance>();
    dependencyModel.trackSubset('children');

    if ('children' in resolvedAST) {
      resolvedAST.children?.forEach((child) => {
        const computedChildTree = this.computeTree(
          child.value,
          node,
          dataChanges,
          cacheUpdate,
          resolveOptions
        );
        let { updated: childUpdated, value: childValue } = computedChildTree;
        const { node: childNode, dependencies: childTreeDeps } =
          computedChildTree;

        childTreeDeps.forEach((binding) => childDependencies.add(binding));

        if (childNode.type === NodeType.MultiNode) {
          childValue = [];
          childNode.values.forEach((mValue) => {
            const mTree = this.computeTree(
              mValue,
              node,
              dataChanges,
              cacheUpdate,
              resolveOptions
            );

            if (mTree.value !== undefined && mTree.value !== null) {
              childValue.push(mTree.value);
            }

            mTree.dependencies.forEach((bindingDep) =>
              childDependencies.add(bindingDep)
            );

            childUpdated = childUpdated || mTree.updated;
          });
        }

        if (childValue) {
          if (childNode.type === NodeType.MultiNode && !childNode.override) {
            const arr = addLast(
              dlv(resolved, child.path as any[], []),
              childValue
            );
            resolved = setIn(resolved, child.path, arr);
          } else {
            resolved = setIn(resolved, child.path, childValue);
          }
        }

        updated = updated || childUpdated;
      });
    }

    childDependencies.forEach((bindingDep) =>
      dependencyModel.addChildReadDep(bindingDep)
    );

    dependencyModel.trackSubset('core');
    if (previousResult && !updated) {
      resolved = previousResult?.value;
    }

    resolved = this.hooks.afterResolve.call(resolved, resolvedAST, {
      ...resolveOptions,
      getDependencies: (scope?: 'core' | 'children') =>
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

    this.hooks.afterNodeUpdate.call(node, parent, update);
    cacheUpdate.set(node, update);

    return update;
  }
}

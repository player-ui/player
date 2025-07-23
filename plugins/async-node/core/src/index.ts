import { NodeType, getNodeID } from "@player-ui/player";
import type {
  Player,
  PlayerPlugin,
  Node,
  ParseObjectOptions,
  ParseObjectChildOptions,
  ViewInstance,
  Parser,
  ViewPlugin,
  Resolver,
  Resolve,
} from "@player-ui/player";
import { AsyncParallelBailHook, SyncBailHook } from "tapable-ts";
import queueMicrotask from "queue-microtask";
import { omit } from "timm";

export * from "./types";
export * from "./transform";

/** Object type for storing data related to a single `apply` of the `AsyncNodePluginPlugin`
 * This object should be setup once per ViewInstance to keep any cached info just for that view to avoid conflicts of shared async node ids across different view states.
 */
type AsyncPluginContext = {
  /** Map of async node id to resolved content */
  nodeResolveCache: Map<string, any>;
  /** The view instance this context is attached to. */
  view: ViewInstance;
  /** Map of async node id to promises being used to resolve them */
  inProgressNodes: Set<string>;
};

export interface AsyncNodePluginOptions {
  /** A set of plugins to load  */
  plugins?: AsyncNodeViewPlugin[];
}

export interface AsyncNodeViewPlugin extends ViewPlugin {
  /** Use this to tap into the async node plugin hooks */
  applyPlugin: (asyncNodePlugin: AsyncNodePlugin) => void;

  asyncNode: AsyncParallelBailHook<[Node.Async, (result: any) => void], any>;
}
export type AsyncHandler = (
  node: Node.Async,
  callback?: (result: any) => void,
) => Promise<any>;

/** Hook declaration for the AsyncNodePlugin */
type AsyncNodeHooks = {
  /** Async hook to get content for an async node */
  onAsyncNode: AsyncParallelBailHook<[Node.Async, (result: any) => void], any>;
  /** Sync hook to manage errors coming from the onAsyncNode hook. Return a fallback node or null to render a fallback. The first argument of passed in the call is the error thrown. */
  onAsyncNodeError: SyncBailHook<[Error, Node.Async], any>;
};

/**
 * Async node plugin used to resolve async nodes in the content
 * If an async node is present, allow users to provide a replacement node to be rendered when ready
 */
export class AsyncNodePlugin implements PlayerPlugin {
  private plugins: AsyncNodeViewPlugin[] | undefined;
  private playerInstance: Player | undefined;

  constructor(options: AsyncNodePluginOptions, asyncHandler?: AsyncHandler) {
    if (options?.plugins) {
      this.plugins = options.plugins;
      options.plugins.forEach((plugin) => {
        plugin.applyPlugin(this);
      });
    }

    if (asyncHandler) {
      this.hooks.onAsyncNode.tap(
        "async",
        async (node: Node.Async, callback) => {
          return await asyncHandler(node, callback);
        },
      );
    }
  }

  public readonly hooks: AsyncNodeHooks = {
    onAsyncNode: new AsyncParallelBailHook(),
    onAsyncNodeError: new SyncBailHook(),
  };

  getPlayerInstance(): Player | undefined {
    return this.playerInstance;
  }

  name = "AsyncNode";

  apply(player: Player): void {
    this.playerInstance = player;

    player.hooks.viewController.tap(this.name, (viewController) => {
      viewController.hooks.view.tap(this.name, (view) => {
        this.plugins?.forEach((plugin) => {
          plugin.apply(view);
        });
      });
    });
  }
}

export class AsyncNodePluginPlugin implements AsyncNodeViewPlugin {
  public asyncNode: AsyncParallelBailHook<
    [Node.Async, (result: any) => void],
    any
  > = new AsyncParallelBailHook();
  private basePlugin: AsyncNodePlugin | undefined;

  name = "AsyncNode";

  /**
   * Parses the node from the result and triggers an asynchronous view update if necessary.
   * @param node The asynchronous node that might be updated.
   * @param result The result obtained from resolving the async node. This could be any data structure or value.
   * @param options Options provided for node resolution, including a potential parseNode function to process the result.
   * @param view The view instance where the node resides. This can be undefined if the view is not currently active.
   */
  private parseNodeAndUpdate(
    node: Node.Async,
    context: AsyncPluginContext,
    result: any,
    options: Resolve.NodeResolveOptions,
  ) {
    const parsedNode =
      options.parseNode && result ? options.parseNode(result) : undefined;

    this.handleAsyncUpdate(node, context, parsedNode);
  }

  /**
   * Updates the node asynchronously based on the result provided.
   * This method is responsible for handling the update logic of asynchronous nodes.
   * It checks if the node needs to be updated based on the new result and updates the mapping accordingly.
   * If an update is necessary, it triggers an asynchronous update on the view.
   * @param node The asynchronous node that might be updated.
   * @param newNode The new node to replace the async node.
   * @param view The view instance where the node resides. This can be undefined if the view is not currently active.
   */
  private handleAsyncUpdate(
    node: Node.Async,
    context: AsyncPluginContext,
    newNode?: Node.Node | null,
  ) {
    const { nodeResolveCache, view } = context;
    if (nodeResolveCache.get(node.id) !== newNode) {
      nodeResolveCache.set(node.id, newNode ? newNode : node);
      view.updateAsync();
    }
  }

  /**
   * Handles the asynchronous API integration for resolving nodes.
   * This method sets up a hook on the resolver's `beforeResolve` event to process async nodes.
   * @param resolver The resolver instance to attach the hook to.
   * @param view
   */
  applyResolver(resolver: Resolver, context: AsyncPluginContext): void {
    resolver.hooks.beforeResolve.tap(this.name, (node, options) => {
      if (!this.isAsync(node)) {
        return node;
      }

      const resolvedNode = context.nodeResolveCache.get(node.id);
      if (resolvedNode !== undefined) {
        return resolvedNode;
      }

      if (context.inProgressNodes.has(node.id)) {
        return node;
      }

      // Track that the node is in progress.
      context.inProgressNodes.add(node.id);
      queueMicrotask(() => {
        this.runAsyncNode(node, context, options).finally();
      });

      return node;
    });
  }

  private async runAsyncNode(
    node: Node.Async,
    context: AsyncPluginContext,
    options: Resolve.NodeResolveOptions,
  ) {
    try {
      const result = await this.basePlugin?.hooks.onAsyncNode.call(
        node,
        (result) => {
          this.parseNodeAndUpdate(node, context, result, options);
        },
      );

      // Stop tracking before the next update is triggered
      context.inProgressNodes.delete(node.id);
      this.parseNodeAndUpdate(node, context, result, options);
    } catch (e: unknown) {
      const error = e instanceof Error ? e : new Error(String(e));
      const result = this.basePlugin?.hooks.onAsyncNodeError.call(error, node);

      if (result === undefined) {
        const playerState = this.basePlugin?.getPlayerInstance()?.getState();

        if (playerState?.status === "in-progress") {
          playerState.fail(error);
        }

        return;
      }

      options.logger?.error(
        "Async node handling failed and resolved with a fallback. Error:",
        error,
      );

      // Stop tracking before the next update is triggered
      context.inProgressNodes.delete(node.id);
      this.parseNodeAndUpdate(node, context, result, options);
    }
  }

  private isAsync(node: Node.Node | null): node is Node.Async {
    return node?.type === NodeType.Async;
  }

  private isDeterminedAsync(obj: any) {
    return obj && Object.prototype.hasOwnProperty.call(obj, "async");
  }

  applyParser(parser: Parser): void {
    parser.hooks.parseNode.tap(
      this.name,
      (
        obj: any,
        nodeType: Node.ChildrenTypes,
        options: ParseObjectOptions,
        childOptions?: ParseObjectChildOptions,
      ) => {
        if (this.isDeterminedAsync(obj)) {
          const parsedAsync = parser.parseObject(
            omit(obj, "async"),
            nodeType,
            options,
          );
          const parsedNodeId = getNodeID(parsedAsync);

          if (parsedAsync === null || !parsedNodeId) {
            return childOptions ? [] : null;
          }

          const asyncAST = parser.createASTNode(
            {
              id: parsedNodeId,
              type: NodeType.Async,
              value: parsedAsync,
            },
            obj,
          );

          if (childOptions) {
            return asyncAST
              ? [
                  {
                    path: [...childOptions.path, childOptions.key],
                    value: asyncAST,
                  },
                ]
              : [];
          }

          return asyncAST;
        }
      },
    );
  }

  apply(view: ViewInstance): void {
    const context: AsyncPluginContext = {
      nodeResolveCache: new Map(),
      inProgressNodes: new Set(),
      view,
    };

    view.hooks.parser.tap("async", this.applyParser.bind(this));
    view.hooks.resolver.tap("async", (resolver) => {
      this.applyResolver(resolver, context);
    });
  }

  applyPlugin(asyncNodePlugin: AsyncNodePlugin): void {
    this.basePlugin = asyncNodePlugin;
  }
}

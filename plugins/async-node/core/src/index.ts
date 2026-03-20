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
import { AsyncSeriesBailHook, SyncBailHook } from "tapable-ts";
import queueMicrotask from "queue-microtask";
import { AsyncNodeError } from "./AsyncNodeError";
import { AsyncNodeInfo, AsyncPluginContext } from "./internal-types";
import { getNodeFromError } from "./utils";

export * from "./types";
export * from "./transform";
export * from "./createAsyncTransform";

export interface AsyncNodePluginOptions {
  /** A set of plugins to load  */
  plugins?: AsyncNodeViewPlugin[];
}

export interface AsyncNodeViewPlugin extends ViewPlugin {
  /** Use this to tap into the async node plugin hooks */
  applyPlugin: (asyncNodePlugin: AsyncNodePlugin) => void;

  applyPlayer?: (player: Player) => void;
}
export type AsyncHandler = (
  node: Node.Async,
  callback?: (result: any) => void,
) => Promise<any>;

export type AsyncContent = {
  async: true;
  flatten?: boolean;
  [key: string]: unknown;
};

/** Hook declaration for the AsyncNodePlugin */
export type AsyncNodeHooks = {
  /** Async hook to get content for an async node */
  onAsyncNode: AsyncSeriesBailHook<[Node.Async, (result: any) => void], any>;
  /** Sync hook to manage errors coming from the onAsyncNode hook. Return a fallback node or null to render a fallback. The first argument of passed in the call is the error thrown. */
  onAsyncNodeError: SyncBailHook<[Error, Node.Async], any>;
};

export const AsyncNodePluginSymbol: symbol = Symbol.for("AsyncNodePlugin");

/**
 * Async node plugin used to resolve async nodes in the content
 * If an async node is present, allow users to provide a replacement node to be rendered when ready
 */
export class AsyncNodePlugin implements PlayerPlugin {
  private plugins: AsyncNodeViewPlugin[] | undefined;
  private playerInstance: Player | undefined;

  static Symbol: symbol = AsyncNodePluginSymbol;
  public readonly symbol: symbol = AsyncNodePlugin.Symbol;

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
    onAsyncNode: new AsyncSeriesBailHook(),
    onAsyncNodeError: new SyncBailHook(),
  };

  getPlayerInstance(): Player | undefined {
    return this.playerInstance;
  }

  name = "AsyncNode";

  apply(player: Player): void {
    this.playerInstance = player;

    this.plugins?.forEach((plugin) => {
      plugin.applyPlayer?.(player);
    });

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
    parseFunction?: (content: any) => Node.Node | null,
  ) {
    let parsedNode =
      parseFunction && result ? parseFunction(result) : undefined;

    if (parsedNode && node.onValueReceived) {
      parsedNode = node.onValueReceived(parsedNode);
    }

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
    const { asyncNodeCache: asyncNodeInfo, viewController } = context;
    const entry = asyncNodeInfo.get(node.id);
    if (!entry) {
      throw new Error("Failed to update async content. Cache entry not found");
    }
    if (entry.resolvedContent !== newNode) {
      entry.resolvedContent = newNode ? newNode : entry.asyncNode;
      viewController.updateViewAST(entry.updateNodes);
    }
  }

  private hasValidMapping(
    cacheEntry: AsyncNodeInfo,
  ): cacheEntry is Required<AsyncNodeInfo> {
    return (
      cacheEntry.resolvedContent !== undefined &&
      cacheEntry.resolvedContent !== cacheEntry.asyncNode
    );
  }

  private getOrCreateAsyncNodeCacheEntry(
    node: Node.Async,
    context: AsyncPluginContext,
  ): AsyncNodeInfo {
    const { asyncNodeCache: asyncNodeInfo } = context;
    let entry = asyncNodeInfo.get(node.id);
    if (!entry) {
      entry = {
        asyncNode: node,
        updateNodes: new Set(),
      };
      asyncNodeInfo.set(node.id, entry);
    }

    return entry;
  }

  /**
   * Handles the asynchronous API integration for resolving nodes.
   * This method sets up a hook on the resolver's `beforeResolve` event to process async nodes.
   * @param resolver The resolver instance to attach the hook to.
   * @param view
   */
  applyResolver(resolver: Resolver, context: AsyncPluginContext): void {
    const { assetIdCache } = context;
    resolver.hooks.afterNodeUpdate.tap(this.name, (original, _, update) => {
      if (
        update.node.type !== NodeType.Asset &&
        update.node.type !== NodeType.View
      ) {
        return;
      }

      assetIdCache.set(update.value.id, original);
    });

    resolver.hooks.beforeResolve.tap(this.name, (node, options) => {
      if (!this.isAsync(node)) {
        return node === null ? node : this.resolveAsyncChildren(node, context);
      }

      const entry = this.getOrCreateAsyncNodeCacheEntry(node, context);

      if (options.node) {
        entry.updateNodes = new Set([options.node]);
        context.generatedByMap.set(options.node, node.id);
      }

      if (entry.resolvedContent !== undefined) {
        return this.resolveAsyncChildren(entry.resolvedContent, context);
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

  /**
   * Replaces child async nodes with their resolved content and flattens when necessary. Resolving the children directly helps manage the `parent` reference without needing as much work within the resolver itself.
   * Handles async node chains as well to make sure all applicable nodes can get flattened.
   * @param node - The node whose children need to be resolved.
   * @param context - the async plugin context needed to reach into the cache
   * @returns The same node but with async node children mapped to their resolved AST.
   */
  private resolveAsyncChildren(
    node: Node.Node,
    context: AsyncPluginContext,
  ): Node.Node {
    if (node.type === NodeType.MultiNode) {
      // Using a while loop lets us catch when async nodes produce more async nodes that need to be flattened further
      let index = 0;
      while (index < node.values.length) {
        const childNode = node.values[index];
        if (childNode?.type !== NodeType.Async) {
          index++;
          continue;
        }
        const entry = this.getOrCreateAsyncNodeCacheEntry(childNode, context);

        if (!this.hasValidMapping(entry)) {
          index++;
          continue;
        }

        const mappedNode = entry.resolvedContent;
        const nodeSet = new Set<Node.Node>();
        if (mappedNode.type === NodeType.MultiNode && childNode.flatten) {
          mappedNode.values.forEach((v: Node.Node) => {
            v.parent = node;
            nodeSet.add(v);
          });
          node.values = [
            ...node.values.slice(0, index),
            ...mappedNode.values,
            ...node.values.slice(index + 1),
          ];
        } else {
          node.values[index] = mappedNode;
          mappedNode.parent = node;
          nodeSet.add(mappedNode);
        }
        entry.updateNodes = nodeSet;
        for (const n of nodeSet) {
          context.generatedByMap.set(n, childNode.id);
        }
      }
    } else if ("children" in node) {
      node.children?.forEach((c) => {
        // Similar to above, using a while loop lets us handle when async nodes produce more async nodes.
        while (c.value.type === NodeType.Async) {
          const entry = this.getOrCreateAsyncNodeCacheEntry(c.value, context);
          if (!this.hasValidMapping(entry)) {
            break;
          }

          const mappedNode = entry.resolvedContent;
          entry.updateNodes = new Set([mappedNode]);
          context.generatedByMap.set(mappedNode, c.value.id);
          c.value = mappedNode;
          c.value.parent = node;
        }
      });
    }

    return node;
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
          this.parseNodeAndUpdate(node, context, result, options.parseNode);
        },
      );

      // Stop tracking before the next update is triggered
      context.inProgressNodes.delete(node.id);
      this.parseNodeAndUpdate(node, context, result, options.parseNode);
    } catch (e: unknown) {
      const cause = e instanceof Error ? e : new Error(String(e));
      const playerState = this.basePlugin?.getPlayerInstance()?.getState();

      if (playerState?.status !== "in-progress") {
        options.logger?.warn(
          "[AsyncNodePlugin]: An error occured during async node resolution, but the player instance is no londer running. Exception: ",
          cause,
        );
        return;
      }

      const error = new AsyncNodeError(
        node,
        "An error occured during async node resolution. See cause for details.",
        cause,
      );
      playerState.controllers.error.captureError(error, error.type);
    }
  }

  private isAsync(node: Node.Node | null): node is Node.Async {
    return node?.type === NodeType.Async;
  }

  private isDeterminedAsync(obj: unknown): obj is AsyncContent {
    return (
      typeof obj === "object" &&
      obj !== null &&
      Object.prototype.hasOwnProperty.call(obj, "async")
    );
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
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { async, flatten, ...rest } = obj;
          const parsedAsync = parser.parseObject(rest, nodeType, options);
          const parsedNodeId = getNodeID(parsedAsync);

          if (parsedAsync === null || !parsedNodeId) {
            return childOptions ? [] : null;
          }

          const asyncAST = parser.createASTNode(
            {
              id: parsedNodeId,
              type: NodeType.Async,
              value: parsedAsync,
              flatten,
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
    view.hooks.parser.tap("async", this.applyParser.bind(this));
  }

  applyPlayer(player: Player): void {
    // TODO: Need a better mechanism for storing the current context.
    let currentContext: AsyncPluginContext | undefined = undefined;
    let parser: Parser | undefined = undefined;

    player.hooks.errorController.tap("async", (errorController) => {
      errorController.hooks.onError.tap("async", (playerError) => {
        if (currentContext === undefined) {
          return undefined;
        }

        /** Try to handle the error using the onAsyncNodeError hook. Returns true if new content is provided. */
        const tryHandleError = (asyncNode: Node.Async): boolean => {
          if (this.basePlugin === undefined) {
            player.logger.warn(
              `[AsyncNodePlugin]: No plugin detected. Error handling will fail`,
            );
          }

          let result: any = undefined;
          result = this.basePlugin?.hooks.onAsyncNodeError.call(
            playerError.error,
            asyncNode,
          );

          if (result === undefined) {
            return false;
          }

          player.logger?.warn(
            "[AsyncNodePlugin]: Async node handling failed and resolved with a fallback. Cause:",
            playerError.error.message,
          );

          // Stop tracking before the next update is triggered
          currentContext!.inProgressNodes.delete(asyncNode.id);
          this.parseNodeAndUpdate(
            asyncNode,
            currentContext!,
            result,
            parser?.parseObject.bind(parser),
          );

          return true;
        };

        let node = getNodeFromError(playerError, currentContext);
        // If the node is an async node try, to handle errors with it first.
        if (node?.type === NodeType.Async && tryHandleError(node)) {
          return true;
        }

        // Loop through the nodes to see if something is generated by something else. Continue until the error is handled or there are no more nodes to check
        while (node !== undefined) {
          const generatedBy = currentContext.generatedByMap.get(node);
          if (generatedBy) {
            const entry = currentContext.asyncNodeCache.get(generatedBy);

            if (!entry) {
              node = node.parent;
              continue;
            }

            const { asyncNode } = entry;

            // Don't return false when the error isn't handled to allow for cases where one async is generated by another. Give different nodes a chance to try to recover from the error.
            if (tryHandleError(asyncNode)) {
              return true;
            }
          }

          node = node.parent;
        }

        return undefined;
      });
    });

    player.hooks.viewController.tap("async", (viewController) => {
      viewController.hooks.view.tap("async", (view) => {
        view.hooks.parser.tap(this.name, (p) => {
          parser = p;
        });
        const context: AsyncPluginContext = {
          inProgressNodes: new Set(),
          view,
          viewController,
          generatedByMap: new Map(),
          assetIdCache: new Map(),
          asyncNodeCache: new Map(),
        };
        currentContext = context;

        view.hooks.resolver.tap("async", (resolver) => {
          this.applyResolver(resolver, context);
        });
      });
    });
  }

  applyPlugin(asyncNodePlugin: AsyncNodePlugin): void {
    this.basePlugin = asyncNodePlugin;
  }
}

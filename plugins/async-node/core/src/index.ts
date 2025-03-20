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
import { AsyncParallelBailHook } from "tapable-ts";
import queueMicrotask from "queue-microtask";
import { omit } from "timm";

export * from "./types";
export * from "./transform";

export interface AsyncNodePluginOptions {
  /** A set of plugins to load  */
  plugins?: AsyncNodeViewPlugin[];
}

export interface AsyncNodeViewPlugin extends ViewPlugin {
  /** Use this to tap into the async node plugin hooks */
  applyPlugin: (asyncNodePlugin: AsyncNodePlugin) => void;

  asyncNode: AsyncParallelBailHook<[Node.Async, (result: any) => void], any>;
}

/**
 * Async node plugin used to resolve async nodes in the content
 * If an async node is present, allow users to provide a replacement node to be rendered when ready
 */
export class AsyncNodePlugin implements PlayerPlugin {
  private plugins: AsyncNodeViewPlugin[] | undefined;

  constructor(options: AsyncNodePluginOptions) {
    if (options?.plugins) {
      this.plugins = options.plugins;
      options.plugins.forEach((plugin) => {
        plugin.applyPlugin(this);
      });
    }
  }

  public readonly hooks = {
    onAsyncNode: new AsyncParallelBailHook<
      [Node.Async, (result: any) => void],
      any
    >(),
  };

  name = "AsyncNode";

  apply(player: Player) {
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
  public asyncNode = new AsyncParallelBailHook<
    [Node.Async, (result: any) => void],
    any
  >();
  private basePlugin: AsyncNodePlugin | undefined;

  name = "AsyncNode";

  private resolvedMapping = new Map<string, any>();

  private currentView: ViewInstance | undefined;

  /**
   * Updates the node asynchronously based on the result provided.
   * This method is responsible for handling the update logic of asynchronous nodes.
   * It checks if the node needs to be updated based on the new result and updates the mapping accordingly.
   * If an update is necessary, it triggers an asynchronous update on the view.
   * @param node The asynchronous node that might be updated.
   * @param result The result obtained from resolving the async node. This could be any data structure or value.
   * @param options Options provided for node resolution, including a potential parseNode function to process the result.
   * @param view The view instance where the node resides. This can be undefined if the view is not currently active.
   */
  private handleAsyncUpdate(
    node: Node.Async,
    result: any,
    options: Resolve.NodeResolveOptions,
    view: ViewInstance | undefined,
  ) {
    const parsedNode =
      options.parseNode && result ? options.parseNode(result) : undefined;

    if (this.resolvedMapping.get(node.id) !== parsedNode) {
      this.resolvedMapping.set(node.id, parsedNode ? parsedNode : node);
      view?.updateAsync();
    }
  }

  /**
   * Handles the asynchronous API integration for resolving nodes.
   * This method sets up a hook on the resolver's `beforeResolve` event to process async nodes.
   * @param resolver The resolver instance to attach the hook to.
   * @param view
   */
  applyResolver(resolver: Resolver) {
    resolver.hooks.beforeResolve.tap(this.name, (node, options) => {
      let resolvedNode;
      if (this.isAsync(node)) {
        const mappedValue = this.resolvedMapping.get(node.id);
        if (mappedValue) {
          resolvedNode = mappedValue;
        }
      } else {
        resolvedNode = null;
      }

      const newNode = resolvedNode || node;
      if (!resolvedNode && node?.type === NodeType.Async) {
        queueMicrotask(async () => {
          const result = await this.basePlugin?.hooks.onAsyncNode.call(
            node,
            (result) => {
              this.handleAsyncUpdate(node, result, options, this.currentView);
            },
          );
          this.handleAsyncUpdate(node, result, options, this.currentView);
        });

        return node;
      }
      return newNode;
    });
  }

  private isAsync(node: Node.Node | null): node is Node.Async {
    return node?.type === NodeType.Async;
  }

  private isDeterminedAsync(obj: any) {
    return obj && Object.prototype.hasOwnProperty.call(obj, "async");
  }

  applyParser(parser: Parser) {
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
    this.currentView = view;
    view.hooks.parser.tap("async", this.applyParser.bind(this));
    view.hooks.resolver.tap("async", this.applyResolver.bind(this));
  }

  applyPlugin(asyncNodePlugin: AsyncNodePlugin): void {
    this.basePlugin = asyncNodePlugin;
  }
}

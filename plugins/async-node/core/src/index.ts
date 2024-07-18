import { NodeType, getNodeID } from "@player-ui/player";
import type {
  Player,
  PlayerPlugin,
  Node,
  ParseObjectOptions,
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

  private isAsync(node: Node.Node | null): node is Node.Async {
    return node?.type === NodeType.Async;
  }

  applyParser(parser: Parser) {
    parser.hooks.determineNodeType.tap(this.name, (obj) => {
      if (Object.prototype.hasOwnProperty.call(obj, "async")) {
        return NodeType.Async;
      }
    });
    parser.hooks.parseNode.tap(
      this.name,
      (
        obj: any,
        nodeType: Node.ChildrenTypes,
        options: ParseObjectOptions,
        determinedNodeType: null | NodeType,
      ) => {
        if (determinedNodeType === NodeType.Async) {
          const parsedAsync = parser.parseObject(
            omit(obj, "async"),
            nodeType,
            options,
          );
          const parsedNodeId = getNodeID(parsedAsync);
          if (parsedAsync !== null && parsedNodeId) {
            return parser.createASTNode(
              {
                id: parsedNodeId,
                type: NodeType.Async,
                value: parsedAsync,
              },
              obj,
            );
          }

          return null;
        }
      },
    );
  }

  applyResolverHooks(resolver: Resolver) {
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

  apply(view: ViewInstance): void {
    view.hooks.parser.tap("template", this.applyParser.bind(this));
    view.hooks.resolver.tap("template", (resolver) => {
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
                this.handleAsyncUpdate(node, result, options, view);
              },
            );
            this.handleAsyncUpdate(node, result, options, view);
          });

          return node;
        }
        return newNode;
      });
    });
  }

  applyPlugin(asyncNodePlugin: AsyncNodePlugin): void {
    this.basePlugin = asyncNodePlugin;
  }
}

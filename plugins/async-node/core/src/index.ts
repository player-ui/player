import { NodeType, getNodeID } from '@player-ui/player';
import type {
  Player,
  PlayerPlugin,
  Node,
  ParseObjectOptions,
  ViewInstance,
  Parser,
  ViewPlugin,
  Resolver,
} from '@player-ui/player';
import { AsyncParallelBailHook } from 'tapable-ts';
import queueMicrotask from 'queue-microtask';
import { omit } from 'timm';

export * from './types';

/**
 * Async node plugin used to resolve async nodes in the content
 * If an async node is present, allow users to provide a replacement node to be rendered when ready
 */
export class AsyncNodePlugin implements PlayerPlugin {
  public readonly hooks = {
    onAsyncNode: new AsyncParallelBailHook<[Node.Node], Node.Node>(),
  };

  name = 'AsyncNode';

  private resolvedMapping = new Map<string, Node.Node>();

  private isAsync(node: Node.Node | null): node is Node.Async {
    return node?.type === NodeType.Async;
  }

  apply(player: Player) {
    player.hooks.viewController.tap(this.name, (viewController) => {
      viewController.hooks.view.tap(this.name, (view) => {
        view.hooks.parser.tap(this.name, (parser) => {
          parser.hooks.determineNodeType.tap(this.name, (obj) => {
            if (Object.prototype.hasOwnProperty.call(obj, 'async')) {
              return NodeType.Async;
            }
          });
          parser.hooks.parseNode.tap(
            this.name,
            (
              obj: any,
              nodeType: Node.ChildrenTypes,
              options: ParseObjectOptions,
              determinedNodeType: null | NodeType
            ) => {
              if (determinedNodeType === NodeType.Async) {
                const parsedAsync = parser.parseObject(
                  omit(obj, 'async'),
                  nodeType,
                  options
                );
                const parsedNodeId = getNodeID(parsedAsync);
                if (parsedAsync !== null && parsedNodeId) {
                  return parser.createASTNode(
                    {
                      id: parsedNodeId,
                      type: NodeType.Async,
                      value: parsedAsync,
                    },
                    obj
                  );
                }

                return null;
              }
            }
          );
        });

        view.hooks.resolver.tap(this.name, (resolver) => {
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
                const result = await this.hooks.onAsyncNode.call(node);
                const parsedNode = options.parseNode
                  ? options.parseNode(result)
                  : undefined;

                if (parsedNode) {
                  this.resolvedMapping.set(node.id, parsedNode);
                  viewController.currentView?.updateAsync();
                }
              });

              return node;
            }

            return newNode;
          });
        });
      });
    });
  }
}

import type { Node } from '@player-ui/view';
import { NodeType } from '@player-ui/view';
import { LocalStateStore } from './store';
import type { TransformRegistry } from './types';
import type { ViewController } from './controller';
import { PlayerPlugin } from '..';

/** Traverse up the nodes until the target is found */
function findUp(node: Node.Node, target: Node.Node): boolean {
  if (node === target) {
    return true;
  }

  if (node.parent) {
    return findUp(node.parent, target);
  }

  return false;
}

/**
 * A plugin to register custom transforms on certain asset types
 * This allows users to embed stateful data into transforms.
 */
export class AssetTransformCorePlugin {
  public readonly stateStore: Map<Node.Node, LocalStateStore>;
  private readonly registry: TransformRegistry;
  private beforeResolveSymbol: symbol;
  private resolveSymbol: symbol;
  private beforeResolveCountSymbol: symbol;
  private resolveCountSymbol: symbol;

  constructor(registry: TransformRegistry) {
    this.registry = registry;
    this.stateStore = new Map();
    this.beforeResolveSymbol = Symbol('before resolve');
    this.resolveSymbol = Symbol('resolve');
    this.beforeResolveCountSymbol = Symbol('before resolve count');
    this.resolveCountSymbol = Symbol('resolve count');
  }

  apply(viewController: ViewController) {
    viewController.hooks.view.tap('asset-transform', (view) => {
      // Clear out everything when we create a new view
      this.stateStore.clear();

      view.hooks.resolver.tap('asset-transform', (resolver) => {
        let lastUpdatedNode: Node.Node | undefined;

        /** A function to update the state and trigger a view re-compute */
        const updateState = (node: Node.Node) => {
          lastUpdatedNode = node;
          view.update(new Set());
        };

        /** Given a node and a transform step, fetch a local store */
        const getStore = (node: Node.Node, stepKey: symbol) => {
          let store: LocalStateStore;
          const countKey =
            stepKey === this.resolveSymbol
              ? this.resolveCountSymbol
              : this.beforeResolveCountSymbol;

          const storedState = this.stateStore.get(node);

          if (storedState) {
            store = storedState;
            store.removeKey(countKey);
          } else {
            store = new LocalStateStore(() => {
              updateState(node);
            });
            this.stateStore.set(node, store);
          }

          return {
            useSharedState: (
              key: string | symbol
            ): (<T>(initialState: T) => readonly [T, (value: T) => void]) => {
              return store.useSharedState(key);
            },
            useLocalState: <T>(initialState: T) => {
              return store.getLocalStateFunction<T>(
                stepKey,
                countKey
              )(initialState);
            },
          };
        };

        resolver.hooks.beforeResolve.tap('asset-transform', (node, options) => {
          if (node && (node.type === 'asset' || node.type === 'view')) {
            const transform = this.registry.get(node.value);

            if (transform?.beforeResolve) {
              const store = getStore(node, this.beforeResolveSymbol);

              return transform.beforeResolve(node, options, store);
            }
          }

          return node;
        });

        resolver.hooks.afterUpdate.tap('asset-transform', () => {
          lastUpdatedNode = undefined;
        });

        resolver.hooks.skipResolve.tap('asset-transform', (skip, node) => {
          if (!skip || !lastUpdatedNode) {
            return skip;
          }

          const isParentOfUpdated = findUp(lastUpdatedNode, node);
          const isChildOfUpdated = findUp(node, lastUpdatedNode);

          return !isParentOfUpdated && !isChildOfUpdated;
        });

        resolver.hooks.afterResolve.tap(
          'asset-transform',
          (value, node, options) => {
            if (node.type !== NodeType.Asset && node.type !== NodeType.View) {
              return value;
            }

            const originalNode = resolver.getSourceNode(node);

            if (!originalNode) {
              return value;
            }

            const transform = this.registry.get(value);

            if (transform?.resolve) {
              const store = getStore(originalNode, this.resolveSymbol);

              return transform?.resolve(value, options, store);
            }

            return value;
          }
        );
      });
    });
  }
}

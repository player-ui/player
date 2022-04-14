import type {
  Player,
  PlayerPlugin,
  TransformRegistry,
  TransformFunction,
  TransformFunctions,
} from '@player-ui/player';
import { Registry } from '@player-ui/partial-match-registry';
import { compose } from './utils';

export * from './utils';
export type TransformType = TransformFunction<any> | TransformFunctions;
export type TransformRegistryEntries = Array<[any, TransformType]>;
export type AssetTransformInit =
  | Registry<TransformType>
  | TransformRegistryEntries;

/**
 * Normalize asset transform values so that they are all objects that contains
 * the resolve & beforeResolve functions.
 */
function maybeCompose(maybeFn: any): TransformFunctions {
  if (typeof maybeFn === 'object') {
    return maybeFn;
  }

  return compose(maybeFn);
}

/**
 * Standardize each variation of Asset Registry input into the same transform
 * registry shape.
 */
function cleanupTransformRegistry(
  maybeRegistry: AssetTransformInit
): TransformRegistry {
  if (Array.isArray(maybeRegistry)) {
    const wrappedTransforms = maybeRegistry.map(([key, value]) => {
      return [key, maybeCompose(value)] as [any, TransformFunctions];
    });

    return new Registry(wrappedTransforms);
  }

  const registry = new Registry<TransformFunctions>();

  maybeRegistry.forEach(({ key, value }) => {
    registry.set(key, maybeCompose(value));
  });

  return registry;
}

/**
 * A plugin to register custom transforms on certain asset types
 * This allows users to embed stateful data into transforms.
 */
export class AssetTransformPlugin implements PlayerPlugin {
  name = 'asset-transform';
  public readonly registry: TransformRegistry;

  constructor(transforms: AssetTransformInit) {
    this.registry = cleanupTransformRegistry(transforms);
  }

  apply(player: Player) {
    player.hooks.viewController.tap(this.name, (vc) => {
      this.registry.forEach(({ key, value }) =>
        vc.transformRegistry.set(key, maybeCompose(value))
      );
    });
  }
}

import type { Asset } from '@player-ui/types';
import type { Registry } from '@player-ui/partial-match-registry';

import type { Resolve, Node } from '../../view';
import type { Store } from './store';

/** Transform function that is ran on the Asset before it's resolved */
export type BeforeTransformFunction<AuthoredAsset extends Asset = Asset> = (
  asset: Node.Asset<AuthoredAsset> | Node.View<AuthoredAsset>,
  options: Resolve.NodeResolveOptions,
  store: Store,
) => Node.Node;

/** Transform function that is ran on the Asset after it's resolved */
export type TransformFunction<
  AuthoredAsset extends Asset = Asset,
  TransformedAsset extends Asset = AuthoredAsset,
> = (
  asset: AuthoredAsset,
  options: Resolve.NodeResolveOptions,
  store: Store,
) => TransformedAsset;

export interface TransformFunctions {
  /** A function that is executed as an AST -> AST transform before resolving the node to a value */
  beforeResolve?: BeforeTransformFunction<any>;

  /** A function to resolve an AST to a value */
  resolve?: TransformFunction<any>;
}

export type TransformRegistry = Registry<TransformFunctions>;

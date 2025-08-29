import {
  BeforeTransformFunction,
  Builder,
  Node,
  NodeType,
} from "@player-ui/player";
import {
  extractNodeFromPath,
  requiresAssetWrapper,
  traverseAndReplace,
  unwrapAsset,
} from "./utils";

export type AsyncTransformOptions = {
  /** Whether or not to flatten the results into its container. Defaults to true */
  flatten?: boolean;
  /** The path to the array within the `wrapperAssetType` that will contain the async content. Defaults to ["values"] */
  path?: string[];
  /** The asset type that the transform is matching against. */
  transformAssetType: string;
  /** The asset type that will contain the async content. */
  wrapperAssetType: string;
  /** Function to get any nested asset that will need to be extracted and kept when creating the wrapper asset. */
  getNestedAsset?: (node: Node.ViewOrAsset) => Node.Node | undefined;
  /** Function to get the id for the async node being generated. Defaults to creating an id with the format of async-<ASSET.ID> */
  getAsyncNodeId?: (node: Node.ViewOrAsset) => string;
  /** Where to place the async node relative to the asset from `getNestedAsset`. Defaults to "last" */
  asyncNodePosition?: "first" | "last";
};

const defaultGetNodeId = (node: Node.ViewOrAsset): string => {
  return `async-${node.value.id}`;
};

/** Creates a BeforeTransformFunction that turns the given asset into a wrapper asset with an async node in it.
 * By setting {@link AsyncTransformOptions.flatten} to true, you can chain multiple of the same asset type to create a flow of async content that
 * exists within a single collection.
 *
 * @param options - Options for managing the transform
 * @returns The {@link BeforeTransformFunction} that can be used for your asset.
 */
export const createAsyncTransform = (
  options: AsyncTransformOptions,
): BeforeTransformFunction => {
  const {
    transformAssetType,
    wrapperAssetType,
    getNestedAsset,
    getAsyncNodeId = defaultGetNodeId,
    path = ["values"],
    flatten = true,
    asyncNodePosition = "last",
  } = options;

  const replaceNode = (node: Node.Node): Node.Node => {
    const unwrapped = unwrapAsset(node);

    if (
      unwrapped.type !== NodeType.Asset ||
      unwrapped.value.type !== transformAssetType
    ) {
      return node;
    }

    const transformed = asyncTransform(unwrapped);
    return extractNodeFromPath(transformed, path) ?? node;
  };

  const replacer = (node: Node.Node) => traverseAndReplace(node, replaceNode);

  const asyncTransform = (node: Node.ViewOrAsset) => {
    const id = getAsyncNodeId(node);
    const asset = getNestedAsset?.(node);

    // If flattening is disabled, don't need to extract the multi-node when async node is resolved.
    const replaceFunction = flatten ? replacer : undefined;
    const asyncNode = Builder.asyncNode(id, flatten, replaceFunction);

    let values: Node.Node[] = [asyncNode];
    if (asset) {
      const otherValues = [];
      if (requiresAssetWrapper(asset)) {
        otherValues.push(Builder.assetWrapper(asset));
      } else if (asset.type === NodeType.MultiNode) {
        otherValues.push(...asset.values);
      } else {
        otherValues.push(asset);
      }

      values =
        asyncNodePosition === "first"
          ? [...values, ...otherValues]
          : [...otherValues, ...values];
    }

    const multiNode = Builder.multiNode(...(values as any[]));

    const wrapperAsset: Node.ViewOrAsset = Builder.asset({
      id: wrapperAssetType + "-" + id,
      type: wrapperAssetType,
    });

    Builder.addChild(wrapperAsset, path, multiNode);

    return wrapperAsset;
  };

  return asyncTransform;
};

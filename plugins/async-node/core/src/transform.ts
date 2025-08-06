import { Builder } from "@player-ui/player";
import type { AsyncTransformFunc } from "./types";

/**
 * @deprecated Use {@link createAsyncTransform} to create your before transform function.
 * Util function to generate transform function for async asset
 * @param asset - async asset to apply beforeResolve transform
 * @param wrapperAssetType: container asset type
 * @param flatten: flatten the streamed in content
 * @param path: property path to add the multinode containing the next async node to
 * @returns - wrapper asset with children of transformed asset and async node
 */

export const asyncTransform: AsyncTransformFunc = (
  assetId,
  wrapperAssetType,
  asset,
  flatten = true,
  path = ["values"],
) => {
  const id = "async-" + assetId;

  const asyncNode = Builder.asyncNode(id, flatten);

  let multiNode;
  let assetNode;

  if (asset) {
    assetNode = Builder.assetWrapper(asset);
    multiNode = Builder.multiNode(assetNode, asyncNode);
  } else {
    multiNode = Builder.multiNode(asyncNode);
  }

  const wrapperAsset = Builder.asset({
    id: wrapperAssetType + "-" + id,
    type: wrapperAssetType,
  });

  Builder.addChild(wrapperAsset, path, multiNode);

  return wrapperAsset;
};

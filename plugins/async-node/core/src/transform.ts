import { Builder } from "@player-ui/player";
import type { AsyncTransformFunc } from "./types";

/**
 * Util function to generate transform function for async asset
 * @param asset - async asset to apply beforeResolve transform
 * @param transformedAssetType: transformed asset type for rendering
 * @param wrapperAssetType: container asset type
 * @param flatten: flatten the streamed in content
 * @returns - wrapper asset with children of transformed asset and async node
 */

export const asyncTransform: AsyncTransformFunc = (
  assetId,
  wrapperAssetType,
  asset,
  flatten,
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

  Builder.addChild(wrapperAsset, ["values"], multiNode);

  return wrapperAsset;
};

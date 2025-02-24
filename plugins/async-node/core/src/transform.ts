import { Builder } from "@player-ui/player";
import type { AsyncTransformFunc } from "./types";

/**
 * Util function to generate transform function for async asset
 * @param asset - async asset to apply beforeResolve transform
 * @param transformedAssetType: transformed asset type for rendering
 * @param wrapperAssetType: container asset type
 * @param flatten: flatten the streamed in content or not
 * @returns - wrapper asset with children of transformed asset and async node
 */

export const asyncTransform: AsyncTransformFunc = (
  asset,
  transformedAssetType,
  wrapperAssetType,
  flatten,
) => {
  const id = "async-" + asset.value.id;

  const assetNode = Builder.assetWrapper({
    ...asset.value,
    type: transformedAssetType,
  });

  const asyncNode = Builder.asyncNode(id, flatten);
  const multiNode = Builder.multiNode(assetNode, asyncNode);

  const wrapperAsset = Builder.asset({
    id: wrapperAssetType + "-" + id,
    type: wrapperAssetType,
  });

  Builder.addChild(wrapperAsset, ["values"], multiNode);

  return wrapperAsset;
};

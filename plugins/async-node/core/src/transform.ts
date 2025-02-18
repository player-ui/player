import { Builder } from "@player-ui/player";
import type { AsyncTransformFunc } from "./types";

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

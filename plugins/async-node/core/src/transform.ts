import { Builder } from "@player-ui/player";
import type { AsyncTransformFunc } from "./types";

export const asyncTransform: AsyncTransformFunc = (
  asset,
  transformedAssetType,
  wrapperAssetType,
  flatten,
) => {
  const timeStamp = new Date().valueOf();
  // const id = timeStamp;
  const id = asset.value.id;

  const assetNode = Builder.assetWrapper({
    ...asset.value,
    type: transformedAssetType,
  });

  const asyncNode = Builder.asyncNode(id, flatten);
  const multiNode = Builder.multiNode(assetNode, asyncNode);

  const wrapperAsset = Builder.asset({
    id: wrapperAssetType + "-" + timeStamp,
    type: wrapperAssetType,
  });

  Builder.addChild(wrapperAsset, ["values"], multiNode);

  return wrapperAsset;
};

import { Builder } from "@player-ui/player";
import { v4 as uuid } from "uuid";
import type { AsyncTransformFunc } from "./types";

export const asyncTransform: AsyncTransformFunc = (
  asset,
  transformedAssetType,
  wrapperAssetType,
) => {
  const id = uuid();

  const assetNode = Builder.assetWrapper({
    ...asset.value,
    type: transformedAssetType,
  });

  const asyncNode = Builder.asyncNode(id);
  const multiNode = Builder.multiNode(assetNode, asyncNode);

  const wrapperAsset = Builder.asset({
    id: wrapperAssetType + "-" + id,
    type: wrapperAssetType,
  });

  Builder.addChild(wrapperAsset, ["values"], multiNode);

  return wrapperAsset;
};

import { Builder } from "@player-ui/player";
import SnowflakeId from "snowflake-id";
import type { AsyncTransformFunc } from "./types";

export const asyncTransform: AsyncTransformFunc = (
  asset,
  transformedAssetType,
  wrapperAssetType,
) => {
  const id = new SnowflakeId().generate();

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

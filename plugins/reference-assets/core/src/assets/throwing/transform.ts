import type { TransformFunction } from "@player-ui/player";
import type { ThrowingAsset } from "./types";

/**
 * Docs about the asset transform
 */
export const throwingTransform: TransformFunction<ThrowingAsset> = (asset) => {
  if (asset.timing === "transform") {
    throw new Error(asset.message);
  }

  return asset;
};

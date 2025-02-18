import type {
  Asset,
  BeforeTransformFunction,
  TransformFunctions,
} from "@player-ui/player";
import { composeBefore, compose } from "@player-ui/asset-transform-plugin";
import { asyncTransform } from "@player-ui/async-node-plugin";
/**
 * In beforeTransform function, pass in flatten marker and call beforeResolve function.
 * Flatten default value is true.
 * input: asset
 * @param asset - Asset to apply the transform to
 * @returns - multi-node with async node placeholder
 */

export const transform: BeforeTransformFunction<Asset> = (asset) => {
  return asyncTransform(asset, "text", "collection");
};

export const chatMessageTransform: TransformFunctions = compose(
  composeBefore(transform),
);

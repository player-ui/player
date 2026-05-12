import type { TransformFunction } from "@player-ui/player";
import { SIMPLE_BINDING_REGEX } from "@player-ui/player";
import type { TextAsset } from "./types";

//TODO basic check to see if text is just a binding. Make more robust
export const textTransform: TransformFunction<TextAsset, TextAsset> = (
  asset,
  options,
) => {
  let text = asset.text;
  if (asset.text && SIMPLE_BINDING_REGEX.test(asset.text)) {
    try {
      text = options.data.model.get(asset.text) ?? asset.text;
    } catch (e) {
      text = asset.text;
    }
  }
  return {
    ...asset,
    text,
  };
};

import type { TransformFunction } from "@player-ui/player";
import type { TextAsset } from "./types";

//TODO basic check to see if text is just a binding. Make more robust
export const textTransform: TransformFunction<TextAsset, TextAsset> = (
  asset,
  options,
) => {
  const text =
    asset.text && asset.text?.includes(".")
      ? options.data.model.get(asset.text)
      : asset.text;
  return {
    ...asset,
    text,
  };
};

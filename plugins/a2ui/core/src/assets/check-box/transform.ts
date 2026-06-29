import type { TransformFunction } from "@player-ui/player";
import type { CheckBoxAsset, TransformedCheckBox } from "./types";

export const checkBoxTransform: TransformFunction<
  CheckBoxAsset,
  TransformedCheckBox
> = (asset, options) => {
  const binding = asset.value;
  return {
    ...asset,
    currentValue:
      binding === undefined
        ? false
        : Boolean(options.data.model.get(binding, { includeInvalid: true })),
    set(newValue) {
      if (binding === undefined) return;
      options.data.model.set([[binding, newValue]]);
    },
  };
};

import type { TransformFunction } from "@player-ui/player";
import type { ChoicePickerAsset, TransformedChoicePicker } from "./types";

export const choicePickerTransform: TransformFunction<
  ChoicePickerAsset,
  TransformedChoicePicker
> = (asset, options) => {
  const binding = asset.selections;
  const raw =
    binding === undefined
      ? []
      : options.data.model.get(binding, { includeInvalid: true });
  return {
    ...asset,
    currentValue: Array.isArray(raw) ? (raw as string[]) : [],
    set(newValue) {
      if (binding === undefined) return;
      options.data.model.set([[binding, newValue]]);
    },
  };
};

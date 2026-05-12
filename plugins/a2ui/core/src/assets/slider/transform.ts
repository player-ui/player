import type { TransformFunction } from "@player-ui/player";
import type { SliderAsset, TransformedSlider } from "./types";

export const sliderTransform: TransformFunction<
  SliderAsset,
  TransformedSlider
> = (asset, options) => {
  const binding = asset.value;
  const fallback = asset.minValue ?? 0;
  return {
    ...asset,
    currentValue:
      binding === undefined
        ? fallback
        : Number(
            options.data.model.get(binding, { includeInvalid: true }) ??
              fallback,
          ),
    set(newValue) {
      if (binding === undefined) return;
      options.data.model.set([[binding, newValue]]);
    },
  };
};

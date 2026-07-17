import type { TransformFunction } from "@player-ui/player";
import type { DateTimeInputAsset, TransformedDateTimeInput } from "./types";

export const dateTimeInputTransform: TransformFunction<
  DateTimeInputAsset,
  TransformedDateTimeInput
> = (asset, options) => {
  const binding = asset.value;
  return {
    ...asset,
    currentValue:
      binding === undefined
        ? ""
        : ((options.data.model.get(binding, {
            includeInvalid: true,
          }) as string) ?? ""),
    set(newValue) {
      if (binding === undefined) return;
      options.data.model.set([[binding, newValue]]);
    },
  };
};

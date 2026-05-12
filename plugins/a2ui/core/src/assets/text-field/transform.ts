import type { TransformFunction } from "@player-ui/player";
import type { TextFieldAsset, TransformedTextField } from "./types";

/** Wire the bound model value + setters onto a TextField asset. */
export const textFieldTransform: TransformFunction<
  TextFieldAsset,
  TransformedTextField
> = (asset, options) => {
  const binding = asset.value;
  return {
    ...asset,
    currentValue:
      binding === undefined
        ? ""
        : (options.data.model.get(binding, {
            includeInvalid: true,
            formatted: true,
          }) as string | undefined),
    set(newValue) {
      if (binding === undefined) return;
      options.data.model.set([[binding, newValue]], { formatted: true });
    },
    format(newValue) {
      if (binding === undefined) return newValue;
      return options.data.format(binding, newValue) as string | undefined;
    },
    validation:
      binding === undefined
        ? undefined
        : options.validation?.get(binding, { track: true }),
    dataType:
      binding === undefined ? undefined : options.validation?.type(binding),
  };
};

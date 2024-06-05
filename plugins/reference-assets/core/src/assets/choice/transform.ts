import type { TransformFunction } from "@player-ui/player";
import type {
  ChoiceAsset,
  TransformedChoice,
  TransformedChoiceItem,
} from "./types";

/**
 * Docs about the asset transform
 */
export const choiceTransform: TransformFunction<
  ChoiceAsset,
  TransformedChoice
> = (asset, options) => {
  const { items, binding, ...rest } = asset;

  const assetHasBinding = binding !== undefined;

  const currentValue = assetHasBinding
    ? options.data.model.get(binding, {
        includeInvalid: true,
      })
    : undefined;

  const resetValue = () => {
    if (assetHasBinding) {
      return options.data.model.set([[binding, null]]);
    }
  };

  const transformedChoiceItems: TransformedChoiceItem[] = (items || []).map(
    (item, index) => ({
      ...item,
      id: item.id ?? `${asset.id}-choice-${index}`,
      select() {
        if (assetHasBinding) {
          return options.data.model.set([[binding, item.value]]);
        }
      },
      unselect: resetValue,
    }),
  );

  return {
    ...rest,
    binding,
    clearSelection: resetValue,
    items: transformedChoiceItems,
    value: currentValue,
    validation: assetHasBinding
      ? options.validation?.get(binding, { track: true })
      : undefined,
    dataType: assetHasBinding ? options.validation?.type(binding) : undefined,
  };
};

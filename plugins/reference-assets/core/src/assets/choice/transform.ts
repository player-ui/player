import type { TransformFunction } from '@player-ui/player';
import type { ChoiceAsset, TransformedChoice } from './types';

/**
 * Choice asset transform
 */
export const choiceTransform: TransformFunction<ChoiceAsset, TransformedChoice> = (
  asset,
  options
) => {
  return {
    ...asset,
    set(val) {
      if (asset.binding === undefined) {
        return;
      }
      return options.data.model.set([[asset.binding, val]]);
    },
    value:
      asset.binding === undefined
        ? ''
        : options.data.model.get(asset.binding),
    validation:
      asset.binding === undefined
        ? undefined
        : options.validation?.get(asset.binding, { track: true })
  };
};
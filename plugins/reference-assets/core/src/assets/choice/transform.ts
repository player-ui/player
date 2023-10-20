import type { TransformFunction } from '@player-ui/player';
import type { ChoiceAsset, TransformedChoice } from './types';

/**
 * Choice asset transform
 */
export const choiceTransform: TransformFunction<ChoiceAsset, TransformedChoice> = (
  asset,
  options
) => {
  const currentValue = options.data.model.get(asset.binding);
  const transformedChoices = asset.choices.map(choicesEntry => {
    return {
      ...choicesEntry,
      selected: choicesEntry.value === currentValue,
      select: () => {
        if (asset.binding === undefined) {
          return;
        }
        options.data.model.set([[asset.binding, choicesEntry.value]])
      }
    }
  });
  return {
    ...asset,
    validation:
      asset.binding === undefined
        ? undefined
        : options.validation?.get(asset.binding, { track: true }),
    choices: transformedChoices
  };
};
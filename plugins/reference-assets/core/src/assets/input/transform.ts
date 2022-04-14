import type { TransformFunction } from '@player-ui/player';
import type { InputAsset, TransformedInput } from './types';

/**
 * Docs about the asset transform
 */
export const inputTransform: TransformFunction<InputAsset, TransformedInput> = (
  asset,
  options
) => {
  return {
    ...asset,
    format(val) {
      if (asset.binding === undefined) {
        return val;
      }

      return options.data.format(asset.binding, val);
    },
    set(val) {
      if (asset.binding === undefined) {
        return;
      }

      return options.data.model.set([[asset.binding, val]], {
        formatted: true,
      });
    },
    value:
      asset.binding === undefined
        ? ''
        : options.data.model.get(asset.binding, {
            includeInvalid: true,
            formatted: true,
          }),
    validation:
      asset.binding === undefined
        ? undefined
        : options.validation?.get(asset.binding, { track: true }),
    dataType:
      asset.binding === undefined
        ? undefined
        : options.validation?.type(asset.binding),
  };
};

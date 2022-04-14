import type {
  Asset,
  TransformFunction,
  BeforeTransformFunction,
} from '@player-ui/player';
import { compose, composeBefore } from '@player-ui/asset-transform-plugin';
import type { ActionAsset, TransformedAction } from './types';

export function isBackAction(action: ActionAsset): boolean {
  return action.value === 'Prev';
}

/**
 * Attaches the methods to execute an action to an action
 */
const transform: TransformFunction<ActionAsset, TransformedAction> = (
  action,
  options
) => {
  return {
    ...action,
    run() {
      if (action.exp) {
        options.evaluate(action.exp);
      }

      if (action.value) {
        const skipValidation = action.metaData?.skipValidation;
        options.transition?.(action.value, { force: skipValidation });
      }
    },
  };
};

/**
 * Appends `exp` to the plugins.stringResolver.propertiesToSkip array or creates it if it doesn't exist
 *
 * @param asset - Asset to apply the transform to
 */
export const expPropTransform: BeforeTransformFunction<Asset> = (asset) => {
  const skipArray = asset.plugins?.stringResolver?.propertiesToSkip;

  if (skipArray && skipArray.indexOf('exp') > 1) {
    return asset;
  }

  return {
    ...asset,
    plugins: {
      ...asset.plugins,
      stringResolver: {
        ...asset?.plugins?.stringResolver,
        propertiesToSkip: [
          ...(asset.plugins?.stringResolver?.propertiesToSkip ?? []),
          'exp',
        ],
      },
    },
  };
};

export const actionTransform = compose(
  transform,
  composeBefore(expPropTransform)
);

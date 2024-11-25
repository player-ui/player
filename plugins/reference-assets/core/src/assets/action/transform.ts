import type {
  Asset,
  TransformFunction,
  BeforeTransformFunction,
} from "@player-ui/player";
import { compose, composeBefore } from "@player-ui/asset-transform-plugin";
import type { ActionAsset, TransformedAction } from "./types";
import { NodeType } from "@player-ui/player";

/**
 * Function to find prev button
 */
export function isBackAction(action: ActionAsset): boolean {
  return action.value === "Prev";
}

/**
 * Attaches the methods to execute an action to an action
 */
const transform: TransformFunction<ActionAsset, TransformedAction> = (
  action,
  options,
) => {
  console.log("action transform");
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
 * De couples back button from the back icon
 */
const backIconTransform: TransformFunction<ActionAsset, ActionAsset> = (
  action,
) => {
  /** For previous versions of player, the back button would already have the back icon.
   *  This ensures that the old functionality does not break and back button is still visible when they update the player.
   */
  if (isBackAction(action) && action?.metaData?.role === undefined) {
    return {
      ...action,
      metaData: {
        ...action?.metaData,
        role: "back",
      },
    };
  }

  return action;
};

/**
 * Appends `exp` to the plugins.stringResolver.propertiesToSkip array or creates it if it doesn't exist
 *
 * @param asset - Asset to apply the transform to
 */
export const expPropTransform: BeforeTransformFunction<Asset> = (asset) => {
  const skipArray = asset.plugins?.stringResolver?.propertiesToSkip;

  if (skipArray && skipArray.indexOf("exp") > 1) {
    return asset;
  }
  const result = {
    ...asset,
    plugins: {
      ...asset.plugins,
      stringResolver: {
        ...asset?.plugins?.stringResolver,
        propertiesToSkip: [
          ...(asset.plugins?.stringResolver?.propertiesToSkip ?? []),
          "exp",
        ],
      },
    },
  };

  return result;
};
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
export const twoActions: BeforeTransformFunction<Asset> = (asset) => {
  const result = {
    type: NodeType.MultiNode,
    values: [
      {
        ...asset.value,
        id: "1",
      },
      {
        ...asset.value,
        id: "2",
      },
    ],
  };
  return {
    ...asset,
    value: result,
  };
  // return result;
};

export const actionTransform = compose(
  transform,
  backIconTransform,
  composeBefore(expPropTransform, twoActions),
);

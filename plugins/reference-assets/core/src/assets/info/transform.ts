import type { TransformFunction } from "@player-ui/player";
import type { AssetWrapper } from "@player-ui/player";
import type { InfoAsset, InfoAssetTransform } from "./types";
import type { ActionAsset } from "../action/types";
import { isBackAction } from "../action/transform";

/**
 * This transform should add segmentedActions to the info asset.
 * Segmented actions display side by side in larger viewports. Segmented Actions is an object of next and prev actions
 */
export const infoTransform: TransformFunction<InfoAsset, InfoAssetTransform> = (
  infoAsset,
) => {
  const actions = infoAsset?.actions;
  const segmentedActions = actions?.reduce(
    (segmentedActionsArray, action) => {
      segmentedActionsArray[
        isBackAction(action.asset as ActionAsset) ? "prev" : "next"
      ].push(action as AssetWrapper<ActionAsset>);
      return segmentedActionsArray;
    },
    { next: [], prev: [] } as {
      /**
       * next is an array of next actions
       */
      next: Array<AssetWrapper<ActionAsset>>;
      /**
       * prev is an array of prev actions
       */
      prev: Array<AssetWrapper<ActionAsset>>;
    },
  );

  return {
    ...infoAsset,
    segmentedActions,
  };
};

import type { AssetWrapper, Asset } from "@player-ui/player";
import type { ActionAsset } from "../action/types";

export interface InfoAsset extends Asset<"info"> {
  /** The string value to show */
  title?: AssetWrapper;

  /** subtitle */
  subTitle?: AssetWrapper;

  /** Primary place for info  */
  primaryInfo?: AssetWrapper;

  /** List of actions to show at the bottom of the page */
  actions?: Array<AssetWrapper>;

  /** Footer to show at the bottom of the page below the actions info */
  footer?: AssetWrapper;
}

export interface InfoAssetTransform extends InfoAsset {
  /**
   * This is an array of next and prev actions
   */
  segmentedActions?: {
    /**
     * Array of next actions
     */
    next: Array<AssetWrapper<ActionAsset>>;
    /**
     * Array of prev actions
     */
    prev: Array<AssetWrapper<ActionAsset>>;
  };
}

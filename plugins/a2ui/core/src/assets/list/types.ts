import type { Asset } from "@player-ui/player";
import type { A2UICommon, A2UIChildrenAssets } from "../common";

export type ListDirection = "vertical" | "horizontal";
export type ListAlign = "start" | "center" | "end" | "stretch";

/** Scrollable list of items. Supports static children and dynamic templates. */
export interface ListAsset extends Asset<"List">, A2UICommon {
  children?: A2UIChildrenAssets;
  direction?: ListDirection;
  align?: ListAlign;
}

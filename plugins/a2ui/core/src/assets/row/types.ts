import type { Asset } from "@player-ui/player";
import type { A2UICommon, A2UIChildrenAssets } from "../common";

/** Distribution of children along the main (horizontal) axis. */
export type RowJustify =
  | "start"
  | "center"
  | "end"
  | "spaceBetween"
  | "spaceAround"
  | "spaceEvenly";

/** Cross-axis (vertical) alignment of children within a Row. */
export type RowAlign = "start" | "center" | "end" | "stretch";

/** Horizontal layout container. Children are arranged left-to-right. */
export interface RowAsset extends Asset<"Row">, A2UICommon {
  children?: A2UIChildrenAssets;
  justify?: RowJustify;
  align?: RowAlign;
}

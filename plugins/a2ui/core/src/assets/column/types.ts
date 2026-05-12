import type { Asset } from "@player-ui/player";
import type { A2UICommon, A2UIChildrenAssets } from "../common";

/** Distribution of children along the main (vertical) axis. */
export type ColumnJustify =
  | "start"
  | "center"
  | "end"
  | "spaceBetween"
  | "spaceAround"
  | "spaceEvenly";

/** Cross-axis (horizontal) alignment of children within a Column. */
export type ColumnAlign = "start" | "center" | "end" | "stretch";

/** Vertical layout container. Children are arranged top-to-bottom. */
export interface ColumnAsset extends Asset<"Column">, A2UICommon {
  children?: A2UIChildrenAssets;
  justify?: ColumnJustify;
  align?: ColumnAlign;
}

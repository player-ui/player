import type { Asset } from "@player-ui/player";
import type { A2UICommon } from "../common";

export type DividerAxis = "horizontal" | "vertical";

/** Visual separator line. */
export interface DividerAsset extends Asset<"Divider">, A2UICommon {
  axis?: DividerAxis;
}

import type { Asset } from "@player-ui/player";
import type { A2UICommon, A2UIChildAsset } from "../common";

/** Container with elevation/border and padding. */
export interface CardAsset extends Asset<"Card">, A2UICommon {
  child?: A2UIChildAsset;
}

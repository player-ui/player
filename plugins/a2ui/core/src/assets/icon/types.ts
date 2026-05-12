import type { Asset, Binding } from "@player-ui/player";
import type { A2UICommon } from "../common";

/** Display icons from the catalog's basic set. */
export interface IconAsset extends Asset<"Icon">, A2UICommon {
  name?: string | Binding;
}

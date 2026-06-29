import type { Asset } from "@player-ui/player";
import type { A2UICommon, A2UIChildAsset } from "../common";

/** Overlay dialog triggered by an entry point component. */
export interface ModalAsset extends Asset<"Modal">, A2UICommon {
  /** Trigger component — clicking opens the modal. */
  entryPointChild?: A2UIChildAsset;
  /** Body of the modal. */
  contentChild?: A2UIChildAsset;
}

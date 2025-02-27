import type { Asset } from "@player-ui/player";

export interface ChatMessageAsset extends Asset<"chat-message"> {
  /**
   * The asset to be displayed
   */
  value?: Asset;
}

import type { Asset } from "@player-ui/player";

export interface ChatMessageAsset extends Asset<"chat-message"> {
  /** Flatten flag */
  flatten?: boolean | false;
}

import type { AssetWrapper, Asset } from "@player-ui/player";

export interface ChatMessageAsset extends Asset<"chat-message"> {
  value?: AssetWrapper;
}

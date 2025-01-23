import type { AssetWrapper, Asset } from "@player-ui/player";

export interface ChatMessageWrapperAsset extends Asset<"chat-message-wrapper"> {
  /** The string value to show */
  values?: Array<AssetWrapper> | Array<Asset>;
}

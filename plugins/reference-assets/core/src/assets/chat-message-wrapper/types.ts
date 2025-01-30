import type { AssetWrapper, Asset } from "@player-ui/player";

export interface ChatMessageWrapperAsset extends Asset<"chat-message-wrapper"> {
  values?: Array<AssetWrapper> | Array<Asset>;
}
export interface TransformedChatMessageWrapperAsset
  extends ChatMessageWrapperAsset {
  values?: Array<AssetWrapper>;
}

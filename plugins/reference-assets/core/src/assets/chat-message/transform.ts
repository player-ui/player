import type {
  BeforeTransformFunction,
  TransformFunctions,
} from "@player-ui/player";
import { composeBefore, compose } from "@player-ui/asset-transform-plugin";
import { createAsyncTransform } from "@player-ui/async-node-plugin";
import { ChatMessageAsset } from "./types";
/**
 * In beforeTransform function, pass in flatten marker and call beforeResolve function.
 * Flatten default value is true.
 * input: ChatMessageAsset
 * @param asset - Asset to apply the transform to
 * @returns - transformed asset with async node and asset node
 */
export const transform: BeforeTransformFunction<ChatMessageAsset> =
  createAsyncTransform({
    transformAssetType: "chat-message",
    wrapperAssetType: "collection",
    getNestedAsset: (node) => node.children?.[0]?.value,
  });

export const chatMessageTransform: TransformFunctions = compose(
  composeBefore(transform),
);
